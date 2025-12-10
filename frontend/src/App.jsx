import { Routes, Route } from "react-router-dom";
import Login from "./pages/Login.jsx";
import Home from "./pages/Home.jsx";
import Task from "./pages/Task.jsx";
import TaskSubmission from "./pages/TaskSubmission.jsx";
import EditTask from "./pages/EditTask.jsx";
import AddTask from "./pages/AddTask.jsx";
import ProtectedRoute from "./components/ProtectedRoute.jsx";

function App() {
  return (
    <Routes>
      <Route
        path="/"
        element={
          <ProtectedRoute>
            <Home />
          </ProtectedRoute>
        }
      />

      <Route path="/login" element={<Login />} />

      <Route
        path="/task/submission/:id"
        element={
          <ProtectedRoute allowedRoles={["mahasiswa"]}>
            <TaskSubmission />
          </ProtectedRoute>
        }
      />

      <Route
        path="/task/add"
        element={
          <ProtectedRoute>
            <AddTask />
          </ProtectedRoute>
        }
      />

      <Route
        path="/task/edit/:id"
        element={
          <ProtectedRoute allowedRoles={["admin"]}>
            <EditTask />
          </ProtectedRoute>
        }
      />

      <Route
        path="/task/:id"
        element={
          <ProtectedRoute>
            <Task />
          </ProtectedRoute>
        }
      />

      <Route path="/unauthorized" element={<div>Unauthorized Access</div>} />
    </Routes>
  );
}

export default App;