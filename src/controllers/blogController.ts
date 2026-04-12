import { Request, Response, NextFunction } from 'express';
import * as blogService from '../services/blogService.js';

export const uploadBlogImage = async (req: Request, res: Response, next: NextFunction) => {
    try {
        const { id: userId } = (req.session as any).user;
        const { slugId } = req.body;
        const image = req.file;

        const response = await blogService.processImageUpload(userId, slugId, image);
        res.status(200).json(response);
    } catch (error) {
        next(error);
    }
};

export const createBlog = async (req: Request, res: Response, next: NextFunction) => {
    try {
        const { id: userId } = (req.session as any).user;

        const response = await blogService.createBlog(userId, req.body, req.file);
        res.status(201).json(response);
    } catch (error) {
        next(error);
    }
};

export const getBlogData = async (req: Request, res: Response, next: NextFunction) => {
    try {
        const { blogId } = req.params;
        const { id: userId } = (req.session as any).user;

        const response = await blogService.getBlogData(userId, (blogId || "") as string);
        res.status(200).json(response);
    } catch (error) {
        next(error);
    }
};

export const updateBlogData = async (req: Request, res: Response, next: NextFunction) => {
    try {
        const { id: userId } = (req.session as any).user;

        const response = await blogService.updateBlogData(userId, req.body, req.file);
        res.status(200).json(response);
    } catch (error) {
        next(error);
    }
};

export const publishBlog = async (req: Request, res: Response, next: NextFunction) => {
    try {
        const { id: userId } = (req.session as any).user;

        const response = await blogService.publishBlog(userId, req.body, req.file);
        res.status(200).json(response);
    } catch (error) {
        next(error);
    }
};

export const deleteBlog = async (req: Request, res: Response, next: NextFunction) => {
    try {
        const { blogId } = req.params;
        const { id: userId } = (req.session as any).user;

        const response = await blogService.deleteBlog(userId, (blogId || "") as string);
        res.status(200).json(response);
    } catch (error) {
        next(error);
    }
};

export const getMyBlogs = async (req: Request, res: Response, next: NextFunction) => {
    try {
        const { id: userId } = (req.session as any).user;

        const response = await blogService.getMyBlogs(userId, req.query as any);
        res.status(200).json(response);
    } catch (error) {
        next(error);
    }
};

export const getPublicBlogs = async (req: Request, res: Response, next: NextFunction) => {
    try {
        const { id: userId } = (req.session as any).user;

        const response = await blogService.getPublicBlogs(userId, req.query as any);
        res.status(200).json(response);
    } catch (error) {
        next(error);
    }
};