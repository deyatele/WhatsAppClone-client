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
  private suppressRestart = false; // Added for ICE restart logic

  // Media stream management
  private localStream: MediaStream | null = null;
  private remoteStream: MediaStream | null = null;
  private isScreenSharing = false;
  private savedCameraTrack: MediaStreamTrack | null = null;
  private frontCamera?: MediaDeviceInfo;
  private backCamera?: MediaDeviceInfo;
  private usingFront = true;

  public initialize(socket: Socket) {
    if (this.socket) {
      return;
    }
    log(`CallStae Init: ${useChatStore.getState().callState}`);
    this.socket = socket;
    this._registerSocketListeners();
    log("WebRTCManager initialized");

    // Add unload listeners
    window.addEventListener("beforeunload", this.closeConnection.bind(this));
    window.addEventListener("pagehide", this.closeConnection.bind(this));
  }

  private _registerSocketListeners() {
    if (!this.socket) return;

    this.socket.on("call:incoming", this._handleIncomingCall.bind(this));
    this.socket.on("call:offer", this._handleOffer.bind(this)); // Added handler for low-level offer
    this.socket.on("call:answer", this._handleAnswer.bind(this));
    this.socket.on("call:candidate", this._handleIceCandidate.bind(this));
    this.socket.on("call:ended", this.closeConnection.bind(this));
    this.socket.on("call:accepted", (payload) => {
      console.log("CALL:ACCEPT", payload);
      if (payload?.id) this.currentCallId = payload.id;
      log(`Call accepted by ${payload.from}, callId=${this.currentCallId}`);
    });
    this.socket.on("call:started", (payload) => {
      console.log("call:started payload", payload);

      if (payload?.call?.id) this.currentCallId = payload.call.id;
      log(`Call started, callId=${this.currentCallId}`);
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
      const constraints = {
        video: video
          ? { width: { ideal: 1280 }, height: { ideal: 720 } }
          : false,
        audio: audio
          ? { noiseSuppression: true, echoCancellation: true }
          : false,
      };
      const stream = await navigator.mediaDevices.getUserMedia(constraints);
      this.localStream = stream;
      useChatStore.getState().setLocalStream(stream);
      log("✅ Got local stream");
      return stream;
    } catch (error) {
      log(
        `❌ Failed to get local stream ${error && error instanceof Error ? error.message : String(error)}`,
      );
      throw error;
    }
  }

  private async _getTurnConfig(): Promise<RTCConfiguration> {
    try {
      const response = await fetch(
        `/api/turn-credentials?userId=${useChatStore.getState().userId}`,
      );
      if (!response.ok) {
        throw new Error("Failed to fetch TURN credentials");
      }
      const turnConfig = await response.json();
      console.log("turnConfig", turnConfig);
      return {
        iceServers: [
          // { urls: 'stun:stun.l.google.com:19302' },
          turnConfig,
        ],
        iceTransportPolicy: "relay",
      };
    } catch (error) {
      log(
        `⚠️ Could not get TURN credentials, using STUN only. ${error && error instanceof Error ? error.message : String(error)}`,
      );
      return {
        iceServers: [{ urls: "stun:stun.l.google.com:19302" }],
      };
    }
  }

  private async _initPeerConnection(toUserId: string) {
    if (this.peerConnection) {
      log("Peer connection already exists.");
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
      log("📡 Remote track received");
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
      log(`🧊 ICE connection state: ${state}`);

      if (
        !this.suppressRestart &&
        (state === "disconnected" || state === "failed")
      ) {
        log("🔄 Attempting to restore connection...");
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
      log(`🔗 Connection state: ${this.peerConnection?.connectionState}`);
      if (this.peerConnection?.connectionState === "connected") {
        useChatStore.getState().setCallState("connected");
      }
    };
  }

  private async _restartIce() {
    if (!this.peerConnection) return log("⚠️ No peerConnection for ICE restart");
    if (this.peerConnection.signalingState !== "stable")
      return log("⚠️ Signaling state is not stable");
    if (!this.currentCallUserId)
      return log("❌ Cannot restart ICE: no current call user ID");
    if (useChatStore.getState().callState === "idle")
      return log("⚠️ Call state is idle, not restarting ICE."); // Added safety check

    try {
      log("🔄 Restarting ICE...");
      const offer = await this.peerConnection.createOffer({ iceRestart: true });
      await this.peerConnection.setLocalDescription(offer);

      if (this?.socket?.emit) {
        this.socket.emit("call:offer", {
          to: this.currentCallUserId,
          sdp: this.peerConnection.localDescription,
          iceRestart: true,
        });
        log(`📤 ICE restart offer sent to ${this.currentCallUserId}`);
      }
    } catch (error) {
      log(
        `❌ ICE restart failed: ${
          error && error instanceof Error ? error.message : String(error)
        }`,
      );
    }
  }

  public async initiateCall(toUserId: string) {
    log(`📞 Initiating call to ${toUserId}`);
    useChatStore.getState().setCallState("calling");
    await this._initPeerConnection(toUserId);

    if (!this.peerConnection || !this.socket) return;

    try {
      const offer = await this.peerConnection.createOffer();
      await this.peerConnection.setLocalDescription(offer);

      this.socket.emit("call:start", { to: toUserId, sdp: offer });

      // Also emit low-level offer for signaling, as seen in client.js
      this.socket.emit("call:offer", { to: toUserId, sdp: offer });
    } catch (error) {
      log(
        `❌ Error initiating call: ${
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

    // If it's an ICE restart offer or a re-negotiation
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
          `❌ Error handling re-negotiation offer: ${
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
    log("✅ Answering call");
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
      log("📤 Answer sent");

      useChatStore.getState().setCallState("connected");
      useChatStore.getState().setIncomingCall(null);

      this._processIceCandidates();
    } catch (error) {
      log(
        `❌ Error answering call: ${
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
      log("✅ Remote description (answer) set");
      this._processIceCandidates();
    } catch (error) {
      log(
        `❌ Error handling answer: ${
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
    log(`🧊 ICE candidate received from ${from}`);
    if (!candidate) return;

    if (!this.peerConnection || !this.isRemoteDescriptionSet) {
      this.iceCandidateBuffer.push(candidate);
      log(`💾 Buffering ICE candidate (${this.iceCandidateBuffer.length})`);
      return;
    }
    try {
      await this.peerConnection.addIceCandidate(new RTCIceCandidate(candidate));
    } catch (error) {
      log(
        `❌ Error adding ICE candidate: ${
          error && error instanceof Error ? error.message : String(error)
        }`,
      );
    }
  }

  private _processIceCandidates() {
    if (this.iceCandidateBuffer.length > 0) {
      log(
        `🔄 Processing ${this.iceCandidateBuffer.length} buffered ICE candidates`,
      );
      this.iceCandidateBuffer.forEach((candidate) => {
        this.peerConnection?.addIceCandidate(candidate);
      });
      this.iceCandidateBuffer = [];
    }
  }

  public closeConnection() {
    log("❌ Closing connection");
    log(
      "To id: " +
        this.currentCallUserId +
        " To id: " +
        "?" +
        " Call Id:" +
        this.currentCallId,
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
    this.suppressRestart = true; // Reset suppressRestart on call end

    useChatStore.getState().setPeerConnection(null);
    useChatStore.getState().setLocalStream(null);
    useChatStore.getState().setRemoteStream(null);
    useChatStore.getState().setIncomingCall(null);
    useChatStore.getState().setCallState("idle");
  }

  // --- Media Controls ---

  public toggleAudio() {
    if (!this.localStream) return;
    this.localStream.getAudioTracks().forEach((track) => {
      track.enabled = !track.enabled;
      log(`🎤 Microphone ${track.enabled ? "ON" : "OFF"}`);
    });
  }

  public toggleVideo() {
    if (!this.localStream) return;
    this.localStream.getVideoTracks().forEach((track) => {
      track.enabled = !track.enabled;
      log(`🎬 Camera ${track.enabled ? "ON" : "OFF"}`);
    });
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
      `Video devices found: ${{
        front: this.frontCamera?.label,
        back: this.backCamera?.label,
      }}`,
    );
  }

  public async switchCamera() {
    await this._initVideoDevices();
    if (!this.localStream || !this.peerConnection) return;

    this.usingFront = !this.usingFront;
    const deviceId = this.usingFront
      ? this.frontCamera?.deviceId
      : this.backCamera?.deviceId;
    if (!deviceId) {
      log("⚠️ Could not find camera to switch to.");
      return;
    }

    const newStream = await navigator.mediaDevices.getUserMedia({
      video: { deviceId: { exact: deviceId } },
    });
    const newTrack = newStream.getVideoTracks()[0];

    const sender = this.peerConnection
      .getSenders()
      .find((s) => s.track?.kind === "video");
    if (sender) {
      sender.replaceTrack(newTrack);
    }

    // also update local stream for the user to see
    const oldTrack = this.localStream.getVideoTracks()[0];
    this.localStream.removeTrack(oldTrack);
    oldTrack.stop();
    this.localStream.addTrack(newTrack);
    useChatStore.getState().setLocalStream(this.localStream);

    log(`🔄 Switched camera to ${this.usingFront ? "front" : "back"}`);
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
        log("🖥️ Screen sharing stopped.");
      }
    } else {
      // Start screen share
      try {
        const displayStream = await navigator.mediaDevices.getDisplayMedia({
          video: true,
        });
        const screenTrack = displayStream.getVideoTracks()[0];
        if (!screenTrack) return;

        this.savedCameraTrack = sender.track; // save current camera track
        sender.replaceTrack(screenTrack);

        // Update local view to show screen
        const newLocalStream = new MediaStream([
          screenTrack,
          ...(this.localStream?.getAudioTracks() || []),
        ]);
        this.localStream = newLocalStream;
        useChatStore.getState().setLocalStream(newLocalStream);

        screenTrack.onended = () => {
          if (this.isScreenSharing) {
            this.toggleScreenShare(); // Automatically revert when user stops sharing from browser UI
          }
        };
        this.isScreenSharing = true;
        log("🖥️ Screen sharing started.");
      } catch (error) {
        log(
          `❌ Could not start screen share ${
            error && error instanceof Error ? error.message : String(error)
          }`,
        );
      }
    }
  }
}

// Export a singleton instance
export const webRTCManager = new WebRTCManager();
