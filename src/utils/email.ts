import nodemailer from 'nodemailer';

const SMTP_PORT = parseInt(process.env.SMTP_PORT || "465");
const SMTP_USER = process.env.SMTP_USER || "no-reply@conzex.com";

const transporter = nodemailer.createTransport({
  host: process.env.SMTP_HOST || "mail.conzex.com",
  port: SMTP_PORT,
  secure: SMTP_PORT === 465,
  auth: {
    user: SMTP_USER,
    pass: process.env.SMTP_PASS || "p]M9b|Y2?"
  }
});

// Verify connection configuration
transporter.verify((error, success) => {
  if (error) {
    console.error("SMTP Connection Error:", error);
  } else {
    console.log("SMTP Server is ready to take our messages");
  }
});

// Ensure FROM_EMAIL always has a valid domain
const FROM_EMAIL = SMTP_USER.includes('@') 
  ? `"CardSwipe" <${SMTP_USER}>` 
  : `"CardSwipe" <no-reply@conzex.com>`;

export const sendVerificationEmail = async (email: string, token: string) => {
  let baseUrl = process.env.BASE_URL || process.env.APP_URL || 'http://localhost:3000';
  if (baseUrl.endsWith('/')) baseUrl = baseUrl.slice(0, -1);
  const url = `${baseUrl}/verify-email?token=${token}`;
  console.log(`Attempting to send verification email to: ${email}`);
  try {
    await transporter.sendMail({
      from: FROM_EMAIL,
      to: email,
      subject: "Verify your email",
      html: `
        <div style="font-family: sans-serif; padding: 20px; border: 1px solid #eee; border-radius: 10px;">
          <h2>Welcome to CardSwipe</h2>
          <p>Please click the button below to verify your email address and start managing your cards.</p>
          <a href="${url}" style="display: inline-block; padding: 10px 20px; background-color: #4F46E5; color: white; text-decoration: none; border-radius: 5px;">Verify Email</a>
          <p>If the button doesn't work, copy and paste this link: ${url}</p>
        </div>
      `
    });
    console.log(`Verification email sent successfully to: ${email}`);
  } catch (error) {
    console.error(`Error sending verification email to ${email}:`, error);
    throw error;
  }
};

export const sendDueReminder = async (email: string, cardName: string, dueDate: string) => {
  console.log(`Attempting to send due reminder to: ${email}`);
  try {
    await transporter.sendMail({
      from: FROM_EMAIL,
      to: email,
      subject: `Reminder: ${cardName} Bill Due Soon`,
      html: `
        <div style="font-family: sans-serif; padding: 20px; border: 1px solid #eee; border-radius: 10px;">
          <h2>Payment Reminder</h2>
          <p>Your bill for <strong>${cardName}</strong> is due on <strong>${dueDate}</strong>.</p>
          <p>Please ensure you have sufficient funds to avoid late fees.</p>
        </div>
      `
    });
    console.log(`Due reminder sent successfully to: ${email}`);
  } catch (error) {
    console.error(`Error sending due reminder to ${email}:`, error);
    throw error;
  }
};

export const sendPasswordResetEmail = async (email: string, token: string) => {
  let baseUrl = process.env.BASE_URL || process.env.APP_URL || 'http://localhost:3000';
  if (baseUrl.endsWith('/')) baseUrl = baseUrl.slice(0, -1);
  const url = `${baseUrl}/reset-password?token=${token}`;
  console.log(`Attempting to send password reset email to: ${email}`);
  try {
    await transporter.sendMail({
      from: FROM_EMAIL,
      to: email,
      subject: "Reset your password",
      html: `
        <div style="font-family: sans-serif; padding: 20px; border: 1px solid #eee; border-radius: 10px;">
          <h2>Password Reset Request</h2>
          <p>You requested to reset your password. Please click the button below to proceed.</p>
          <a href="${url}" style="display: inline-block; padding: 10px 20px; background-color: #4F46E5; color: white; text-decoration: none; border-radius: 5px;">Reset Password</a>
          <p>If you didn't request this, you can safely ignore this email.</p>
          <p>If the button doesn't work, copy and paste this link: ${url}</p>
        </div>
      `
    });
    console.log(`Password reset email sent successfully to: ${email}`);
  } catch (error) {
    console.error(`Error sending password reset email to ${email}:`, error);
    throw error;
  }
};
