import React, { useEffect, useState } from "react";
import { API } from "../api";
import socket from "./ socket";

export default function Cart({ user }) {
  const [cart, setCart] = useState({ items: [] });
  const [loading, setLoading] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);
  const [profile, setProfile] = useState(null);
  const [editingAddress, setEditingAddress] = useState(false);
  const [newAddress, setNewAddress] = useState("");

  // 🧭 Fetch Cart + Profile
  useEffect(() => {
    if (user?._id) {
      fetchCart();
      fetchProfile();
    }
  }, [user]);

  // 🛒 Fetch cart
  async function fetchCart() {
    try {
      const r = await fetch(`${API}/cart/${user._id}`);
      const j = await r.json();
      setCart(j);
    } catch (err) {
      console.error("Fetch cart error:", err);
    }
  }

  // 👤 Fetch profile (for address)
  async function fetchProfile() {
    try {
      const res = await fetch(`${API}/profile/${user._id}`);
      const data = await res.json();
      setProfile(data);
      setNewAddress(data.address || "");
    } catch (err) {
      console.error("Fetch profile error:", err);
    }
  }

  function total() {
    return (cart.items || []).reduce(
      (s, i) => s + (i.productId.price || 0) * i.qty,
      0
    );
  }

  async function updateQty(productId, qty) {
    if (qty < 1) return;
    const items = (cart.items || []).map((it) =>
      it.productId._id === productId ? { ...it, qty } : it
    );
    await saveCart(items);
  }

  async function removeItem(productId) {
    if (!window.confirm("Remove this item from your cart?")) return;
    const items = (cart.items || []).filter(
      (it) => it.productId._id !== productId
    );
    await saveCart(items);
  }

  async function saveCart(items) {
    try {
      setLoading(true);
      const res = await fetch(`${API}/cart/${user._id}`, {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ items }),
      });
      if (!res.ok) throw new Error("Failed to update cart");
      setCart((prev) => ({ ...prev, items }));

      socket.emit("cartUpdated", {
        userId: user._id,
        count: items.reduce((s, i) => s + i.qty, 0),
      });
    } catch (err) {
      console.error("Save cart error:", err);
      alert("❌ Failed to update cart");
    } finally {
      setLoading(false);
    }
  }

  // 💾 Save updated address to API
  async function saveAddress() {
    if (!newAddress.trim()) return alert("Address cannot be empty.");
    try {
      const res = await fetch(`${API}/profile/${user._id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ address: newAddress }),
      });
      const data = await res.json();
      if (data.ok) {
        alert("✅ Address updated successfully!");
        setProfile((prev) => ({ ...prev, address: newAddress }));
        setEditingAddress(false);
      } else {
        alert("❌ Failed to save address");
      }
    } catch (err) {
      console.error("Save address error:", err);
      alert("Error saving address");
    }
  }

  // ✅ Confirm Checkout
  function confirmCheckout() {
    if (!profile?.address) {
      alert("⚠️ Please add your delivery address first!");
      return;
    }

    setShowConfirm(false);
    alert("✅ Checkout confirmed! Your order has been placed.");

    // 🆕 After alert - show "No payment" message + Chat button
    const messageContainer = document.createElement("div");
    messageContainer.className =
      "fixed inset-0 flex justify-center items-center bg-black bg-opacity-50 z-50";

    messageContainer.innerHTML = `
      <div class="bg-white rounded-lg shadow-lg p-6 w-[90%] max-w-sm text-center">
        <h3 class="text-lg font-semibold mb-3">Order Received ✅</h3>
        <p class="text-gray-700 mb-4">
          We don’t take online payments for now.<br />
          you can chat with the chat support to make payments either on delivery, pay part of it, full payments chat with the customer care they will direct you and tell them what your payment plan
        </p>
        <button id="chatSupportBtn" class="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700">
          💬 Chat with Support
        </button>
      </div>
    `;

    document.body.appendChild(messageContainer);

    // 🗨️ Chat button handler
    document
      .getElementById("chatSupportBtn")
      .addEventListener("click", () => {
        window.location.href = "/chat"; // ✅ Change this to your actual chat route
      });

    // Close popup when clicking outside
    messageContainer.addEventListener("click", (e) => {
      if (e.target === messageContainer) {
        messageContainer.remove();
      }
    });
  }

  function handleCheckout() {
    setShowConfirm(true);
  }

  if (!cart.items || cart.items.length === 0) {
    return (
      <div className="text-center mt-20 text-gray-600">
        <h3 className="text-xl font-semibold mb-2">Your Cart is Empty 🛒</h3>
        <p>Start adding products to your cart!</p>
      </div>
    );
  }

  return (
    <div className="mt-20">
      <h3 className="text-xl font-semibold mb-4">Your Cart</h3>
      <div className="space-y-3">
        {(cart.items || []).map((it) => (
          <div
            key={it.productId._id}
            className="bg-white p-4 rounded shadow flex items-center justify-between"
          >
            <div>
              <div className="font-semibold">{it.productId.title}</div>
              <div className="text-sm text-gray-500">x {it.qty}</div>
            </div>
            <div className="flex items-center gap-3">
              <div className="text-lg font-bold">
                ${it.productId.price * it.qty}
              </div>
              <input
                type="number"
                min="1"
                value={it.qty}
                onChange={(e) =>
                  updateQty(it.productId._id, Number(e.target.value))
                }
                className="w-16 p-1 border rounded"
                disabled={loading}
              />
              <button
                onClick={() => removeItem(it.productId._id)}
                className="px-2 py-1 text-red-600 hover:text-red-800 text-sm"
                disabled={loading}
              >
                🗑️ Remove
              </button>
            </div>
          </div>
        ))}
      </div>

      <div className="mt-4 text-right">
        <div className="text-lg">
          Total: <b>${total().toFixed(2)}</b>
        </div>
        <button
          className="mt-2 px-4 py-2 bg-green-600 text-white rounded hover:bg-green-700"
          onClick={handleCheckout}
          disabled={loading}
        >
          Checkout
        </button>
      </div>

      {/* ✅ Confirmation Modal */}
      {showConfirm && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex justify-center items-center z-50">
          <div className="bg-white rounded-lg shadow-lg p-6 w-[90%] max-w-md">
            <h3 className="text-lg font-semibold mb-3">Confirm Your Order 🛍️</h3>

            {/* 🏠 User Address Section */}
            <div className="mb-4 border p-3 rounded bg-gray-50 text-sm">
              <div className="flex justify-between items-center mb-2">
                <h4 className="font-semibold">Delivery Address:</h4>
                {!editingAddress && (
                  <button
                    className="text-blue-600 text-sm hover:underline"
                    onClick={() => setEditingAddress(true)}
                  >
                    ✏️ Edit
                  </button>
                )}
              </div>

              {editingAddress ? (
                <div>
                  <textarea
                    className="w-full p-2 border rounded mb-2 focus:ring focus:ring-blue-300"
                    rows={3}
                    value={newAddress}
                    onChange={(e) => setNewAddress(e.target.value)}
                    placeholder="Enter your delivery address"
                  />
                  <div className="flex justify-end gap-2">
                    <button
                      onClick={() => setEditingAddress(false)}
                      className="px-3 py-1 border rounded hover:bg-gray-100"
                    >
                      Cancel
                    </button>
                    <button
                      onClick={saveAddress}
                      className="px-3 py-1 bg-blue-600 text-white rounded hover:bg-blue-700"
                    >
                      Save Address
                    </button>
                  </div>
                </div>
              ) : (
                <p className="text-gray-700">
                  {profile?.address || (
                    <span className="italic text-gray-500">
                      No address found.
                    </span>
                  )}
                </p>
              )}
            </div>

            {/* 🛒 Cart Items */}
            <div className="max-h-56 overflow-y-auto border p-3 rounded">
              {(cart.items || []).map((it) => (
                <div
                  key={it.productId._id}
                  className="flex justify-between border-b py-2 text-sm"
                >
                  <div>{it.productId.title}</div>
                  <div>
                    {it.qty} × ${it.productId.price.toFixed(2)}
                  </div>
                </div>
              ))}
            </div>

            {/* 💵 Total */}
            <div className="mt-4 font-semibold text-right">
              Total: ${total().toFixed(2)}
            </div>

            {/* Buttons */}
            <div className="mt-5 flex justify-end gap-3">
              <button
                className="px-4 py-2 rounded border hover:bg-gray-100"
                onClick={() => setShowConfirm(false)}
              >
                Cancel
              </button>
              <button
                className="px-4 py-2 rounded bg-green-600 text-white hover:bg-green-700"
                onClick={confirmCheckout}
              >
                Confirm
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
