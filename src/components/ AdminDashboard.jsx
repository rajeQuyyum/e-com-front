import React, { useEffect, useState } from "react";
import { API, BASE_URL } from "../api"; // ✅ Added BASE_URL import
import { useNavigate } from "react-router-dom";
import AdminChat from "./AdminChat";

export default function AdminDashboard({ adminToken }) {
  const [users, setUsers] = useState([]);
  const [carts, setCarts] = useState([]);
  const [notifications, setNotifications] = useState([]);
  const [products, setProducts] = useState([]);
  const [selectedCart, setSelectedCart] = useState(null);
  const [showCartModal, setShowCartModal] = useState(false);

  // NEW: user profile modal state
  const [showUserProfileModal, setShowUserProfileModal] = useState(false);
  const [profileLoading, setProfileLoading] = useState(false);
  const [selectedUserProfile, setSelectedUserProfile] = useState(null);

  // Notification form
  const [title, setTitle] = useState("");
  const [body, setBody] = useState("");
  const [target, setTarget] = useState("all");
  const [editId, setEditId] = useState(null);

  // Product form
  const [productTitle, setProductTitle] = useState("");
  const [productPrice, setProductPrice] = useState("");
  const [productDesc, setProductDesc] = useState("");
  const [productImages, setProductImages] = useState([]);

  const navigate = useNavigate();

  useEffect(() => {
    if (adminToken) loadData();
  }, [adminToken]);

  async function loadData() {
    try {
      const headers = { "x-admin-password": adminToken };
      const [usersRes, cartsRes, notifRes, prodRes] = await Promise.all([
        fetch(`${API}/admin/users`, { headers }),
        fetch(`${API}/admin/carts`, { headers }),
        fetch(`${API}/admin/notify`, { headers }),
        fetch(`${API}/products`),
      ]);
      setUsers(await usersRes.json());
      setCarts(await cartsRes.json());
      setNotifications(await notifRes.json());
      setProducts(await prodRes.json());
    } catch (err) {
      console.error("AdminDashboard loadData error:", err);
      alert("⚠️ Failed to load admin data.");
    }
  }

  // Product Upload
  async function uploadProduct(e) {
    e.preventDefault();
    if (!productTitle || !productPrice || productImages.length === 0)
      return alert("Please fill in all fields");

    const formData = new FormData();
    formData.append("title", productTitle);
    formData.append("price", productPrice);
    formData.append("description", productDesc);
    for (const img of productImages) formData.append("images", img);

    try {
      const res = await fetch(`${API}/products`, { method: "POST", body: formData });
      if (!res.ok) throw new Error("Failed");
      alert("✅ Product uploaded!");
      setProductTitle("");
      setProductPrice("");
      setProductDesc("");
      setProductImages([]);
      loadData();
    } catch (err) {
      console.error("Upload error:", err);
      alert("❌ Failed to upload");
    }
  }

  async function deleteProduct(id) {
    if (!window.confirm("Delete this product?")) return;
    try {
      const res = await fetch(`${API}/products/${id}`, { method: "DELETE" });
      if (!res.ok) throw new Error("Failed");
      alert("🗑️ Product deleted");
      loadData();
    } catch (err) {
      console.error(err);
    }
  }

  // Notifications
  async function saveNotification() {
    if (!title || !body) return alert("Please fill title and message");
    const method = editId ? "PUT" : "POST";
    const url = editId
      ? `${API}/admin/notify/${editId}`
      : `${API}/admin/notify`;

    try {
      const res = await fetch(url, {
        method,
        headers: {
          "content-type": "application/json",
          "x-admin-password": adminToken,
        },
        body: JSON.stringify({ title, body, target }),
      });
      if (!res.ok) throw new Error("Failed");
      alert(editId ? "✅ Notification updated" : "✅ Notification sent");
      setTitle("");
      setBody("");
      setTarget("all");
      setEditId(null);
      loadData();
    } catch (err) {
      alert("❌ Failed to save notification");
      console.error(err);
    }
  }

  async function deleteNotification(id) {
    if (!window.confirm("Delete this notification?")) return;
    try {
      const res = await fetch(`${API}/admin/notify/${id}`, {
        method: "DELETE",
        headers: { "x-admin-password": adminToken },
      });
      if (!res.ok) throw new Error("Failed");
      alert("🗑️ Notification deleted");
      loadData();
    } catch (err) {
      alert("❌ Failed to delete notification");
    }
  }

  function startEdit(n) {
    setEditId(n._id);
    setTitle(n.title);
    setBody(n.body);
    setTarget(n.target || "all");
  }

  // Users and Carts
  async function deleteUser(userId) {
    if (!userId) return alert("Invalid user ID");
    if (!window.confirm("Delete user and their cart?")) return;
    try {
      await fetch(`${API}/admin/users/${userId}`, {
        method: "DELETE",
        headers: { "x-admin-password": adminToken },
      });
      alert("🗑️ User deleted");
      loadData();
    } catch {
      alert("❌ Failed to delete user");
    }
  }

  async function deleteCart(userId) {
    if (!userId) return alert("Invalid user ID");
    if (!window.confirm("Delete this user's cart?")) return;
    try {
      await fetch(`${API}/admin/cart/${userId}`, {
        method: "DELETE",
        headers: { "x-admin-password": adminToken },
      });
      alert("🗑️ Cart deleted");
      loadData();
      setShowCartModal(false);
    } catch {
      alert("❌ Failed to delete cart");
    }
  }

  function openCartModal(cart) {
    setSelectedCart(cart);
    setShowCartModal(true);
  }
  function closeCartModal() {
    setSelectedCart(null);
    setShowCartModal(false);
  }

  function calculateCartTotal(cart) {
    return (cart.items || []).reduce(
      (sum, i) => sum + (i.productId?.price || 0) * (i.qty || 0),
      0
    );
  }

  function handleLogout() {
    localStorage.removeItem("adminToken");
    navigate("/admin");
  }

  // NEW: User profile modal helpers
  async function openUserProfile(userObj) {
    if (!userObj || !userObj._id) return;
    setProfileLoading(true);
    setShowUserProfileModal(true);
    setSelectedUserProfile(null);

    try {
      const res = await fetch(`${API}/profile/${userObj._id}`);
      if (res.ok) {
        const profileData = await res.json();
        const combined = {
          _id: userObj._id,
          email: userObj.email || profileData.email || "",
          name: userObj.name || profileData.fullName || "",
          fullName: profileData.fullName || userObj.name || "",
          phone: profileData.phone || userObj.phone || "",
          optionalEmail: profileData.optionalEmail || "",
          address: profileData.address || "",
          createdAt: profileData.createdAt || userObj.createdAt || "",
        };
        setSelectedUserProfile(combined);
      } else {
        const combined = {
          _id: userObj._id,
          email: userObj.email || "",
          name: userObj.name || "",
          fullName: userObj.name || "",
          phone: userObj.phone || "",
          optionalEmail: "",
          address: "",
          createdAt: userObj.createdAt || "",
        };
        setSelectedUserProfile(combined);
      }
    } catch (err) {
      console.error("Failed to load user profile:", err);
      const combined = {
        _id: userObj._id,
        email: userObj.email || "",
        name: userObj.name || "",
        fullName: userObj.name || "",
        phone: userObj.phone || "",
        optionalEmail: "",
        address: "",
        createdAt: userObj.createdAt || "",
      };
      setSelectedUserProfile(combined);
    } finally {
      setProfileLoading(false);
    }
  }

  function closeUserProfileModal() {
    setSelectedUserProfile(null);
    setShowUserProfileModal(false);
    setProfileLoading(false);
  }

  return (
    <div className="p-4">
      {/* Header */}
      <div className="flex justify-between mb-6">
        <h3 className="text-2xl font-semibold">Admin Dashboard</h3>
        <button
          onClick={handleLogout}
          className="bg-red-600 hover:bg-red-700 text-white px-4 py-2 rounded"
        >
          Logout
        </button>
      </div>

      {/* 🛍️ PRODUCT UPLOAD */}
      <div className="bg-white p-4 rounded shadow mb-6">
        <h4 className="font-semibold mb-3">Add New Product</h4>
        <form onSubmit={uploadProduct} className="space-y-2">
          <input
            placeholder="Product Title"
            value={productTitle}
            onChange={(e) => setProductTitle(e.target.value)}
            className="w-full p-2 border rounded"
          />
          <input
            type="number"
            placeholder="Price"
            value={productPrice}
            onChange={(e) => setProductPrice(e.target.value)}
            className="w-full p-2 border rounded"
          />
          <textarea
            placeholder="Description"
            value={productDesc}
            onChange={(e) => setProductDesc(e.target.value)}
            className="w-full p-2 border rounded"
          />
          <input
            type="file"
            multiple
            onChange={(e) => setProductImages(Array.from(e.target.files))}
          />
          <button
            type="submit"
            className="bg-green-600 hover:bg-green-700 text-white px-4 py-2 rounded"
          >
            Upload Product
          </button>
        </form>

        {/* Product list */}
        <div className="mt-4 max-h-64 overflow-auto">
          <h5 className="font-semibold mb-2">Existing Products</h5>
          {products.map((p) => (
            <div
              key={p._id}
              className="flex justify-between border-b py-2 items-center"
            >
              <div className="flex items-center gap-3">
                {p.images?.[0] && (
                 <img
                  src={
                     p.images[0].startsWith("http")
                      ? p.images[0]
                       : `${BASE_URL}${p.images[0]}`
                   }
                  alt={p.title}
                   className="w-12 h-12 object-cover rounded"
                 />
                )}

                <div>
                  <div className="font-semibold">{p.title}</div>
                  <div className="text-sm text-gray-500">₦{p.price}</div>
                </div>
              </div>
              <button
                onClick={() => deleteProduct(p._id)}
                className="text-red-600 hover:text-red-800"
              >
                🗑️
              </button>
            </div>
          ))}
        </div>
      </div>

      {/* USERS & CARTS */}
      <div className="grid md:grid-cols-2 gap-6 mb-6">
        <div className="bg-white p-4 rounded shadow">
          <h4 className="font-semibold mb-2">Users</h4>
          <div className="max-h-64 overflow-auto space-y-1">
            {users.map((u) => (
              <div
                key={u._id}
                className="flex justify-between text-sm border-b py-2"
              >
                <div
                  onClick={() => openUserProfile(u)}
                  className="cursor-pointer hover:bg-gray-50 pr-2 flex-1"
                >
                  {u.email}
                </div>
                <button
                  onClick={() => deleteUser(u._id)}
                  className="text-red-600 hover:text-red-800 px-2"
                >
                  🗑️
                </button>
              </div>
            ))}
          </div>
        </div>

        <div className="bg-white p-4 rounded shadow">
          <h4 className="font-semibold mb-2">Carts</h4>
          <div className="max-h-64 overflow-auto space-y-1">
            {carts.map((c) => (
              <div
                key={c._id}
                className="flex justify-between text-sm border-b py-2"
              >
                <div
                  onClick={() => openCartModal(c)}
                  className="flex-1 cursor-pointer hover:bg-gray-50 pr-2"
                >
                  {c.userId?.email || "Unknown"} — {c.items?.length || 0} items
                </div>
                <button
                  onClick={() => deleteCart(c.userId?._id)}
                  className="text-red-600 hover:text-red-800 px-2"
                >
                  🗑️
                </button>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* NOTIFICATIONS */}
      <div className="bg-white p-4 rounded shadow mb-6">
        <h4 className="font-semibold mb-3">
          {editId ? "Edit Notification" : "Send Notification"}
        </h4>
        <input
          className="w-full mb-2 p-2 border rounded"
          placeholder="Title"
          value={title}
          onChange={(e) => setTitle(e.target.value)}
        />
        <textarea
          className="w-full mb-2 p-2 border rounded"
          placeholder="Message"
          rows={3}
          value={body}
          onChange={(e) => setBody(e.target.value)}
        />
        <select
          className="w-full mb-3 p-2 border rounded"
          value={target}
          onChange={(e) => setTarget(e.target.value)}
        >
          <option value="all">All Users</option>
          {users.map((u) => (
            <option key={u._id} value={u._id}>
              {u.email}
            </option>
          ))}
        </select>
        <div className="flex gap-2">
          <button
            onClick={saveNotification}
            className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded"
          >
            {editId ? "Save Changes" : "Send Notification"}
          </button>
          {editId && (
            <button
              onClick={() => {
                setEditId(null);
                setTitle("");
                setBody("");
                setTarget("all");
              }}
              className="bg-gray-500 hover:bg-gray-600 text-white px-4 py-2 rounded"
            >
              Cancel
            </button>
          )}
        </div>
      </div>

      {/* EXISTING NOTIFICATIONS LIST */}
      <div className="bg-white p-4 rounded shadow mb-6">
        <h4 className="font-semibold mb-3">All Notifications</h4>
        <div className="max-h-80 overflow-auto space-y-2">
          {notifications.map((n) => (
            <div
              key={n._id}
              className="border p-2 rounded flex justify-between items-center"
            >
              <div>
                <div className="font-semibold">{n.title}</div>
                <div className="text-sm text-gray-600">{n.body}</div>
                <div className="text-xs text-gray-500">
                  Target: {n.target === "all" ? "All Users" : n.target}
                </div>
              </div>
              <div className="flex gap-2">
                <button
                  onClick={() => startEdit(n)}
                  className="text-blue-600 hover:text-blue-800"
                >
                  ✏️
                </button>
                <button
                  onClick={() => deleteNotification(n._id)}
                  className="text-red-600 hover:text-red-800"
                >
                  🗑️
                </button>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* CART MODAL */}
      {showCartModal && selectedCart && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg shadow-lg w-full max-w-md p-6 relative">
            <button
              className="absolute top-2 right-3 text-gray-500 hover:text-gray-700 text-lg"
              onClick={closeCartModal}
            >
              ✕
            </button>

            <h4 className="text-xl font-semibold mb-3">
              Cart — {selectedCart.userId?.email}
            </h4>

            {selectedCart.items?.length > 0 ? (
              <div className="space-y-3 max-h-80 overflow-auto">
                {selectedCart.items.map((item, idx) => (
                  <div
                    key={idx}
                    className="flex items-center justify-between border-b pb-2"
                  >
                    <div className="flex items-center gap-3">
                     {item.productId?.images?.[0] && (
                     <img
                       src={
                         item.productId.images[0].startsWith("http")
                           ? item.productId.images[0]
                           : `${BASE_URL}${item.productId.images[0]}`
                       }
                       alt={item.productId?.title}
                      className="w-12 h-12 object-cover rounded"
                     />
                                   )}

                      <div>
                        <div className="font-semibold text-gray-800">
                          {item.productId?.title || "Unknown Product"}
                        </div>
                        <div className="text-xs text-gray-500">
                          Qty: {item.qty}
                        </div>
                      </div>
                    </div>
                    <div className="font-semibold">
                      ${item.productId?.price || 0}
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-gray-500 text-center">No items in this cart.</p>
            )}

            <div className="mt-4 border-t pt-3 flex justify-between text-lg font-semibold">
              <span>Total:</span>
              <span>${calculateCartTotal(selectedCart).toFixed(2)}</span>
            </div>

            <div className="mt-4 flex justify-between">
              <button
                onClick={() => deleteCart(selectedCart.userId?._id)}
                className="bg-red-600 hover:bg-red-700 text-white px-4 py-2 rounded"
              >
                Delete Cart
              </button>
              <button
                onClick={closeCartModal}
                className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}

      {/* USER PROFILE MODAL */}
      {showUserProfileModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg shadow-lg w-full max-w-lg p-6 relative">
            <button
              className="absolute top-2 right-3 text-gray-500 hover:text-gray-700 text-lg"
              onClick={closeUserProfileModal}
            >
              ✕
            </button>

            <h4 className="text-xl font-semibold mb-3">User Profile</h4>

            {profileLoading ? (
              <p className="text-center text-gray-500">Loading profile...</p>
            ) : selectedUserProfile ? (
              <div className="space-y-3">
                <div className="flex justify-between items-center">
                  <div>
                    <div className="text-sm text-gray-500">Full Name</div>
                    <div className="font-semibold">
                      {selectedUserProfile.fullName || "Not provided"}
                    </div>
                  </div>
                  <div className="text-sm text-gray-500">User ID</div>
                </div>

                <div>
                  <div className="text-sm text-gray-500">Email</div>
                  <div className="font-semibold">
                    {selectedUserProfile.email || "Not provided"}
                  </div>
                </div>

                <div>
                  <div className="text-sm text-gray-500">Phone</div>
                  <div className="font-semibold">
                    {selectedUserProfile.phone || "Not provided"}
                  </div>
                </div>

                <div>
                  <div className="text-sm text-gray-500">Optional Email</div>
                  <div className="font-semibold">
                    {selectedUserProfile.optionalEmail || "Not provided"}
                  </div>
                </div>

                <div>
                  <div className="text-sm text-gray-500">Address</div>
                  <div className="font-semibold">
                    {selectedUserProfile.address || "Not provided"}
                  </div>
                </div>

                <div>
                  <div className="text-sm text-gray-500">Account created</div>
                  <div className="font-semibold">
                    {selectedUserProfile.createdAt
                      ? new Date(selectedUserProfile.createdAt).toLocaleString()
                      : "Unknown"}
                  </div>
                </div>

                <div className="mt-4 flex justify-end gap-2">
                  <button
                    onClick={closeUserProfileModal}
                    className="bg-gray-500 hover:bg-gray-600 text-white px-4 py-2 rounded"
                  >
                    Close
                  </button>
                </div>
              </div>
            ) : (
              <p className="text-center text-gray-500">Profile not found.</p>
            )}
          </div>
        </div>
      )}

      {/* CHAT */}
      <AdminChat adminToken={adminToken} />
    </div>
  );
}
