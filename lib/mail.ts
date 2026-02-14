import nodemailer from "nodemailer";

const port = Number(process.env.SMTP_PORT) || 587;
const secure = port === 465;

export const transporter = nodemailer.createTransport({
  host: process.env.SMTP_HOST,
  port,
  secure,
  auth: {
    user: process.env.SMTP_USER,
    pass: process.env.SMTP_PASSWORD,
  },
});

export async function sendMail(to: string, subject: string, html: string) {
  try {
    const info = await transporter.sendMail({
      from: `"${process.env.SMTP_FROM_NAME}" <${process.env.SMTP_FROM_EMAIL}>`,
      to,
      subject,
      html,
    });

    return info;
  } catch (error: any) {
    console.error("sendMail error details:", {
      error: error.message,
      code: error.code,
      command: error.command,
    });

    if (error.code === "EAUTH") {
      throw new Error(
        "Email authentication failed. Check your SMTP credentials.",
      );
    }

    if (error.code === "ECONNECTION") {
      throw new Error("Cannot connect to email server. Check SMTP settings.");
    }

    throw new Error(`Failed to send email: ${error.message}`);
  }
}
