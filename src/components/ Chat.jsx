import React, { useEffect, useRef, useState } from "react";
import { API, SOCKET_URL } from "../api";
import { io } from "socket.io-client";
import { IoIosSend } from "react-icons/io";

export default function Chat({ user }) {
  const [messages, setMessages] = useState([]);
  const [text, setText] = useState("");
  const [image, setImage] = useState(null);
  const boxRef = useRef(null);
  const socketRef = useRef(null);
  const joinedRef = useRef(false);
  const room = user?._id || "guest";

  // ✅ Connect socket only once
  useEffect(() => {
    if (joinedRef.current) return;
    joinedRef.current = true;

    const socket = io(SOCKET_URL, { transports: ["websocket"] });
    socketRef.current = socket;
    socket.emit("join", room);

    // ✅ Receive messages
    socket.on("receiveMessage", (msg) => {
      if (msg.room === room) {
        setMessages((prev) =>
          prev.some((m) => m._id === msg._id && m.text === msg.text)
            ? prev
            : [...prev, msg]
        );
      }
    });

    // ✅ When admin sees messages
    socket.on("messagesSeen", (roomId) => {
      if (roomId === room) {
        setMessages((prev) => prev.map((m) => ({ ...m, seen: true })));
      }
    });

    // ✅ Load old messages
    (async () => {
      try {
        const res = await fetch(`${API}/messages/${room}`);
        const data = await res.json();
        setMessages(data);
      } catch (err) {
        console.error("Load messages error:", err);
      }
    })();

    return () => {
      socket.off("receiveMessage");
      socket.disconnect();
    };
  }, [room]);

  // ✅ Auto-scroll to bottom
  useEffect(() => {
    boxRef.current?.scrollTo({
      top: boxRef.current.scrollHeight,
      behavior: "smooth",
    });
  }, [messages]);

  // ✅ Mark all messages as seen
  useEffect(() => {
    if (!user?._id) return;
    const markAsSeen = async () => {
      try {
        socketRef.current?.emit("markSeen", user._id);
        await fetch(`${API}/messages/seen/${user._id}`, { method: "PUT" });
      } catch (err) {
        console.error("❌ Failed to mark messages as seen:", err);
      }
    };

    markAsSeen();
  }, [user?._id]);

  // ✅ Send message (with Cloudinary + no duplicates)
  async function sendMessage() {
    if ((!text.trim() && !image) || !user) return;

    const formData = new FormData();
    formData.append("room", room);
    formData.append("from", user.email);
    if (socketRef.current?.id) {
      formData.append("senderSocketId", socketRef.current.id);
    }
    if (text) formData.append("text", text);
    if (image) formData.append("image", image);

    // Show temporary message immediately (optimistic UI)
    const tempMsg = {
      _id: Date.now(),
      room,
      from: user.email,
      text,
      image: image ? URL.createObjectURL(image) : "",
      createdAt: new Date().toISOString(),
      delivered: true,
      seen: false,
    };

    setMessages((prev) => [...prev, tempMsg]);
    setText("");
    setImage(null);

    // ✅ Do NOT emit socket message directly (server will handle broadcasting)
    try {
      await fetch(`${API}/messages`, {
        method: "POST",
        body: formData,
      });
    } catch (err) {
      console.error("Send message error:", err);
    }
  }

  const formatTime = (ts) =>
    new Date(ts).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" });

  return (
    <div className="bg-white p-4 rounded shadow max-w-2xl mt-20 m-auto">
      <h3 className="font-semibold mb-3">Chat Support</h3>

      <div
        ref={boxRef}
        className="h-64 overflow-auto mb-3 border rounded p-3 flex flex-col space-y-2"
      >
        {messages.map((m, i) => {
          const isMine = m.from === user.email;
          const senderName = isMine ? "You" : m.from === "admin" ? "Admin" : m.from;

          return (
            <div
              key={m._id || i}
              className={`p-2 rounded max-w-[75%] whitespace-pre-wrap ${
                isMine
                  ? "self-end bg-blue-500 text-white"
                  : "self-start bg-gray-200 text-black"
              }`}
            >
              <div className="text-xs font-semibold mb-1 opacity-80">
                {senderName}
              </div>

              {m.image && (
                <img
                  src={
                    m.image.startsWith("blob:")
                      ? m.image
                      : m.image.startsWith("http")
                      ? m.image
                      : `${SOCKET_URL}${m.image}`
                  }
                  alt=""
                  className="w-32 h-32 object-cover rounded mb-2"
                />
              )}

              {m.text && <div>{m.text}</div>}

              <div className="text-xs text-right mt-1 opacity-70">
                {formatTime(m.createdAt)}{" "}
                {isMine && (
                  <span>{m.seen ? "✅✅" : m.delivered ? "✅" : "✅"}</span>
                )}
              </div>
            </div>
          );
        })}
      </div>

      <div className="flex md:flex-row flex-wrap gap-2 items-center">
        <input
          type="file"
          accept="image/*"
          onChange={(e) => setImage(e.target.files[0])}
        />

        <textarea
          className="flex-1 p-2 border rounded resize-none overflow-y-auto"
          style={{ maxHeight: "120px" }}
          value={text}
          onChange={(e) => setText(e.target.value)}
          placeholder="Type a message..."
          onKeyDown={(e) => {
            if (e.key === "Enter" && !e.shiftKey) {
              e.preventDefault();
              sendMessage();
            }
          }}
          rows={1}
        />

        <button
          className="px-4 py-2 bg-blue-600 text-white rounded"
          onClick={sendMessage}
        >
          <IoIosSend />
        </button>
      </div>
    </div>
  );
}
