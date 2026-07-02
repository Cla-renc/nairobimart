import nodemailer from "nodemailer";

// Create reusable transporter object using the default SMTP transport
const transporter = nodemailer.createTransport({
    service: 'gmail',
    auth: {
        user: process.env.EMAIL_USER,
        pass: process.env.EMAIL_APP_PASSWORD,
    },
});

export const sendOrderConfirmationEmail = async (
    email: string,
    orderNumber: string,
    totalAmount: number
) => {
    return sendMarketingEmail(
        email,
        `Order Confirmation – ${orderNumber}`,
        `Thank you for your order! Your order number is <strong>${orderNumber}</strong> and the order total is <strong>KES ${totalAmount.toLocaleString()}</strong>. We will update you once the order ships.`
    );
};

export const sendMarketingEmail = async (
    email: string,
    subject: string,
    htmlContent: string
) => {
    const user = process.env.EMAIL_USER;
    const pass = process.env.EMAIL_APP_PASSWORD;

    if (!user || !pass) {
        console.warn("[Email] EMAIL_USER or EMAIL_APP_PASSWORD is missing in environment variables. Email not sent.");
        return { success: false, error: "Missing email credentials" };
    }

    console.log(`[Email] Attempting to send email via Gmail to: ${email}, subject: ${subject}`);

    try {
        const info = await transporter.sendMail({
            from: `"NairobiMart" <${user}>`,
            to: email,
            subject: subject,
            html: `
        <div style="font-family: sans-serif; max-width: 600px; margin: auto; color: #0D1B2A;">
          <div style="background: #0D1B2A; padding: 24px; border-radius: 8px 8px 0 0; text-align: center;">
            <h1 style="color: #F4A522; margin: 0; font-size: 28px;">NairobiMart</h1>
          </div>
          <div style="background: #ffffff; padding: 32px; border: 1px solid #e5e7eb; border-top: none;">
            <h2 style="margin-top: 0;">${subject}</h2>
            <div style="font-size: 15px; line-height: 1.6;">
              ${htmlContent}
            </div>
            <p style="margin-top: 24px;">If you have any questions, contact us at <a href="mailto:support@nairobimart.co.ke" style="color: #F4A522;">support@nairobimart.co.ke</a> or call <strong>0759193674</strong>.</p>
          </div>
          <div style="text-align: center; padding: 16px; font-size: 11px; color: #999;">
            © ${new Date().getFullYear()} NairobiMart. All rights reserved.
          </div>
        </div>
      `,
        });

        console.log(`[Email] Successfully sent to ${email}. Message ID: ${info.messageId}`);
        return { success: true, data: info };
    } catch (error) {
        console.error("[Email] Nodemailer send failed:", error);
        return { success: false, error };
    }
};

export const sendContactTicketCreatedEmail = async (
    email: string,
    name: string,
    ticketCode: string,
    subject: string
) => {
    return sendMarketingEmail(
        email,
        `NairobiMart Support Ticket Created: ${ticketCode}`,
        `Hello ${name},<br/><br/>Thank you for contacting NairobiMart. Your request has been received and assigned ticket code <strong>${ticketCode}</strong>.<br/><br/>
        Subject: <strong>${subject}</strong><br/><br/>
        You can track the progress of your support request by returning to the contact page and entering your ticket code.<br/><br/>
        We will notify you again once a support agent responds to your message.`
    );
};

export const sendContactTicketResponseEmail = async (
    email: string,
    name: string,
    ticketCode: string,
    subject: string,
    response: string
) => {
    return sendMarketingEmail(
        email,
        `NairobiMart Support Response: ${ticketCode}`,
        `Hello ${name},<br/><br/>Your support request <strong>${ticketCode}</strong> has been updated.<br/><br/>
        Subject: <strong>${subject}</strong><br/><br/>
        <strong>Response from our team:</strong><br/>${response.replace(/\n/g, "<br/>")}<br/><br/>
        You can track this ticket any time on our contact page using the same ticket code.`
    );
};

export default transporter;
