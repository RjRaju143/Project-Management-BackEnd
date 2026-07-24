import nodemailer from "nodemailer";
import { env } from "../config/env.js";

let transporter: nodemailer.Transporter | null = null;

/**
 * Returns true if SMTP is configured.
 */
export function isSmtpConfigured(): boolean {
  return !!(env.SMTP_HOST && env.SMTP_USER && env.SMTP_PASS);
}

/**
 * Get or create the nodemailer transporter.
 */
function getTransporter(): nodemailer.Transporter {
  if (!transporter) {
    transporter = nodemailer.createTransport({
      host: env.SMTP_HOST,
      port: env.SMTP_PORT,
      secure: env.SMTP_PORT === 465,
      auth: {
        user: env.SMTP_USER,
        pass: env.SMTP_PASS,
      },
    });
  }
  return transporter;
}

/**
 * Send an invite email with the registration link.
 */
export async function sendInviteEmail(options: {
  to: string;
  firstName: string;
  inviteLink: string;
}): Promise<void> {
  const { to, firstName, inviteLink } = options;

  if (!isSmtpConfigured()) {
    // eslint-disable-next-line no-console
    console.log("[MAIL] SMTP not configured — skipping email send.");
    return;
  }

  const html = `
    <div style="font-family: 'Segoe UI', Arial, sans-serif; max-width: 520px; margin: 0 auto; padding: 2rem; border: 2px solid #0a0a0a;">
      <div style="background: #0a0a0a; color: #fafafa; padding: 1.5rem 2rem; margin: -2rem -2rem 1.5rem;">
        <h1 style="margin: 0; font-size: 1.25rem; font-weight: 900; letter-spacing: -0.02em;">
          ◈ FreelancerCRM
        </h1>
      </div>
      <h2 style="margin: 0 0 0.5rem; font-size: 1.5rem; font-weight: 900;">You're Invited!</h2>
      <p style="color: #555; line-height: 1.6; margin: 0 0 1.5rem;">
        Hi <strong>${firstName}</strong>, you've been invited to join FreelancerCRM. Click the button below to set your password and activate your account.
      </p>
      <a href="${inviteLink}" style="display: inline-block; padding: 0.875rem 2rem; background: #ffe135; color: #0a0a0a; text-decoration: none; font-weight: 800; font-size: 0.9rem; text-transform: uppercase; letter-spacing: 0.05em; border: 2px solid #0a0a0a; box-shadow: 4px 4px 0 #0a0a0a;">
        Accept Invitation
      </a>
      <p style="margin-top: 1.5rem; font-size: 0.8rem; color: #888; line-height: 1.5;">
        Or copy this link: <br/>
        <a href="${inviteLink}" style="color: #2563eb; word-break: break-all;">${inviteLink}</a>
      </p>
      <p style="margin-top: 1.5rem; font-size: 0.75rem; color: #aaa;">
        This link expires in 7 days. If you didn't expect this invitation, you can safely ignore it.
      </p>
    </div>
  `;

  const mail = getTransporter();
  await mail.sendMail({
    from: env.SMTP_FROM,
    to,
    subject: "You're invited to FreelancerCRM",
    html,
  });
}
