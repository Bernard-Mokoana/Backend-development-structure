import { Videos } from "../models/video.models.js";
import { User } from "../models/user.models.js";
import { ApiResponse } from "../utils/apiResponse.js";
import { asyncHandler } from "../utils/asyncHandler.js";
import { ApiError } from "../utils/ApiError.js";
import { uploadOnCloudinary } from "../utils/cloudinary.js";


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
        
        if(!title || !description) {     
            throw new ApiError(400, "Title and description are required");
           }

           const videoFile = req.files?.videoFile[0]?.path;
           const thumbnailFile = req.files?.thumbnail[0]?.path;

           if(!videoFile || !thumbnailFile) {
            throw new ApiError(400, "Video and thumbnail are required");
           }

           const videoUploadResponse = await uploadOnCloudinary(videoFile);
           if(!videoUploadResponse?.url) {
            throw new ApiError(500, "Failed to upload video");
           }

           const thumbnailUploadResponse = await uploadOnCloudinary(thumbnailFile);
           if(!thumbnailUploadResponse?.url) {
            throw new ApiError(500, "Failed to uplaod thumbnail");
           }

           const video = await Videos.create({
            title,
            description,
            videoFile: videoUploadResponse.url,
            thumbnailFile: thumbnailUploadResponse,
            duration: videoUploadResponse.duration,
            owner: req.User._id,
           });

           return res
           .status(201)
           .json(new ApiResponse(201, video, "video published successfully"));
    } catch (error) {
        throw new ApiError(500, error?.message || "Error while publishing video");
    }
})

const getVideoById = asyncHandler(async (req, res) => {
   try {
    const { videoId } = req.body;
   } catch (error) {
    
   }
})

const updateVideo = asyncHandler(async (req, res) => {
    const { videoId } = req.params

})

const deleteVideo = asyncHandler( async(req, res) => {
    const { videoId } = req.params

})

const togglePublishDtatus = asyncHandler(async (req, res) => {
    const { videoId } = req.params

})

export{
    getAllVideos,
    publishAVideo,
    getVideoById,
    updateVideo,
    deleteVideo,
    togglePublishDtatus
}