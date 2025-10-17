This application is a web-based clone of WhatsApp, focusing on real-time chat functionality. It provides user authentication (login/register), a list of chats, and a chat window for exchanging messages. It also includes basic WebRTC capabilities for potential future voice/video calls, though these features are not fully implemented or exposed in the current UI.

**Structure:**
The application is built using Next.js, a React framework, and TypeScript for type safety. It leverages Tailwind CSS for styling.

Key directories and their roles:
*   `app/`: Contains the main application logic and UI components.
    *   `app/api/`: Next.js API routes for backend interactions (auth, messages, WebRTC TURN credentials).
    *   `app/components/`: Reusable React UI components (e.g., `AuthForm`, `ChatList`, `ChatWindow`, `Loader`, `Modal`, `SocketProvider`, `UserProvider`, `VideoPlayer`).
        *   `app/components/ChatWindow.tsx`: The main chat interface, now refactored to be a presentational component.
        *   `app/components/Welcome.tsx`, `ChatHeader.tsx`, `MessageList.tsx`, `MessageInput.tsx`, `Message.tsx`: Smaller, focused UI components for the chat window.
    *   `app/lib/`: Contains core application logic, utilities, and state management.
        *   `app/lib/api.ts`: Defines Zod schemas for API responses and provides API client functions (`chatApi`, `authApi`).
        *   `app/lib/clientActions.ts`, `app/lib/serverActions.ts`: Functions for client-side and server-side actions.
        *   `app/lib/store.ts`: Zustand store for global state management (chats, messages, pagination, call state).
        *   `app/lib/utils.ts`: General utility functions.
        *   `app/lib/WebRTCManager.ts`: Logic for WebRTC connections.
        *   `app/lib/hooks/useChat.ts`: Custom hook encapsulating the logic for the `ChatWindow` component.
    *   `app/login/`, `app/register/`: Pages for user authentication.
    *   `app/page.tsx`: The main application entry point, responsible for fetching initial data (chats) and rendering the main layout.
*   `middleware.ts`: Next.js middleware for handling requests (e.g., authentication checks).
*   `public/`: Static assets.
*   `node_modules/`: Project dependencies.

**Functions:**

1.  **User Authentication:**
    *   **Registration:** Users can create new accounts (`/register`).
    *   **Login:** Users can log in with existing accounts (`/login`).
    *   **Session Management:** Uses access tokens and refresh tokens for secure authentication.
2.  **Real-time Chat:**
    *   **Chat List:** Displays a list of active chats for the logged-in user.
    *   **Chat Window:** Provides an interface to view and send messages in a selected chat.
    *   **Message Sending/Receiving:** Real-time message exchange using WebSockets (Socket.IO).
    *   **Infinite Scrolling:** Automatically loads older messages as the user scrolls up.
    *   **Message Display:** Shows messages with sender information and timestamps.
3.  **State Management:**
    *   Uses Zustand for efficient and centralized management of application state, including active chat, messages, pagination, and call-related data.
4.  **WebRTC Integration (Partial):**
    *   Includes components and logic for managing WebRTC connections, local/remote media streams, and TURN credentials, indicating a foundation for voice/video call features.
5.  **API Interaction:**
    *   Communicates with a backend API for authentication, fetching chats, and messages. Zod is used for robust schema validation of API responses.

This application aims to replicate the core messaging experience of WhatsApp in a web environment.