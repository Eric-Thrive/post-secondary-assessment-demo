// SendGrid integration - Reference: blueprint:javascript_sendgrid
import { MailService } from "@sendgrid/mail";

let mailService: MailService | null = null;

function getMailService(): MailService {
  if (!mailService) {
    if (!process.env.SENDGRID_API_KEY) {
      throw new Error("SENDGRID_API_KEY environment variable must be set");
    }
    mailService = new MailService();
    mailService.setApiKey(process.env.SENDGRID_API_KEY);
  }
  return mailService;
}

export interface EmailParams {
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

    await getMailService().send(emailData);
    console.log(`Email sent successfully to ${params.to}: ${params.subject}`);
    return true;
  } catch (error) {
    console.error("SendGrid email error:", error);
    return false;
  }
}

/**
 * Send email with retry logic for failed sends
 * @param params Email parameters
 * @param maxRetries Maximum number of retry attempts (default: 3)
 * @param retryDelay Delay between retries in milliseconds (default: 2000)
 * @returns Promise<boolean> indicating success or failure
 */
export async function sendEmailWithRetry(
  params: EmailParams,
  maxRetries: number = 3,
  retryDelay: number = 2000
): Promise<boolean> {
  let lastError: any;

  for (let attempt = 1; attempt <= maxRetries; attempt++) {
    try {
      const emailData: any = {
        to: params.to,
        from: params.from,
        subject: params.subject,
      };

      if (params.text) emailData.text = params.text;
      if (params.html) emailData.html = params.html;

      await getMailService().send(emailData);
      console.log(
        `Email sent successfully to ${params.to}: ${params.subject} (attempt ${attempt}/${maxRetries})`
      );
      return true;
    } catch (error) {
      lastError = error;
      console.error(
        `SendGrid email error (attempt ${attempt}/${maxRetries}):`,
        error
      );

      if (attempt < maxRetries) {
        console.log(`Retrying in ${retryDelay}ms...`);
        await new Promise((resolve) => setTimeout(resolve, retryDelay));
      }
    }
  }

  console.error(
    `Failed to send email after ${maxRetries} attempts:`,
    lastError
  );
  return false;
}

/**
 * Send verification email to user
 */
export async function sendVerificationEmail(
  email: string,
  username: string,
  verificationLink: string
): Promise<boolean> {
  const emailParams = generateVerificationEmail(
    email,
    username,
    verificationLink
  );
  return sendEmailWithRetry(emailParams);
}

/**
 * Send registration notification to admin
 */
export async function sendAdminRegistrationNotification(
  adminEmail: string,
  userData: RegistrationData
): Promise<boolean> {
  const emailParams = generateAdminRegistrationNotification(
    adminEmail,
    userData
  );
  return sendEmailWithRetry(emailParams);
}

/**
 * Send support request notification to admin
 */
export async function sendAdminSupportNotification(
  adminEmail: string,
  request: SupportRequest
): Promise<boolean> {
  const emailParams = generateAdminSupportNotification(adminEmail, request);
  return sendEmailWithRetry(emailParams);
}

/**
 * Send sales inquiry notification to admin
 */
export async function sendAdminSalesNotification(
  adminEmail: string,
  inquiry: SalesInquiry
): Promise<boolean> {
  const emailParams = generateAdminSalesNotification(adminEmail, inquiry);
  return sendEmailWithRetry(emailParams);
}

