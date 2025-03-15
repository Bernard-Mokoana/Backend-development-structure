import mongoose, { Schema } from "mongoose"; 
import bcrypt from "bcrypt";
import jwt from "jsonwebtoken";
import dotenv from "dotenv";

dotenv.config({
    path: "./.env"
})

// Define the user schema with required fields
const userSchema = new Schema(
    {
        fullName: {
            type: String,
            required: true,
            trim: true
        },
        username: {
            type: String, 
            required: true, 
            unique: true,   
            lowercase: true,
            trim: true      
        },
        email: {
            type: String, 
            required: true, 
            unique: true,   
            trim: true,      
            index: true,     // Improve query performance

        // validate: {
       //  validator: function (v) {
        // return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(v); simple email regex 
       //},
       // message: props => `${props.value} is not a valid email address!`
      // } 
         },
        avatar: {
            type: String,
            // default: "https://example.com/default-avatar.png",
        },
        coverImage: {  
            type: String,   
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
            minlength: [8, "Password must be at least 8 characters long"],    // Minimum password length
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
    if (!this.isModified("password")) return next();
    try{ // Skip hashing if password is not modified
    this.password = await bcrypt.hash(this.password, 10); // Hash password with salt rounds
    next();
    } catch(error){
        next(error)
    }
});

// Method to check if the entered password is correct
userSchema.methods.isPasswordCorrect = async function(password) {
    try{
    return await bcrypt.compare(password, this.password);
    } catch(error) {
        throw new Error("Error comparing passwords");
    }
};

// Method to generate an access token for authentication
userSchema.methods.generateAccessToken = function() {
    if(!process.env.ACCESS_TOKEN_SECRET || !process.env.ACCESS_TOKEN_EXPIRY) {
        throw new Error("Access token secret or expiry not configured");
    }
    return jwt.sign(
        {
            _id: this._id, // User ID
            email: this.email,
            username: this.username,
            fullname: this.fullname
        },
        process.env.ACCESS_TOKEN_SECRET, 
        { expiresIn: process.env.ACCESS_TOKEN_EXPIRY } 
    );
};

// Method to generate a refresh token for re-authentication
userSchema.methods.generateRefreshToken = function() {
    if(!process.env.REFRESH_TOKEN_SECRET || !process.env.REFRESH_TOKEN_EXPIRY){
        throw new Error("Refresh token secret or expiry not configured")
    }
    return jwt.sign(
        {
            _id: this._id,
        },
        process.env.REFRESH_TOKEN_SECRET, 
        { expiresIn: process.env.REFRESH_TOKEN_EXPIRY } 
    );
};


// Export the User model using the defined schema
export const User = mongoose.model("User", userSchema);
