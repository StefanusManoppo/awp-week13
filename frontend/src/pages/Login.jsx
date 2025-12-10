import { useState } from "react";
import api from "../lib/api";
import { useNavigate } from "react-router-dom";
import useAuthStore from "../lib/useAuthStore";

function Login() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState(null);
  const setUser = useAuthStore((state) => state.setUser);
  const navigate = useNavigate();

  const handleLogin = async (e) => {
    // Agar halaman tidak reload saat submit
    e.preventDefault();
    try {
      // Panggil API login
      const res = await api.post("/api/auth/login", { email, password });
      // Jika email dan password match
      if (res.data) {
        // simpan data user ke global state (zustand)
        setUser(res.data.user);
        // Redirect ke halaman Home
        navigate("/");
      }
    } catch (err) {
      console.error("Login failed:", err);
      // Tampilkan pesan error dari backend jika ada
      setError(err.response?.data?.message || "Terjadi kesalahan saat login");
    }
  };

  return (
    <div>
      <h1>Login</h1>
      {error && <p style={{ color: "red" }}>{error}</p>}
      <form onSubmit={handleLogin}>
        <label>Email: </label>
        <input
          type="email"
          name="email"
          onChange={(e) => setEmail(e.target.value)}
          required
        />
        <br />
        <label>Password: </label>
        <input
          type="password"
          name="password"
          onChange={(e) => setPassword(e.target.value)}
          required
        />
        <br />
        <button type="submit">Login</button>
      </form>
    </div>
  );
}

export default Login;