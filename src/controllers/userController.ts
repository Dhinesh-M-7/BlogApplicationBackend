import { Request, Response } from "express";
import * as userService from "../services/userService.js";
import { clearRefreshToken, deleteOtherSessions, updateUserIdToSession } from "../models/userModel.js";

export const signupUser = async (req: Request, res: Response) => {
    const userData = req.body;

    const referer = req.get('referer') || '';
    const origin = req.get('origin') || new URL(referer).origin;

    const response = await userService.signUp(userData, origin);
    res.status(201).json(response);
}

export const verifyUser = async (req: Request, res: Response) => {
    const { token } = req.params;
    const response = await userService.verifyEmail(token as string);
    res.status(200).json(response);
}

export const loginUser = async (req: Request, res: Response) => {
    const userData = req.body;
    const response = await userService.loginUser(userData);
    if (!req.session) {
        throw new Error("Session initialization failed");
    }
    (req.session as any).user = response.sessionData;
    res.cookie('rToken', response.refreshToken.token, {
        httpOnly: true,
        maxAge: 7 * 24 * 60 * 60 * 1000
    });

    req.session.save(async (err) => {
        if (err) return res.status(500).json({ message: "Session initialization failed" });
        await updateUserIdToSession(response.sessionData.id, req.sessionID);
    })
    res.status(200).json({ message: response.message });
}

export const logoutUser = async (req: Request, res: Response) => {
    const { rToken } = req.cookies;

    if (rToken) await clearRefreshToken(rToken);

    const data = req.body;
    if (data && data.logoutOthers) {
        await deleteOtherSessions((req.session as any).user.id, req.sessionID, rToken);
    }

    req.session.destroy((err) => {
        if (err) console.error(err);

        res.clearCookie("connect.sid");
        res.clearCookie("rToken");

        return res.status(200).json({ message: "User logged out successfully" });
    })

}

export const changeUserPassword = async (req: Request, res: Response) => {
    const userData = req.body;
    const { id } = (req.session as any).user;
    const response = await userService.changeUserPassword(userData, id);

    if (userData?.logoutOthers && response.message === "User password updated successfully") {
        await deleteOtherSessions((req.session as any).user.id, req.sessionID, req.cookies.rToken);
    }

    res.status(200).json(response);
}

export const forgotPassword = async (req: Request, res: Response) => {
    const userData = req.body;

    const referer = req.get('referer') || '';
    const origin = req.get('origin') || new URL(referer).origin;

    const response = await userService.forgotPassword(userData, origin);
    res.status(200).json(response);
}

export const resetPassword = async (req: Request, res: Response) => {
    const userData = req.body;
    const response = await userService.resetPassword(userData);
    res.status(200).json(response);
}

export const getUser = async (req: Request, res: Response) => {
    const { id } = (req.session as any).user;
    const response = await userService.getUser(id);
    res.status(200).json(response);
};