// SendGrid integration - Reference: blueprint:javascript_sendgrid
import { MailService } from '@sendgrid/mail';

if (!process.env.SENDGRID_API_KEY) {
  throw new Error("SENDGRID_API_KEY environment variable must be set");
}

const mailService = new MailService();
mailService.setApiKey(process.env.SENDGRID_API_KEY);

interface EmailParams {
  to: string;
  from: string;
  subject: string;
  text?: string;
  html?: string;
}

export async function sendEmail(params: EmailParams): Promise<boolean> {
  try {
    const emailData: any = {
      to: params.to,
      from: params.from,
      subject: params.subject,
    };
    
    if (params.text) emailData.text = params.text;
    if (params.html) emailData.html = params.html;
    
    await mailService.send(emailData);
    return true;
  } catch (error) {
    console.error('SendGrid email error:', error);
    return false;
  }
}

export function generatePasswordResetEmail(resetToken: string, email: string, resetUrl: string) {
  const fromEmail = process.env.SENDGRID_FROM_EMAIL || 'eric@thriveiep.com';
  return {
    to: email,
    from: fromEmail, // Administrative sender email
    subject: 'Password Reset - Post-Secondary Portal',
    text: `
      Password Reset Request
      
      You have requested to reset your password for the Post-Secondary Portal.
      
      Click the following link to reset your password:
      ${resetUrl}
      
      This link will expire in 1 hour for security purposes.
      
      If you did not request this password reset, please ignore this email.
      
      Best regards,
      Post-Secondary Portal Team
    `,
    html: `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
        <h2 style="color: #2563eb;">Password Reset Request</h2>
        <p>You have requested to reset your password for the Post-Secondary Portal.</p>
        <p>Click the button below to reset your password:</p>
        <a href="${resetUrl}" style="display: inline-block; padding: 12px 24px; background-color: #2563eb; color: white; text-decoration: none; border-radius: 6px; margin: 20px 0;">
          Reset Password
        </a>
        <p>Or copy and paste this link into your browser:</p>
        <p style="word-break: break-all; color: #6b7280;">${resetUrl}</p>
        <p><strong>This link will expire in 1 hour for security purposes.</strong></p>
        <p>If you did not request this password reset, please ignore this email.</p>
        <hr style="margin: 30px 0; border: none; border-top: 1px solid #e5e7eb;">
        <p style="color: #6b7280; font-size: 14px;">Best regards,<br>Post-Secondary Portal Team</p>
      </div>
    `,
  };
}

export function generateForgotUsernameEmail(email: string, usernames: string[]) {
  const fromEmail = process.env.SENDGRID_FROM_EMAIL || 'eric@thriveiep.com';
  const usernameList = usernames.length === 1 
    ? `Your username is: ${usernames[0]}` 
    : `Your usernames are: ${usernames.join(', ')}`;
  
  return {
    to: email,
    from: fromEmail, // Administrative sender email
    subject: 'Username Information - Post-Secondary Portal',
    text: `
      Username Information Request
      
      You have requested your username information for the Post-Secondary Portal.
      
      ${usernameList}
      
      You can now use ${usernames.length === 1 ? 'this username' : 'any of these usernames'} to log in to your account.
      
      If you did not request this information, please ignore this email.
      
      Best regards,
      Post-Secondary Portal Team
    `,
    html: `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
        <h2 style="color: #2563eb;">Username Information Request</h2>
        <p>You have requested your username information for the Post-Secondary Portal.</p>
        <div style="background-color: #f3f4f6; padding: 20px; border-radius: 8px; margin: 20px 0;">
          <p style="margin: 0; font-weight: bold; color: #1f2937;">${usernameList}</p>
        </div>
        <p>You can now use ${usernames.length === 1 ? 'this username' : 'any of these usernames'} to log in to your account.</p>
        <p>If you did not request this information, please ignore this email.</p>
        <hr style="margin: 30px 0; border: none; border-top: 1px solid #e5e7eb;">
        <p style="color: #6b7280; font-size: 14px;">Best regards,<br>Post-Secondary Portal Team</p>
      </div>
    `,
  };
}