import dotenv from 'dotenv';
dotenv.config();

import { v2 as cloudinary, UploadApiResponse } from 'cloudinary';
import streamifier from 'streamifier';

cloudinary.config({
    cloud_name: process.env.CLOUDINARY_CLOUD_NAME as string,
    api_key: process.env.CLOUDINARY_API_KEY as string,
    api_secret: process.env.CLOUDINARY_API_SECRET as string,
});

export const uploadProfileImgToCloudinary = async (fileBuffer: Buffer): Promise<string> => {
    return new Promise((resolve, reject) => {
        const uploadStream = cloudinary.uploader.upload_stream(
            { folder: "UserProfiles" },
            (error, result) => {
                if (error) return reject(error);
                resolve(result?.secure_url || "");
            }
        );
        uploadStream.end(fileBuffer);
    });
};

export const uploadToCloudinary = (fileBuffer: Buffer, folder: string): Promise<UploadApiResponse> => {
    return new Promise((resolve, reject) => {
        const stream = cloudinary.uploader.upload_stream(
            {
                folder,
                resource_type: 'auto'
            },
            (error, result) => {
                if (result) resolve(result);
                else reject(error);
            }
        );

        streamifier.createReadStream(fileBuffer).pipe(stream);
    });
};

export const deleteImageFromCloudinary = async (publicId: string) => {
    try {
        const result = await cloudinary.uploader.destroy(publicId);
        console.log("Delete result:", result, publicId);
    } catch (error) {
        console.error(error);
    }
};

export const extractPublicIdFromUrl = (url: string): string => {
    try {
        const urlObj = new URL(url);

        const parts = urlObj.pathname.split('/');
        const uploadIndex = parts.findIndex(part => part === 'upload');

        if (uploadIndex === -1) return "";

        let publicIdParts = parts.slice(uploadIndex + 1);

        if (publicIdParts[0]?.startsWith('v')) {
            publicIdParts = publicIdParts.slice(1);
        }

        const fullPath = publicIdParts.join('/');
        const publicId = fullPath.replace(/\.[^/.]+$/, '');

        return publicId;
    } catch {
        return "";
    }
};

export const deleteFolderFromCloudinary = async (folderPath: string) => {
    try {
        await cloudinary.api.delete_resources_by_prefix(`${folderPath}/`);

        const result = await cloudinary.api.delete_folder(folderPath);

        console.log("Folder deleted successfully:", result);
        return result;
    } catch (error) {
        console.error("Error deleting Cloudinary folder:", error);
    }
};