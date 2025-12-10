import { useState, useEffect } from "react";
import api from "../lib/api";
import useAuthStore from "../lib/useAuthStore";
import { useParams } from "react-router-dom";
import { useNavigate } from "react-router-dom";

const Task = () => {
  // ambil id dari parameter URL
  const { id } = useParams();
  const [task, setTask] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const user = useAuthStore((state) => state.user);
  const navigate = useNavigate();
  const BASE_URL = "http://localhost:5001/";

  useEffect(() => {
    const fetchTask = async () => {
      try {
        setLoading(true);
        // fetch data task berdasarkan id
        const res = await api.get("/api/task/" + id);
        setTask(res.data);
        setLoading(false);
      } catch (err) {
        console.error("Failed to fetch task:", err);
        setError("Failed to fetch task");
        setLoading(false);
      }
    };

    fetchTask();
  }, []);

  const handleDeleteSubmission = async () => {
    try {
      setLoading(true);
      // Delete semua submission terkait task ini
      await api.delete("/api/task/submission/" + id);
      // Refresh task data setelah penghapusan
      const res = await api.get("/api/task/" + id);
      setTask(res.data);
      setLoading(false);
    } catch (err) {
      console.error("Failed to delete submissions:", err);
      setError("Failed to delete submissions");
    }
  };

  const handleSubmission = () => {
    navigate(`/task/submission/${id}`);
  };

  return (
    <>
      {loading ? (
        <p>Loading...</p>
      ) : (
        <>
          <h1>Task Detail</h1>
          {error && <p>{error}</p>}
          <h1>Judul Tugas: {task.title}</h1>
          <p>Deskripsi Tugas: {task.description}</p>
          <p>
            File Pendukung:{" "}
            <a href={BASE_URL + task.filePath} target="_blank" rel="noopener noreferrer">
              {task.filePath.split("-").slice(2).join("-")}
            </a>
          </p>

          {
            // Render untuk role mahasiswa
            user.role === "mahasiswa" &&
            (task.TaskSubmissions && task.TaskSubmissions.length > 0 ? (
              <div>
                <h2>Your Submissions:</h2>
                <button onClick={handleDeleteSubmission}>
                  Delete All Submission
                </button>
                <br />
                <a href={`/task/submission/${id}`}>Edit Submission</a>
                <ul>
                  {/* list task submission milik user yang sedang login */}
                  {task.TaskSubmissions.map((submission) => (
                    <li key={submission.id}>
                      <a
                        href={submission.filePath}
                        target="_blank"
                        rel="noopener noreferrer"
                      >
                        {submission.filePath.split("-").slice(2).join("-")}
                      </a>
                    </li>
                  ))}
                </ul>
              </div>
            ) : (
              <button onClick={handleSubmission}>Add submission</button>
            ))
          }

          {/* Untuk role admin */}
          {user.role === "admin" && (
            <>
              <a href={`/task/edit/${id}`}>Edit Task</a>
              <h2>All Submissions:</h2>
              {/* Menampilkan seluruh submission dari semua mahasiswa */}
              {task.TaskSubmissions && task.TaskSubmissions.length > 0 ? (
                Object.entries(
                  task.TaskSubmissions.reduce((acc, submission) => {
                    if (!acc[submission.userId]) {
                      acc[submission.userId] = [];
                    }
                    acc[submission.userId].push(submission);
                    return acc;
                  }, {})
                ).map(([userId, submissions]) => (
                  <div key={userId}>
                    <h3>User ID: {userId}</h3>
                    <ul>
                      {submissions.map((submission) => (
                        <li key={submission.id}>
                          <a
                            href={BASE_URL + submission.filePath}
                            target="_blank"
                            rel="noopener noreferrer"
                          >
                            {submission.filePath.split("-").slice(2).join("-")}
                          </a>
                        </li>
                      ))}
                    </ul>
                  </div>
                ))
              ) : (
                <p>No submissions yet.</p>
              )}
            </>
          )}
        </>
      )}
    </>
  );
};

export default Task;