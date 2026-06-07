import { Resend } from "resend";

const resend = new Resend(process.env.RESEND_API_KEY);

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
    const apiKey = process.env.RESEND_API_KEY;
    if (!apiKey || apiKey === "re_..." || apiKey.length < 10) {
        console.warn("[Email] RESEND_API_KEY is missing or is a placeholder. Email not sent.");
        console.warn("[Email] Set a real key from https://resend.com/api-keys in your .env.local / Vercel environment.");
        return { success: false, error: "Missing RESEND_API_KEY" };
    }

    console.log(`[Email] Attempting to send email to: ${email}, subject: ${subject}`);

    try {
        const data = await resend.emails.send({
            from: "NairobiMart <onboarding@resend.dev>",
            to: [email],
            subject,
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

        console.log(`[Email] Successfully sent to ${email}. Resend ID:`, (data as { id?: string })?.id);
        return { success: true, data };
    } catch (error) {
        console.error("[Email] Resend send failed:", error);
        return { success: false, error };
    }
};

export default resend;
