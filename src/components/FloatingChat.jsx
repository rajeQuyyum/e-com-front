import React, { useState, useEffect, useRef } from "react";
import { MessageSquare } from "lucide-react";
import { io } from "socket.io-client";
import { API } from "../api";
import Chat from "./ Chat"; // ✅ fixed spacing typo

export default function FloatingChat({ user }) {
  const [open, setOpen] = useState(false);
  const [unreadCount, setUnreadCount] = useState(
    parseInt(localStorage.getItem("unreadChatCount") || "0", 10)
  );
  const socketRef = useRef(null);

  // ✅ Connect to socket
  useEffect(() => {
    if (!user) return;

    const socket = io(API.replace("/api", ""), { transports: ["websocket"] });
    socketRef.current = socket;
    socket.emit("join", user._id);

    socket.on("receiveMessage", (msg) => {
      if (msg.room === user._id && !open) {
        const newCount = unreadCount + 1;
        setUnreadCount(newCount);
        localStorage.setItem("unreadChatCount", newCount.toString());
        localStorage.setItem("hasNewChat", "true");
        window.dispatchEvent(new Event("chatStatusUpdated"));
      }
    });

    return () => socket.disconnect();
  }, [user, open, unreadCount]);

  // ✅ Reset unread count when chat is opened
  useEffect(() => {
    if (open) {
      setUnreadCount(0);
      localStorage.setItem("unreadChatCount", "0");
      localStorage.setItem("hasNewChat", "false");
      window.dispatchEvent(new Event("chatStatusUpdated"));
    }
  }, [open]);

  // ✅ Sync with Navbar when badge is cleared elsewhere
  useEffect(() => {
    const syncHandler = () => {
      const count = parseInt(localStorage.getItem("unreadChatCount") || "0", 10);
      setUnreadCount(count);
    };
    window.addEventListener("chatStatusUpdated", syncHandler);
    return () => window.removeEventListener("chatStatusUpdated", syncHandler);
  }, []);

  const toggleChat = () => {
    const newState = !open;
    setOpen(newState);
    if (newState) {
      setUnreadCount(0);
      localStorage.setItem("unreadChatCount", "0");
      localStorage.setItem("hasNewChat", "false");
      window.dispatchEvent(new Event("chatStatusUpdated"));
    }
  };

  // ✅ Stop animation immediately when unreadCount = 0
  const isBouncing = unreadCount > 0 && !open;

  return (
    <>
      {/* Floating Button */}
      <div
        className={`fixed bottom-6 right-6 z-50 flex items-center justify-center w-14 h-14 bg-blue-600 hover:bg-blue-700 text-white rounded-full shadow-lg cursor-pointer transition-transform transform hover:scale-105 ${
          isBouncing ? "animate-bounce" : ""
        }`}
        onClick={toggleChat}
      >
        <MessageSquare size={28} />

        {/* 🔴 Numeric Badge */}
        {unreadCount > 0 && !open && (
          <span className="absolute top-1.5 right-1.5 flex items-center justify-center w-5 h-5 text-xs font-bold bg-red-600 text-white rounded-full border-2 border-white">
            {unreadCount > 9 ? "9+" : unreadCount}
          </span>
        )}
      </div>

      {/* Chat Popup */}
      {open && (
        <div className="fixed bottom-20 right-6 w-80 md:w-96 z-50">
          <div className="bg-white rounded-lg shadow-2xl border border-gray-200 overflow-hidden">
            <div className="flex justify-between items-center bg-blue-600 text-white px-4 py-2">
              <h4 className="font-semibold text-sm">Chat Support</h4>
              <button
                onClick={toggleChat}
                className="text-white text-lg font-bold hover:text-gray-200"
              >
                ✕
              </button>
            </div>
            <div className="p-3 max-h-[400px] overflow-auto">
              <Chat user={user} />
            </div>
          </div>
        </div>
      )}
    </>
  );
}
