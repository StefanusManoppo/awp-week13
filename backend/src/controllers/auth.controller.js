const jwt = require("jsonwebtoken");
const bcrypt = require("bcrypt");
const { validateRegistration, validateLogin } = require("../utils/authValidation");
const pool = require("../db");
require("dotenv").config();

const createUser = async (req, res) => {
  try {
    // Validasi data input dari user
    const { isValid, message } = validateRegistration(req.body);
    if (!isValid) {
      return res.status(422).json({ message });
    }

    const { email, name, role, password } = req.body;

    // Cek apakah email sudah ada
    const [existing] = await pool.query(
      "SELECT id FROM `Users` WHERE email = ? LIMIT 1",
      [email]
    );
    if (existing.length > 0) {
      return res.status(400).json({ message: "Email already exists" });
    }

    // Hash password dengan bcrypt
    const hashedPassword = await bcrypt.hash(password, 10);

    // Insert user baru ke dalam database
    const [result] = await pool.query(
      `
      INSERT INTO \`Users\` (email, name, role, password, createdAt, updatedAt)
      VALUES (?, ?, ?, ?, NOW(), NOW())
      `,
      [email, name, role, hashedPassword]
    );
    const newUserId = result.insertId;

    return res.status(201).json({
      message: "User registered successfully",
      user: {
        id: newUserId,
        email,
        name,
        role,
      },
    });
  } catch (error) {
    console.error("Registration error:", error);
    return res.status(500).json({ message: "Internal server error" });
  }
};

const login = async (req, res) => {
  try {
    // Validasi data input dari user
    const { isValid, message } = validateLogin(req.body);
    if (!isValid) {
      return res.status(422).json({ message });
    }

    const { email, password } = req.body;
    // Cari user by email
    const [rows] = await pool.query(
      "SELECT id, email, name, role, password FROM `Users` WHERE email = ? LIMIT 1",
      [email]
    );

    if (rows.length === 0) {
      return res.status(401).json({ message: "Invalid email or password" });
    }

    const user = rows[0];

    // Bandingkan password dari input dengan yang di DB
    const match = await bcrypt.compare(password, user.password);
    if (!match) {
      // Jika tidak cocok, artinya password yang dimasukkan salah
      return res.status(401).json({ message: "Invalid email or password" });
    }

    // Buat JWT token berisi id user
    const jwtToken = jwt.sign(
      { id: user.id },
      process.env.JWT_SECRET,
      { expiresIn: "1h" }
    );

    // Simpan JWT di cookie
    res.cookie("jwtToken", jwtToken, {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "lax",
      maxAge: 60 * 60 * 1000,
    });

    return res.status(200).json({
      message: "Login successful",
      jwtToken,
      user: {
        id: user.id,
        email: user.email,
        name: user.name,
        role: user.role,
      },
    });
  } catch (error) {
    console.error("Login error:", error);
    return res.status(500).json({ message: "Internal server error" });
  }
};

const logout = (req, res) => {
  try {
    // Mengambil token dari cookie
    const existingToken = req.cookies?.jwtToken;

    if (!existingToken) {
      return res.status(400).json({ message: "No active session found" });
    }

    // Hapus cookie dengan mengatur ulang nilainya
    res.clearCookie("jwtToken", {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "lax",
    });

    return res.status(200).json({ message: "Logged out successfully" });
  } catch (error) {
    console.error("Logout error:", error);
    return res.status(500).json({ message: "Internal server error" });
  }
};

const getMe = async (req, res) => {
  try {
    // req.user diisi middleware verifyJWT
    const user = req.user;

    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }

    return res.status(200).json({
      user: {
        id: user.id,
        email: user.email,
        name: user.name,
        role: user.role,
      },
    });
  } catch (error) {
    console.error("Get user error:", error);
    return res.status(500).json({ message: "Internal server error" });
  }
};

module.exports = {
  createUser,
  login,
  logout,
  getMe,
};