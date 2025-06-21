// D:\applications\tasks\TaskZenith\src\lib\email.ts

import nodemailer from "nodemailer";

export async function sendVerificationEmail(email: string) {
  const transporter = nodemailer.createTransport({
    host: process.env.SMTP_HOST,
    port: Number(process.env.SMTP_PORT),
    secure: process.env.SMTP_SECURE === 'true', // Better handling for boolean
    auth: {
      user: process.env.SMTP_USER,
      pass: process.env.SMTP_PASS,
    },
  });

  const mailOptions = {
    from: `"${process.env.SMTP_FROM_NAME}" <${process.env.SMTP_FROM_EMAIL || process.env.SMTP_USER}>`,
    to: email,
    subject: "Confirm your email for TaskZenith",
    text: "Please click the link to confirm your email.", // Simple text version
    html: `<p>Please click the link to confirm your email.</p>` // Rich HTML version
  };

  try {
    await transporter.sendMail(mailOptions);
    return { success: true };
  } catch (error) {
    console.error("Failed to send verification email:", error);
    return { success: false, error: "Failed to send email." };
  }
}