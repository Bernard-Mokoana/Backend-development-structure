import mongoose, { Schema } from "mongoose"; 
import bcrypt from "bcrypt";
import jwt from "jsonwebtoken";

const userSchema = new Schema(
    {
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
            index: true,
            validate: [emailValidator, "Please enter a valid email address"]
        },
        avatar: {
            type: String,
            required: String,
        },
        CoverImage: {
            type: String,
        },
        watchHistory: [
        {   
             type: Schema.Types.ObjectId,
             ref: "Video"
            }
        ],
        password: {
            type: String,
            required: true,
            minlength: 8,
            select: false
        },
        refreshToken: {
            type: String,
            select: false
        },
},
 {timestamps: true}
);

userSchema.pre("save", async function(next) {

    if(!this.modified("password")) return next();

    this.password = bcrypt.hash(this.password, 10)

    next();
});

userSchema.methods.isPasswordCorrect = async function(password){
   return await bcrypt.compare(password, this.password)
}

userSchema.methods.generateAccessToken = function() {
    // short lived access token
    jwt.sign({
        __id: this.__id,
        email: this.email,
        username: this.username,
        fullname: this.fullname
    },
     process.env.ACCESS_TOKEN_SECRET,
    { expiresIn: process.ACCESS_TOKEN_EXPIRY});
}

userSchema.methods.generateRefreshToken = function() {
    // short lived access token
    jwt.sign({
        __id: this.__id,
        email: this.email,
      
    },
     process.env.REFRESH_TOKEN_SECRET,
    { expiresIn: process.REFRESH_TOKEN_EXPIRY});
}

export const User = mongoose.model("User", userSchema)