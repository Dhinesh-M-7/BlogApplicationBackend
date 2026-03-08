import dotenv from 'dotenv';
dotenv.config();

import { v2 as cloudinary } from 'cloudinary';

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

export const deleteImageFromCloudinary = async (publicId: string) => {
    try {
        await cloudinary.uploader.destroy(publicId);
    } catch (error) {
        console.error(error);
    }
};

export const extractPublicIdFromUrl = (url: string) => {
    const parts = url.split('/');
    const fileName = parts.pop() || "";
    const folder = parts.pop() || "";
    const publicId = `${folder}/${fileName.split('.')[0]}`;
    return publicId;
}