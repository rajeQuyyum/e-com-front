import React, { useEffect, useState } from 'react';
import { API } from '../api';

export default function Notifications({ user }) {
  const [notifs, setNotifs] = useState([]);

  useEffect(() => {
    if (user) load();
  }, [user]);

  async function load() {
    try {
      const res = await fetch(`${API}/notifications/${user._id}`);
      const data = await res.json();
      setNotifs(data);
    } catch (err) {
      console.error("Failed to load notifications:", err);
    }
  }

  async function markRead(n) {
    try {
      await fetch(`${API}/notifications/read/${n._id}`, {
        method: 'POST',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify({ userId: user._id }),
      });
      setNotifs((prev) =>
        prev.map((x) =>
          x._id === n._id
            ? { ...x, readBy: [...(x.readBy || []), user._id] }
            : x
        )
      );
    } catch (err) {
      console.error("Mark read error:", err);
    }
  }

  // ✅ Format date & time
  function formatDate(dateString) {
    const date = new Date(dateString);
    return date.toLocaleString("en-US", {
      dateStyle: "medium",
      timeStyle: "short",
    });
  }

  return (
    <div className="p-4 mt-20">
      <h3 className="text-xl font-semibold mb-4">Notifications</h3>

      {notifs.length === 0 ? (
        <div className="text-gray-500 text-center mt-10 text-sm">
          📭 No notifications yet
        </div>
      ) : (
        <div className="space-y-3">
          {notifs.map((n) => (
            <div
              key={n._id}
              className={`bg-white p-3 rounded shadow flex items-start justify-between ${
                !(n.readBy || []).includes(user._id)
                  ? "border-l-4 border-blue-500"
                  : ""
              }`}
            >
              <div>
                <div className="font-semibold">{n.title}</div>
                <div className="text-sm text-gray-600">{n.body}</div>

                {/* 📅 Date & Time */}
                <div className="text-xs text-gray-400 mt-1">
                  {n.createdAt ? `📅 ${formatDate(n.createdAt)}` : "No date"}
                </div>
              </div>

              <div>
                {!(n.readBy || []).includes(user._id) ? (
                  <button
                    className="px-3 py-1 bg-blue-600 text-white rounded text-sm"
                    onClick={() => markRead(n)}
                  >
                    Mark read
                  </button>
                ) : (
                  <span className="text-sm text-gray-400">Read</span>
                )}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
