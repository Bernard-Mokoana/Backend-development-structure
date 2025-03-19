import multer from "multer";

// Configure storage for uploaded files
const storage = multer.diskStorage({
  destination: function (req, files, cb) {
    cb(null, "./public/temp"); 
  },
  filename: function (req, file, cb) {
    const uniqueSuffix = Date.now() + "-" + Math.round(Math.random() * 1e9);
    cb(null, uniqueSuffix + "-" + file.originalname); // Unique filenames
  }
});

// Initialize Multer with file filter and error handling
export const upload = multer({
  storage,
  limits: { fileSize: 5 * 1024 * 1024 }, // 5MB limit
  fileFilter: function (req, file, cb) {
    if (!file) {
      return cb(new Error("No file uploaded"), false);
    }
    cb(null, true);
  }
});
