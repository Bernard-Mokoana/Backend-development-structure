import mongoose from "mongoose";
import { Like } from "../models/like.models.js";
import { asyncHandler } from "../utils/asyncHandler.js";
import { ApiError } from "../utils/ApiError.js";
import { ApiResponse } from "../utils/apiResponse.js";

const toggleVideoLike = asyncHandler(async (req, res) => {
    try {
        const { videoId } = req.params;
        const userId = req.user._id;

    if(!mongoose.Types.ObjectId.isValid(videoId)) {
        throw new ApiError(400, "Invalid video Id");
    }

    const existingLike = await Like.findOne({
        video: videoId,
        likeBy: userId,
    });

    if(existingLike) {
        await Like.deleteOne({ _id: existingLike._id });
        return res.status(200).json(new ApiResponse(200, {}, "Like removed successfully"));
    } else {
        const like = await Like.create({
            video: videoId,
            likedBy: userId,
        });
        return res.status(200).json(new ApiResponse(200, like, "like added successfully"));
    }
    } catch (error) {
        throw new ApiError(500, error?.message || "Error while toggling video like");
    }
})

const toggleCommentLike = asyncHandler(async (req, res) => {
    try {
        const { commentId } = req.params;
        const userId = req.user._id;

        if(!mongoose.Types.ObjectId.isValid(commentId)) {
            throw new ApiError(400, "Invalid comment Id");
        }

        const existingLike = await Like.findOne({ 
            comment: commentId,
            likedBy: userId
         });

        if (existingLike) {
            await Like.deleteOne({ _id: existingLike._id})
            return res.status(200).json(new ApiResponse(200, {}, "Like removed successfully"));
        } else {
            const like = await Like.create({
                comment: commentId,
                LikedBy: userId
            });

            return res.status(200).json(new ApiResponse(200, like, "Like added successfully" ));
        }
    } catch (error) {
        throw new ApiError(500, error?.message || "Error while togglin a comment like");
    }
})

const toggleTweetLike = asyncHandler(async (req, res) => {
    try {
        const { tweetId } = req.params;
        const userId = req.user._id;

        if(!mongoose.Types.ObjectId.isValid(tweetId)) {
            throw new ApiError(400, "Invalid tweet Id");
        }

        const existingLike = await Like.findOne({
            tweet: tweetId,
            LikedBy: userId
        });

        if(existingLike) {
            await Like.deleteOne({ _id: existingLike._id });
            return res.status(200).json(new ApiResponse(200, {}, "Like removed successfully"));
        } else {
            const like = await Like.create({
                tweet: tweetId,
                LikedBy: userId,
            });
            return res.status(200).json(new ApiResponse(200, like, "Like added successfully"));
        }
    } catch (error) {
        throw new ApiError(500, error?.message || "Error while toggling tweet like");
    }
})

const getLikedVideos = asyncHandler(async (req, res) => {
    try {
        const userId = req.user._id;

        const likes = await Like.find({ likedBy: userId, video: {$exists: true} }).populate("video");

        const likedVideo = likes.map((like) => like.video);

        return res.status(200).json(new ApiResponse(200, likedVideo, "Liked video fetched successfully"));
    } catch (error) {
        throw new ApiError(500, error?.message || "Error while fetching liked video")
    }
})

export {
    toggleVideoLike,
    toggleCommentLike,
    toggleTweetLike,
    getLikedVideos
}