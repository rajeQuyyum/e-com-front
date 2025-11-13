import React, { useEffect, useState } from "react";
import { NavLink, useLocation } from "react-router-dom";
import {
  ShoppingCart,
  Bell,
  LogIn,
  LogOut,
  Home,
  MessageSquare,
  UserPlus,
  Menu,
  X,
} from "lucide-react";
import { io } from "socket.io-client";
import { API } from "../api";

export default function Navbar({ user, adminToken }) {
  const [hasNewNotif, setHasNewNotif] = useState(
    localStorage.getItem("hasNewNotif") === "true"
  );
  const [hasNewChat, setHasNewChat] = useState(
    localStorage.getItem("hasNewChat") === "true"
  );
  const [cartCount, setCartCount] = useState(
    Number(localStorage.getItem("cartCount")) || 0
  );
  const [notifCount, setNotifCount] = useState(0);
  const [showMenu, setShowMenu] = useState(false); // ✅ Added for mobile menu toggle

  const location = useLocation();

  function logout() {
    const notifState = localStorage.getItem("hasNewNotif");
    const chatState = localStorage.getItem("hasNewChat");
    localStorage.clear();
    localStorage.setItem("hasNewNotif", notifState);
    localStorage.setItem("hasNewChat", chatState);
    window.location.href = "/";
  }

  const activeClass = "text-blue-400 font-semibold";

  async function checkUnreadStatus() {
    if (!user?._id) return;

    try {
      const notifRes = await fetch(`${API}/notifications/${user._id}`);
      const notifData = await notifRes.json();
      const unread = Array.isArray(notifData)
        ? notifData.filter((n) => !(n.readBy || []).includes(user._id)).length
        : 0;
      setHasNewNotif(unread > 0);
      setNotifCount(unread);
      localStorage.setItem("hasNewNotif", unread > 0 ? "true" : "false");

      const msgRes = await fetch(`${API}/messages/${user._id}`);
      const msgData = await msgRes.json();
      const hasUnreadChats =
        Array.isArray(msgData) &&
        msgData.some((m) => m.from === "admin" && !m.seen);

      setHasNewChat(hasUnreadChats);
      localStorage.setItem("hasNewChat", hasUnreadChats ? "true" : "false");

      const cartRes = await fetch(`${API}/cart/${user._id}`);
      const cartData = await cartRes.json();
      const count =
        Array.isArray(cartData.items) && cartData.items.length
          ? cartData.items.length
          : 0;
      setCartCount(count);
      localStorage.setItem("cartCount", count);
    } catch (err) {
      console.error("Unread/cart check error:", err);
    }
  }

  useEffect(() => {
    const socket = io(API.replace("/api", ""), { transports: ["websocket"] });
    const room = user?._id || "public";
    socket.emit("join", room);

    socket.on("notification", () => {
      if (location.pathname !== "/notifications") {
        setHasNewNotif(true);
        setNotifCount((prev) => prev + 1);
        localStorage.setItem("hasNewNotif", "true");
      }
    });

    socket.on("receiveMessage", (msg) => {
      if (msg.room === user?._id && location.pathname !== "/chat") {
        setHasNewChat(true);
        localStorage.setItem("hasNewChat", "true");
      }
    });

    socket.on("cartCount", (payload) => {
      if (payload?.userId === user?._id) {
        setCartCount(payload.count || 0);
        localStorage.setItem("cartCount", payload.count || 0);
      }
    });

    return () => socket.disconnect();
  }, [user, location.pathname]);

  useEffect(() => {
    if (user) checkUnreadStatus();
  }, [user]);

  useEffect(() => {
    if (location.pathname === "/notifications") {
      setHasNewNotif(false);
      setNotifCount(0);
      localStorage.setItem("hasNewNotif", "false");
    }

    if (location.pathname === "/chat") {
      setHasNewChat(false);
      localStorage.setItem("hasNewChat", "false");
      localStorage.setItem("unreadChatCount", "0");
      window.dispatchEvent(new Event("chatStatusUpdated"));
    }

    // ✅ Close menu when any nav changes
    setShowMenu(false);
  }, [location.pathname]);

  useEffect(() => {
    const syncHandler = () => {
      const hasChat = localStorage.getItem("hasNewChat") === "true";
      setHasNewChat(hasChat);
    };
    window.addEventListener("chatStatusUpdated", syncHandler);
    return () => window.removeEventListener("chatStatusUpdated", syncHandler);
  }, []);

  return (
    <nav className="bg-gray-700 text-white shadow-md fixed w-full z-50">
      <div className="max-w-6xl mx-auto px-4 py-3 flex items-center justify-between">
        {/* 🏠 Logo */}
        <NavLink to="/" className="flex items-center gap-2">
          <Home className="w-5 h-5 text-blue-400" />
          <span className="text-lg font-semibold tracking-wide">
            🛒 Raje E-Commerce
          </span>
        </NavLink>

        {/* 🍔 Mobile Menu Toggle */}
        <button
  className="md:hidden focus:outline-none relative"
  onClick={() => setShowMenu((prev) => !prev)}
>
  {showMenu ? (
    <X
      className={`w-6 h-6 transition-colors ${
        hasNewNotif || hasNewChat ? "text-white" : "text-white"
      }`}
    />
  ) : (
    <Menu
      className={`w-6 h-6 transition-colors ${
        hasNewNotif || hasNewChat ? "text-white" : "text-white"
      }`}
    />
  )}

  {/* Small red dot indicator (extra visual cue) */}
  {(hasNewNotif || hasNewChat) && !showMenu && (
    <span className="absolute top-0 right-0 w-2.5 h-2.5 bg-red-500 rounded-full border border-white"></span>
  )}
</button>


        {/* 🔘 Links */}
        <div
          className={`flex flex-col md:flex-row md:items-center gap-6 md:static absolute md:bg-transparent bg-gray-800 md:w-auto w-full left-0 md:top-auto top-16 px-4 md:px-0 py-4 md:py-0 transition-all duration-300 ease-in-out ${
            showMenu
              ? "opacity-100 translate-y-0 visible"
              : "opacity-0 -translate-y-5 invisible md:visible md:opacity-100 md:translate-y-0"
          }`}
        >
          <NavLink
            to="/"
            className={({ isActive }) =>
              isActive ? activeClass : "hover:text-blue-400"
            }
          >
            Products
          </NavLink>

          {user && (
            <>
              {/* 🛒 Cart + Greeting */}
              <div className="relative flex items-center gap-3">
                {user && (
                  <NavLink
                    to="/profile"
                    className="px-3 py-1 bg-blue-600 text-white text-sm font-semibold rounded-full shadow-md"
                  >
                    Hi, {user.name || user.email?.split("@")[0] || "User"}
                  </NavLink>
                )}

                <div className="relative flex items-center">
                  <NavLink
                    to="/cart"
                    className={({ isActive }) =>
                      isActive
                        ? activeClass
                        : "hover:text-blue-400 flex items-center gap-1"
                    }
                  >
                    <div className="relative">
                      <ShoppingCart className="inline w-5 h-5" />
                      {cartCount > 0 && (
                        <span className="absolute -top-2 left-1 bg-red-500 text-white text-[10px] font-bold rounded-full w-4 h-4 flex items-center justify-center border border-white">
                          {cartCount > 9 ? "9+" : cartCount}
                        </span>
                      )}
                      <span className="ml-1">Cart</span>
                    </div>
                  </NavLink>
                </div>
              </div>

              {/* 🔔 Notifications */}
              <div className="relative flex items-center">
                <NavLink
                  to="/notifications"
                  className={({ isActive }) =>
                    isActive
                      ? activeClass
                      : "hover:text-blue-400 flex items-center gap-1"
                  }
                >
                  <div className="relative">
                    <Bell className="inline w-5 h-5" />
                    {notifCount > 0 && (
                      <span className="absolute -top-2 left-1 bg-red-500 text-white text-[10px] font-bold rounded-full w-4 h-4 flex items-center justify-center border border-white">
                        {notifCount > 9 ? "9+" : notifCount}
                      </span>
                    )}
                    <span className="ml-1">Notifications</span>
                  </div>
                </NavLink>
              </div>

              {/* 💬 Chat */}
              <div className="relative flex items-center">
                <NavLink
                  to="/chat"
                  className={({ isActive }) =>
                    isActive
                      ? activeClass
                      : "hover:text-blue-400 flex items-center gap-1"
                  }
                >
                  <div className="relative">
                    <MessageSquare className="inline w-5 h-5" />
                    {hasNewChat && (
                      <span className="absolute -top-1 left-1 block w-2.5 h-2.5 bg-red-500 rounded-full border border-white"></span>
                    )}
                    <span className="ml-1">Chat</span>
                  </div>
                </NavLink>
              </div>
            </>
          )}

          {!user && !adminToken && (
            <>
              <NavLink
                to="/login"
                className={({ isActive }) =>
                  isActive
                    ? "text-green-400 font-semibold"
                    : "flex items-center gap-1 hover:text-green-400"
                }
              >
                <LogIn className="w-4 h-4" />
                Login
              </NavLink>

              <NavLink
                to="/register"
                className={({ isActive }) =>
                  isActive
                    ? "text-yellow-400 font-semibold"
                    : "flex items-center gap-1 hover:text-yellow-400"
                }
              >
                <UserPlus className="w-4 h-4" />
                Register
              </NavLink>
            </>
          )}

          {(user || adminToken) && (
            <button
              onClick={logout}
              className="flex items-center gap-1 hover:text-red-400 transition"
            >
              <LogOut className="w-4 h-4" />
              Logout
            </button>
          )}
        </div>
      </div>
    </nav>
  );
}
