import React, { useEffect, useState } from "react";
import { API } from "../api";

export default function Profile({ user }) {
  const [profile, setProfile] = useState({
    fullName: "",
    email: "",
    phone: "",
    optionalEmail: "",
    address: "",
  });
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);

  // 🧭 Fetch existing profile
  useEffect(() => {
    if (!user?._id) return;
    (async () => {
      setLoading(true);
      try {
        const res = await fetch(`${API}/profile/${user._id}`);
        const data = await res.json();
        setProfile(data);
      } catch (err) {
        console.error("Load profile error:", err);
      } finally {
        setLoading(false);
      }
    })();
  }, [user]);

  // 🧩 Handle field edits
  function handleChange(e) {
    const { name, value } = e.target;
    setProfile((prev) => ({ ...prev, [name]: value }));
  }

  // 💾 Save profile (only editable fields)
  async function handleSave() {
    if (!user?._id) return;
    setSaving(true);
    try {
      const res = await fetch(`${API}/profile/${user._id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          phone: profile.phone,
          optionalEmail: profile.optionalEmail,
          address: profile.address,
        }),
      });
      const data = await res.json();
      if (data.ok) alert("✅ Profile saved successfully!");
      else alert("❌ Failed to save profile");
    } catch (err) {
      console.error("Save profile error:", err);
    } finally {
      setSaving(false);
    }
  }

  if (loading) return <div className="mt-20 text-center">Loading profile...</div>;

  return (
    <div className="max-w-md mx-auto mt-24 bg-white shadow-lg rounded-lg p-6 border">
      <h2 className="text-xl font-semibold mb-4 text-center text-gray-700">
        👤 My Profile
      </h2>

      <div className="space-y-4">
        {/* 🧍 Full Name (read-only) */}
        <div>
          <label className="block text-gray-600 text-sm mb-1">Full Name</label>
          <input
            type="text"
            name="fullName"
            value={profile.fullName || ""}
            disabled
            className="w-full p-2 border rounded bg-gray-100 text-gray-700 cursor-not-allowed"
          />
        </div>

        {/* ✉️ Email (read-only) */}
        <div>
          <label className="block text-gray-600 text-sm mb-1">Email</label>
          <input
            type="email"
            name="email"
            value={profile.email || ""}
            disabled
            className="w-full p-2 border rounded bg-gray-100 text-gray-700 cursor-not-allowed"
          />
        </div>

        {/* 📱 Phone */}
        <div>
          <label className="block text-gray-600 text-sm mb-1">Phone</label>
          <input
            type="text"
            name="phone"
            value={profile.phone || ""}
            onChange={handleChange}
            className="w-full p-2 border rounded focus:ring focus:ring-blue-300"
            placeholder="Enter your phone number"
          />
        </div>

        {/* ✉️ Optional Email */}
        <div>
          <label className="block text-gray-600 text-sm mb-1">Optional Email</label>
          <input
            type="email"
            name="optionalEmail"
            value={profile.optionalEmail || ""}
            onChange={handleChange}
            className="w-full p-2 border rounded focus:ring focus:ring-blue-300"
            placeholder="Enter an alternate email"
          />
        </div>

        {/* 🏠 Address */}
        <div>
          <label className="block text-gray-600 text-sm mb-1">Address</label>
          <textarea
            name="address"
            value={profile.address || ""}
            onChange={handleChange}
            className="w-full p-2 border rounded focus:ring focus:ring-blue-300"
            rows={3}
            placeholder="Enter your address"
          />
        </div>
      </div>

      <button
        onClick={handleSave}
        disabled={saving}
        className="mt-6 w-full bg-blue-600 text-white font-semibold py-2 rounded hover:bg-blue-700 transition disabled:opacity-50"
      >
        {saving ? "Saving..." : "Save Changes"}
      </button>
    </div>
  );
}

