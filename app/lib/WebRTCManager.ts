import type { Socket } from "socket.io-client";

import { useChatStore } from "../lib/store";
import { log } from "./log";

class WebRTCManager {
  private socket: Socket | null = null;
  private peerConnection: RTCPeerConnection | null = null;
  private iceCandidateBuffer: RTCIceCandidateInit[] = [];
  private remoteSdp: RTCSessionDescriptionInit | null = null;
  private isRemoteDescriptionSet = false;
  private currentCallUserId: string | null = null;
  private currentCallId: string | null = null;
  private suppressRestart = false; // Добавлено для логики перезапуска ICE

  // Управление медиапотоками
  private localStream: MediaStream | null = null;
  private remoteStream: MediaStream | null = null;
  private isScreenSharing = false;
  private savedCameraTrack: MediaStreamTrack | null = null;
  private frontCamera?: MediaDeviceInfo;
  private backCamera?: MediaDeviceInfo;
  private usingFront = true;

  public initialize(socket: Socket) {
    if (this.socket === socket) {
      return;
    }

    log(
      `DEBUG:Инициализация состояния вызова: ${useChatStore.getState().callState}`,
    );
    this.socket = socket;
    this._registerSocketListeners();
    log("DEBUG:WebRTCManager инициализирован");

    window.addEventListener("beforeunload", this.closeConnection.bind(this));
    window.addEventListener("pagehide", this.closeConnection.bind(this));
  }

  private _registerSocketListeners() {
    if (!this.socket) return;

    this.socket.on("call:incoming", this._handleIncomingCall.bind(this));
    this.socket.on("call:offer", this._handleOffer.bind(this));
    this.socket.on("call:answer", this._handleAnswer.bind(this));
    this.socket.on("call:candidate", this._handleIceCandidate.bind(this));
    this.socket.on("call:ended", this.closeConnection.bind(this));
    this.socket.on("call:accepted", (payload) => {
      if (payload?.id) this.currentCallId = payload.id;
      log(`DEBUG:Вызов принят ${payload.from}, callId=${this.currentCallId}`);
    });
    this.socket.on("call:started", (payload) => {
      if (payload?.call?.id) this.currentCallId = payload.call.id;
      log(`DEBUG:Вызов начат, callId=${this.currentCallId}`);
    });
  }

  private async _getLocalStream(
    video = true,
    audio = true,
  ): Promise<MediaStream> {
    if (this.localStream) {
      return this.localStream;
    }
    try {
      await this._initVideoDevices();
      const constraints = {
        video: video
          ? {
              width: { ideal: 1280 },
              height: { ideal: 720 },
              deviceId: { exact: this.frontCamera?.deviceId },
            }
          : false,
        audio: audio
          ? { noiseSuppression: true, echoCancellation: true }
          : false,
      };
      const stream = await navigator.mediaDevices.getUserMedia(constraints);
      this.localStream = stream;
      useChatStore.getState().setLocalStream(stream);
      log("DEBUG:✅ Локальный поток получен");
      return stream;
    } catch (error) {
      log(
        `ERROR ❌ Не удалось получить локальный поток ${error && error instanceof Error ? error.message : String(error)}`,
      );
      throw error;
    }
  }

  private async _initVideoDevices() {
    if (this.frontCamera && this.backCamera) return;
    const devices = await navigator.mediaDevices.enumerateDevices();
    const videoInputs = devices.filter((d) => d.kind === "videoinput");
    this.frontCamera =
      videoInputs.find((d) => /front|user/i.test(d.label)) || videoInputs[0];
    this.backCamera =
      videoInputs.find((d) => /back|rear|environment/i.test(d.label)) ||
      videoInputs[1] ||
      videoInputs[0];
    log(
      `DEBUG:Найдены видеоустройства: 
        front: ${JSON.stringify(this.frontCamera)},
        back: ${JSON.stringify(this.backCamera)}`,
    );
  }

