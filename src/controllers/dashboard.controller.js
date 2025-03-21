import { ApiError } from "../utils/ApiError";
import { ApiResponse } from "../utils/apiResponse";
import { Video } from "../models/video.models.js"
import { Like } from "../models/like.models.js";
import { Subscription } from "../models/subscription.models.js";
import { asyncHandler } from "../utils/asyncHandler.js";


const getChannelStats = asyncHandler(async (req, res) => {
    try {
        const userId = req.user._id;

        const totalVideos = await Video.countDocuments({ owner: userId }); //  Fetch total videos uplaoded by the channel

        const totalSubscribers = await Subscription.countDocuments({ channel: userId }); // Fetch total subscribers for the channel

        const totalLikes = await Like.countDocuments({ // Fetch total likes on all videos uplaoded by the channel
            Video: { $in: await Video.find({ owner: userId }).distinct("_id")},
        });

        const totalViews = await Video.aggregate([ // Fetch total views on all videos uploaded by the channel
            { $match: { owner: userId}},
            { $group: { _id: null, totalViews: { $sum: "$views"}}},
        ]);

        const views = totalViews.length > 0 ? totalViews[0].totalViews : 0;

        return res
        .status(200)
        .json(new ApiResponse(200, {
            totalVideos, 
            totalSubscribers, 
            totalLikes, 
            totalViews : views}, "Channel stats fetched successfully"));
    } catch (error) {
        throw new ApiError(500, error?.message || "Error while fetching channel stats");
    }
})

const getChannelVideos = asyncHandler(async (req, res) => {
    try {
        const userId = req.user._id;

        const videos = await Video.find({ owner: userId });

        return res.status(200).json(new ApiResponse(200, videos, "Channel videos fetched successfully"));
    } catch (error) {
        throw new ApiError(500, error?.message || "Error while fetching channel videos");
    }
})

export {
    getChannelStats,
    getChannelVideos
}