import { Videos } from "../models/video.models.js";
import { User } from "../models/user.models.js";
import { ApiResponse } from "../utils/apiResponse.js";
import { asyncHandler } from "../utils/asyncHandler.js";
import { ApiError } from "../utils/ApiError.js";
import { uploadOnCloudinary } from "../utils/cloudinary.js";
import mongoose from "mongoose";


const getAllVideos = asyncHandler(async (req, res) => {
    try {
        const { page = 1, limit = 10, query, sortBy, sortType, userId } = req.query;
        
        const filter = {};
        if (query) {
            filter.title = { $regex: query, $options: "i"};
        }
        if(userId) {
            filter.owner = userId;
        }

        const sort = {};
        if(sortBy && sortType) {
            sort[sortBy] = sortType === "asc" ? 1 : -1;
        } else {
            sort.createdAr = -1;
        }

        const options = {
            page: parseInt(page),
            limit: parseInt(limit),
            sort,
        }

        const videos = await Videos.aggregatePaginate(filter, options);

        return res
        .status(200)
        .json(new ApiResponse(200, videos, "Videos fetched successfully" ));
    } catch (error) {
        throw new ApiError(500, error?.message || "Error while fetching video")
    }
})

const publishAVideo = asyncHandler(async(req, res) => {
   
    try {
        const { title, description } = req.body;
        const userId = req.user._id;

        if(!title || !description) {     
            throw new ApiError(400, "Title and description are required");
           }


           console.log("Uploaded files:", req.files);

           if(!req.files || !req.files.videoFile || !req.files.thumbnail) {
            throw new ApiError(400, "video and thumbnail are required")
           }

           const videoFile = req.files.videoFile[0].path;
        // req.files?.videoFile[0]?.path;
           const thumbnailFile =  req.files.thumbnail[0].path;
        //    req.files?.thumbnail[0]?.path;


           const videoUploadResponse = await uploadOnCloudinary(videoFile);
           if(!videoUploadResponse?.url) {
            throw new ApiError(500, "Failed to upload video to cloudinary");
           }

           const thumbnailUploadResponse = await uploadOnCloudinary(thumbnailFile);
           if(!thumbnailUploadResponse?.url) {
            throw new ApiError(500, "Failed to uplaod thumbnail to cloudinary");
           }

           const video = await Videos.create({
            title,
            description,
            videoFile: videoUploadResponse.url,
            thumbnailFile: thumbnailUploadResponse.url,
            duration: videoUploadResponse.duration,
            owner: userId,
           });

           console.log(req.user);
           return res
           .status(201)
           .json(new ApiResponse(201, video, "video published successfully"));
    } catch (error) {
        throw new ApiError(500, error?.message || "Error while publishing video");
    }
})

const getVideoById = asyncHandler(async (req, res) => {
   try {
    const { videoId } = req.params;

    if(!mongoose.Types.ObjectId.isValid(videoId)) {
        throw new ApiError(400, "Invalid video ID");
    }

    const video = await Videos.findById(videoId);

    if(!video) {
        throw new ApiError(404, "Video not found");
    }

    return res
    .status(201)
    .json(new ApiResponse(200, video, "Video fetched successfully"))
   } catch (error) {
    throw new ApiError(500, error?.message || "Error while fetching video");
   }
})

const updateVideo = asyncHandler(async (req, res) => {
    try {
        const { videoId } = req.params;
        const {title, description } = req.body;
        const thumbnailFile = req.file?.path; // Extract thumbnail

        if(!mongoose.Types.ObjectId.isValid(videoId)) {
            throw new ApiError(401, "Invalid video Id");
        }

        const video = await Videos.findOne({ _id: videoId, owner: req.user._id });

        if(!video) {
            throw new ApiError(404, "Video not found or you not authorized to update this video")
        }

        if(title) video.title = title;
        if(description) video.description = description;
        if(thumbnailFile) {
            const thumbnailUploadResponse = await uploadOnCloudinary(thumbnailFile);
            if(!thumbnailUploadResponse?.url) {
                throw new ApiError(500, "Failed to upload thumbnail");
            }
            video.thumbnail = thumbnailUploadResponse.url;
            }
        await video.save();

        return res
        .status(200)
        .json(new ApiResponse(201, "Video updated successfully"));
    } catch (error) {
        throw new ApiError(500, error?.message || "Error while updating video")
    }
})

const deleteVideo = asyncHandler( async(req, res) => {
    try {
        const { videoId } = req.params;

        if(!mongoose.Types.ObjectId.isValid(videoId)) {
            throw new ApiError(400, "Invalid video Id");
        }


        const video = await Videos.findOne({ _id: videoId, owner: req._user._id })

        if(!video) {
            throw new ApiError(404, "video not found or you are not athorized to delete the video")
        }

        await Videos.deleteOne({ _id: videoId });

        return res.status(200).json(new ApiResponse(200,  "Video deleted successfully"))
    } catch (error) {
        throw new ApiError(500, error?.message || "Error while deleting a video")
    }

})

const togglePublishStatus = asyncHandler(async (req, res) => {
   try {
    const { videoId } = req.params;

    if(!mongoose.Types.ObjectId.isValid(videoId)) {
        throw new ApiError(400, "Invalid video Id");
    }

    if(!videoId) {
        throw new ApiError(404, "Video not found or you not athorized to toggle publish status")
    }

    const video = await Videos.findOne({ _id: videoId, owner: req.user._id});

    video.isPublished = !video.isPublished;
    await video.save()

    return res
    .status(200)
    .json(new ApiResponse(200, video, "Publish status toggled successfully"));
   } catch (error) {
    throw new ApiError(500, error?.message || "Error while toggling publish status")
   }

})

export{
    getAllVideos,
    publishAVideo,
    getVideoById,
    updateVideo,
    deleteVideo,
    togglePublishStatus
}