import mongoose from "mongoose";
import { Playlist } from "../models/playlist.models.js";
import { asyncHandler } from "../utils/asyncHandler.js";
import { ApiError } from "../utils/ApiError.js";
import { ApiResponse } from "../utils/apiResponse.js";

const createPlaylist = asyncHandler(async (req, res) => {
   try{
    const { name, description} = req.body;
    const userId = req.user._id;

    if (!name) {
        throw new ApiError(400, "Name is required");
    }

    const playlist = await Playlist.create({
        name,
        description,
        owner: userId
    });

    return res.status(200).json(new ApiResponse(200, playlist, "Playlist successfully created"));
   } catch(error) {
    throw new ApiError(500, error?.message || "Error while creating a playlist");
   }
})

const getUserPlaylists = asyncHandler(async (req, res) => {
   try {
    const { userId } = req.params;

    if(!mongoose.Types.ObjectId.isValid(userId)) {
        throw new ApiError(400, "Invalid user Id");
    }

    const playlist = await Playlist.find({ owner: userId });

    return res.status(200).json(200, playlist, "Playlist fetched successfully");
   } catch (error) {
    throw new ApiError(500, error?.message || "Error while fetching playlist");
   }
}) 

const getPlaylistById = asyncHandler(async (req, res) => {
    try {
        const { playlistId } = req.params;

        if(!mongoose.Types.ObjectId.isValid(playlistId)) {
            throw new ApiError(400, "Invalid playlist Id");
        }

        const playlist = await Playlist.findById(playlistId);

        if(!playlist) {
            throw new ApiError(404, "Playlist not found");
        }

        return res.status(200).json(new ApiResponse(200, playlist, "Playlist fetched successfully"));
    } catch (error) {
        throw new ApiError(500, error?.message || "Error while fetching playlist")
    }
})

const addVideoToPlaylist = asyncHandler(async (req, res) => {
    try {
        const { playlistId, videoId } = req.params;

        if (!mongoose.Types.ObjectId.isValid(playlistId) || !mongoose.Types.ObjectId.isValid(videoId)) {
            throw new ApiError(400, "Invalid playlist Id or video Id")
        }

        const playlist = await Playlist.findById(playlistId);

        if(!playlist) {
            throw new ApiError(404, "Playlist not found");
        }

        if(playlist.videos.includes(videoId)) {
            throw new (400, "Video already in playlist");
        }

        playlist.video.push(videoId);
        await playlist.save();

        return res.status(200).json(new ApiResponse(200, playlist, "Video added to the playlist successfully"));
    } catch (error) {
        throw new ApiError(500, error?.message || "Error while adding video to  playlist");
    }
})

const removeVideoFromPlaylist = asyncHandler(async (req, res) => {
   try {
    const { playlistId, videoId } = req.params;

    if(!mongoose.Types.ObjectId.isValid(playlistId) || !mongoose.Types.ObjectId.isValid(videoId)){
        throw new ApiError(400, "Invalid playlist Id or video Id");
    }
        const playlist = await Playlist.findById(playlistId);

        if(!playlist) {
            throw new ApiError(404, "Playlist not found");
        }

        if(playlist.videos.includes(videoId)) {
            throw new ApiError(400, "Video already in the playlist");
        }

        playlist.videos = playlist.videos.filter((id) => id.toString() !== videoId);
        await playlist.save();

        return res.status(200).json(new ApiResponse(200, {}, "Video removed successfully from playlist"));
   } catch (error) {
    throw new ApiError(500, error?.message || "Error while removing video")
   }
})

const deletePlaylist = asyncHandler(async (req, res) => {
    try {
        const { playlistId } = req.params;
    const userId = req.user._id;

    if(!mongoose.Types.ObjectId.isValid(playlistId)) {
        throw new ApiError(400, "Invalid playlist Id");
    }

    const playlist = await Playlist.findOne({ _id: playlistId, owner: userId});

    if(!playlist) {
        throw new ApiError(404, "Playlist not found or you are not authorized to delete the playlist");
    }
    await Playlist.deleteOne({ _id: playlistId});

    return res.status(200).json(new ApiResponse(200, {}, "Playlist deleted successfully"));
    } catch (error) {
        throw new ApiError(500, error?.message || "Error while deleting playlist");
    }
})

const updatePlaylist = asyncHandler(async (req, res) => {
    try {
        const { playlistId } = req.params;
        const { name, description } = req.body;
        const userId = req.user._id;

        if(!mongoose.Types.ObjectId.isValid(playlistId)) {
            throw new ApiError(400, "Invalid playlist Id");
        }

        if(!name) {
            throw new ApiError(400, "Name is required");
        }

        const playlist = await Playlist.findOne({ _id: playlistId, owner: userId });

        if(!playlistId) {
            throw new ApiError(404, "Playlist not found or you are not authorized to update this playlist");
        }

        if(name) playlist.name = name;
        if (description) playlist.description = description;
        await playlist.save();


        return res.status(200).json(new ApiResponse(200, playlist, "Playlist updated successfully"));
    } catch (error) {
        throw new ApiError(500, error?.message || "Error while updating a playlist")
    }
})

export {
    createPlaylist,
    getUserPlaylists,
    getPlaylistById,
    addVideoToPlaylist,
    removeVideoFromPlaylist,
    deletePlaylist,
    updatePlaylist
}