import nodemailer from 'nodemailer';

const SMTP_USER = process.env.SMTP_USER || "info@sumitkumawat.com";

const transporter = nodemailer.createTransport({
  host: process.env.SMTP_HOST || "mail.sumitkumawat.com",
  port: parseInt(process.env.SMTP_PORT || "465"),
  secure: true,
  auth: {
    user: SMTP_USER,
    pass: process.env.SMTP_PASS || "Sumit@123"
  }
});

const FROM_EMAIL = `"Credit Card Manager" <${SMTP_USER}>`;

export const sendVerificationEmail = async (email: string, token: string) => {
  const url = `${process.env.BASE_URL}/verify-email?token=${token}`;
  await transporter.sendMail({
    from: FROM_EMAIL,
    to: email,
    subject: "Verify your email",
    html: `
      <div style="font-family: sans-serif; padding: 20px; border: 1px solid #eee; border-radius: 10px;">
        <h2>Welcome to Credit Card Manager</h2>
        <p>Please click the button below to verify your email address and start managing your cards.</p>
        <a href="${url}" style="display: inline-block; padding: 10px 20px; background-color: #4F46E5; color: white; text-decoration: none; border-radius: 5px;">Verify Email</a>
        <p>If the button doesn't work, copy and paste this link: ${url}</p>
      </div>
    `
  });
};

export const sendDueReminder = async (email: string, cardName: string, dueDate: string) => {
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
};

export const sendPasswordResetEmail = async (email: string, token: string) => {
  const url = `${process.env.BASE_URL}/reset-password?token=${token}`;
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
};
