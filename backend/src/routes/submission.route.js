const router = require("express").Router();
const multer = require("multer");
const verifyJWT = require("../middleware/verifyJWT.middleware");
const checkRole = require("../middleware/checkRole.middleware");
const fs = require("fs");

const {
  getSubmissionsByTaskId,
  createSubmission,
  updateSubmission,
  deleteSubmission,
} = require("../controllers/submission.controller");

// --- KONFIGURASI MULTER KHUSUS SUBMISSION ---
// Pastikan folder uploads/submissions ada
const uploadDir = "uploads/submissions/";
if (!fs.existsSync(uploadDir)) {
  fs.mkdirSync(uploadDir, { recursive: true });
}

const diskStorage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, uploadDir);
  },
  filename: (req, file, cb) => {
    const uniqueSuffix = Date.now() + "-" + Math.round(Math.random() * 1e9);
    // Sanitasi nama file agar aman
    const safeName = file.originalname.replace(/[^a-zA-Z0-9.]/g, "_");
    cb(null, uniqueSuffix + "-" + safeName);
  },
});

const upload = multer({
  storage: diskStorage,
  limits: { fileSize: 7 * 1024 * 1024 }, // Limit 7 MB per file
  fileFilter: (req, file, cb) => {
    // Tipe file yang diizinkan: PDF, Word (doc/docx), Zip
    const allowedMimeTypes = [
      "application/pdf",
      "application/msword",
      "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
      "application/zip",
      "application/x-zip-compressed",
      "application/x-rar-compressed" // Opsional jika ingin support RAR
    ];

    if (allowedMimeTypes.includes(file.mimetype)) {
      cb(null, true);
    } else {
      cb(new Error("Invalid file type. Only PDF, Word, and ZIP are allowed."));
    }
  },
});

// --- ROUTES ---

// 1. GET Submission (Admin & Mahasiswa boleh akses)
router.get("/:taskId", verifyJWT, checkRole(["admin", "mahasiswa"]), getSubmissionsByTaskId);

// 2. POST Submission (Hanya Mahasiswa)
// upload.array("files", 10) artinya field form bernama 'files' bisa muat maks 10 file
router.post(
  "/:taskId",
  verifyJWT,
  checkRole(["mahasiswa"]),
  upload.array("files", 10), 
  createSubmission
);

// 3. PUT Submission (Hanya Mahasiswa)
router.put(
  "/",
  verifyJWT,
  checkRole(["mahasiswa"]),
  upload.array("files", 10),
  updateSubmission
);

// 4. DELETE Submission (Hanya Mahasiswa)
router.delete(
  "/:taskId",
  verifyJWT,
  checkRole(["mahasiswa"]),
  deleteSubmission
);

module.exports = router;