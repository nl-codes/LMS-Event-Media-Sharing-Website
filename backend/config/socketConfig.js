/**
 * @module config/socketConfig
 * @description Holder for the socket.io server instance. server.js
 * registers it via {@link setIO}; the rest of the codebase grabs it
 * with {@link getIO} to emit room-scoped events without threading the
 * io object through every layer.
 */

let io;

/**
 * Register the live socket.io server. Called once from server.js boot.
 * @param {import("socket.io").Server} ioInstance
 */
export const setIO = (ioInstance) => {
    io = ioInstance;
};

/**
 * Get the shared socket.io server.
 * @returns {import("socket.io").Server}
 * @throws {Error} If {@link setIO} hasn't run yet (boot-ordering bug).
 */
export const getIO = () => {
    if (!io) {
        throw new Error("Socket.io not initialized");
    }
    return io;
};
