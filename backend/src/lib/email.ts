import nodemailer from "nodemailer";

// ----------------------------
// 1. Create reusable SMTP client
// ----------------------------
const emailClient = nodemailer.createTransport({
  host: process.env.SMTP_HOST, // smtp.gmail.com
  port: Number(process.env.SMTP_PORT), // 465
  secure: true, // true for 465
  auth: {
    user: process.env.SMTP_USER, // yourgmail@gmail.com
    pass: process.env.SMTP_PASS, // app password (no spaces)
  },
});

// ----------------------------
// 2. Simple email sender function
// ----------------------------
export async function sendEmail({
  to,
  subject,
  body,
}: {
  to: string;
  subject: string;
  body: string;
}) {
  try {
    const result = await emailClient.sendMail({
      from: process.env.FROM_EMAIL,
      to,
      subject,
      html: body, // HTML body allowed
      text: body, // fallback
    });

    return {
      success: true,
      messageId: result.messageId,
    };
  } catch (error: any) {
    return {
      success: false,
      error: error.message,
    };
  }
}
