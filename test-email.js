import nodemailer from "nodemailer";
import dotenv from "dotenv";

dotenv.config({ path: ".env.local" });

async function testEmail() {
    console.log("Testing email with user:", process.env.EMAIL_USER);
    
    const transporter = nodemailer.createTransport({
        service: 'gmail',
        auth: {
            user: process.env.EMAIL_USER,
            pass: process.env.EMAIL_APP_PASSWORD,
        },
    });

    try {
        const info = await transporter.sendMail({
            from: process.env.EMAIL_USER,
            to: process.env.EMAIL_USER, // Send to yourself
            subject: "Test Email from NairobiMart",
            text: "If you are reading this, Nodemailer is working perfectly!",
        });
        console.log("SUCCESS! Email sent. Message ID:", info.messageId);
    } catch (error) {
        console.error("FAILED to send email:");
        console.error(error);
    }
}

testEmail();
