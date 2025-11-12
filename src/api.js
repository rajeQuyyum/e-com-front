// src/api.js
const BACKEND_URL = import.meta.env.VITE_BACKEND_URL?.replace(/\/$/, "") || "http://localhost:5001";

export const API = `${BACKEND_URL}/api`;
export const SOCKET_URL = BACKEND_URL; // ✅ Same base URL for sockets
export const BASE_URL = BACKEND_URL;   // ✅ For images, if needed