  public async switchCamera() {
    if (!this.localStream || !this.peerConnection) return;
    if (this.localStream) {
      this.localStream.getVideoTracks().forEach((t) => {
        try {
          t.stop();
        } catch {}
        this.localStream?.removeTrack(t);
      });
    }
    await new Promise((r) => setTimeout(r, 50));

    // подождать, чтобы Android отпустил камеру
    await new Promise((r) => setTimeout(r, 50));
    try {
      await this._initVideoDevices();

      this.usingFront = !this.usingFront;
      const preferredDeviceId = this.usingFront
        ? this.frontCamera?.deviceId
        : this.backCamera?.deviceId;

      const tryConstraints = (deviceId?: string) =>
        deviceId
          ? { video: { deviceId: { exact: deviceId } } }
          : { video: { facingMode: this.usingFront ? "user" : "environment" } };

      let newStream: MediaStream | null = null;
      let lastError: unknown = null;

      const constraintsList = [
        tryConstraints(preferredDeviceId),
        tryConstraints(undefined),
      ];

      for (const c of constraintsList) {
        try {
          newStream = await navigator.mediaDevices.getUserMedia({
            ...c,
            audio: false,
          } as MediaStreamConstraints);
          if (newStream?.getVideoTracks().length) break;
        } catch (err) {
          lastError = err;
        }
      }

      if (!newStream) {
        log(
          `ERROR:❌ Не удается получить новый поток с камеры (пробовали deviceId и facingMode). ${String(
            lastError,
          )}`,
        );
        return;
      }

      const newTrack = newStream.getVideoTracks()[0];
      if (!newTrack) {
        for (const t of newStream.getTracks()) {
          t.stop();
        }
        log("ERROR:❌ Новый поток не имеет видеодорожки");
        return;
      }

      let sender = this.peerConnection
        .getSenders()
        .find((s) => s.track && s.track.kind === "video");

      if (!sender) {
        const tr = this.peerConnection
          .getTransceivers()
          .find((t) => t.sender && t.sender.track?.kind === "video");
        sender = tr?.sender;
      }

      if (sender?.replaceTrack) {
        await sender.replaceTrack(newTrack);
      } else {
        this.peerConnection.addTrack(newTrack, this.localStream);
      }

      const audioTracks = this.localStream.getAudioTracks();
      this.localStream.getVideoTracks().forEach((t) => {
        try {
          t.stop();
        } catch {}
        try {
          this.localStream?.removeTrack(t);
        } catch {}
      });
      this.localStream.addTrack(newTrack);
      audioTracks.forEach((t) => {
        if (!this.localStream?.getAudioTracks().includes(t)) {
          this.localStream?.addTrack(t);
        }
      });

      useChatStore.getState().setLocalStream(this.localStream);

      // остановить все лишние дорожки во вспомогательном потоке, кроме той, которую мы использовали
      newStream.getTracks().forEach((t) => {
        if (t !== newTrack)
          try {
            t.stop();
          } catch {}
      });

      log(
        `DEBUG:🔄 Камера переключена на ${this.usingFront ? "переднюю" : "заднюю"}`,
      );
    } catch (e) {
      log(
        `ERROR ❌ сбой switchCamera: ${e && e instanceof Error ? e.message : String(e)}`,
      );
    }
  }

  private async _getTurnConfig(): Promise<RTCConfiguration> {
    try {
      const response = await fetch(
        `/api/turn-credentials?userId=${useChatStore.getState().userId}`,
      );
      if (!response.ok) {
        throw new Error("Не удалось получить учетные данные TURN");
      }
      const turnConfig = await response.json();
      log(`DEBUG:✅ Получена конфигурация TURN" ${JSON.stringify(turnConfig)}`);
      return {
        iceServers: [
          // { urls: 'stun:stun.l.google.com:19302' },
          turnConfig,
        ],
        iceTransportPolicy: "relay",
      };
    } catch (error) {
      log(
        `ERROR:⚠️ Не удалось получить учетные данные TURN, используется только STUN. ${error && error instanceof Error ? error.message : String(error)}`,
      );
      return {
        iceServers: [{ urls: "stun:stun.l.google.com:19302" }],
      };
    }
  }

