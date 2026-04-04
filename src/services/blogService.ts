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
}

export const processImageUpload = async (userId: number, slugId: string, file?: Express.Multer.File) => {

    if (!userId || !slugId || !file) {
        const error = new Error("Invalid data");
        (error as any).statusCode = 400;
        throw error;
    }
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

    const folderPath = `blogImages/${existingBlogData.id}`;

    const result = await uploadToCloudinary(file.buffer, folderPath);

    return {
        url: result.secure_url,
        publicId: result.public_id
    };
};

export const createBlog = async (id: number, blogData: CreateBlogData, imageFile?: Express.Multer.File) => {
    const { title, excerpt } = blogData;

    if (!title || !excerpt) {
        const error = new Error("Invalid data");
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
        const error = new Error("Invalid data");
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
        message: "Blog data retrieved successfully",
        blogData
    };

}

export const updateBlogData = async (userId: number, blogData: UpdateBlogData, imageFile?: Express.Multer.File | undefined) => {
    const { slug, title, excerpt, contenthtml, isprivate } = blogData;
    if (!slug) {
        const error = new Error("Invalid data");
        (error as any).statusCode = 400;
        throw error;
    };

    const existingBlogData = await blogModel.getBlogDataBySlug(slug);
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

    const newSlug = title && existingBlogData.status !== "published" ? createSlug(title) : existingBlogData.slug;
    const newReadingTime = contenthtml ? calculateReadingTime(contenthtml) : existingBlogData.readingtime;
    let newCoverImage = "";
    if (imageFile) {
        const folderPath = `blogImages/${existingBlogData.id}`;
        const result = await uploadToCloudinary(imageFile.buffer, folderPath);
        newCoverImage = result.secure_url;
        if (existingBlogData.coverimage && newCoverImage) {
            const publicId = extractPublicIdFromUrl(existingBlogData.coverimage);
            await deleteImageFromCloudinary(publicId);
        }
    };
    const finalIsPrivate = (isprivate !== undefined && isprivate !== null)
        ? isprivate === 'true'
        : existingBlogData.isprivate;

    const updateData = {
        title: title || existingBlogData.title,
        slug: newSlug,
        excerpt: excerpt ?? existingBlogData.excerpt,
        coverimage: newCoverImage || existingBlogData.coverimage,
        contenthtml: contenthtml ?? existingBlogData.contenthtml,
        isprivate: finalIsPrivate,
        readingtime: newReadingTime,
    };

    const data = await blogModel.updateBlogData(slug, updateData);
    if (!data) {
        const error = new Error("Updating blog content failed.");
        (error as any).statusCode = 500;
        throw error;
    }
    return {
        message: "Blog data updated successfully",
        data
    }
};


export const publishBlog = async (userId: number, blogData: UpdateBlogData, imageFile?: Express.Multer.File | undefined) => {
    const { slug, title, excerpt, contenthtml, isprivate } = blogData;
    if (!slug) {
        const error = new Error("Invalid data");
        (error as any).statusCode = 400;
        throw error;
    };

    const existingBlogData = await blogModel.getBlogDataBySlug(slug);
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

    const newSlug = title && existingBlogData.status !== "published" ? createSlug(title) : existingBlogData.slug;
    const newReadingTime = contenthtml ? calculateReadingTime(contenthtml) : existingBlogData.readingtime;
    let newCoverImage = "";
    if (imageFile) {
        const folderPath = `blogImages/${existingBlogData.id}`;
        const result = await uploadToCloudinary(imageFile.buffer, folderPath);
        newCoverImage = result.secure_url;
        if (existingBlogData.coverimage && newCoverImage) {
            const publicId = extractPublicIdFromUrl(existingBlogData.coverimage);
            await deleteImageFromCloudinary(publicId);
        }
    };
    const finalIsPrivate = (isprivate !== undefined && isprivate !== null)
        ? isprivate === 'true'
        : existingBlogData.isprivate;
    const updateData = {
        title: title || existingBlogData.title,
        slug: newSlug,
        excerpt: excerpt ?? existingBlogData.excerpt,
        coverimage: newCoverImage || existingBlogData.coverimage,
        contenthtml: contenthtml ?? existingBlogData.contenthtml,
        isprivate: finalIsPrivate,
        readingtime: newReadingTime,
    };

    const data = await blogModel.publishBlog(slug, updateData);
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
        const error = new Error("Invalid data");
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
        message: "Blog has been deleted"
    }
}

export const getMyBlogs = async (userId: number, queryData: any) => {
    if (!userId) {
        const error = new Error("Invalid data");
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
        message: "Data retrieved successfully",
        data
    }
}

export const getPublicBlogs = async (userId: number, queryData: any) => {
    if (!userId) {
        const error = new Error("Invalid data");
        (error as any).statusCode = 400;
        throw error;
    }

    const filterData = {
        search: (queryData.search as string)?.trim() || undefined,
        sort: (queryData.sort as string)?.toUpperCase() === 'ASC' ? 'ASC' : 'DESC'
    };

    const data = await blogModel.getPublicBlogs(userId, filterData);

    return {
        message: "Data retrieved successfully",
        data
    }
}