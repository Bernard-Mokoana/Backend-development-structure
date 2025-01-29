import { v2 as cloudinary } from 'cloudinary';
import fs from "fs";

// Configure Cloudinary
cloudinary.config({ 
    cloud_name: 'dvn7dosgg',
    api_key: "155895361615844",
    api_secret: 'ah1mj4wqqhLrnGRXlJsfEXiELn4',
});

// Upload File to Cloudinary
const uploadOnCloudinary = async (localFilePath) => {
    try {
        if (!localFilePath) {
            console.error("❌ No file path provided for Cloudinary upload.");
            return null;
        }

        console.log("⏳ Uploading file to Cloudinary:", localFilePath);

        const resource = await cloudinary.uploader.upload(localFilePath, {
            resource_type: "auto"
        });

        console.log("✅ File uploaded to Cloudinary:", resource.url);

        // Delete file from local storage after uploading
        fs.unlinkSync(localFilePath);

        return resource;
    } catch (error) {
        console.error("❌ Cloudinary Upload Error:", error);

        // Delete file from local storage if upload fails
        if (fs.existsSync(localFilePath)) {
            fs.unlinkSync(localFilePath);
        }
        
        return null;
    }
};

// Delete File from Cloudinary
const deleteFromCloudinary = async (publicId) => {
    try {
        if (!publicId) {
            console.error("❌ No public ID provided for deletion.");
            return null;
        }

        console.log("⏳ Deleting file from Cloudinary:", publicId);

        const result = await cloudinary.uploader.destroy(publicId);

        console.log("✅ Cloudinary Deletion Successful:", result);
        return result;
    } catch (error) {
        console.error("❌ Cloudinary Deletion Error:", error);
        return null;
    }
};

export { uploadOnCloudinary, deleteFromCloudinary };
