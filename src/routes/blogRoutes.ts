import { Router } from "express";
import multer from 'multer';
import { createBlog, updateBlogData, uploadBlogImage, getBlogData, publishBlog, deleteBlog, getMyBlogs, getPublicBlogs } from "../controllers/blogController.js";

const storage = multer.memoryStorage();

const upload = multer({
    storage: storage,
    limits: { fileSize: 5 * 1024 * 1024 }
});

export const blogRouter = Router();

blogRouter.post("/image", upload.single('image'), uploadBlogImage);
blogRouter.post("/create", upload.single('image'), createBlog);
blogRouter.patch("/update", upload.single('image'), updateBlogData);
blogRouter.patch("/publish", upload.single('image'), publishBlog);
blogRouter.get("/blog/:blogId", getBlogData);
blogRouter.delete("/blog/:blogId", deleteBlog);
blogRouter.get("/myblogs", getMyBlogs);
blogRouter.get("/publicblogs", getPublicBlogs);

export default blogRouter;