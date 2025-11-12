import React, { useState } from "react";
import './App.css'
import {
  BrowserRouter as Router,
  Routes,
  Route,
  Navigate,
} from "react-router-dom";

import Products from "./components/Products";
import Register from "./components/Register";
// import Navbar from "./components/Navbar";
import Login from "./components/ Login";
import Cart from "./components/ Cart";
import Chat from "./components/ Chat";
import Notifications from "./components/ Notifications";
import AdminDashboard from "./components/ AdminDashboard";
import AdminLogin from "./components/AdminLogin";
import Navbar from "./components/ Navbar";
import FloatingChat from "./components/FloatingChat";
import Profile from "./components/Profile";

// ✅ Safe parser so invalid localStorage JSON never crashes the app
function safeParse(key) {
  try {
    const value = localStorage.getItem(key);
    if (!value || value === "undefined" || value === "null") return null;
    return JSON.parse(value);
  } catch {
    return null;
  }
}

// ✅ ErrorBoundary to catch unexpected runtime errors gracefully
class ErrorBoundary extends React.Component {
  constructor(props) {
    super(props);
    this.state = { hasError: false, error: null };
  }
  static getDerivedStateFromError(error) {
    return { hasError: true, error };
  }
  componentDidCatch(error, info) {
    console.error("React ErrorBoundary caught:", error, info);
  }
  render() {
    if (this.state.hasError) {
      return (
        <div className="h-screen flex items-center justify-center bg-gray-100 text-center">
          <div className="bg-white shadow-lg rounded p-6 max-w-md">
            <h2 className="text-2xl font-semibold mb-2 text-red-600">
              Something went wrong 😢
            </h2>
            <p className="text-gray-600 mb-4">
              Please refresh the page or try again later.
            </p>
            <button
              onClick={() => window.location.reload()}
              className="bg-blue-600 text-white px-4 py-2 rounded"
            >
              Refresh
            </button>
          </div>
        </div>
      );
    }
    return this.props.children;
  }
}

export default function App() {
  const [user, setUser] = useState(safeParse("user"));
  const [adminToken, setAdminToken] = useState(safeParse("adminToken"));

  // ✅ Admin route protection
  const AdminRoute = ({ children }) => {
    const token = adminToken || safeParse("adminToken");
    if (!token) return <Navigate to="/admin" />;
    return children;
  };

  // ✅ User route protection
  const UserRoute = ({ children }) => {
    if (!user) {
      alert("Please log in first!");
      return <Navigate to="/login" />;
    }
    return children;
  };

  return (
    <ErrorBoundary>
      <Router>
        <div className="min-h-screen bg-gray-50">
          {/* Hide navbar on admin pages */}
          {!window.location.pathname.startsWith("/admin") && (
            <Navbar user={user} adminToken={adminToken} />
          )}

          <main className="max-w-6xl mx-auto p-6">
            <Routes>
              {/* Public routes */}
              <Route path="/" element={<Products user={user} />} />
              <Route
                path="/login"
                element={
                  <Login
                    onLogin={(u) => {
                      setUser(u);
                      localStorage.setItem("user", JSON.stringify(u || null));
                    }}
                  />
                }
              />
              <Route path="/register" element={<Register />} />

              {/* User protected routes */}
              <Route
                path="/cart"
                element={
                  <UserRoute>
                    <Cart user={user} />
                  </UserRoute>
                }
              />
              <Route
                path="/chat"
                element={
                  <UserRoute>
                    <Chat user={user} />
                  </UserRoute>
                }
              />
              <Route
                path="/notifications"
                element={
                  <UserRoute>
                    <Notifications user={user} />
                  </UserRoute>
                }
              />
              <Route
                path="/profile"
                element={
                  <UserRoute>
                    <Profile user={user} />
                  </UserRoute>
                }
              />

              {/* Admin routes */}
              <Route
                path="/admin"
                element={<AdminLogin onAdminLogin={setAdminToken} />}
              />
              <Route
                path="/admin/dashboard"
                element={
                  <AdminRoute>
                    <AdminDashboard adminToken={adminToken} />
                  </AdminRoute>
                }
              />

              {/* Fallback */}
              <Route path="*" element={<Navigate to="/" />} />
            </Routes>
          </main>

          {/* ✅ Floating Chat (visible on all pages for users) */}
        {!window.location.pathname.startsWith("/admin") && user && (
          <FloatingChat user={user} />
        )}
        </div>
      </Router>
    </ErrorBoundary>
  );
}
