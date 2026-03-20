import { Resend } from "resend";

const resend = new Resend(process.env.RESEND_API_KEY);

export const sendOrderConfirmationEmail = async (
    email: string,
    orderNumber: string,
    totalAmount: number
) => {
    try {
        const data = await resend.emails.send({
            from: "NairobiMart <orders@nairobimart.com>",
            to: [email],
            subject: `Order Confirmation - ${orderNumber}`,
            html: `
        <div style="font-family: sans-serif; max-width: 600px; margin: auto;">
          <h1 style="color: #0D1B2A;">NairobiMart</h1>
          <h2>Thank you for your order!</h2>
          <p>Your order <strong>${orderNumber}</strong> has been received and is being processed.</p>
          <p>Total Amount: <strong>KES ${totalAmount.toLocaleString()}</strong></p>
          <div style="background-color: #f4f4f4; padding: 20px; border-radius: 10px; margin-top: 20px;">
            <p><strong>Shipping Note:</strong> Since we source globally to get you the best prices, please allow 15-30 business days for delivery.</p>
          </div>
          <p style="margin-top: 30px; font-size: 12px; color: #666;">If you have any questions, reply to this email.</p>
        </div>
      `,
        });

        return { success: true, data };
    } catch (error) {
        console.error("Resend Email Error:", error);
        return { success: false, error };
    }
};

export default resend;
