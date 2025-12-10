// backend/src/controllers/task.controller.js
const pool = require("../db");
const fs = require("fs");
const path = require("path");

// GET /api/task
const getAllTasks = async (req, res) => {
  try {
    const [tasks] = await pool.query(
      "SELECT id, title, description, filePath, createdAt, updatedAt FROM `Tasks` ORDER BY createdAt DESC"
    );
    return res.status(200).json(tasks);
  } catch (error) {
    console.error("Error retrieving tasks:", error);
    return res.status(500).json({ message: "Error retrieving tasks" });
  }
};

// GET /api/task/:id
const getTaskById = async (req, res) => {
  try {
    const { id } = req.params;
    const user = req.user; // diisi verifyJWT

    // Ambil task
    const [taskRows] = await pool.query(
      "SELECT id, title, description, filePath, createdAt, updatedAt FROM `Tasks` WHERE id = ? LIMIT 1",
      [id]
    );

    if (taskRows.length === 0) {
      return res.status(404).json({ message: "Task not found" });
    }

    const task = taskRows[0];

    // Ambil submissions
    let submissionsQuery =
      "SELECT id, taskId, userId, filePath, createdAt, updatedAt FROM `TaskSubmissions` WHERE taskId = ?";
    const params = [id];

    // Kalau mahasiswa -> hanya submission miliknya
    if (user && user.role === "mahasiswa") {
      submissionsQuery += " AND userId = ?";
      params.push(user.id);
    }

    const [submissions] = await pool.query(submissionsQuery, params);

    return res.status(200).json({
      ...task,
      submissions,
    });
  } catch (error) {
    console.error("Error retrieving task:", error);
    return res.status(500).json({ message: "Error retrieving task" });
  }
};

// POST /api/task
const createTask = async (req, res) => {
  try {
    const { title, description } = req.body;

    if (!title || !title.trim()) {
      return res.status(400).json({ message: "Title is required" });
    }

    // Normalisasi path agar kompatibel (ubah backslash jadi slash)
    const filePath = req.file
      ? req.file.path.replace(/\\/g, "/") 
      : null;

    const now = new Date();
    const [result] = await pool.query(
      `INSERT INTO \`Tasks\` (title, description, filePath, createdAt, updatedAt)
       VALUES (?, ?, ?, ?, ?)`,
      [title, description || null, filePath, now, now]
    );

    return res.status(201).json({
      id: result.insertId,
      title,
      description: description || null,
      filePath,
      createdAt: now,
      updatedAt: now,
    });
  } catch (error) {
    console.error("Error creating task:", error);
    return res.status(500).json({ message: "Error creating task" });
  }
};

// PUT /api/task/:id
const updateTask = async (req, res) => {
  try {
    const { id } = req.params;
    const { title, description } = req.body;

    // Cek task apakah exist di database
    const [rows] = await pool.query(
      "SELECT id, title, description, filePath FROM `Tasks` WHERE id = ? LIMIT 1",
      [id]
    );

    // Jika tidak ada, maka return error 404
    if (rows.length === 0) {
      return res.status(404).json({ message: "Task not found" });
    }

    const existing = rows[0];
    
    // Logika update field (pakai yang lama jika tidak dikirim)
    let newTitle = title !== undefined && title !== "" ? title : existing.title;
    let newDescription = 
      description !== undefined ? description : existing.description;
    let newFilePath = existing.filePath;

    // Kalau ada file baru diupload
    if (req.file) {
      const uploadedPath = req.file.path.replace(/\\/g, "/");

      // Hapus file lama kalau ada dan masih exist
      if (existing.filePath) {
        try {
          const oldPath = path.resolve(existing.filePath);
          if (fs.existsSync(oldPath)) {
            fs.unlinkSync(oldPath);
          }
        } catch (e) {
          console.warn("Failed to delete old file:", e.message);
        }
      }
      newFilePath = uploadedPath;
    }

    const now = new Date();
    await pool.query(
      `UPDATE \`Tasks\`
       SET title = ?, description = ?, filePath = ?, updatedAt = ?
       WHERE id = ?`,
      [newTitle, newDescription, newFilePath, now, id]
    );

    return res.status(200).json({
      id: Number(id),
      title: newTitle,
      description: newDescription,
      filePath: newFilePath,
      updatedAt: now,
    });
  } catch (error) {
    console.error("Error updating task:", error);
    return res.status(500).json({ message: "Error updating task" });
  }
};

// DELETE /api/task/:id
const deleteTask = async (req, res) => {
  try {
    const { id } = req.params;

    // Cek task
    const [rows] = await pool.query(
      "SELECT id, filePath FROM `Tasks` WHERE id = ? LIMIT 1",
      [id]
    );

    if (rows.length === 0) {
      return res.status(404).json({ message: "Task not found" });
    }

    const task = rows[0];

    // Hapus file kalau ada
    if (task.filePath) {
      try {
        const fileToDelete = path.resolve(task.filePath);
        if (fs.existsSync(fileToDelete)) {
          fs.unlinkSync(fileToDelete);
        }
      } catch (e) {
        console.warn("Failed to delete file on task delete:", e.message);
      }
    }

    // Hapus semua submission terkait
    await pool.query("DELETE FROM `TaskSubmissions` WHERE taskId = ?", [id]);

    // Hapus task
    await pool.query("DELETE FROM `Tasks` WHERE id = ?", [id]);

    return res.status(200).json({ message: "Task deleted successfully" });
  } catch (error) {
    console.error("Error deleting task:", error);
    return res.status(500).json({ message: "Error deleting task" });
  }
};

module.exports = {
  getAllTasks,
  getTaskById,
  createTask,
  updateTask,
  deleteTask,
};