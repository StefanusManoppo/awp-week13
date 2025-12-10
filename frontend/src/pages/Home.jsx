import { useState, useEffect } from "react";
import api from "../lib/api";
import useAuthStore from "../lib/useAuthStore";
import { useNavigate } from "react-router-dom";

function Home() {
  const [tasks, setTasks] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const user = useAuthStore((state) => state.user);
  const logout = useAuthStore((state) => state.logout);
  const navigate = useNavigate();

  useEffect(() => {
    const fetchTasks = async () => {
      try {
        setLoading(true);
        // fetch seluruh tugas yang ada
        const res = await api.get("/api/task");
        // set ke state React
        setTasks(res.data);
        setLoading(false);
      } catch (err) {
        console.error("Failed to fetch tasks:", err);
        setError("Failed to fetch tasks");
        setLoading(false);
      }
    };

    fetchTasks();
    console.log("User info:", user);
  }, []);

  const handleLogout = async () => {
    try {
      setLoading(true);
      // fetch endpoint logout ke backend
      await api.get("/api/auth/logout");
      // panggil fungsi logout dari zustand store
      // fungsi ini akan menghapus data user dari state global (zustand)
      logout();
      // redirect user ke halaman login
      navigate("/login");
    } catch (err) {
      console.error("Logout failed:", err);
      setError("Logout failed");
    }
  };

  return (
    <>
      <h1>Home Page</h1>
      {loading ? (
        <p>Loading...</p>
      ) : (
        <>
          <p>Welcome, {user && user.name}!</p>

          {user.role === "admin" && (
            <button onClick={() => navigate("/task/add")}>
              Add Task
            </button>
          )}
          {error && <p>{error}</p>}
          {tasks &&
            tasks.map((task) => (
              <div key={task.id} onClick={() => navigate("/task/" + task.id)}>
                <h2>Tugas : {task.title}</h2>
              </div>
            ))}
        </>
      )}
      <button onClick={handleLogout}>Logout</button>
    </>
  );
}

export default Home;