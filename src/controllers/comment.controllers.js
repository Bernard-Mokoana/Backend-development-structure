import mongoose from "mongoose";
import { Comment } from "../models/comment.models.js";
import { asyncHandler } from "../utils/asyncHandler.js";
import { ApiError } from "../utils/ApiError.js";
import { ApiResponse } from "../utils/apiResponse.js";
import { User } from "../models/user.models.js";
const getVideoComments = asyncHandler(async (req, res) => {
    try {
        const { videoId } = req.params;
        const {page = 1, limit = 10 } = req.query;

        if(!mongoose.Types.ObjectId.isValid(videoId)) {
            throw new ApiError(400, "Invalid video Id");
        }

        const  options = {
            page: parseInt(page),
            limit: parseInt(limit),
            sort: { createdAt: -1 }
        }

        const comment = await Comment.aggregatePaginate(
            { video: videoId },
            options
        );

        return  res.status(200).json(new ApiResponse(200, comment , "Comments fetched successfully"));
    } catch (error) {
        throw new ApiError(500, error?.message || "Error while fetching comments");
    }
})

const addComment = asyncHandler(async (req, res) => {
   try {
    const { videoId } = req.params;
    const { content } = req.body;

    if(!mongoose.Types.ObjectId.isValid(videoId)) {
        throw new ApiError(400, "Invalid video Id");
    }

    if(!content) {
        throw new ApiError(400, "Content is required")
    }

    const comment = await Comment.create({
        content,
        video: videoId,
        owner: req.user._id,
    });

    return res.status(200).json(new ApiResponse(200, comment , "Comment added successfully"));
   } catch (error) {
    throw new ApiError(500, error?.message || "Error while adding a comment");
   }
})

const updateComment = asyncHandler(async (req, res) => {
    try {
        const { commentId } = req.params;
    const { content } = req.body;

    if(!mongoose.Types.ObjectId.isValid(commentId)) {
        throw new ApiError(400, "Invalid comment Id");
    }

    if(!content) {
        throw new ApiError(400, "Content is required");
    }

    const comment = await Comment.findOne({ _id: commentId, owner: req.user._id });

    if(!comment) {
        throw new ApiError(404, "Comment not found or you not authorized to update this comment")
    }

    comment.content = content;
    await comment.save();

    return res.status(200).json(new ApiResponse(200, comment,  "Comment updated successfully"));
    } catch (error) {
        throw new ApiError(500, error?.message || "Error while updating comment")
    }
})

const deleteComment = asyncHandler(async (req, res) => {
    try {
        const { commentId } = req.params;
    
    if(!mongoose.Types.ObjectId.isValid(commentId)) {
        throw new ApiError(400, "Invalid comment Id");
    }

    const comment = await Comment.findOne({ _id: commentId, owner: req.user._id });

    if(!comment) {
        throw new ApiError(404, "Comment not found or not authorized to delete this comment");
    }

    await Comment.deleteOne({ _id: commentId });

    return res.status(200).json(new ApiError(200, {}, "Comment deleted successfully"));
    } catch (error) {
        throw new ApiError(500, error?.message || "Error while deleting a comment");
    }
})

export {
    getVideoComments,
    addComment,
    updateComment,
    deleteComment
}
