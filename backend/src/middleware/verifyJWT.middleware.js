const jwt = require("jsonwebtoken");
const pool = require("../db");
require("dotenv").config();

const verifyJWT = async (req, res, next) => {
  try {
    // Client mengirim token di cookie
    const token = req.cookies?.jwtToken;

    if (!token) {
      return res.status(401).json({
        type: "INVALID_TOKEN",
        message: "Session expired or unauthorized",
      });
    }

    // Verifikasi token (sync, kalau gagal akan throw error)
    let decoded;
    try {
      decoded = jwt.verify(token, process.env.JWT_SECRET);
    } catch (err) {
      console.error("JWT verify error:", err.message);
      return res.status(401).json({
        type: "INVALID_TOKEN",
        message: "Failed to authenticate token",
      });
    }

    // Ambil user dari DB pakai id di token
    const [rows] = await pool.query(
      "SELECT id, name, role FROM `Users` WHERE id = ? LIMIT 1",
      [decoded.id]
    );

    if (rows.length === 0) {
      return res.status(404).json({
        message: "User not found",
      });
    }

    // Simpan ke req.user untuk dipakai di controller
    req.user = {
      id: rows[0].id,
      name: rows[0].name,
      role: rows[0].role,
    };

    next();
  } catch (error) {
    console.error("verifyJWT middleware error:", error);
    return res.status(500).json({
      message: "Internal server error",
    });
  }
};

module.exports = verifyJWT;