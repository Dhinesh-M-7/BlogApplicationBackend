import { deleteFolderFromCloudinary, deleteImageFromCloudinary, extractPublicIdFromUrl, uploadToCloudinary } from "../config/cloudinary.js";
import { calculateReadingTime, createSlug } from "../utils/utils.js";
import * as blogModel from "../models/blogModel.js"

interface CreateBlogData {
    title: string;
    excerpt: string;
}

interface UpdateBlogData {
    slug: string;
    title?: string;
    excerpt?: string;
    contenthtml?: string;
    isprivate?: string;
    removeImage?: string;
}

export const processImageUpload = async (userId: number, slugId: string, file?: Express.Multer.File) => {

    if (!userId || !slugId || !file) {
        const error = new Error("Missing required data.");
        (error as any).statusCode = 400;
        throw error;
    }
    const existingBlogData = await blogModel.getBlogDataBySlug(slugId);
    if (!existingBlogData) {
        const error = new Error("Blog not found.");
        (error as any).statusCode = 404;
        throw error;
    }

    if (existingBlogData.authorid !== userId) {
        const error = new Error("You do not have permission.");
        (error as any).statusCode = 403;
        throw error;
    }

    const folderPath = `blogImages/${existingBlogData.id}`;

    try {
        const result = await uploadToCloudinary(file.buffer, folderPath);

        return {
            url: result.secure_url,
            publicId: result.public_id
        };
    } catch (uploadError) {
        const error = new Error("Failed to upload image to storage.");
        (error as any).statusCode = 500;
        throw error;
    }
};

export const createBlog = async (id: number, blogData: CreateBlogData, imageFile?: Express.Multer.File) => {
    const { title, excerpt } = blogData;

    if (!title || !excerpt) {
        const error = new Error("Missing required fields.");
        (error as any).statusCode = 400;
        throw error;
    }

    const slug = createSlug(title);

    const initialData = {
        authorid: id,
        title,
        slug,
        excerpt
    };

    const newBlog = await blogModel.createBlog(initialData);

    if (!newBlog || !newBlog.id) {
        const error = new Error("Blog creation failed!");
        (error as any).statusCode = 500;
        throw error;
    }

    const blogId = newBlog.id;

    if (imageFile) {
        const folderPath = `blogImages/${blogId}`;
        const result = await uploadToCloudinary(imageFile.buffer, folderPath);
        const coverimage = result.secure_url;

        await blogModel.updateCoverImage(newBlog.slug, coverimage);
    }

    return {
        message: "Blog created successfully.",
        blogData: newBlog,
    };
};

export const getBlogData = async (userId: number, blogId: string) => {
    if (!userId || !blogId) {
        const error = new Error("Missing required data.");
        (error as any).statusCode = 400;
        throw error;
    }

    const blogData = await blogModel.getBlogDataBySlug(blogId);
    if (!blogData) {
        const error = new Error("Blog not found.");
        (error as any).statusCode = 404;
        throw error;
    }

    if (blogData.isprivate || blogData.status !== "published") {
        if (blogData.authorid !== userId) {
            const error = new Error("You do not have permission.");
            (error as any).statusCode = 403;
            throw error;
        }
    }

    return {
        message: "Blog data retrieved successfully.",
        blogData
    };

}

export const updateBlogData = async (userId: number, blogData: UpdateBlogData, imageFile?: Express.Multer.File) => {
    const { slug, title, excerpt, contenthtml, isprivate, removeImage } = blogData;
    if (!slug) {
        const error = new Error("Missing required data.");
        (error as any).statusCode = 400;
        throw error;
    }

    const existingBlogData = await blogModel.getBlogDataBySlug(slug);
    if (!existingBlogData) {
        const error = new Error("Blog not found.");
        (error as any).statusCode = 404;
        throw error;
    }

    if (existingBlogData.authorid !== userId) {
        const error = new Error("You do not have permission.");
        (error as any).statusCode = 403;
        throw error;
    }

    const newSlug = (title && existingBlogData.status !== "published")
        ? createSlug(title)
        : existingBlogData.slug;

    const newReadingTime = contenthtml
        ? calculateReadingTime(contenthtml)
        : existingBlogData.readingtime;

    const isDeletingImage = removeImage === 'true';
    const isReplacingImage = !!imageFile;
    let finalCoverImage = existingBlogData.coverimage;

    if (existingBlogData.coverimage && (isDeletingImage || isReplacingImage)) {
        try {
            const publicId = extractPublicIdFromUrl(existingBlogData.coverimage);
            await deleteImageFromCloudinary(publicId);
            finalCoverImage = "";
        } catch (err) {
            console.error("Cloudinary cleanup failed:", err);
        }
    }

    const finalIsPrivate = (isprivate !== undefined && isprivate !== null)
        ? isprivate === 'true'
        : existingBlogData.isprivate;

    if (isReplacingImage && imageFile) {
        const folderPath = `blogImages/${existingBlogData.id}`;
        const uploadResult = await uploadToCloudinary(imageFile.buffer, folderPath);
        finalCoverImage = uploadResult.secure_url;
    }

    const updatePayload = {
        title: title || existingBlogData.title,
        slug: newSlug,
        excerpt: excerpt ?? existingBlogData.excerpt,
        coverimage: finalCoverImage,
        contenthtml: contenthtml ?? existingBlogData.contenthtml,
        isprivate: finalIsPrivate,
        readingtime: newReadingTime,
    };

    const updatedBlog = await blogModel.updateBlogData(slug, updatePayload);

    if (!updatedBlog) {
        const error = new Error("Database update failed.");
        (error as any).statusCode = 500;
        throw error;
    }

    return {
        message: "Blog updated successfully.",
        data: updatedBlog
    };
};


