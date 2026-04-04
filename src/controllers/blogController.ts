import { Request, Response } from 'express';
import * as blogService from '../services/blogService.js';

export const uploadBlogImage = async (req: Request, res: Response) => {
    const { id } = (req.session as any).user;
    const image = req.file;
    const blogData = req.body;
    const blogId = blogData?.slugId;

    const response = await blogService.processImageUpload(id, blogId, image);

    res.status(200).json(response);
};

export const createBlog = async (req: Request, res: Response) => {
    const blogData = req.body;
    const imageFile = req.file;
    const { id } = (req.session as any).user;

    const response = await blogService.createBlog(id, blogData, imageFile);
    res.status(201).json(response);
};

export const getBlogData = async (req: Request, res: Response) => {
    const { blogId } = req.params;
    const { id: userId } = (req.session as any).user;

    const response = await blogService.getBlogData(userId, (blogId || "") as string);
    res.status(200).json(response);
}

export const updateBlogData = async (req: Request, res: Response) => {
    const blogData = req.body;
    const imageFile = req.file;
    const { id } = (req.session as any).user;

    const response = await blogService.updateBlogData(id, blogData, imageFile);
    res.status(200).json(response);
}


export const publishBlog = async (req: Request, res: Response) => {
    const blogData = req.body;
    const imageFile = req.file;
    const { id } = (req.session as any).user;

    const response = await blogService.publishBlog(id, blogData, imageFile);
    res.status(200).json(response);
}

export const deleteBlog = async (req: Request, res: Response) => {
    const { blogId } = req.params;
    const { id: userId } = (req.session as any).user;

    const response = await blogService.deleteBlog(userId, (blogId || "") as string);
    res.status(200).json(response);
};

export const getMyBlogs = async (req: Request, res: Response) => {
    const { id: userId } = (req.session as any).user;
    const queryData = req.query;

    const response = await blogService.getMyBlogs(userId, queryData as any);
    res.status(200).json(response);
}

export const getPublicBlogs = async (req: Request, res: Response) => {
    const { id: userId } = (req.session as any).user;
    const queryData = req.query;

    const response = await blogService.getPublicBlogs(userId, queryData as any);
    res.status(200).json(response);
}