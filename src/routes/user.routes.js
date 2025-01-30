import { Router } from "express";
import { registerUser, logoutUser } from "../controllers/user.controllers.js";
import { upload } from "../middleware/multer.middlewares.js";
import { verifyJWT } from "../middleware/auth.middleware.js";

const router = Router();

router.route("/register").post(
  // Middleware to handle file uploads using multer
  (req, res, next) => {
    upload.fields([
      { 
        name: "avatar",  // Expecting an uploaded file named "avatar"
        maxCount: 1      // Only allow one file for the avatar field
      },
      { 
        name: "coverImage", // Expecting an uploaded file named "coverImage"
        maxCount: 1         // Only allow one file for the coverImage field
      } 
    ])(req, res, (err) => {
      if (err) {
        // If there's an error during file upload (e.g., file size limit exceeded),
        // return a 400 Bad Request response with the error message
        return res.status(400).json({ success: false, error: err.message });
      }
      // If no errors, proceed to the next middleware/controller
      next();
    });
  },
  registerUser // Controller function that handles user registration
);

//secured routes

router.route("/logout").post(verifyJWT, logoutUser); // Controller function that handles user logout

export default router; // Export the router to be used in the application
