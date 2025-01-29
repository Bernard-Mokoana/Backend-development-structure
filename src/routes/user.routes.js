import { Router } from "express";
import { registerUser } from "../controllers/user.controllers.js";
import { upload } from "../middleware/multer.middlewares.js";

const router = Router();

router.route("/register").post(
  (req, res, next) => {
    upload.fields([
      { name: "avatar", maxCount: 1 },
      { name: "coverImage", maxCount: 1 } // 🔹 Ensure consistent naming
    ])(req, res, (err) => {
      if (err) {
        return res.status(400).json({ success: false, error: err.message });
      }
      next();
    });
  },
  registerUser
);

export default router;
