import { randomUUID } from "node:crypto";

export const createSlug = (title: string): string => {
    const baseSlug = title
        .toLowerCase()
        .trim()
        .replace(/[^a-z0-9\s-]/g, "")
        .replace(/\s+/g, "-")
        .replace(/-+/g, "-")
        .replace(/^-+|-+$/g, "");

    const id = randomUUID();

    return `${baseSlug}-${id}`;
};

export const calculateReadingTime = (htmlString: string, wordsPerMinute: number = 225): number => {
    if (!htmlString || typeof htmlString !== "string") return 1;

    const noScripts = htmlString
        .replace(/<script[^>]*>[\s\S]*?<\/script>/gi, "")
        .replace(/<style[^>]*>[\s\S]*?<\/style>/gi, "");
    const textOnly = noScripts.replace(/<[^>]*>/g, " ");

    const decodeHTML = (str: string) => {
        if (typeof window === "undefined") return str;
        const txt = document.createElement("textarea");
        txt.innerHTML = str;
        return txt.value;
    };

    const decoded = decodeHTML(textOnly);

    const words = decoded.match(/\b[\w']+\b/g) || [];
    const wordCount = words.length;

    const imageCount = (htmlString.match(/<img\b/gi) || []).length;
    if (wordCount === 0 && imageCount === 0) return 1;

    const textMinutes = wordCount / wordsPerMinute;
    const imageMinutes = (imageCount * 12) / 60;

    return Math.ceil(textMinutes + imageMinutes) || 1;
};