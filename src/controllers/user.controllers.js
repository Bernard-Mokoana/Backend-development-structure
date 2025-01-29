import {asyncHandler} from "../utils/asyncHandler.js";
import { ApiError } from "../utils/ApiError.js";
import { User } from "../models/user.models.js";
import { uploadOnCloudinary, deleteFromCloudinary } from "../utils/cloudinary.js";
import { ApiResponse } from "../utils/apiResponse.js";

const registerUser = asyncHandler(async (req, res) => {
    const { fullname, email, username, password } = req.body;

    // Validation for missing fields
    if (
        [fullname, username, email, password].some((field) => field?.trim()  === "")
    ){
        throw new ApiError(400, "All fields are required");
    }

    // Check if user already exists
    const existedUser = await User.findOne({
        $or: [{ username }, { email }]
    });

    if (existedUser) {
        throw new ApiError(409, "User with email or username already exists");
    }

    console.warn("Uploaded Files:", req.files);

    //  Fixing field names (ensure consistency with multer setup)
    const avatarLocalPath = req.files?.avatar?.[0]?.path;
    const coverLocalPath = req.files?.CoverImage?.[0]?.path; 
    if (!avatarLocalPath) {
        throw new ApiError(400, "Avatar file is missing");
    }

    let avatar, coverImage;

    //  Upload Avatar
    try {
        avatar = await uploadOnCloudinary(avatarLocalPath);
        console.log("✅ Uploaded Avatar:", avatar);
    } catch (error) {
        console.error("❌ Error Uploading Avatar:", error);
        throw new ApiError(500, "Failed to upload avatar");
    }

    //  Upload Cover Image (if provided)
    if (coverLocalPath) {
        try {
            coverImage = await uploadOnCloudinary(coverLocalPath);
            console.log("✅ Uploaded Cover Image:", coverImage);
        } catch (error) {
            console.error("❌ Error Uploading Cover Image:", error);
            throw new ApiError(500, "Failed to upload cover image");
        }
    }

    //  Create new user
    let user;
    try {
        user = await User.create({
            fullname,
            email,
            username: username.toLowerCase(), // Fix duplicate username issue
            avatar: avatar.url,
            coverImage: coverImage?.url || "",
        });

        const createdUser = await User.findById(user._id).select("-password -refreshToken");

        if (!createdUser) {
            throw new ApiError(500, "Something went wrong while registering a user");
        }

        return res.status(201).json(new ApiResponse(201, createdUser, "User registered successfully"));

    } catch (error) {
        console.error("❌ User Creation Failed:", error);

        //  Cleanup Cloudinary uploads if user creation fails
        if (avatar) {
            await deleteFromCloudinary(avatar.public_id);
        }
        if (coverImage) {
            await deleteFromCloudinary(coverImage.public_id);
        }

        throw new ApiError(500, "Something went wrong while registering a user and images were deleted");
    }
});

export { registerUser };
