import { Router } from "express";
import { getAllVideos, 
    publishAVideo,
    getVideoById,
    updateVideo,
    deleteVideo,
    togglePublishStatus } from "../controllers/video.controllers.js";
import { verifyJWT } from "../middleware/auth.middleware.js";
import { upload } from "../middleware/multer.middlewares.js";

const router = Router();
router.use(verifyJWT);


router.route("/").get(getAllVideos);

router.post("/upload", verifyJWT, upload.fields([
    { name: "videoFile", maxCount: 1 },
    { name: "thumbnailFile", maxCount: 1 },
]), 
publishAVideo
);


router
.route("/:videoId")
.get(getVideoById)
.delete(deleteVideo)
.patch(upload.single("thumbnailFile"), updateVideo);

router.route("/toggle/publish/:videoId").patch(togglePublishStatus);

export default router;


