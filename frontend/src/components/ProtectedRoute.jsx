import { Navigate } from "react-router-dom";
import { useEffect, useState } from "react";
import useAuthStore from "../lib/useAuthStore";
import api from "../lib/api";

function ProtectedRoute({ children, allowedRoles = [] }) {
  // Data user dari global state (zustand)
  const user = useAuthStore((state) => state.user);
  // Function untuk menyimpan data user ke global state
  const setUser = useAuthStore((state) => state.setUser);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const checkAuth = async () => {
      try {
        // Zustand menyimpan data user di memory saja,
        // jadi saat halaman di refresh, data user akan hilang.
        // Jadi kita perlu cek ke backend apakah user masih login atau tidak.
        // Jika masih, kita ambil data usernya.

        // Cek apakah data user sudah ada di zustand
        if (!user) {
          // Jika tidak ada, panggil endpoint /api/auth/me
          // untuk mendapatkan data user yang sedang login
          const res = await api.get("/api/auth/me");
          if (res.data) {
            setUser(res.data.user);
          }
        }
      } catch (err) {
        console.error("Auth check failed:", err);
      } finally {
        setLoading(false);
      }
    };

    checkAuth();
  }, [user, setUser]);

  if (loading) {
    return <p>Loading...</p>;
  }

  // Jika tidak ada user, redirect ke halaman login
  if (!user) {
    return <Navigate to="/login" replace />;
  }

  // Jika tidak ada allowedRoles, berarti semua role boleh mengakses
  // Jika ada allowedRoles dan role user tidak ada di allowedRoles,
  // redirect ke halaman unauthorized
  if (allowedRoles.length > 0 && !allowedRoles.includes(user.role)) {
    return <Navigate to="/unauthorized" replace />;
  }

  return children;
}

export default ProtectedRoute;