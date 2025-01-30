import { asyncHandler } from "../utils/asyncHandler.js";
import { ApiError } from "../utils/ApiError.js";
import { User } from "../models/user.models.js";
import { uploadOnCloudinary, deleteFromCloudinary } from "../utils/cloudinary.js";
import { ApiResponse } from "../utils/apiResponse.js";
import jwt from "jsonwebtoken";

// Function to generate access and refresh tokens
const generateAccessAndRefreshToken = async (userId) => {
   try {
    const user = await User.findById(userId); // Find user by ID
 
    if (!user)
     throw new ApiError(404, "User not found"); // Error if user not found
 
    const accessToken = user.generateAccessToken(); // Generate access token
    const refreshToken = user.generateRefreshToken(); // Generate refresh token
 
    user.refreshToken = refreshToken; // Save refresh token in user model
    await user.save({ validateBeforeSave: false }); // Save user without validation

    return { accessToken, refreshToken }; // Return tokens
   } catch (error) {
    throw new ApiError(500, "Something went wrong while generating access and refresh token");
   }
}

// Register a new user
const registerUser = asyncHandler(async (req, res) => {
    const { fullname, email, username, password } = req.body;

    // Validation for missing fields
    if (
        [fullname, username, email, password].some((field) => field?.trim() === "")
    ) {
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

    // Extract file paths for avatar and cover image
    const avatarLocalPath = req.files?.avatar?.[0]?.path; // Avatar image path
    const coverLocalPath = req.files?.CoverImage?.[0]?.path; // Cover image path (Ensure consistent naming)

    if (!avatarLocalPath) {
        throw new ApiError(400, "Avatar file is missing"); // Avatar is required
    }

    let avatar, coverImage;

    // Upload avatar to Cloudinary
    try {
        avatar = await uploadOnCloudinary(avatarLocalPath);
        console.log("✅ Uploaded Avatar:", avatar);
    } catch (error) {
        console.error("❌ Error Uploading Avatar:", error);
        throw new ApiError(500, "Failed to upload avatar");
    }

    // Upload cover image to Cloudinary (if provided)
    if (coverLocalPath) {
        try {
            coverImage = await uploadOnCloudinary(coverLocalPath);
            console.log("✅ Uploaded Cover Image:", coverImage);
        } catch (error) {
            console.error("❌ Error Uploading Cover Image:", error);
            throw new ApiError(500, "Failed to upload cover image");
        }
    }

    // Create a new user
    let user;
    try {
        user = await User.create({
            fullname,
            email,
            username: username.toLowerCase(), // Convert username to lowercase
            avatar: avatar.url, // Store avatar URL
            coverImage: coverImage?.url || "", // Store cover image URL if available
        });

        // Fetch the created user and exclude sensitive fields
        const createdUser = await User.findById(user._id).select("-password -refreshToken");

        if (!createdUser) {
            throw new ApiError(500, "Something went wrong while registering a user");
        }

        return res.status(201).json(new ApiResponse(201, createdUser, "User registered successfully"));

    } catch (error) {
        console.error("❌ User Creation Failed:", error);

        // Cleanup Cloudinary uploads if user creation fails
        if (avatar) {
            await deleteFromCloudinary(avatar.public_id);
        }
        if (coverImage) {
            await deleteFromCloudinary(coverImage.public_id);
        }

        throw new ApiError(500, "Something went wrong while registering a user and images were deleted");
    }
});

// Login user
const loginUser = asyncHandler(async (req, res) => {
    // Get data from request body
    const { email, username, password } = req.body;

    // Validation for required fields
    if (!email) {
        throw new ApiError(400, "Email is required");
    }

    // Check if user exists
    const user = await User.findOne({
        $or: [{ username }, { email }]
    });

    if (!user) {
        throw new ApiError(401, "User not found");
    }

    // Validate password
    const isPasswordValid = await user.isPasswordCorrect(password);

    if (!isPasswordValid) {
        throw new ApiError(401, "Invalid credentials");
    }

    // Generate access and refresh tokens
    const { accessToken, refreshToken } = await generateAccessAndRefreshToken(user._id);

    // Get logged-in user data (excluding sensitive fields)
    const loggedInUser = await User.findById(user._id).select("-password -refreshToken");

    if (!loggedInUser) {
        throw new ApiError(400, "User not logged In");
    }

    // Set cookie options
    const options = {
        httpOnly: true,
        secure: process.env.NODE_ENV === "production",
    };

    // Send response with cookies and user data
    return res
        .status(200)
        .cookie("accessToken", accessToken, options)
        .cookie("refreshToken", refreshToken, options)
        .json(new ApiResponse(
            200,
            { user: loggedInUser, accessToken, refreshToken },
            "User logged in successfully"
        ));
});

// Logout user
const logoutUser = asyncHandler(async (req, res) => {
    // Remove refresh token from user record
    await User.findByIdAndUpdate(
        req.user._id,
        {
            $set: {
                refreshToken: undefined,
            }
        },
        { new: true }
    );

    // Set cookie options
    const options = {
        httpOnly: true,
        secure: process.env.NODE_ENV === "production",
    };

    // Clear cookies and send response
    return res
        .status(200)
        .clearCookie("accessToken", options)
        .clearCookie("refreshToken", options)
        .json(new ApiResponse(200, {}, "User logged out successfully"));
});

// Refresh access token
const refreshAccessToken = asyncHandler(async (req, res) => {
    // Get refresh token from cookies or request body
    const incomingRefreshToken = req.cookies.refreshToken || req.body.refreshToken;

    if (!incomingRefreshToken) {
        throw new ApiError(401, "No refresh token provided");
    }

    try {
        // Verify refresh token
        const decodedToken = jwt.verify(
            incomingRefreshToken,
            process.env.REFRESH_TOKEN_SECRET,
        );

        // Find user by decoded token ID
        const user = await User.findById(decodedToken?._id);

        if (!user) {
            throw new ApiError(401, "Invalid refresh token");
        }

        // Check if refresh token matches stored token
        if (incomingRefreshToken !== user?.refreshToken) {
            throw new ApiError(401, "Invalid refresh token");
        }

        // Set cookie options
        const options = {
            httpOnly: true,
            secure: process.env.NODE_ENV === "production",
        };

        // Generate new access and refresh tokens
        const { accessToken, refreshToken: newRefreshToken } = await generateAccessAndRefreshToken(user._id);

        // Send response with new tokens
        return res
            .status(200)
            .cookie("accessToken", accessToken, options)
            .cookie("refreshToken", newRefreshToken, options)
            .json(new ApiResponse(
                200,
                { accessToken, refreshToken: newRefreshToken },
                "Access token refreshed successfully"
            ));

    } catch (error) {
        throw new ApiError(500, "Something went wrong while refreshing access token");
    }
});


const changeCurrentPassword = asyncHandler( async (req, res) => {
    const { oldPassword, newPassword } = req.body;

    const user = await User.findById(req.User?._id)

    const isPasswordValid = user.isPasswordCorrect(oldPassword)

    if (!isPasswordValid) {
        throw new ApiError(401, "Incorrect old password")
    }

    user.password = newPassword;

    await user.save({ validateBeforeSave: false});


    return res
    .status(200)
    .json( new ApiResponse(200, {}, "Password changed successfully"));
});

const getCurrentUser = asyncHandler( async (req, res) => {
    return res
    .status(200)
    .json( new ApiResponse(200, req.user, "Current user details"))
});

const updateAccountDetails = asyncHandler( async (req, res) => {
    const { fullname, email} = req.body;

    if (!fullname || !email) {
        throw new ApiError(400, "Full name and email are required")
    }

   const user = await User.findByIdAndUpdate(
        req.user?._id,
        {
            $set: {
                fullname,
                email: email
            }
        },
        { new: true }
    ).select("-password -refreshToken")

    return res.status(200)
    .json( new ApiResponse(200, user, "Account details updated successfully"))
});

const updateUserAvatar = asyncHandler( async (req, res) => {
    const avatarLocalPath = req.file?.path; 

    if(!avatarLocalPath) {
        throw new ApiError(400, "File is required")
    }

    const avatar = await uploadOnCloudinary(avatarLocalPath)

    if(!avatar.url) {
        throw new ApiError(500, "Failed to upload avatar")
    }

   const user = await User.findByIdAndUpdate(
        req.user?._id,
        {
            $set: {
                avatar: avatar.url
            }
        },
        {new: true}
    ).select('-password -refreshToken');

    res.status(200)
    .json( new ApiResponse(200, user, "Avatar updated successfully"))

});

const updateUserCoverImage = asyncHandler( async (req, res) => {    
    const coverLocalPath = req.file?.path; 

    if(!coverLocalPath) {
        throw new ApiError(400, "File is required")
    }

    const coverImage = await uploadOnCloudinary(coverLocalPath)

    if(!coverLocalPath.url) {
        throw new ApiError(500, "Failed to upload coverImage")
    }

   const user = await User.findByIdAndUpdate(
        req.user?._id,
        {
            $set: {
                coverImage: coverImage.url
            }
        },
        {new: true}
    ).select('-password -refreshToken');

    res.status(200)
    .json( new ApiResponse(200, user, "cover Image updated successfully"))
});


export {
    registerUser,
    loginUser,
    refreshAccessToken,
    logoutUser,
    changeCurrentPassword,
    getCurrentUser,
    updateAccountDetails,
    updateUserAvatar,
    updateUserCoverImage,
};
