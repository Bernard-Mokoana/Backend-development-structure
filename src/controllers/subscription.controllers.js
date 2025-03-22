import mongoose from "mongoose";
import { Subscriber } from "../models/subscription.models.js";
import { asyncHandler } from "../utils/asyncHandler.js";
import { ApiError } from "../utils/ApiError.js";
import { ApiResponse } from "../utils/apiResponse.js";

const toggleSubscription = asyncHandler(async (req, res) => {
    try {
        const { channelId } = req.params;
        const userId = req.user._id;

        if(!mongoose.Types.ObjectId.isValid(channelId)) {
            throw new ApiError(400, "Invalid channel Id");
        }

       const existingSubscription = await Subscriber.findOne({
        channel: channelId,
        subscriber: userId
       });


       if(existingSubscription) {
        await Subscriber.deleteOne({ _id: existingSubscription._id });
        return res.status(200).json(new ApiResponse(200, {}, "Unsubscribed successfully"));
       } else {
        const subscription = await Subscriber.create({
            channel: channelId,
            subscriber: userId
        });

        return res.status(200).json(new ApiResponse(200, subscription, "Subscribed successfully"));
       }
    } catch (error) {
        throw new ApiError(500, error?.message || "Error while toggling subscription");
    }
})

const getUserchannelSubscribers = asyncHandler(async (req, res) => {
    try {
        const { channelId } = req.params;

        if(!mongoose.Types.ObjectId.isValid(channelId)) {
            throw new ApiError(400, "Invalid channel Id");
        }

        const subscriptions = await Subscriber.find({channel: channelId})
        .populate("subscriber", "username email avatar");

        const subscribers = subscriptions.map((sub) => sub.subscriber);

        return res.status(200).json(new ApiResponse(200, subscribers, "Subscribers fetched successfully"));
    } catch (error) {
        throw new ApiError(500, error?.message || "Error while fetching subscribers");
    }
})

const getSubscribedChannels = asyncHandler(async (req, res) => {
    try {
        const { subscriberId } = req.params;

        if(mongoose.Types.ObjectId.isValid(subscriberId)) {
            throw new ApiError(400, "Invalid subscriber Id");
        }

        const subscriptions = await Subscriber.find({ subscriber: subscriberId})
        .populate("channel", "username email avatar");

        const channels = subscriptions.map((sub) => sub.channel);

        return res.status(200).json(new ApiResponse(200, channels, "Subscribed channels fetched successfully"));
    } catch (error) {
        throw new ApiError(500, error?.message || "Error while fetching subscribed channels");
    }
})

export {
    toggleSubscription,
    getSubscribedChannels,
    getUserchannelSubscribers
}