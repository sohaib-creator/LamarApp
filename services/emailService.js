import nodemailer from 'nodemailer';
import { env } from '../config/env.js';

let transporter = null;

function getTransporter() {
  if (transporter) return transporter;

  if (env.SMTP_HOST) {
    transporter = nodemailer.createTransport({
      host: env.SMTP_HOST,
      port: env.SMTP_PORT,
      secure: env.SMTP_SECURE,
      auth: {
        user: env.SMTP_USER,
        pass: env.SMTP_PASS,
      },
    });
  } else {
    console.warn('[Email] No SMTP configured — emails will be logged only');
    transporter = {
      sendMail: async (opts) => {
        console.log('[Email] Would send:', JSON.stringify(opts, null, 2));
        return { messageId: 'logged-' + Date.now() };
      },
    };
  }
  return transporter;
}

export async function sendVerificationEmail(email, name, token) {
  const url = `${env.FRONTEND_URL}/verify-email?token=${token}`;
  const t = getTransporter();
  const info = await t.sendMail({
    from: env.EMAIL_FROM,
    to: email,
    subject: 'تأكيد البريد الإلكتروني - لمار',
    html: `
      <div dir="rtl" style="font-family: sans-serif; max-width: 480px; margin: 0 auto;">
        <h2>مرحباً ${name}،</h2>
        <p>شكراً لتسجيلك في لمار. يرجى تأكيد بريدك الإلكتروني بالضغط على الرابط أدناه:</p>
        <a href="${url}" style="display: inline-block; padding: 12px 24px; background: #059669; color: #fff; text-decoration: none; border-radius: 6px; margin: 16px 0;">تأكيد البريد الإلكتروني</a>
        <p style="color: #666; font-size: 14px;">أو انسخ الرابط: <br/>${url}</p>
        <p style="color: #999; font-size: 12px;">ينتهي هذا الرابط بعد 24 ساعة.</p>
      </div>
    `,
  });
  return info;
}

export async function sendPasswordResetEmail(email, name, token) {
  const url = `${env.FRONTEND_URL}/reset-password?token=${token}`;
  const t = getTransporter();
  const info = await t.sendMail({
    from: env.EMAIL_FROM,
    to: email,
    subject: 'إعادة تعيين كلمة المرور - لمار',
    html: `
      <div dir="rtl" style="font-family: sans-serif; max-width: 480px; margin: 0 auto;">
        <h2>مرحباً ${name}،</h2>
        <p>لقد تلقينا طلباً لإعادة تعيين كلمة المرور لحسابك. اضغط على الرابط أدناه:</p>
        <a href="${url}" style="display: inline-block; padding: 12px 24px; background: #059669; color: #fff; text-decoration: none; border-radius: 6px; margin: 16px 0;">إعادة تعيين كلمة المرور</a>
        <p style="color: #666; font-size: 14px;">أو انسخ الرابط: <br/>${url}</p>
        <p style="color: #999; font-size: 12px;">ينتهي هذا الرابط بعد ساعة واحدة. إذا لم تطلب إعادة التعيين، تجاهل هذه الرسالة.</p>
      </div>
    `,
  });
  return info;
}
