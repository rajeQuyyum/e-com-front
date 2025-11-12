import React, { useEffect, useState } from "react";
import { API } from "../api";
// import socket from "../utils/socket"; // optional: for live cart updates

export default function Products({ user }) {
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [viewer, setViewer] = useState({ open: false, images: [], index: 0 });

  // ✅ Dynamic backend URL (local or Render)
  const BASE_URL =
    import.meta.env.VITE_BACKEND_URL?.replace(/\/$/, "") ||
    API.replace("/api", "");

  useEffect(() => {
    fetchProducts();
  }, []);

  async function fetchProducts() {
    try {
      const res = await fetch(`${API}/products`);
      const data = await res.json();
      setProducts(data);
    } catch (err) {
      console.error("Error loading products:", err);
    } finally {
      setLoading(false);
    }
  }

  async function addToCart(p) {
    if (!user) return alert("Please log in first");

    try {
      const get = await fetch(`${API}/cart/${user._id}`);
      const cart = get.ok ? await get.json() : { items: [] };

      const items = cart.items || [];
      const found = items.find(
        (i) => i.productId === p._id || (i.productId && i.productId._id === p._id)
      );
      if (found) found.qty += 1;
      else items.push({ productId: p._id, qty: 1 });

      await fetch(`${API}/cart/${user._id}`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ items }),
      });

      // 🔔 Optional real-time cart update
      socket.emit("cartUpdated", {
        userId: user._id,
        count: items.reduce((s, i) => s + i.qty, 0),
      });

      alert("✅ Added to cart!");
    } catch (err) {
      console.error("Add to cart error:", err);
      alert("Failed to add item to cart");
    }
  }

  function openViewer(images, index = 0) {
    if (!images || images.length === 0) return;
    setViewer({ open: true, images, index });
  }

  function closeViewer() {
    setViewer({ open: false, images: [], index: 0 });
  }

  function nextImage() {
    setViewer((prev) => ({
      ...prev,
      index: (prev.index + 1) % prev.images.length,
    }));
  }

  function prevImage() {
    setViewer((prev) => ({
      ...prev,
      index: (prev.index - 1 + prev.images.length) % prev.images.length,
    }));
  }

  if (loading)
    return <p className="text-center text-gray-500 mt-10">Loading products...</p>;

  return (
    <div className="mt-20">
      <h2 className="text-2xl font-semibold mb-4">Products</h2>

      {products.length === 0 && (
        <p className="text-gray-500">No products found.</p>
      )}

      {/* Product List */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
        {products.map((p) => {
          const imgSrc = p.images?.[0]
            ? `${BASE_URL}${p.images[0]}`
            : "/placeholder.png";

          return (
            <div
              key={p._id}
              className="group bg-white rounded shadow p-4 hover:shadow-lg transition relative overflow-hidden"
            >
              {/* Product Image */}
              <div
                className="h-48 w-full bg-gray-100 flex items-center justify-center mb-3 rounded cursor-pointer"
                onClick={() => openViewer(p.images, 0)}
              >
                <img
                  src={imgSrc}
                  alt={p.title}
                  className="max-h-44 rounded object-cover"
                  onError={(e) => (e.target.src = "/placeholder.png")}
                />
              </div>

              {/* Product Info */}
              <h4 className="font-semibold truncate">{p.title}</h4>
              <p className="text-sm text-gray-600 my-2 line-clamp-2">
                {p.description}
              </p>

              <div className="flex items-center justify-between mt-4">
                <div className="text-lg font-bold text-blue-700">
                  ₦{p.price.toFixed(2)}
                </div>

                <button
                  onClick={() => addToCart(p)}
                  className="absolute bottom-4 right-4 px-3 py-1 bg-blue-600 text-white rounded hover:bg-blue-700 transition-all duration-200"
                >
                  Add to Cart
                </button>
              </div>
            </div>
          );
        })}
      </div>

      {/* ✅ Image Viewer Modal */}
      {viewer.open && (
        <div className="fixed inset-0 bg-black bg-opacity-80 flex items-center justify-center z-50">
          <button
            onClick={closeViewer}
            className="absolute top-4 right-5 text-white text-2xl font-bold"
          >
            ✕
          </button>

          <div className="flex flex-col items-center space-y-4">
            <div className="relative">
              <img
                src={`${BASE_URL}${viewer.images[viewer.index]}`}
                alt="Product view"
                className="max-h-[80vh] max-w-[90vw] rounded-lg shadow-lg object-contain"
              />

              {viewer.images.length > 1 && (
                <>
                  <button
                    onClick={prevImage}
                    className="absolute left-0 top-1/2 -translate-y-1/2 text-white bg-gray-700 bg-opacity-60 hover:bg-opacity-80 px-3 py-2 rounded-full"
                  >
                    ◀
                  </button>
                  <button
                    onClick={nextImage}
                    className="absolute right-0 top-1/2 -translate-y-1/2 text-white bg-gray-700 bg-opacity-60 hover:bg-opacity-80 px-3 py-2 rounded-full"
                  >
                    ▶
                  </button>
                </>
              )}
            </div>

            {viewer.images.length > 1 && (
              <div className="flex gap-2 mt-2 overflow-x-auto">
                {viewer.images.map((img, idx) => (
                  <img
                    key={idx}
                    src={`${BASE_URL}${img}`}
                    alt="thumb"
                    onClick={() => setViewer((v) => ({ ...v, index: idx }))}
                    className={`w-16 h-16 object-cover rounded cursor-pointer border ${
                      viewer.index === idx
                        ? "border-blue-500"
                        : "border-transparent"
                    }`}
                  />
                ))}
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