  private async _initPeerConnection(toUserId: string) {
    if (this.peerConnection) {
      log("DEBUG:Peer-соединение уже существует.");
      return;
    }
    this.currentCallUserId = toUserId;
    const config = await this._getTurnConfig();
    this.peerConnection = new RTCPeerConnection(config);
    useChatStore.getState().setPeerConnection(this.peerConnection);

    const stream = await this._getLocalStream();
    stream.getTracks().forEach((track) => {
      this.peerConnection?.addTrack(track, stream);
    });

    this.peerConnection.ontrack = (event) => {
      log("DEBUG:📡 Получена удаленная дорожка");
      this.remoteStream = event.streams[0];
      useChatStore.getState().setRemoteStream(this.remoteStream);
    };

    this.peerConnection.onicecandidate = (event) => {
      if (event.candidate && this.socket && this.currentCallUserId) {
        this.socket.emit("call:candidate", {
          to: this.currentCallUserId,
          candidate: event.candidate,
        });
      }
    };

    this.peerConnection.oniceconnectionstatechange = () => {
      const state = this.peerConnection?.iceConnectionState;
      log(`DEBUG:🧊 Состояние ICE-соединения: ${state}`);

      if (
        !this.suppressRestart &&
        (state === "disconnected" || state === "failed")
      ) {
        log("DEBUG:🔄 Попытка восстановить соединение...");
        setTimeout(() => {
          if (
            !this.suppressRestart &&
            this.peerConnection &&
            (this.peerConnection.iceConnectionState === "disconnected" ||
              this.peerConnection.iceConnectionState === "failed")
          ) {
            this._restartIce();
          }
        }, 2000);
      }
    };

    this.peerConnection.onconnectionstatechange = () => {
      log(
        `DEBUG:🔗 Состояние соединения: ${this.peerConnection?.connectionState}`,
      );
      if (this.peerConnection?.connectionState === "connected") {
        useChatStore.getState().setCallState("connected");
      }
    };
  }

  private async _restartIce() {
    if (!this.peerConnection)
      return log("⚠️ Нет peerConnection для перезапуска ICE");
    if (this.peerConnection.signalingState !== "stable")
      return log("DEBUG:⚠️ Состояние сигнализации нестабильно");
    if (!this.currentCallUserId)
      return log(
        "DEBUG:❌ Не удается перезапустить ICE: нет идентификатора пользователя текущего вызова",
      );
    if (useChatStore.getState().callState === "idle")
      return log(
        "DEBUG:⚠️ Состояние вызова idle, перезапуск ICE не выполняется.",
      ); // Добавлена проверка безопасности

    try {
      log("DEBUG:🔄 Перезапуск ICE...");
      const offer = await this.peerConnection.createOffer({ iceRestart: true });
      await this.peerConnection.setLocalDescription(offer);

      if (this?.socket?.emit) {
        this.socket.emit("call:offer", {
          to: this.currentCallUserId,
          sdp: this.peerConnection.localDescription,
          iceRestart: true,
        });
        log(
          `DEBUG:📤 Предложение о перезапуске ICE отправлено ${this.currentCallUserId}`,
        );
      }
    } catch (error) {
      log(
        `ERROR:❌ сбой перезапуска ICE: ${
          error && error instanceof Error ? error.message : String(error)
        }`,
      );
    }
  }

  public async initiateCall(toUserId: string) {
    log(`DEBUG:📞 Инициация вызова к ${toUserId}`);
    useChatStore.getState().setCallState("calling");
    await this._initPeerConnection(toUserId);

    if (!this.peerConnection || !this.socket) return;

    try {
      const offer = await this.peerConnection.createOffer();
      await this.peerConnection.setLocalDescription(offer);
      console.log("call:start");
      this.socket.emit("call:start", { to: toUserId, sdp: offer });

      // Также отправляем низкоуровневое предложение для сигнализации, как показано в client.js
      this.socket.emit("call:offer", { to: toUserId, sdp: offer });
    } catch (error) {
      log(
        `❌ Ошибка инициации вызова: ${
          error && error instanceof Error ? error.message : String(error)
        }`,
      );
      this.closeConnection();
    }
  }

  private async _handleIncomingCall(data: {
    from: string;
    sdp: RTCSessionDescriptionInit;
    callId: string;
  }) {
    if (useChatStore.getState().callState !== "idle") {
      this.socket?.emit("call:reject", { callId: data.callId });
      return;
    }
    this.currentCallId = data.callId;
    this.currentCallUserId = data.from;
    this.remoteSdp = data.sdp;
    useChatStore
      .getState()
      .setIncomingCall({ from: data.from, sdp: this.remoteSdp });
    useChatStore.getState().setCallState("incoming");
  }

