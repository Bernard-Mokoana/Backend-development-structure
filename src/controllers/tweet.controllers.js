 import mongoose, { Mongoose } from "mongoose";
 import { Tweet } from "../models/tweet.models.js";
 import { User } from "../models/user.models.js";
 import { ApiError } from "../utils/ApiError.js";
 import { ApiResponse } from "../utils/apiResponse.js";
 import { asyncHandler } from "../utils/asyncHandler.js";

 const createTweet = asyncHandler(async (req, res) => {
    try {
        const { content } = req.body;

        if(!content) {
            throw new ApiError(400, "content is required");
        }

        const userId = req.user._id;

        const tweet = await Tweet.create({
            content,
            owner: userId
        });

        return res.status(201).json(new ApiResponse(201, tweet, "Tweet created successfully"))
    } catch (error) {
        throw new ApiError(500, error?.message || "Error while creating tweet")
    }
 })

 const getUserTweets = asyncHandler(async (req, res) => {
    try {
        const { userId } = req.params;

        if(!mongoose.Types.ObjectId.isValid(userId)) {
            throw new ApiError(400, "Invalid user id");
        }

        const tweets = await Tweet.find({ owner: userId})

        return res.status(200).json(new ApiResponse(200, tweets, "Tweets fetched successfully"));
    } catch (error) {
        throw new ApiError(500, error?.message || "Error while fetching")
    }
 })

 const updateTweet = asyncHandler(async (req, res) => {
    try {
    const { tweetId } = req.params;
    const { content } = req.body;

    if(!Mongoose.Types.ObjectId.isValid(tweetId)) {
        throw new ApiError(401, "Invalid tweet id");
    }

    if(!content) {
        throw new ApiError(400, "content is required");
    }

    const tweet = await Tweet.find({ _id: tweetId , owner: req.user._id });

    if(!tweetId) {
        throw new ApiError(404, "Tweet not found");
    }

    tweet.content = content;
    await tweet.save();

    return res.status(200).json(new ApiResponse(200, tweet, "Tweet updated successfully"));
    } catch (error) {
        throw new ApiError(500, error?.message || "Error while updating a tweet");
    }
 })
 const deleteTweet = asyncHandler(async (req, res) => {
    try {
        const { tweetId } = req.params;

    if(!mongoose.Types.ObjectId.isValid(tweetId)) {
        throw new ApiError(401, "Invalid tweet id");
    }

    
    if(!tweetId) {
        throw new ApiError(400, "Invalid tweet id");
    }

     const tweet = await Tweet.find({ _id: tweetId, owner: req.user._id});

     await Tweet.deleteOne({ _id: tweetId });

     return res.status(200).json(new ApiResponse(200, {}, "Tweet deleted successfully"));
    } catch (error) {
        throw new ApiError(500, error?.message || " Error while deleting tweet")
    }
 }) 
 export {
    createTweet,
    getUserTweets,
    updateTweet,
    deleteTweet
 }

