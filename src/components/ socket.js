// src/utils/socket.js
import { io } from "socket.io-client";
import { SOCKET_URL } from "../api";

const socket = io(SOCKET_URL, {
  autoConnect: false,
  transports: ["websocket"], // ✅ ensure it works on Vercel and Render
});

export default socket;
