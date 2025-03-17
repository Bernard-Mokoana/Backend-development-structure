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

router
.route("/")
.get(getAllVideos)
.post(upload.fields([
    {
    name: "VideoFile",
    maxCount: 1, 
},
{
    name: "thumbnail",
    maxCount: 1,
},
]),
publishAVideo
);

router
.route("/:videoId")
.get(getVideoById)
.delete(deleteVideo)
.patch(upload.single("thumbnail"), updateVideo);

router.route("/toggle/publish/:videoId").patch(togglePublishStatus);

export default router;
