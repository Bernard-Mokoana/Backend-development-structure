import mongoose from "mongoose";
import { Comment } from "../models/comment.models.js";
import { asyncHandler } from "../utils/asyncHandler.js";

const getVideoComments = asyncHandler(async (req, res) => {
    try {
        const { videoId } = req.params;
        const {page = 1, limit = 10 } = req.query;
    } catch (error) {
        
    }
})

const addComment = asyncHandler(async (req, res) => {

})

const updateComment = asyncHandler(async (req, res) => {

})

const deleteComment = asyncHandler(async (req, res) => {

})

export {
    getVideoComments,
    addComment,
    updateComment,
    deleteComment
}
