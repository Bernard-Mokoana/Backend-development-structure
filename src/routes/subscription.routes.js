import { Router } from "express";
import { toggleSubscription,
    getSubscribedChannels,
    getUserchannelSubscribers } from "../controllers/subscription.controllers.js";
import { verifyJWT } from "../middleware/auth.middleware.js";

const router = Router();
router.use(verifyJWT);

router.route("/c/:channelId").post(toggleSubscription).get(getUserchannelSubscribers);

router.route("/u/:subscriberId").get(getSubscribedChannels);

export default router;