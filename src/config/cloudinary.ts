import dotenv from 'dotenv';
import { v2 as cloudinary, UploadApiResponse, UploadApiOptions } from 'cloudinary';
import streamifier from 'streamifier';

dotenv.config();

const { CLOUDINARY_CLOUD_NAME, CLOUDINARY_API_KEY, CLOUDINARY_API_SECRET } = process.env;

if (!CLOUDINARY_CLOUD_NAME || !CLOUDINARY_API_KEY || !CLOUDINARY_API_SECRET) {
    throw new Error('Cloudinary configuration is missing in environment variables.');
}

cloudinary.config({
    cloud_name: CLOUDINARY_CLOUD_NAME,
    api_key: CLOUDINARY_API_KEY,
    api_secret: CLOUDINARY_API_SECRET,
});

const streamUpload = (fileBuffer: Buffer, options: UploadApiOptions): Promise<UploadApiResponse> => {
    return new Promise((resolve, reject) => {
        const stream = cloudinary.uploader.upload_stream(options, (error, result) => {
            if (result) resolve(result);
            else reject(error);
        });

        streamifier.createReadStream(fileBuffer).pipe(stream);
    });
};

export const uploadToCloudinary = (fileBuffer: Buffer, folder: string): Promise<UploadApiResponse> => {
    return streamUpload(fileBuffer, { folder, resource_type: 'auto' });
};

export const uploadProfileImgToCloudinary = async (fileBuffer: Buffer): Promise<string> => {
    const result = await streamUpload(fileBuffer, { folder: "UserProfiles" });
    return result.secure_url;
};

export const deleteImageFromCloudinary = async (publicId: string): Promise<void> => {
    try {
        await cloudinary.uploader.destroy(publicId);
    } catch (error) {
        console.error(`Failed to delete Cloudinary asset: ${publicId}`, error);
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
        return result;
    } catch (error) {
        console.error("Error deleting Cloudinary folder:", error);
    }
};