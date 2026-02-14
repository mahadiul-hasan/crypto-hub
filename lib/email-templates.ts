const BASE_STYLES = `
  * { margin: 0; padding: 0; box-sizing: border-box; }
  body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif; line-height: 1.6; color: #333; background-color: #f9fafb; }
  .container { max-width: 600px; margin: 0 auto; padding: 20px; }
  .header { text-align: center; padding: 30px 0; border-radius: 12px 12px 0 0; }
  .logo { color: white !important; font-size: 28px; font-weight: bold; text-decoration: none; }
  .content { background: white; padding: 40px; border-radius: 0 0 12px 12px; box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1); }
  .greeting { font-size: 24px; font-weight: 600; color: #111827; margin-bottom: 16px; }
  .message { font-size: 16px; color: #6b7280; margin-bottom: 24px; line-height: 1.8; }
  .button-container { text-align: center; margin: 32px 0; }
  .button { display: inline-block; padding: 14px 32px; color: white !important; text-decoration: none; border-radius: 8px; font-weight: 600; font-size: 16px; transition: transform 0.2s, box-shadow 0.2s; }
  .button:hover { transform: translateY(-2px); box-shadow: 0 6px 12px rgba(0, 0, 0, 0.15); }
  .link-text { word-break: break-all; color: #2563eb; text-decoration: none; background: #f0f9ff; padding: 8px 12px; border-radius: 6px; display: inline-block; margin: 8px 0; }
  .highlight-box { background: #f8fafc; padding: 20px; border-radius: 8px; margin: 24px 0; border-left: 4px solid; }
  .footer { text-align: center; margin-top: 40px; padding-top: 24px; border-top: 1px solid #e5e7eb; color: #9ca3af; font-size: 14px; }
  .support { color: #6b7280; margin-top: 16px; }
  .info-grid { display: grid; grid-template-columns: 1fr; gap: 12px; margin: 24px 0; }
  .info-item { display: flex; align-items: center; gap: 12px; }
  .icon { width: 20px; height: 20px; }
  .status-badge { display: inline-block; padding: 6px 16px; border-radius: 20px; font-weight: 600; font-size: 14px; margin: 8px 0; }
`;

const getHeaderGradient = (type: string) => {
  const gradients = {
    verify: "linear-gradient(135deg, #667eea 0%, #764ba2 100%)",
    reset: "linear-gradient(135deg, #ec4899 0%, #8b5cf6 100%)",
    payment: "linear-gradient(135deg, #10b981 0%, #059669 100%)",
    general: "linear-gradient(135deg, #3b82f6 0%, #1d4ed8 100%)",
    warning: "linear-gradient(135deg, #f59e0b 0%, #d97706 100%)",
  };
  return gradients[type as keyof typeof gradients] || gradients.general;
};

const getButtonColor = (type: string) => {
  const colors = {
    verify: "linear-gradient(135deg, #667eea 0%, #764ba2 100%)",
    reset: "linear-gradient(135deg, #ec4899 0%, #8b5cf6 100%)",
    payment: "linear-gradient(135deg, #10b981 0%, #059669 100%)",
    general: "linear-gradient(135deg, #3b82f6 0%, #1d4ed8 100%)",
  };
  return colors[type as keyof typeof colors] || colors.general;
};

const getHighlightColor = (type: string) => {
  const colors = {
    verify: "#667eea",
    reset: "#ec4899",
    payment: "#10b981",
    general: "#3b82f6",
    warning: "#f59e0b",
  };
  return colors[type as keyof typeof colors] || colors.general;
};

// Main template builder
export function buildEmailTemplate({
  type = "general",
  userName = "User",
  title,
  mainContent,
  buttonText,
  buttonLink,
  secondaryContent,
  expiryHours = 24,
  additionalInfo = [],
}: {
  type?: "verify" | "reset" | "payment" | "general" | "warning";
  userName?: string;
  title: string;
  mainContent: string;
  buttonText?: string;
  buttonLink?: string;
  secondaryContent?: string;
  expiryHours?: number;
  additionalInfo?: Array<{ icon: string; text: string }>;
}) {
  const appName = process.env.SMTP_FROM_NAME || "EduHub";
  const supportEmail = `support@${process.env.APP_URL?.replace("https://", "").replace("http://", "").split("/")[0]}`;
  const currentYear = new Date().getFullYear();
  const headerGradient = getHeaderGradient(type);
  const buttonColor = getButtonColor(type);
  const highlightColor = getHighlightColor(type);

  return `
    <!DOCTYPE html>
    <html>
    <head>
      <meta charset="utf-8">
      <meta name="viewport" content="width=device-width, initial-scale=1.0">
      <title>${title}</title>
      <style>${BASE_STYLES}</style>
    </head>
    <body>
      <div class="container">
        <div class="header" style="background: ${headerGradient};">
          <a href="${process.env.APP_URL}" class="logo">${appName}</a>
        </div>
        <div class="content">
          <h1 class="greeting">${title}</h1>
          <p class="message">Hello ${userName},</p>
          <div class="message">${mainContent}</div>
          
          ${
            additionalInfo.length > 0
              ? `
            <div class="info-grid">
              ${additionalInfo
                .map(
                  (info) => `
                <div class="info-item">
                  <span class="icon">${info.icon}</span>
                  <span>${info.text}</span>
                </div>
              `,
                )
                .join("")}
            </div>
          `
              : ""
          }
          
          ${
            buttonText && buttonLink
              ? `
            <div class="button-container">
              <a href="${buttonLink}" class="button" style="background: ${buttonColor};">
                ${buttonText}
              </a>
            </div>
          `
              : ""
          }
          
          ${
            buttonLink
              ? `
            <p class="message">Or copy and paste this link:</p>
            <a href="${buttonLink}" class="link-text">${buttonLink}</a>
          `
              : ""
          }
          
          ${
            expiryHours > 0
              ? `
            <div class="highlight-box" style="border-left-color: ${highlightColor};">
              <p><strong>⏰ Expires in ${expiryHours} hours</strong></p>
              <p>For security reasons, this link will expire after ${expiryHours} hours.</p>
            </div>
          `
              : ""
          }
          
          ${
            secondaryContent
              ? `
            <div class="message">${secondaryContent}</div>
          `
              : ""
          }
          
          <div class="footer">
            <p>${appName} &copy; ${currentYear}. All rights reserved.</p>
            <p class="support">
              Need help? Contact us at <a href="mailto:${supportEmail}">${supportEmail}</a>
            </p>
          </div>
        </div>
      </div>
    </body>
    </html>
  `;
}

