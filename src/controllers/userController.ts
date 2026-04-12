import { Request, Response, NextFunction } from "express";
import * as userService from "../services/userService.js";
import { clearRefreshToken, deleteOtherSessions, updateUserIdToSession } from "../models/userModel.js";

const getOrigin = (req: Request): string => {
    const referer = req.get('referer');
    const origin = req.get('origin');
    if (origin) return origin;
    if (referer) return new URL(referer).origin;
    return "";
};

export const signupUser = async (req: Request, res: Response, next: NextFunction) => {
    try {
        const response = await userService.signUp(req.body, getOrigin(req));
        res.status(201).json(response);
    } catch (error) {
        next(error);
    }
};

export const verifyUser = async (req: Request, res: Response, next: NextFunction) => {
    try {
        const { token } = req.params;
        const response = await userService.verifyEmail(token as string);
        res.status(200).json(response);
    } catch (error) {
        next(error);
    }
};

export const loginUser = async (req: Request, res: Response, next: NextFunction) => {
    try {
        const response = await userService.loginUser(req.body);
        if (!req.session) throw new Error("Session initialization failed");

        (req.session as any).user = response.sessionData;

        res.cookie('rToken', response.refreshToken.token, {
            httpOnly: true,
            maxAge: 7 * 24 * 60 * 60 * 1000,
            sameSite: 'none',
            secure: true
        });

        req.session.save(async (err) => {
            if (err) return res.status(500).json({ message: "Session initialization failed" });
            await updateUserIdToSession(response.sessionData.id, req.sessionID);
            res.status(200).json({ message: response.message });
        });
    } catch (error) {
        next(error);
    }
};

export const logoutUser = async (req: Request, res: Response, next: NextFunction) => {
    try {
        const { rToken } = req.cookies;
        const userId = (req.session as any).user?.id;

        if (rToken) await clearRefreshToken(rToken);

        if (req.body?.logoutOthers && userId) {
            await deleteOtherSessions(userId, req.sessionID, rToken);
        }

        req.session.destroy((err) => {
            if (err) return next(err);

            res.clearCookie("connect.sid");
            res.clearCookie("rToken");
            res.status(200).json({ message: "User logged out successfully." });
        });
    } catch (error) {
        next(error);
    }
};

export const changeUserPassword = async (req: Request, res: Response, next: NextFunction) => {
    try {
        const { id } = (req.session as any).user;
        const response = await userService.changeUserPassword(req.body, id);

        if (req.body?.logoutOthers && response.message === "User password updated successfully.") {
            await deleteOtherSessions(id, req.sessionID, req.cookies.rToken);
        }

        res.status(200).json(response);
    } catch (error) {
        next(error);
    }
};

export const forgotPassword = async (req: Request, res: Response, next: NextFunction) => {
    try {
        const response = await userService.forgotPassword(req.body, getOrigin(req));

        res.clearCookie("connect.sid");
        res.clearCookie("rToken");
        res.status(200).json(response);
    } catch (error) {
        next(error);
    }
};

export const resetPassword = async (req: Request, res: Response, next: NextFunction) => {
    try {
        const response = await userService.resetPassword(req.body);

        res.clearCookie("connect.sid");
        res.clearCookie("rToken");
        res.status(200).json(response);
    } catch (error) {
        next(error);
    }
};

export const getUser = async (req: Request, res: Response, next: NextFunction) => {
    try {
        const { id } = (req.session as any).user;
        const response = await userService.getUser(id);
        res.status(200).json(response);
    } catch (error) {
        next(error);
    }
};

export const updateProfile = async (req: Request, res: Response, next: NextFunction) => {
    try {
        const { id } = (req.session as any).user;
        const response = await userService.updateUser(id, req.body, req.file);
        res.status(200).json(response);
    } catch (error) {
        next(error);
    }
};