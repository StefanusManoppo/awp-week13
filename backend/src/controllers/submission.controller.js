const pool = require("../db");
const fs = require("fs");
const path = require("path");

// GET /api/task/submission/:taskId
const getSubmissionsByTaskId = async (req, res) => {
  try {
    const { taskId } = req.params;
    const user = req.user; // Dari verifyJWT

    let query = `
      SELECT ts.id, ts.taskId, ts.userId, u.name as studentName, u.email as studentEmail, ts.filePath, ts.createdAt, ts.updatedAt 
      FROM \`TaskSubmissions\` ts
      JOIN \`Users\` u ON ts.userId = u.id
      WHERE ts.taskId = ?
    `;
    const params = [taskId];

    // LOGIC 1: Jika Mahasiswa, hanya bisa lihat punya sendiri
    if (user.role === "mahasiswa") {
      query += " AND ts.userId = ?";
      params.push(user.id);
    }
    // Jika Admin, query di atas sudah cukup (melihat semua berdasarkan taskId)

    const [rows] = await pool.query(query, params);

    // Parse filePath dari JSON string kembali ke Array agar rapi saat dikirim ke frontend
    const formattedRows = rows.map((row) => ({
      ...row,
      filePath: row.filePath ? JSON.parse(row.filePath) : [],
    }));

    return res.status(200).json(formattedRows);
  } catch (error) {
    console.error("Error getting submissions:", error);
    return res.status(500).json({ message: "Internal server error" });
  }
};

// POST /api/task/submission/:taskId
const createSubmission = async (req, res) => {
  try {
    const { taskId } = req.params;
    const userId = req.user.id;

    // Cek apakah user sudah pernah submit (biasanya 1 task = 1 submission)
    const [existing] = await pool.query(
      "SELECT id FROM `TaskSubmissions` WHERE taskId = ? AND userId = ? LIMIT 1",
      [taskId, userId]
    );

    if (existing.length > 0) {
      // Jika sudah ada, hapus file yang barusan diupload agar tidak nyampah
      if (req.files) {
        req.files.forEach((f) => fs.unlinkSync(f.path));
      }
      return res.status(400).json({ message: "You have already submitted this task. Please use edit instead." });
    }

    // Proses File Upload (Multiple)
    if (!req.files || req.files.length === 0) {
      return res.status(400).json({ message: "At least one file is required" });
    }

    // Simpan path file sebagai JSON String
    // Contoh: '["uploads/submissions/file1.pdf", "uploads/submissions/file2.zip"]'
    const filePaths = req.files.map((file) => file.path.replace(/\\/g, "/"));
    const filesJson = JSON.stringify(filePaths);

    await pool.query(
      "INSERT INTO `TaskSubmissions` (taskId, userId, filePath, createdAt, updatedAt) VALUES (?, ?, ?, NOW(), NOW())",
      [taskId, userId, filesJson]
    );

    return res.status(201).json({ message: "Task submitted successfully" });
  } catch (error) {
    console.error("Error creating submission:", error);
    return res.status(500).json({ message: "Internal server error" });
  }
};

// PUT /api/task/submission/ (Asumsi: Mengedit submission berdasarkan body taskId)
const updateSubmission = async (req, res) => {
  try {
    // Karena instruksi endpointnya /api/task/submission/, kita ambil taskId dari body
    // Atau jika Anda ingin tetap pakai parameter, sesuaikan route-nya nanti.
    // Di sini saya asumsikan taskId dikirim via body form-data
    const { taskId } = req.body; 
    const userId = req.user.id;

    if (!taskId) {
       // Hapus file baru jika validasi gagal
       if (req.files) req.files.forEach((f) => fs.unlinkSync(f.path));
       return res.status(400).json({ message: "Task ID is required" });
    }

    // Cari submission lama
    const [rows] = await pool.query(
      "SELECT id, filePath FROM `TaskSubmissions` WHERE taskId = ? AND userId = ? LIMIT 1",
      [taskId, userId]
    );

    if (rows.length === 0) {
      if (req.files) req.files.forEach((f) => fs.unlinkSync(f.path));
      return res.status(404).json({ message: "Submission not found" });
    }

    const oldSubmission = rows[0];

    // Jika user mengupload file baru, hapus file lama dan replace
    let newFilesJson = oldSubmission.filePath;

    if (req.files && req.files.length > 0) {
      // 1. Hapus file fisik lama
      const oldPaths = JSON.parse(oldSubmission.filePath || "[]");
      oldPaths.forEach((p) => {
        const absolutePath = path.resolve(p);
        if (fs.existsSync(absolutePath)) fs.unlinkSync(absolutePath);
      });

      // 2. Siapkan path baru
      const newPaths = req.files.map((file) => file.path.replace(/\\/g, "/"));
      newFilesJson = JSON.stringify(newPaths);
    }

    // Update DB
    await pool.query(
      "UPDATE `TaskSubmissions` SET filePath = ?, updatedAt = NOW() WHERE id = ?",
      [newFilesJson, oldSubmission.id]
    );

    return res.status(200).json({ message: "Submission updated successfully" });

  } catch (error) {
    console.error("Error updating submission:", error);
    return res.status(500).json({ message: "Internal server error" });
  }
};

// DELETE /api/task/submission/:taskId
const deleteSubmission = async (req, res) => {
  try {
    const { taskId } = req.params;
    const userId = req.user.id;

    // Cari submission
    const [rows] = await pool.query(
      "SELECT id, filePath FROM `TaskSubmissions` WHERE taskId = ? AND userId = ? LIMIT 1",
      [taskId, userId]
    );

    if (rows.length === 0) {
      return res.status(404).json({ message: "Submission not found" });
    }

    const submission = rows[0];

    // Hapus file fisik
    const filePaths = JSON.parse(submission.filePath || "[]");
    filePaths.forEach((p) => {
      try {
        const absolutePath = path.resolve(p);
        if (fs.existsSync(absolutePath)) fs.unlinkSync(absolutePath);
      } catch (e) {
        console.warn("Failed to delete file:", p);
      }
    });

    // Hapus data di DB
    await pool.query("DELETE FROM `TaskSubmissions` WHERE id = ?", [submission.id]);

    return res.status(200).json({ message: "Submission deleted successfully" });

  } catch (error) {
    console.error("Error deleting submission:", error);
    return res.status(500).json({ message: "Internal server error" });
  }
};

module.exports = {
  getSubmissionsByTaskId,
  createSubmission,
  updateSubmission,
  deleteSubmission
};