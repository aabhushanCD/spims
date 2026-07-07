import nodemailer from "nodemailer";

const user = await nodemailer.createTestAccount();

const transporter = nodemailer.createTransport({
  host: process.env.SMTP_HOST || user.smtp.host,
  port: Number(process.env.SMTP_PORT) || user.smtp.port,
  secure: process.env.SMTP_SECURE === "true" || user.smtp.secure, // true for 465, false for other ports
  auth: {
    user: process.env.SMTP_USER || user.user,
    pass: process.env.SMTP_PASS || user.pass,
  },
});

export async function sendEmail(to: string, subject: string, text: string) {
  const mailOptions = {
    from: process.env.SMTP_FROM || process.env.SMTP_USER,
    to,
    subject,
    text,
  };

  return await transporter.sendMail(mailOptions);
}
