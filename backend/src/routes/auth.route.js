const router = require("express").Router();
const verifyJWT = require("../middleware/verifyJWT.middleware");
const checkRole = require("../middleware/checkRole.middleware"); 

const {
  login,
  createUser,
  logout,
  getMe,
} = require("../controllers/auth.controller");

router.post("/login", login);
router.post("/user/create", verifyJWT, checkRole(["admin"]), createUser); 
router.get("/logout", logout);
router.get("/me", verifyJWT, getMe);

module.exports = router;