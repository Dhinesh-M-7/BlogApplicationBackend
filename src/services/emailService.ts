import dotenv from 'dotenv';
dotenv.config();

import { generateToken } from "../utils/jwt.js";
import { BrevoClient } from "@getbrevo/brevo";

const client = new BrevoClient({
    apiKey: process.env.BREVO_API_KEY as string,
});

export const sendVerificationMail = async (to: string, origin: string): Promise<any> => {
    console.log("DEBUG: Sending email via BrevoClient to ", to);
    const token = generateToken(to);
    const verificationUrl = `${origin}/verify-email?token=${token}`;

    try {
        const response = await client.transactionalEmails.sendTransacEmail({
            subject: "Confirm your email address",
            sender: {
                name: "Blog App",
                email: process.env.MAIL_USER as string
            },
            to: [{ email: to }],
            htmlContent: `
                <div style="font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; line-height: 1.6; color: #333; max-width: 600px; margin: 0 auto; border: 1px solid #e0e0e0; border-radius: 8px; overflow: hidden;">
                    <div style="background-color: #4CAF50; padding: 20px; text-align: center;">
                        <h1 style="color: white; margin: 0; font-size: 24px;">Welcome to Blog App!</h1>
                    </div>
                    <div style="padding: 30px; background-color: #ffffff;">
                        <p style="font-size: 16px;">Hi there,</p>
                        <p style="font-size: 16px;">We're excited to have you join our community. Before you dive into reading and writing amazing stories, please confirm your email address to activate your account.</p>
                        <div style="text-align: center; margin: 35px 0;">
                            <a href="${verificationUrl}"
                                style="
                                background-color: #4CAF50;
                                color: white;
                                padding: 14px 32px;
                                text-decoration: none;
                                border-radius: 5px;
                                font-weight: bold;
                                font-size: 16px;
                                display: inline-block;
                                box-shadow: 0 4px 6px rgba(0,0,0,0.1);
                                ">
                                Verify Email Address
                            </a>
                        </div>
                        <p style="font-size: 14px; color: #666;">If you did not create an account with us, you can safely ignore this email.</p>
                        <p style="font-size: 16px;">Thanks,<br/>Dhinesh</p>
                    </div>
                </div>
            `
        });

        console.log("Verification email sent successfully: ", response.messageId);
        return response;
    } catch (error) {
        console.error("Brevo Verification Mail Error:", error);
        throw error;
    }
};

export const sendForgotPasswordMail = async (to: string, origin: string): Promise<any> => {
    console.log("DEBUG: Sending email via BrevoClient to ", to);
    const token = generateToken(to);
    const resetUrl = `${origin}/reset-password?token=${token}`;

    try {
        const response = await client.transactionalEmails.sendTransacEmail({
            subject: "Reset your password",
            sender: {
                name: "Blog App Support",
                email: process.env.MAIL_USER as string
            },
            to: [{ email: to }],
            htmlContent: `
                <div style="font-family: Arial, sans-serif; line-height: 1.6; color: #333; max-width: 600px; margin: 0 auto; border: 1px solid #eee; padding: 20px; border-radius: 10px;">
                    <h2 style="color: #d9534f;">Password Reset Request</h2>
                    <p>Hi there,</p>
                    <p>We received a request to reset the password for your account associated with this email address.</p>
                    <p>To proceed with the password reset, click the button below:</p>
                    <div style="text-align: center;">
                        <a href="${resetUrl}"
                            style="
                            display: inline-block;
                            padding: 14px 28px;
                            margin: 25px 0;
                            background-color: #007bff;
                            color: white;
                            text-decoration: none;
                            border-radius: 6px;
                            font-weight: bold;
                            font-size: 16px;
                            ">
                            Reset My Password
                        </a>
                    </div>
                    <p style="font-size: 0.9em; color: #666;">
                        <strong>Note:</strong>If you didn't request this, you can safely ignore this email. Your password will remain unchanged.
                    </p>
                    <p>Best regards,<br/>Dhinesh</p>
                </div>
            `
        });

        console.log("Forgot Password Email sent successfully: ", response.messageId);
        return response;
    } catch (error) {
        console.error("Brevo Forgot Password Mail Error:", error);
        throw error;
    }
};