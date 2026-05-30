import { io, Socket } from "socket.io-client";
import { backend_url } from "@/config/backend";

let socket: Socket;

export const getSocket = (): Socket => {
    if (!socket) {
        socket = io(
            backend_url ||
                "https://lms-event-media-sharing-website.onrender.com",
            {
                autoConnect: false,
                withCredentials: true,
            },
        );
    }

    return socket;
};
