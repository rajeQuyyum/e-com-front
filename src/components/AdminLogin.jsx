import React, { useState, useEffect } from "react";
import { API } from "../api";
import { useNavigate } from "react-router-dom";

export default function AdminLogin({ onAdminLogin }) {
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();

  // ✅ Skip login if already logged in
  useEffect(() => {
    const token = localStorage.getItem("adminToken");
    if (token) navigate("/admin/dashboard", { replace: true });
  }, [navigate]);

  async function handleLogin(e) {
    e.preventDefault();
    setLoading(true);

    try {
      const res = await fetch(`${API}/admin/login`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ username, password }),
      });

      const data = await res.json();

      if (!res.ok) {
        alert(data.error || "Invalid credentials");
      } else {
        alert("✅ Admin logged in!");

        // ✅ Use password as "token" since backend uses x-admin-password
        const token = password;
        localStorage.setItem("adminToken", JSON.stringify(token));
        onAdminLogin(token);

        // Navigate to dashboard
        setTimeout(() => {
          navigate("/admin/dashboard", { replace: true });
        }, 150);
      }
    } catch (err) {
      console.error("Admin login error:", err);
      alert("Server error, please try again later.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="flex items-center justify-center h-screen bg-gray-100">
      <div className="bg-white shadow-xl rounded-lg p-8 w-full max-w-sm">
        <h2 className="text-2xl font-semibold mb-6 text-center text-gray-800">
          Admin Login
        </h2>

        <form onSubmit={handleLogin} className="space-y-4">
          <input
            type="text"
            placeholder="Admin Username"
            value={username}
            onChange={(e) => setUsername(e.target.value)}
            className="w-full p-2 border rounded focus:ring focus:ring-yellow-200"
            required
          />
          <input
            type="password"
            placeholder="Admin Password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            className="w-full p-2 border rounded focus:ring focus:ring-yellow-200"
            required
          />

          <button
            type="submit"
            disabled={loading}
            className="w-full bg-yellow-600 text-white py-2 rounded hover:bg-yellow-700 transition disabled:opacity-50"
          >
            {loading ? "Logging in..." : "Login"}
          </button>
        </form>
      </div>
    </div>
  );
}
