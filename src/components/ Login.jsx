import React, { useState } from 'react';
import { API } from '../api';
import { NavLink, useNavigate } from 'react-router-dom';

export default function Login({ onLogin, onAdminLogin }) {
  const [email, setEmail] = useState('');
  const [pw, setPw] = useState('');
  const [adminUser, setAdminUser] = useState('');
  const [adminPw, setAdminPw] = useState('');

  const navigate = useNavigate(); // ✅ for redirecting after login

  async function handleUserLogin() {
    try {
      const res = await fetch(`${API}/users/login`, {
        method: 'POST',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify({ email, password: pw }),
      });
      const j = await res.json();

      if (j.user) {
        onLogin(j.user);
        navigate('/products'); // ✅ redirect to Products page
      } else {
        alert(j.error || 'Login failed');
      }
    } catch (err) {
      console.error('User login error:', err);
      alert('Login failed. Check your backend connection.');
    }
  }

  async function handleUserRegister() {
    try {
      const res = await fetch(`${API}/users/register`, {
        method: 'POST',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify({ name: email, email, password: pw }),
      });
      const j = await res.json();

      if (j._id || j.user) {
        onLogin(j);
        navigate('/products'); // ✅ redirect to Products after registration
      } else {
        alert('Registration failed');
      }
    } catch (err) {
      console.error('User registration error:', err);
      alert('Failed to register user');
    }
  }

  async function handleAdminLogin() {
    try {
      const res = await fetch(`${API}/admin/login`, {
        method: 'POST',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify({ username: adminUser, password: adminPw }),
      });
      const j = await res.json();

      if (j.admin) {
        onAdminLogin(adminPw);
        navigate('/admin/dashboard'); // ✅ redirect to Admin Dashboard
      } else {
        alert(j.error || 'Admin login failed');
      }
    } catch (err) {
      console.error('Admin login error:', err);
      alert('Failed to log in as admin');
    }
  }

  return (
    <div className="max-w-sm mx-auto bg-white shadow-md rounded p-6 mt-20">
      {/* USER LOGIN */}
      <div className="bg-white p-6 rounded shadow">
        <h3 className="font-semibold mb-3">Login/Register</h3>
        <input
          className="w-full mb-2 p-2 border rounded"
          placeholder="Email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
        />
        <input
          className="w-full mb-2 p-2 border rounded"
          placeholder="Password"
          type="password"
          value={pw}
          onChange={(e) => setPw(e.target.value)}
        />
        <div className="flex gap-2">
          <button
            className="bg-blue-600 text-white px-3 py-1 rounded"
            onClick={handleUserLogin}
          >
            Login
          </button>
          <div
            className="border px-3 py-1 rounded"
           
          >
            <NavLink to="/register">

            Register

            </NavLink>
          </div>
        </div>
      </div>

     
    </div>
  );
}