  private async _handleOffer({
    from,
    sdp,
  }: {
    from: string;
    sdp: RTCSessionDescriptionInit;
  }) {
    if (
      useChatStore.getState().callState !== "idle" &&
      from !== this.currentCallUserId
    ) {
      this.socket?.emit("call:reject", {
        to: from,
        callId: this.currentCallId,
      });
      return;
    }

    // Если это предложение о перезапуске ICE или повторном согласовании
    if (this.peerConnection && this.currentCallUserId === from) {
      try {
        await this.peerConnection.setRemoteDescription(
          new RTCSessionDescription(sdp),
        );
        this.isRemoteDescriptionSet = true;
        this._processIceCandidates();
        const answer = await this.peerConnection.createAnswer();
        await this.peerConnection.setLocalDescription(answer);
        this.socket?.emit("call:answer", {
          to: from,
          sdp: this.peerConnection.localDescription,
        });
      } catch (error) {
        log(
          `❌ Ошибка обработки предложения о повторном согласовании: ${
            error && error instanceof Error ? error.message : String(error)
          }`,
        );
      }
      return;
    }

    if (useChatStore.getState().callState === "idle") {
      this.currentCallUserId = from;
      this.remoteSdp = sdp;
      useChatStore
        .getState()
        .setIncomingCall({ from: from, sdp: this.remoteSdp });
    }
  }

  public async answerCall() {
    log("DEBUG:✅ Ответ на вызов");
    const { incomingCall } = useChatStore.getState();
    if (!incomingCall || !this.socket) return;

    await this._initPeerConnection(incomingCall.from);
    if (!this.peerConnection) return;

    try {
      await this.peerConnection.setRemoteDescription(
        new RTCSessionDescription(incomingCall.sdp),
      );
      this.isRemoteDescriptionSet = true;

      const answer = await this.peerConnection.createAnswer();
      await this.peerConnection.setLocalDescription(answer);

      this.socket.emit("call:answer", { to: incomingCall.from, sdp: answer });
      log("DEBUG:📤 Ответ отправлен");

      useChatStore.getState().setCallState("connected");
      useChatStore.getState().setIncomingCall(null);

      this._processIceCandidates();
    } catch (error) {
      log(
        `❌ Ошибка при ответе на вызов: ${
          error && error instanceof Error ? error.message : String(error)
        }`,
      );
      this.closeConnection();
    }
  }

  private async _handleAnswer({
    sdp,
  }: {
    from: string;
    sdp: RTCSessionDescriptionInit;
  }) {
    if (!this.peerConnection) return;

    try {
      await this.peerConnection.setRemoteDescription(
        new RTCSessionDescription(sdp),
      );
      this.isRemoteDescriptionSet = true;
      log("DEBUG:✅ Удаленное описание (ответ) установлено");
      this._processIceCandidates();
    } catch (error) {
      log(
        `❌ Ошибка обработки ответа: ${
          error && error instanceof Error ? error.message : String(error)
        }`,
      );
    }
  }

  private async _handleIceCandidate({
    from,
    candidate,
  }: {
    from: string;
    candidate: RTCIceCandidateInit;
  }) {
    log(`DEBUG:🧊 ICE кандидат получен от ${from}`);
    if (!candidate) return;

    if (!this.peerConnection || !this.isRemoteDescriptionSet) {
      this.iceCandidateBuffer.push(candidate);
      log(
        `DEBUG:💾 Буферизация ICE кандидата (${this.iceCandidateBuffer.length})`,
      );
      return;
    }
    try {
      await this.peerConnection.addIceCandidate(new RTCIceCandidate(candidate));
    } catch (error) {
      log(
        `❌ Ошибка добавления ICE кандидата: ${
          error && error instanceof Error ? error.message : String(error)
        }`,
      );
    }
  }

