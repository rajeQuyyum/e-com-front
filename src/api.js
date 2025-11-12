// src/api.js

// 🧩 Automatically chooses between local or deployed backend
const BASE_URL = import.meta.env.VITE_BACKEND_URL || "http://localhost:5001";

// API base (for fetch calls)
export const API = `${BASE_URL}/api`;

// Socket base (for Socket.IO connections)
export const SOCKET_URL = BASE_URL;

// Optional: log which backend you’re connected to
console.log("✅ API Base:", API);
console.log("✅ Socket Base:", SOCKET_URL);