export const publishBlog = async (userId: number, blogData: UpdateBlogData, imageFile?: Express.Multer.File) => {
    const { slug, title, excerpt, contenthtml, isprivate, removeImage } = blogData;
    if (!slug) {
        const error = new Error("Blog slug is required for publishing.");
        (error as any).statusCode = 400;
        throw error;
    };

    const existingBlogData = await blogModel.getBlogDataBySlug(slug);
    if (!existingBlogData) {
        const error = new Error("Blog not found.");
        (error as any).statusCode = 404;
        throw error;
    }

    if (existingBlogData.authorid !== userId) {
        const error = new Error("You do not have permission.");
        (error as any).statusCode = 403;
        throw error;
    }

    const isImageRemoved = removeImage === 'true';
    const isImageReplaced = !!imageFile;
    let finalCoverImage = existingBlogData.coverimage;

    const newSlug = (title && existingBlogData.status !== "published")
        ? createSlug(title)
        : existingBlogData.slug;

    const newReadingTime = contenthtml
        ? calculateReadingTime(contenthtml)
        : existingBlogData.readingtime;

    if (existingBlogData.coverimage && (isImageRemoved || isImageReplaced)) {
        try {
            const publicId = extractPublicIdFromUrl(existingBlogData.coverimage);
            await deleteImageFromCloudinary(publicId);
            finalCoverImage = "";
        } catch (err) {
            console.error("Cloudinary cleanup failed during publish:", err);
        }
    }
    const finalIsPrivate = (isprivate !== undefined && isprivate !== null)
        ? isprivate === 'true'
        : existingBlogData.isprivate;

    if (isImageReplaced && imageFile) {
        const folderPath = `blogImages/${existingBlogData.id}`;
        const uploadResult = await uploadToCloudinary(imageFile.buffer, folderPath);
        finalCoverImage = uploadResult.secure_url;
    }

    const updatePayload = {
        title: title || existingBlogData.title,
        slug: newSlug,
        excerpt: excerpt ?? existingBlogData.excerpt,
        coverimage: finalCoverImage,
        contenthtml: contenthtml ?? existingBlogData.contenthtml,
        isprivate: finalIsPrivate,
        readingtime: newReadingTime,
    };

    const data = await blogModel.publishBlog(slug, updatePayload);
    if (!data) {
        const error = new Error("Publishing the blog failed.");
        (error as any).statusCode = 500;
        throw error;
    }
    return {
        message: "Blog published successfully",
        data
    }
};

export const deleteBlog = async (userId: number, slugId: string) => {
    if (!slugId) {
        const error = new Error("Missing required data.");
        (error as any).statusCode = 400;
        throw error;
    };

    const existingBlogData = await blogModel.getBlogDataBySlug(slugId);
    if (!existingBlogData) {
        const error = new Error("Blog not found.");
        (error as any).statusCode = 404;
        throw error;
    };

    if (existingBlogData.authorid !== userId) {
        const error = new Error("You do not have permission.");
        (error as any).statusCode = 403;
        throw error;
    };

    const resultRows = await blogModel.deleteBlog(slugId);
    if (resultRows === 0) {
        const error = new Error("Blog not found.");
        (error as any).statusCode = 404;
        throw error;
    }

    const imageFolderPath = `blogImages/${existingBlogData.id}`;
    await deleteFolderFromCloudinary(imageFolderPath);

    return {
        message: "Blog has been deleted."
    }
}

export const getMyBlogs = async (userId: number, queryData: any) => {
    if (!userId) {
        const error = new Error("Missing required data.");
        (error as any).statusCode = 400;
        throw error;
    }

    const filterData = {
        search: (queryData.search as string)?.trim() || undefined,
        status: (queryData.status as string) || undefined,
        isprivate: queryData.isprivate === 'true' ? true :
            queryData.isprivate === 'false' ? false : undefined,
        sort: (queryData.sort as string)?.toUpperCase() === 'ASC' ? 'ASC' : 'DESC'
    };

    const data = await blogModel.getMyBlogs(userId, filterData);

    return {
        message: "Data retrieved successfully.",
        data
    }
}

export const getPublicBlogs = async (userId: number, queryData: any) => {
    if (!userId) {
        const error = new Error("Missing required data.");
        (error as any).statusCode = 400;
        throw error;
    }

    const filterData = {
        search: (queryData.search as string)?.trim() || undefined,
        sort: (queryData.sort as string)?.toUpperCase() === 'ASC' ? 'ASC' : 'DESC'
    };

    const data = await blogModel.getPublicBlogs(userId, filterData);

    return {
        message: "Data retrieved successfully.",
        data
    }
}