  private _processIceCandidates() {
    if (this.iceCandidateBuffer.length > 0) {
      log(
        `DEBUG:🔄 Обработка ${this.iceCandidateBuffer.length} буферизированных ICE кандидатов`,
      );
      this.iceCandidateBuffer.forEach((candidate) => {
        this.peerConnection?.addIceCandidate(candidate);
      });
      this.iceCandidateBuffer = [];
    }
  }

  public closeConnection() {
    log("DEBUG:❌ Закрытие соединения");
    log(
      `"DEBUG:To id: ${this.currentCallUserId}  Call Id: ${this.currentCallId}`,
    );

    if (this.currentCallId) {
      if (this?.socket?.emit) {
        this.socket.emit("call:end", { callId: this.currentCallId });
      }
    }

    this.peerConnection?.close();
    this.localStream?.getTracks().forEach((track) => {
      track.stop();
    });
    this.remoteStream?.getTracks().forEach((track) => {
      track.stop();
    });

    this.peerConnection = null;
    this.localStream = null;
    this.remoteStream = null;
    this.iceCandidateBuffer = [];
    this.isRemoteDescriptionSet = false;
    this.currentCallUserId = null;
    this.currentCallId = null;
    this.remoteSdp = null;
    this.isScreenSharing = false;
    this.savedCameraTrack = null;
    this.suppressRestart = true; // Сброс suppressRestart при завершении вызова

    useChatStore.getState().setPeerConnection(null);
    useChatStore.getState().setLocalStream(null);
    useChatStore.getState().setRemoteStream(null);
    useChatStore.getState().setIncomingCall(null);
    useChatStore.getState().setCallState("idle");
  }

  // --- Управление медиа ---

  public toggleAudio() {
    if (!this.localStream) return;
    this.localStream.getAudioTracks().forEach((track) => {
      track.enabled = !track.enabled;
      log(`DEBUG:🎤 Микрофон ${track.enabled ? "ВКЛ" : "ВЫКЛ"}`);
    });
  }

  public toggleVideo() {
    if (!this.localStream) return;
    this.localStream.getVideoTracks().forEach((track) => {
      track.enabled = !track.enabled;
      log(`DEBUG:🎬 Камера ${track.enabled ? "ВКЛ" : "ВЫКЛ"}`);
    });
  }

  public async toggleScreenShare() {
    if (!this.peerConnection) return;

    const sender = this.peerConnection
      .getSenders()
      .find((s) => s.track?.kind === "video");
    if (!sender) return;

    if (this.isScreenSharing) {
      if (this.savedCameraTrack) {
        sender.replaceTrack(this.savedCameraTrack);
        this.localStream?.getTracks().forEach((t) => {
          t.stop();
        });

        const newLocalStream = new MediaStream([
          this.savedCameraTrack,
          ...(this.localStream?.getAudioTracks() || []),
        ]);
        this.localStream = newLocalStream;
        useChatStore.getState().setLocalStream(newLocalStream);

        this.savedCameraTrack = null;
        this.isScreenSharing = false;
        log("DEBUG:🖥️ Демонстрация экрана остановлена.");
      }
    } else {
      // Начать демонстрацию экрана
      try {
        const displayStream = await navigator.mediaDevices.getDisplayMedia({
          video: true,
        });
        const screenTrack = displayStream.getVideoTracks()[0];
        if (!screenTrack) return;

        this.savedCameraTrack = sender.track; // сохранить текущую видеодорожку
        sender.replaceTrack(screenTrack);

        // Обновить локальный вид для отображения экрана
        const newLocalStream = new MediaStream([
          screenTrack,
          ...(this.localStream?.getAudioTracks() || []),
        ]);
        this.localStream = newLocalStream;
        useChatStore.getState().setLocalStream(newLocalStream);

        screenTrack.onended = () => {
          if (this.isScreenSharing) {
            this.toggleScreenShare(); // Автоматически отключать, когда пользователь прекращает демонстрацию из интерфейса браузера
          }
        };
        this.isScreenSharing = true;
        log("DEBUG:🖥️ Демонстрация экрана начата.");
      } catch (error) {
        log(
          `ERROR:❌ Не удалось начать демонстрацию экрана ${
            error && error instanceof Error ? error.message : String(error)
          }`,
        );
      }
    }
  }
}

// Экспорт единственного экземпляра
export const webRTCManager = new WebRTCManager();
