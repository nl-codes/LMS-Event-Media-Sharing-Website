import { io, Socket } from "socket.io-client";
import { backend_url } from "@/config/backend";

let socket: Socket;

export const getSocket = (): Socket => {
    if (!socket) {
        socket = io(backend_url || "http://localhost:3000", {
            transports: ["websocket"],
            autoConnect: false,
            withCredentials: true,
        });
    }

    return socket;
};