export function generatePasswordResetEmail(
  resetToken: string,
  email: string,
  resetUrl: string
) {
  const fromEmail = process.env.SENDGRID_FROM_EMAIL || "eric@thriveiep.com";
  return {
    to: email,
    from: fromEmail, // Administrative sender email
    subject: "Password Reset - Post-Secondary Portal",
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

export function generateForgotUsernameEmail(
  email: string,
  usernames: string[]
) {
  const fromEmail = process.env.SENDGRID_FROM_EMAIL || "eric@thriveiep.com";
  const usernameList =
    usernames.length === 1
      ? `Your username is: ${usernames[0]}`
      : `Your usernames are: ${usernames.join(", ")}`;

  return {
    to: email,
    from: fromEmail, // Administrative sender email
    subject: "Username Information - Post-Secondary Portal",
    text: `
      Username Information Request
      
      You have requested your username information for the Post-Secondary Portal.
      
      ${usernameList}
      
      You can now use ${
        usernames.length === 1 ? "this username" : "any of these usernames"
      } to log in to your account.
      
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
        <p>You can now use ${
          usernames.length === 1 ? "this username" : "any of these usernames"
        } to log in to your account.</p>
        <p>If you did not request this information, please ignore this email.</p>
        <hr style="margin: 30px 0; border: none; border-top: 1px solid #e5e7eb;">
        <p style="color: #6b7280; font-size: 14px;">Best regards,<br>Post-Secondary Portal Team</p>
      </div>
    `,
  };
}

export function generateVerificationEmail(
  email: string,
  username: string,
  verificationLink: string
): EmailParams {
  const fromEmail = process.env.SENDGRID_FROM_EMAIL || "eric@thriveiep.com";

  return {
    to: email,
    from: fromEmail,
    subject: "Verify your email - THRIVE Assessment Platform",
    text: `
      Welcome to THRIVE!
      
      Thank you for registering, ${username}. Please verify your email address to activate your account.
      
      Click the following link to verify your email address:
      ${verificationLink}
      
      This link will expire in 24 hours.
      
      If you didn't create an account, please ignore this email.
      
      Best regards,
      THRIVE Assessment Platform Team
    `,
    html: `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;">
        <div style="text-align: center; margin-bottom: 30px;">
          <h1 style="color: #1297D2; margin: 0;">THRIVE</h1>
        </div>

        <h2 style="color: #1297D2;">Welcome to THRIVE!</h2>

        <p>Thank you for registering, ${username}. Please verify your email address to activate your account.</p>

        <div style="text-align: center; margin: 30px 0;">
          <a href="${verificationLink}" style="display: inline-block; padding: 14px 28px; background-color: #F89E54; color: white; text-decoration: none; border-radius: 6px; font-weight: bold;">
            Verify Email Address
          </a>
        </div>

        <p>Or copy and paste this link into your browser:</p>
        <p style="word-break: break-all; color: #6b7280; font-size: 14px;">
          ${verificationLink}
        </p>

        <p style="margin-top: 30px;">
          <strong>This link will expire in 24 hours.</strong>
        </p>

        <p>If you didn't create an account, please ignore this email.</p>

        <hr style="margin: 30px 0; border: none; border-top: 1px solid #e5e7eb;" />

        <p style="color: #6b7280; font-size: 14px;">
          Best regards,<br />
          THRIVE Assessment Platform Team
        </p>
      </div>
    `,
  };
}

export interface RegistrationData {
  username: string;
  email: string;
  organizationName?: string;
  registeredAt: Date;
}

export function generateAdminRegistrationNotification(
  adminEmail: string,
  userData: RegistrationData
): EmailParams {
  const fromEmail = process.env.SENDGRID_FROM_EMAIL || "eric@thriveiep.com";
  const timestamp = userData.registeredAt.toLocaleString("en-US", {
    dateStyle: "full",
    timeStyle: "long",
  });

  return {
    to: adminEmail,
    from: fromEmail,
    subject: `New User Registration - ${userData.username}`,
    text: `
      New User Registration
      
      A new user has registered on the THRIVE Assessment Platform.
      
      User Details:
      Username: ${userData.username}
      Email: ${userData.email}
      Organization: ${userData.organizationName || "Not provided"}
      Registered: ${timestamp}
      
      The user will need to verify their email before accessing the platform.
      
      THRIVE Assessment Platform
      Automated Notification
    `,
    html: `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;">
        <h2 style="color: #1297D2;">New User Registration</h2>

        <p>A new user has registered on the THRIVE Assessment Platform.</p>

        <div style="background-color: #f3f4f6; padding: 20px; border-radius: 8px; margin: 20px 0;">
          <h3 style="margin-top: 0; color: #1f2937;">User Details</h3>
          <table style="width: 100%; border-collapse: collapse;">
            <tr>
              <td style="padding: 8px 0; font-weight: bold;">Username:</td>
              <td style="padding: 8px 0;">${userData.username}</td>
            </tr>
            <tr>
              <td style="padding: 8px 0; font-weight: bold;">Email:</td>
              <td style="padding: 8px 0;">${userData.email}</td>
            </tr>
            <tr>
              <td style="padding: 8px 0; font-weight: bold;">Organization:</td>
              <td style="padding: 8px 0;">${
                userData.organizationName || "Not provided"
              }</td>
            </tr>
            <tr>
              <td style="padding: 8px 0; font-weight: bold;">Registered:</td>
              <td style="padding: 8px 0;">${timestamp}</td>
            </tr>
          </table>
        </div>

        <p>The user will need to verify their email before accessing the platform.</p>

        <hr style="margin: 30px 0; border: none; border-top: 1px solid #e5e7eb;" />

        <p style="color: #6b7280; font-size: 14px;">
          THRIVE Assessment Platform<br />
          Automated Notification
        </p>
      </div>
    `,
  };
}

export interface SupportRequest {
  name: string;
  email: string;
  subject: string;
  description: string;
  urgency: "low" | "medium" | "high";
  category: "technical" | "account" | "billing" | "other";
  createdAt: Date;
}

export function generateAdminSupportNotification(
  adminEmail: string,
  request: SupportRequest
): EmailParams {
  const fromEmail = process.env.SENDGRID_FROM_EMAIL || "eric@thriveiep.com";
  const timestamp = request.createdAt.toLocaleString("en-US", {
    dateStyle: "full",
    timeStyle: "long",
  });

  const urgencyColors = {
    low: "#10B981",
    medium: "#F59E0B",
    high: "#EF4444",
  };

  const urgencyColor = urgencyColors[request.urgency];

  return {
    to: adminEmail,
    from: fromEmail,
    subject: `Support Request - ${request.subject}`,
    text: `
      New Support Request
      
      Urgency: ${request.urgency.toUpperCase()}
      
      Request Details:
      Name: ${request.name}
      Email: ${request.email}
      Category: ${request.category}
      Subject: ${request.subject}
      Submitted: ${timestamp}
      
      Description:
      ${request.description}
      
      THRIVE Assessment Platform
      Automated Notification
    `,
    html: `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;">
        <h2 style="color: #1297D2;">New Support Request</h2>

        <div style="background-color: #FEF3C7; padding: 12px; border-left: 4px solid ${urgencyColor}; margin: 20px 0;">
          <strong>Urgency: ${request.urgency.toUpperCase()}</strong>
        </div>

        <div style="background-color: #f3f4f6; padding: 20px; border-radius: 8px; margin: 20px 0;">
          <h3 style="margin-top: 0; color: #1f2937;">Request Details</h3>
          <table style="width: 100%; border-collapse: collapse;">
            <tr>
              <td style="padding: 8px 0; font-weight: bold;">Name:</td>
              <td style="padding: 8px 0;">${request.name}</td>
            </tr>
            <tr>
              <td style="padding: 8px 0; font-weight: bold;">Email:</td>
              <td style="padding: 8px 0;">${request.email}</td>
            </tr>
            <tr>
              <td style="padding: 8px 0; font-weight: bold;">Category:</td>
              <td style="padding: 8px 0;">${request.category}</td>
            </tr>
            <tr>
              <td style="padding: 8px 0; font-weight: bold;">Subject:</td>
              <td style="padding: 8px 0;">${request.subject}</td>
            </tr>
            <tr>
              <td style="padding: 8px 0; font-weight: bold;">Submitted:</td>
              <td style="padding: 8px 0;">${timestamp}</td>
            </tr>
          </table>
        </div>

        <div style="background-color: #ffffff; padding: 20px; border: 1px solid #e5e7eb; border-radius: 8px;">
          <h4 style="margin-top: 0;">Description:</h4>
          <p style="white-space: pre-wrap;">${request.description}</p>
        </div>

        <hr style="margin: 30px 0; border: none; border-top: 1px solid #e5e7eb;" />

        <p style="color: #6b7280; font-size: 14px;">
          THRIVE Assessment Platform<br />
          Automated Notification
        </p>
      </div>
    `,
  };
}

export interface SalesInquiry {
  name: string;
  email: string;
  organization: string;
  organizationSize?: string;
  interestedModules: string[];
  message: string;
  inquiryType: "pricing" | "demo" | "features" | "other";
  createdAt: Date;
}

export function generateAdminSalesNotification(
  adminEmail: string,
  inquiry: SalesInquiry
): EmailParams {
  const fromEmail = process.env.SENDGRID_FROM_EMAIL || "eric@thriveiep.com";
  const timestamp = inquiry.createdAt.toLocaleString("en-US", {
    dateStyle: "full",
    timeStyle: "long",
  });

  const modulesText =
    inquiry.interestedModules.length > 0
      ? inquiry.interestedModules.join(", ")
      : "Not specified";

  return {
    to: adminEmail,
    from: fromEmail,
    subject: `Sales Inquiry - ${inquiry.organization}`,
    text: `
      New Sales Inquiry
      
      Inquiry Type: ${inquiry.inquiryType.toUpperCase()}
      
      Contact Information:
      Name: ${inquiry.name}
      Email: ${inquiry.email}
      Organization: ${inquiry.organization}
      Organization Size: ${inquiry.organizationSize || "Not provided"}
      Interested Modules: ${modulesText}
      Submitted: ${timestamp}
      
      Message:
      ${inquiry.message}
      
      THRIVE Assessment Platform
      Automated Notification
    `,
    html: `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;">
        <h2 style="color: #1297D2;">New Sales Inquiry</h2>

        <div style="background-color: #DCFCE7; padding: 12px; border-left: 4px solid #10B981; margin: 20px 0;">
          <strong>Inquiry Type: ${inquiry.inquiryType.toUpperCase()}</strong>
        </div>

        <div style="background-color: #f3f4f6; padding: 20px; border-radius: 8px; margin: 20px 0;">
          <h3 style="margin-top: 0; color: #1f2937;">Contact Information</h3>
          <table style="width: 100%; border-collapse: collapse;">
            <tr>
              <td style="padding: 8px 0; font-weight: bold;">Name:</td>
              <td style="padding: 8px 0;">${inquiry.name}</td>
            </tr>
            <tr>
              <td style="padding: 8px 0; font-weight: bold;">Email:</td>
              <td style="padding: 8px 0;">${inquiry.email}</td>
            </tr>
            <tr>
              <td style="padding: 8px 0; font-weight: bold;">Organization:</td>
              <td style="padding: 8px 0;">${inquiry.organization}</td>
            </tr>
            <tr>
              <td style="padding: 8px 0; font-weight: bold;">Organization Size:</td>
              <td style="padding: 8px 0;">${
                inquiry.organizationSize || "Not provided"
              }</td>
            </tr>
            <tr>
              <td style="padding: 8px 0; font-weight: bold;">Interested Modules:</td>
              <td style="padding: 8px 0;">${modulesText}</td>
            </tr>
            <tr>
              <td style="padding: 8px 0; font-weight: bold;">Submitted:</td>
              <td style="padding: 8px 0;">${timestamp}</td>
            </tr>
          </table>
        </div>

        <div style="background-color: #ffffff; padding: 20px; border: 1px solid #e5e7eb; border-radius: 8px;">
          <h4 style="margin-top: 0;">Message:</h4>
          <p style="white-space: pre-wrap;">${inquiry.message}</p>
        </div>

        <hr style="margin: 30px 0; border: none; border-top: 1px solid #e5e7eb;" />

        <p style="color: #6b7280; font-size: 14px;">
          THRIVE Assessment Platform<br />
          Automated Notification
        </p>
      </div>
    `,
  };
}
