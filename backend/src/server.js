const express = require("express");
const cors = require("cors");
const dotenv = require("dotenv");
const cookieParser = require("cookie-parser");
const path = require("path");
const pool = require("./db");

const authRouter = require("./routes/auth.route");
const taskRouter = require("./routes/task.route");
const submissionRouter = require("./routes/submission.route"); 

// Load environment variables
dotenv.config();

const PORT = process.env.PORT || 5000;
const app = express();

app.use(
  cors({
    origin: true, 
    credentials: true, 
  })
);

app.use(cookieParser()); // Middleware to parse cookies

// Middleware to parse JSON requests
app.use(express.json());
app.use(express.urlencoded({ extended: true })); // Support parsing form data URL encoded

// --- STATIC FILES ---
// Agar file gambar task dan file submission bisa diakses lewat browser
// URL: http://localhost:5000/uploads/...
app.use("/uploads", express.static(path.join(__dirname, "..", "uploads")));

// --- REGISTER ROUTES ---
app.use("/api/auth", authRouter);
app.use("/api/task", taskRouter);
app.use("/api/task/submission", submissionRouter); // Endpoint submission

// Start server setelah MySQL siap
const startServer = async () => {
  try {
    // Cek koneksi database sebelum server jalan
    const connection = await pool.getConnection();
    await connection.ping();
    connection.release();

    app.listen(PORT, () => {
      console.log(`Server is running on http://localhost:${PORT}`);
      console.log("Connected to the database successfully");
    });
  } catch (err) {
    console.error("Unable to connect to the database:", err);
    process.exit(1); // hentikan kalau DB gagal
  }
};

startServer();