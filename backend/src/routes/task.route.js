// src/routes/task.route.js
const router = require("express").Router();
const multer = require("multer");
const verifyJWT = require("../middleware/verifyJWT.middleware");
const checkRole = require("../middleware/checkRole.middleware");
// Import controller
const {
  getAllTasks,
  getTaskById,
  createTask,
  updateTask,
  deleteTask,
} = require("../controllers/task.controller");

// --- KONFIGURASI MULTER (UPLOAD FILE) ---
const diskStorage = multer.diskStorage({
  // Menentukan folder penyimpanan file
  destination: (req, file, cb) => {
    cb(null, "uploads/");
  },
  // Menentukan nama file agar unik
  filename: (req, file, cb) => {
    const uniqueSuffix =
      Date.now() + "-" + Math.round(Math.random() * 1e9) + "-";
    cb(null, uniqueSuffix + file.originalname);
  },
});

const upload = multer({
  storage: diskStorage,
  limits: { fileSize: 5 * 1024 * 1024 }, // Limit 5MB
  fileFilter: (req, file, cb) => {
    const allowedTypes = ["image/jpeg", "image/png", "application/pdf"];
    if (allowedTypes.includes(file.mimetype)) {
      cb(null, true);
    } else {
      cb(new Error("Invalid file type. Only JPEG, PNG, and PDF are allowed."));
    }
  },
});

// --- DEFINISI ROUTE ---

// Semua user (mahasiswa & admin) bisa melihat task
router.get("/", verifyJWT, getAllTasks);
router.get("/:id", verifyJWT, getTaskById);

// HANYA ADMIN yang bisa Create, Update, Delete
// Urutan: verifyJWT -> checkRole -> upload -> controller
router.post(
  "/",
  verifyJWT,
  checkRole(["admin"]),
  upload.single("file"),
  createTask
);

router.put(
  "/:id",
  verifyJWT,
  checkRole(["admin"]),
  upload.single("file"),
  updateTask
);

router.delete(
  "/:id",
  verifyJWT,
  checkRole(["admin"]),
  deleteTask
);

module.exports = router;