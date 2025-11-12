import React, { useState } from "react";
import { API } from "../api";
import { NavLink, useNavigate } from "react-router-dom";

export default function Register({ setView }) {
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);

  const navigate = useNavigate();

  async function handleRegister(e) {
    e.preventDefault();
    if (!email || !password) return alert("Email and password required");

    setLoading(true);
    try {
      const res = await fetch(`${API}/users/register`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name, email, password }),
      });

      // Try to parse JSON safely; if it fails get raw text for debugging
      let data;
      try {
        data = await res.json();
      } catch (parseErr) {
        const txt = await res.text();
        console.warn("Register: response not JSON. status:", res.status, "text:", txt);
        data = { _rawText: txt };
      }

      console.log("Register response status:", res.status, "body:", data);

      // Heuristics for success:
      // - HTTP 2xx
      // - or body contains user/object/_id or success flag
      const looksLikeSuccess =
        res.ok ||
        data?.user ||
        data?.success ||
        data?._id ||
        (typeof data === "object" && Object.keys(data).length > 0 && !data.error && res.status < 500);

      if (looksLikeSuccess) {
        alert("✅ Registration successful! Please log in.");
        setName("");
        setEmail("");
        setPassword("");

        // prefer setView if parent uses it, otherwise navigate to /login
        if (typeof setView === "function") {
          setView("login");
        } else {
          navigate("/login");
        }
        return;
      }

      // Otherwise show server-provided message where possible
      if (data && data.error) {
        alert(data.error);
      } else if (data && data._rawText) {
        alert("Server response: " + data._rawText);
      } else {
        alert("Registration failed. Check console/network for server response.");
      }
    } catch (err) {
      console.error("Register fetch error:", err);
      alert("Server error, please try again");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="max-w-sm mx-auto mt-20 bg-white shadow-md rounded p-6">
      <h2 className="text-2xl font-semibold mb-4 text-center text-gray-700">
        Create Account
      </h2>
      <form onSubmit={handleRegister} className="space-y-4">
        <input
          type="text"
          placeholder="Full Name"
          value={name}
          onChange={(e) => setName(e.target.value)}
          className="w-full p-2 border rounded focus:ring focus:ring-blue-200"
        />
        <input
          type="email"
          placeholder="Email Address"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          className="w-full p-2 border rounded focus:ring focus:ring-blue-200"
        />
        <input
          type="password"
          placeholder="Password"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          className="w-full p-2 border rounded focus:ring focus:ring-blue-200"
        />
        <button
          type="submit"
          disabled={loading}
          className="w-full bg-blue-600 text-white py-2 rounded hover:bg-blue-700 transition disabled:opacity-50"
        >
          {loading ? "Registering..." : "Register"}
        </button>
        <p className="text-center text-sm text-gray-600">
          Already have an account?{" "}
          <NavLink to="/login" className="text-blue-600 cursor-pointer hover:underline">
            Login
          </NavLink>
        </p>
      </form>
    </div>
  );
}
