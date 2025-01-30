import mongoose, { Schema } from "mongoose"; 
import bcrypt from "bcrypt";
import jwt from "jsonwebtoken";

// Define the user schema with required fields
const userSchema = new Schema(
    {
        username: {
            type: String, 
            required: true,  // Username is required
            unique: true,    // Must be unique
            lowercase: true, // Store in lowercase
            trim: true       // Remove extra spaces
        },
        email: {
            type: String, 
            required: true,  // Email is required
            unique: true,    // Must be unique
            trim: true,      // Remove extra spaces
            index: true,     // Improve query performance
        },
        avatar: {
            type: String,
            required: true,  // Avatar image is required
        },
        coverImage: {  
            type: String,   // Optional cover image
        },
        watchHistory: [
            {   
                type: Schema.Types.ObjectId, // Stores references to Video documents
                ref: "Video" // Refers to the Video model
            }
        ],
        password: {
            type: String,
            required: true,  // Password is required
            minlength: 8,    // Minimum password length
            select: false    // Do not return password in queries
        },
        refreshToken: {
            type: String,
            select: false    // Hide refresh token from queries
        },
    },
    { timestamps: true } // Automatically add createdAt and updatedAt fields
);

// Pre-save middleware to hash the password before saving it to the database
userSchema.pre("save", async function(next) {
    if (!this.isModified("password")) return next(); // Skip hashing if password is not modified
    this.password = await bcrypt.hash(this.password, 10); // Hash password with salt rounds
    next();
});

// Method to check if the entered password is correct
userSchema.methods.isPasswordCorrect = async function(password) {
    return await bcrypt.compare(password, this.password);
};

// Method to generate an access token for authentication
userSchema.methods.generateAccessToken = function() {
    return jwt.sign(
        {
            _id: this._id, // User ID
            email: this.email,
            username: this.username,
            fullname: this.fullname
        },
        process.env.ACCESS_TOKEN_SECRET, // Secret key from environment variables
        { expiresIn: process.env.ACCESS_TOKEN_EXPIRY } // Token expiry time
    );
};

// Method to generate a refresh token for re-authentication
userSchema.methods.generateRefreshToken = function() {
    return jwt.sign(
        {
            _id: this._id, // User ID
        },
        process.env.REFRESH_TOKEN_SECRET, // Secret key from environment variables
        { expiresIn: process.env.REFRESH_TOKEN_EXPIRY } // Token expiry time
    );
};

// Export the User model using the defined schema
export const User = mongoose.model("User", userSchema);
