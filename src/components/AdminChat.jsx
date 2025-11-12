import React, { useEffect, useRef, useState } from "react";
import { io } from "socket.io-client";
import { API } from "../api";

export default function AdminChat({ adminToken }) {
  const [users, setUsers] = useState([]);
  const [selectedUser, setSelectedUser] = useState(null);
  const [messages, setMessages] = useState([]);
  const [text, setText] = useState("");
  const [image, setImage] = useState(null);
  const [isTyping, setIsTyping] = useState(false);
  const socketRef = useRef(null);
  const boxRef = useRef(null);
  const typingTimeout = useRef(null);

  // ✅ Connect to socket
  useEffect(() => {
    const socket = io(API.replace("/api", ""), { transports: ["websocket"] });
    socketRef.current = socket;

    // ✅ Receive messages
    socket.on("receiveMessage", (msg) => {
      if (msg.room === selectedUser?.id) {
        setMessages((prev) =>
          prev.some((m) => m._id === msg._id && m.text === msg.text)
            ? prev
            : [...prev, msg]
        );
      }
    });

    // ✅ Listen for when the USER actually reads messages
    socket.on("messagesSeen", (roomId) => {
      if (roomId === selectedUser?.id) {
        setMessages((prev) => prev.map((m) => ({ ...m, seen: true })));
        console.log(`✅ User ${roomId} has read the messages`);
      }
    });

    // ✅ Typing indicators
    socket.on("typing", (data) => {
      if (data.room === selectedUser?.id && data.from !== "admin")
        setIsTyping(true);
    });

    socket.on("stopTyping", (data) => {
      if (data.room === selectedUser?.id && data.from !== "admin")
        setIsTyping(false);
    });

    return () => socket.disconnect();
  }, [selectedUser]);

  // ✅ Fetch users (chat rooms)
  useEffect(() => {
    fetch(`${API}/messages/rooms`)
      .then((r) => r.json())
      .then(setUsers)
      .catch(console.error);
  }, []);

  // ✅ Load chat messages (without marking as seen)
  async function loadMessages(user) {
    setSelectedUser(user);
    try {
      const res = await fetch(`${API}/messages/${user.id}`);
      const data = await res.json();
      setMessages(data);
      // ❌ Removed: socketRef.current.emit("markSeen", user.id);
      // We only mark seen when the USER opens chat, not admin
    } catch (err) {
      console.error("Load messages error:", err);
    }
  }

  // ✅ Auto scroll to bottom
  useEffect(() => {
    boxRef.current?.scrollTo({
      top: boxRef.current.scrollHeight,
      behavior: "smooth",
    });
  }, [messages]);

  // ✅ Typing events
  const handleTyping = () => {
    if (!selectedUser) return;
    socketRef.current.emit("typing", { room: selectedUser.id, from: "admin" });

    if (typingTimeout.current) clearTimeout(typingTimeout.current);
    typingTimeout.current = setTimeout(() => {
      socketRef.current.emit("stopTyping", {
        room: selectedUser.id,
        from: "admin",
      });
    }, 1000);
  };

  // ✅ Send message
  async function sendMessage(e) {
    e.preventDefault();
    if ((!text.trim() && !image) || !selectedUser) return;

    const formData = new FormData();
    formData.append("room", selectedUser.id);
    formData.append("from", "admin");
    if (text) formData.append("text", text);
    if (image) formData.append("image", image);

    const tempMsg = {
      _id: Date.now(),
      from: "admin",
      room: selectedUser.id,
      text,
      image: image ? URL.createObjectURL(image) : "",
      createdAt: new Date().toISOString(),
      delivered: true,
      seen: false,
    };
    setMessages((prev) => [...prev, tempMsg]);
    setText("");
    setImage(null);

    socketRef.current.emit("stopTyping", {
      room: selectedUser.id,
      from: "admin",
    });
    socketRef.current.emit("sendMessage", { ...tempMsg, toRoom: selectedUser.id });

    try {
      await fetch(`${API}/messages`, { method: "POST", body: formData });
    } catch (err) {
      console.error("Send message error:", err);
    }
  }

  // ✅ Clear chat
  async function clearChat() {
    if (!selectedUser) return alert("Select a user first");
    if (!window.confirm("🧹 Clear all messages in this chat?")) return;

    try {
      const res = await fetch(`${API}/messages/clear/${selectedUser.id}`, {
        method: "DELETE",
      });
      if (!res.ok) throw new Error("Failed to clear");
      alert("✅ Chat cleared!");
      setMessages([]);
    } catch (err) {
      console.error(err);
      alert("❌ Failed to clear chat");
    }
  }

  // ✅ Delete chat room
  async function deleteChat() {
    if (!selectedUser) return alert("Select a user first");
    if (!window.confirm("❌ Delete this user's chat history?")) return;

    try {
      const res = await fetch(`${API}/messages/delete-room/${selectedUser.id}`, {
        method: "DELETE",
      });
      if (!res.ok) throw new Error("Failed to delete");
      alert("🗑️ Chat deleted successfully!");
      setUsers((prev) => prev.filter((u) => u.id !== selectedUser.id));
      setSelectedUser(null);
      setMessages([]);
    } catch (err) {
      console.error(err);
      alert("❌ Failed to delete chat");
    }
  }

  // ✅ Delete user completely
  async function deleteUser() {
    if (!selectedUser) return alert("Select a user first");
    if (!window.confirm("⚠️ Delete this user entirely? This cannot be undone!"))
      return;

    try {
      const res = await fetch(`${API}/messages/remove-user/${selectedUser.id}`, {
        method: "DELETE",
      });
      if (!res.ok) throw new Error("Failed to delete user");
      alert("🚨 User and all their chats deleted successfully!");
      setUsers((prev) => prev.filter((u) => u.id !== selectedUser.id));
      setSelectedUser(null);
      setMessages([]);
    } catch (err) {
      console.error(err);
      alert("❌ Failed to delete user");
    }
  }

  const formatTime = (ts) =>
    new Date(ts).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" });

  return (
    <div className="flex flex-col md:flex-row gap-4 bg-white rounded shadow p-4 h-auto md:h-[500px]">
  {/* Left Panel */}
  <div className="w-full md:w-1/3 border-r md:border-r border-b md:border-b-0 pb-4 md:pb-0 overflow-auto">
    <h4 className="font-semibold mb-2 text-center md:text-left">User Chats</h4>
    {users.map((u) => (
      <div
        key={u.id}
        onClick={() => loadMessages(u)}
        className={`cursor-pointer px-2 py-1 rounded mb-1 text-center md:text-left ${
          selectedUser?.id === u.id
            ? "bg-blue-600 text-white"
            : "hover:bg-gray-100"
        }`}
      >
        {u.name || u.email}
      </div>
    ))}
  </div>

  {/* Chat Panel */}
  <div className="flex-1 flex flex-col w-full">
    {selectedUser ? (
      <>
        <div className="border-b pb-2 mb-2 flex flex-col md:flex-row md:items-center md:justify-between gap-2">
          <span className="font-semibold text-center md:text-left">
            Chat with: {selectedUser.name || selectedUser.email}
          </span>

          <div className="flex flex-wrap justify-center md:justify-end gap-2">
            <button
              onClick={clearChat}
              className="bg-yellow-500 hover:bg-yellow-600 text-white px-2 py-1 rounded text-sm"
            >
              🧹 Clear
            </button>
            <button
              onClick={deleteChat}
              className="bg-red-500 hover:bg-red-600 text-white px-2 py-1 rounded text-sm"
            >
              ❌ Delete Chat
            </button>
            <button
              onClick={deleteUser}
              className="bg-red-700 hover:bg-red-800 text-white px-2 py-1 rounded text-sm"
            >
              🚨 Delete User
            </button>
          </div>
        </div>

        {/* ✅ Scrollable Message Area */}
        <div
          ref={boxRef}
          className="flex-1 border p-2 rounded mb-2 space-y-2 overflow-y-auto"
          style={{ maxHeight: "300px", minHeight: "200px" }}
        >
          {messages.map((m) => (
            <div
              key={m._id}
              className={`p-2 rounded max-w-[85%] md:max-w-[70%] break-words whitespace-pre-wrap ${
                m.from === "admin"
                  ? "bg-green-500 text-white self-end ml-auto"
                  : "bg-gray-200 text-black"
              }`}
            >
              <div className="text-xs font-semibold mb-1 opacity-80">
                {m.from === "admin"
                  ? "You (Admin)"
                  : selectedUser?.name || selectedUser?.email || "User"}
              </div>

              {m.image && (
                <img
                  src={
                    m.image.startsWith("blob:")
                      ? m.image
                      : `${API.replace("/api", "")}${m.image}`
                  }
                  alt=""
                  className="w-32 h-32 object-cover rounded mb-1"
                />
              )}

              {m.text && <div>{m.text}</div>}

              <div className="text-xs mt-1 text-right opacity-75">
                {formatTime(m.createdAt)}{" "}
                {m.from === "admin" && (
                  <span style={{ color: m.seen ? "blue" : "inherit" }}>
                    {m.seen ? "seen✅" : m.delivered ? "✅✅" : "✅"}
                  </span>
                )}
              </div>
            </div>
          ))}

          {isTyping && (
            <div className="italic text-gray-500 text-sm mt-2 text-center md:text-left">
              {selectedUser.name || selectedUser.email} is typing...
            </div>
          )}
        </div>

        {/* Input Section */}
        <form
          onSubmit={sendMessage}
          className="flex flex-col sm:flex-row gap-2 items-center mt-auto"
        >
          <input
            type="file"
            accept="image/*"
            onChange={(e) => setImage(e.target.files[0])}
            className="w-full sm:w-auto"
          />
          <input
            className="flex-1 border rounded p-2 w-full"
            placeholder="Type your message..."
            value={text}
            onChange={(e) => setText(e.target.value)}
            onKeyDown={handleTyping}
          />
          <button
            type="submit"
            className="bg-blue-600 text-white px-4 py-2 rounded w-full sm:w-auto"
          >
            Send
          </button>
        </form>
      </>
    ) : (
      <div className="flex items-center justify-center text-gray-500 flex-1 text-center p-4">
        Select a user to chat.
      </div>
    )}
  </div>
</div>

  );
}
