import * as userModel from "../models/userModel.js";
import { sendForgotPasswordMail, sendVerificationMail } from "./emailService.js";
import { decodeToken } from "../utils/jwt.js";
import bcrypt from "bcrypt";

interface Email {
    email: string;
}

interface SignupData {
    name: string;
    email: string;
    password: string;
}

interface LoginData {
    email: string;
    password: string;
}

interface ChangePasswordData {
    oldPassword: string;
    newPassword: string;
    logoutOthers?: boolean;
}

interface ResetPasswordData {
    token: string;
    password: string;
}

export const signUp = async (data: SignupData, origin: string) => {
    if (!data) {
        const error = new Error("Request body is required");
        (error as any).statusCode = 400;
        throw error;
    }

    if (!data.email || !data.name || !data.password) {
        const error = new Error("Expected fields are missing");
        (error as any).statusCode = 400;
        throw error;
    }

    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(data.email)) {
        const error = new Error("Invalid email format");
        (error as any).statusCode = 400;
        throw error;
    }

    data.password = await bcrypt.hash(data.password, 12);

    const user = await userModel.getUserUsingEmail(data.email);
    if (user && user.isvalidated) {
        const error = new Error("User already exists");
        (error as any).statusCode = 400;
        throw error;
    }

    if (user && !user.isvalidated) {
        sendVerificationMail(data.email, origin);
        return {
            message: "User created successfully",
            user
        };
    }

    if (!user) {
        const userData = await userModel.createUser(data);
        if (!userData) {
            const error = new Error("User creation failed");
            (error as any).statusCode = 500;
            throw error;
        }
        sendVerificationMail(data.email, origin);

        return {
            message: "User created successfully",
            userData
        };
    }
};

export const verifyEmail = async (token: string) => {
    const tokenData: any = decodeToken(token);
    if (!tokenData || !tokenData?.email) {
        const error = new Error("The token is invalid or has expired. Please request a new one.");
        (error as any).statusCode = 400;
        throw error;
    }

    const email = tokenData.email;
    const user = await userModel.getUserUsingEmail(email);
    if (user && user.isvalidated) {
        const error = new Error("Account already verified");
        (error as any).statusCode = 400;
        throw error;
    }

    if (user && !user.isvalidated) {
        const userData = await userModel.verifyUser(email);
        return {
            message: "User email verified successfully",
            userData
        };
    }

};

export const loginUser = async (data: LoginData) => {
    if (!data) {
        const error = new Error("Request body is required");
        (error as any).statusCode = 400;
        throw error;
    }

    if (!data.email || !data.password) {
        const error = new Error("Email and password are required");
        (error as any).statusCode = 400;
        throw error;
    }

    const userData = await userModel.getUserUsingEmail(data.email);

    const isPasswordValid = userData
        ? await bcrypt.compare(data.password, userData.password)
        : false;

    if (!userData || !isPasswordValid) {
        const error = new Error("Invalid email or password");
        (error as any).statusCode = 401;
        throw error;
    }

    if (!userData.isvalidated) {
        const error = new Error("Please verify the email before logging in");
        (error as any).statusCode = 403;
        throw error;
    }

    const sessionData = { id: userData.id, name: userData.name, email: userData.email }
    const refreshToken = await userModel.createRefreshToken(userData.id);

    return {
        message: "Login Successful",
        sessionData,
        refreshToken
    }
}

export const changeUserPassword = async (data: ChangePasswordData, userId: number) => {
    if (!data) {
        const error = new Error("Request body is required");
        (error as any).statusCode = 400;
        throw error;
    }

    if (!data.newPassword || !data.oldPassword) {
        const error = new Error("Invalid data");
        (error as any).statusCode = 400;
        throw error;
    }

    if (data.newPassword === data.oldPassword) {
        const error = new Error("New password cannot be the same as the old password.");
        (error as any).statusCode = 400;
        throw error;
    }

    const userData = await userModel.getUserUsingId(userId);
    if (!userData) {
        const error = new Error("Invalid data");
        (error as any).statusCode = 400;
        throw error;
    }

    const isOldPasswordCorrect = await bcrypt.compare(data.oldPassword, userData.password);

    if (!isOldPasswordCorrect) {
        const error = new Error("Old password is incorrect");
        (error as any).statusCode = 401;
        throw error;
    } else {

        const password = await bcrypt.hash(data.newPassword, 12);
        await userModel.updatePassword(password, userId);

        return {
            message: "User password updated successfully"
        }
    }
}

export const forgotPassword = async (data: Email, origin: string) => {
    if (!data) {
        const error = new Error("Request body is required");
        (error as any).statusCode = 400;
        throw error;
    }

    if (!data.email) {
        const error = new Error("Email is required");
        (error as any).statusCode = 400;
        throw error;
    }

    const userData = await userModel.getUserUsingEmail(data.email);
    if (!userData) {
        return {
            message: "A reset link has been sent to the email address."
        }
    }

    sendForgotPasswordMail(data.email, origin);

    return {
        message: "A reset link has been sent to the email address."
    };
}

export const resetPassword = async (data: ResetPasswordData) => {
    if (!data) {
        const error = new Error("Request body is required");
        (error as any).statusCode = 400;
        throw error;
    }

    if (!data.token || !data.password) {
        const error = new Error("Invalid data");
        (error as any).statusCode = 400;
        throw error;
    }

    const tokenData: any = decodeToken(data.token);
    if (!tokenData || !tokenData?.email) {
        const error = new Error("The token is invalid or has expired. Please request a new one.");
        (error as any).statusCode = 400;
        throw error;
    }

    const email = tokenData.email;
    const user = await userModel.getUserUsingEmail(email);
    if (!user || !user.id) {
        const error = new Error("User not found.");
        (error as any).statusCode = 404;
        throw error;
    }

    const isNewPasswordSame = await bcrypt.compare(data.password, user.password);
    if (isNewPasswordSame) {
        const error = new Error("New password is same as the old password");
        (error as any).statusCode = 400;
        throw error;
    }

    const password = await bcrypt.hash(data.password, 12);
    await userModel.updatePassword(password, user.id);

    await userModel.deleteAllSessions(user.id);

    return {
        message: "User password updated successfully"
    }
}

export const getUser = async (userId: number) => {
    if (!userId) {
        const error = new Error("User not found.");
        (error as any).statusCode = 404;
        throw error;
    }

    const { id, password, isvalidated, ...userData } = await userModel.getUserUsingId(userId);
    if (!userData) {
        const error = new Error("User not found");
        (error as any).statusCode = 404;
        throw error;
    }

    return {
        message: "User details retrieved successfully",
        userData,
    };
};
