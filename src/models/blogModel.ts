import { pool } from "../config/db.js";

export interface BlogData {
    id: number;
    authorid: number;
    title: string;
    slug: string;
    excerpt: string;
    coverimage: string;
    contenthtml: string;
    status: string;
    isprivate: boolean;
    readingtime: number;
    userviews: number;
    createdtime: string;
    updatedtime: string;
    publishedtime: string;
}

interface CreateBlogData {
    authorid: number;
    title: string;
    slug: string;
    excerpt: string;
}

export interface CreateResult {
    id: number;
    slug: string;
}

interface UpdateBlogData {
    title: string;
    slug: string;
    excerpt: string;
    coverimage: string | undefined;
    contenthtml: string;
    isprivate: boolean;
    readingtime: number;
}

interface GetMyBlogFilter {
    search?: string | undefined;
    status?: string | undefined;
    isprivate?: boolean | undefined;
    sort?: string;
}

interface GetPublicBlogFilter {
    search?: string | undefined;
    sort?: string;
}


const _performUpdate = async (slugId: string, updateBlogData: UpdateBlogData, isPublishing: boolean) => {
    const { title, slug, excerpt, coverimage, contenthtml, isprivate, readingtime } = updateBlogData;

    const query = `
        UPDATE blogs 
        SET 
            title = $1, slug = $2, excerpt = $3, coverimage = $4, 
            contenthtml = $5, isprivate = $6, readingtime = $7,
            updatedtime = CURRENT_TIMESTAMP
            ${isPublishing ? `, status = 'published', publishedtime = CURRENT_TIMESTAMP` : ''}
        WHERE slug = $8
        RETURNING *
    `;

    const values = [title, slug, excerpt, coverimage, contenthtml, isprivate, readingtime, slugId];
    const result = await pool.query(query, values);
    return result.rows[0] as BlogData;
}

export const getBlogDataBySlug = async (slug: string): Promise<BlogData> => {
    const result = await pool.query(`SELECT * FROM blogs WHERE slug = $1`, [slug]);
    return result.rows[0];
}

export const createBlog = async (createBlogData: CreateBlogData): Promise<CreateResult> => {
    const { authorid, title, slug, excerpt } = createBlogData;
    const result = await pool.query(
        `INSERT INTO blogs (authorid, title, slug, excerpt) VALUES ($1, $2, $3, $4) RETURNING id, slug`,
        [authorid, title, slug, excerpt]
    );
    return result.rows[0];
}

export const updateCoverImage = async (slug: string, coverimage: string): Promise<void> => {
    await pool.query(`UPDATE blogs SET coverimage = $1 WHERE slug = $2`, [coverimage, slug]);
}

export const updateBlogData = async (slugId: string, updateBlogData: UpdateBlogData) => {
    return _performUpdate(slugId, updateBlogData, false);
}

export const publishBlog = async (slugId: string, updateBlogData: UpdateBlogData) => {
    return _performUpdate(slugId, updateBlogData, true);
}

export const deleteBlog = async (slugId: string) => {
    const result = await pool.query(`DELETE FROM blogs WHERE slug = $1`, [slugId]);
    return result.rowCount;
}

export const getMyBlogs = async (userId: number, filterData: GetMyBlogFilter): Promise<BlogData[]> => {
    const { search, status, isprivate, sort } = filterData;

    let query = `SELECT * FROM blogs WHERE authorid = $1`;
    const values: (string | number | boolean)[] = [userId];
    let paramCount = 1;

    if (search) {
        paramCount++;
        query += ` AND title ILIKE $${paramCount}`;
        values.push(`%${search}%`);
    }

    if (status) {
        paramCount++;
        query += ` AND status = $${paramCount}`;
        values.push(status);
    }

    if (typeof isprivate === "boolean") {
        paramCount++;
        query += ` AND isprivate = $${paramCount}`;
        values.push(isprivate);
    }

    const sortOrder = sort?.toUpperCase() === "ASC" ? "ASC" : "DESC";
    query += ` ORDER BY updatedtime ${sortOrder}`;

    const result = await pool.query(query, values);
    return result.rows;

}

export const getPublicBlogs = async (userId: number, filterData: GetPublicBlogFilter): Promise<any[]> => {
    const { search, sort } = filterData;

    let query = `
        SELECT 
            b.id, b.title, b.slug, b.excerpt, b.coverimage, b.readingtime, b.updatedtime, b.publishedtime,
            u.name AS authorname, 
            u.profileurl AS authorimage
        FROM blogs b
        JOIN users u ON b.authorid = u.id
        WHERE b.authorid <> $1 
          AND b.isprivate = false 
          AND b.status = 'published'`;

    const values: (string | number)[] = [userId];
    let paramCount = 1;

    if (search) {
        paramCount++;
        query += ` AND b.title ILIKE $${paramCount}`;
        values.push(`%${search}%`);
    }

    const sortOrder = sort?.toUpperCase() === "ASC" ? "ASC" : "DESC";
    query += ` ORDER BY b.updatedtime ${sortOrder}`;

    const result = await pool.query(query, values);
    return result.rows;
};