// Pre-built templates
export const EMAIL_TEMPLATES = {
  verifyAccount: (userName: string, link: string) =>
    buildEmailTemplate({
      type: "verify",
      userName,
      title: "Verify Your Email Address 🔐",
      mainContent:
        "Thank you for joining us! To complete your registration and access all features, please verify your email address.",
      buttonText: "Verify Email Address",
      buttonLink: link,
      additionalInfo: [
        { icon: "✅", text: "Secure your account" },
        { icon: "🎯", text: "Access all features" },
        { icon: "🔔", text: "Receive important updates" },
      ],
      secondaryContent:
        "If you didn't create an account with us, please ignore this email.",
    }),

  resendVerification: (userName: string, link: string) =>
    buildEmailTemplate({
      type: "verify",
      userName,
      title: "Verify Your Email Address ⏰",
      mainContent:
        "We noticed you haven't verified your email yet. Click below to verify your account and get started.",
      buttonText: "Verify Now",
      buttonLink: link,
      additionalInfo: [
        { icon: "⏳", text: "Previous link expired" },
        { icon: "🔐", text: "New secure link generated" },
        { icon: "🚀", text: "Get instant access after verification" },
      ],
      secondaryContent:
        "This is a new verification link. The previous one has been invalidated.",
    }),

  passwordReset: (userName: string, link: string) =>
    buildEmailTemplate({
      type: "reset",
      userName,
      title: "Reset Your Password 🔑",
      mainContent:
        "We received a request to reset your password. Click the button below to create a new password.",
      buttonText: "Reset Password",
      buttonLink: link,
      expiryHours: 1,
      additionalInfo: [
        { icon: "🔒", text: "Secure password reset" },
        { icon: "⏱️", text: "Link expires in 1 hour" },
        { icon: "⚠️", text: "If you didn't request this, secure your account" },
      ],
      secondaryContent:
        "If you didn't request a password reset, please ignore this email or contact support if you're concerned.",
    }),

  paymentSubmitted: (
    userName: string,
    amount: number,
    paymentId: string,
    batchName: string,
  ) =>
    buildEmailTemplate({
      type: "payment",
      userName: "Admin",
      title: "New Payment Submitted for Review 💰",
      mainContent: `A new payment of <strong>$${amount.toFixed(2)}</strong> has been submitted by <strong>${userName}</strong> for batch <strong>${batchName}</strong> and requires your review.`,
      buttonText: "Review Payment",
      buttonLink: `${process.env.APP_URL}/dashboard/admin/payments/${paymentId}`,
      additionalInfo: [
        { icon: "👤", text: `Student: ${userName}` },
        { icon: "💰", text: `Amount: $${amount.toFixed(2)}` },
        { icon: "📚", text: `Batch: ${batchName}` },
        { icon: "📝", text: `Payment ID: ${paymentId}` },
        { icon: "⏳", text: "Status: Pending Review" },
        { icon: "📅", text: `Submitted: ${new Date().toLocaleDateString()}` },
      ],
      secondaryContent:
        "Please review this payment submission and approve or reject it accordingly.",
      expiryHours: 48, // Give admins 48 hours to review
    }),

  paymentApproved: (userName: string, amount: number, paymentId: string) =>
    buildEmailTemplate({
      type: "payment",
      userName,
      title: "Payment Approved! 🎉",
      mainContent: `Your payment of <strong>$${amount.toFixed(2)}</strong> has been successfully approved.`,
      additionalInfo: [
        { icon: "💰", text: `Amount: $${amount.toFixed(2)}` },
        { icon: "📝", text: `Payment ID: ${paymentId}` },
        { icon: "✅", text: "Status: Approved" },
        { icon: "📅", text: `Date: ${new Date().toLocaleDateString()}` },
      ],
      secondaryContent:
        "Thank you for your payment! You can now access your purchased content.",
    }),

  paymentRejected: (
    userName: string,
    amount: number,
    paymentId: string,
    reason?: string | null,
  ) =>
    buildEmailTemplate({
      type: "warning",
      userName,
      title: "Payment Rejected ❌",
      mainContent: `Your payment of <strong>$${amount.toFixed(2)}</strong> has been rejected.${reason ? ` Reason: ${reason}` : ""}`,
      additionalInfo: [
        { icon: "💰", text: `Amount: $${amount.toFixed(2)}` },
        { icon: "📝", text: `Payment ID: ${paymentId}` },
        { icon: "❌", text: "Status: Rejected" },
        { icon: "📅", text: `Date: ${new Date().toLocaleDateString()}` },
      ],
      secondaryContent:
        "Please contact our support team for assistance or try again with a different payment method.",
    }),
};
