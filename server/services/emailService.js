const nodemailer = require('nodemailer');
const crypto = require('crypto');

// Create reusable transporter
const createTransporter = () => {
  return nodemailer.createTransporter({
    host: process.env.SMTP_HOST || 'smtp.gmail.com',
    port: parseInt(process.env.SMTP_PORT || '587'),
    secure: false, // true for 465, false for other ports
    auth: {
      user: process.env.SMTP_USER,
      pass: process.env.SMTP_PASS,
    },
  });
};

// Generate secure token for meeting responses
const generateResponseToken = () => {
  return crypto.randomBytes(32).toString('hex');
};

// Create HTML email template for meeting proposal
const createProposalEmailTemplate = (proposal, token, baseUrl) => {
  const { proposedBy, title, description, proposedDate, proposedTime, groupName } = proposal;

  return `
<!DOCTYPE html>
<html>
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <style>
    body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif; line-height: 1.6; color: #333; margin: 0; padding: 0; background-color: #f4f4f4; }
    .container { max-width: 600px; margin: 20px auto; background: white; border-radius: 8px; overflow: hidden; box-shadow: 0 2px 4px rgba(0,0,0,0.1); }
    .header { background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); color: white; padding: 30px 20px; text-align: center; }
    .header h1 { margin: 0; font-size: 24px; }
    .content { padding: 30px 20px; }
    .meeting-details { background: #f8f9fa; border-left: 4px solid #667eea; padding: 15px; margin: 20px 0; border-radius: 4px; }
    .meeting-details strong { color: #667eea; }
    .buttons { margin: 30px 0; text-align: center; }
    .button { display: inline-block; padding: 12px 30px; margin: 5px; text-decoration: none; border-radius: 6px; font-weight: 600; font-size: 14px; transition: transform 0.2s; }
    .button:hover { transform: translateY(-2px); }
    .btn-yes { background-color: #10b981; color: white; }
    .btn-no { background-color: #ef4444; color: white; }
    .btn-alternate { background-color: #f59e0b; color: white; }
    .footer { background: #f8f9fa; padding: 20px; text-align: center; font-size: 12px; color: #6b7280; }
    .footer a { color: #667eea; text-decoration: none; }
  </style>
</head>
<body>
  <div class="container">
    <div class="header">
      <h1>📅 Meeting Time Proposal</h1>
    </div>
    <div class="content">
      <p><strong>${proposedBy}</strong> has proposed a meeting time for <strong>${groupName}</strong></p>

      <div class="meeting-details">
        <p><strong>📝 Title:</strong> ${title}</p>
        ${description ? `<p><strong>📄 Description:</strong> ${description}</p>` : ''}
        <p><strong>📅 Proposed Date:</strong> ${new Date(proposedDate).toLocaleDateString('en-US', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}</p>
        <p><strong>🕐 Proposed Time:</strong> ${proposedTime}</p>
      </div>

      <p style="margin-top: 25px; font-size: 16px;">Can you make it?</p>

      <div class="buttons">
        <a href="${baseUrl}/api/meetings/respond?token=${token}&response=yes" class="button btn-yes">
          ✅ Yes, I can attend
        </a>
        <a href="${baseUrl}/api/meetings/respond?token=${token}&response=no" class="button btn-no">
          ❌ No, I can't attend
        </a>
        <a href="${baseUrl}/meeting-response?token=${token}" class="button btn-alternate">
          🔄 Propose Alternate Time
        </a>
      </div>

      <p style="font-size: 13px; color: #6b7280; margin-top: 30px;">
        Your response will be shared with the group organizer to help coordinate the best time for everyone.
      </p>
    </div>
    <div class="footer">
      <p>Sent via <a href="#">Blue Moon Scheduler</a></p>
      <p>This is an automated message. Please do not reply to this email.</p>
    </div>
  </div>
</body>
</html>
  `;
};

// Send meeting proposal email
const sendProposalEmail = async (recipientEmail, recipientName, proposal, token) => {
  const transporter = createTransporter();
  const baseUrl = process.env.BASE_URL || 'http://localhost:3001';

  const mailOptions = {
    from: process.env.FROM_EMAIL || '"Blue Moon Scheduler" <noreply@bluemoon.com>',
    to: recipientEmail,
    subject: `Meeting Proposal: ${proposal.title}`,
    html: createProposalEmailTemplate(proposal, token, baseUrl),
  };

  try {
    const info = await transporter.sendMail(mailOptions);
    console.log(`Proposal email sent to ${recipientEmail}: ${info.messageId}`);
    return { success: true, messageId: info.messageId };
  } catch (error) {
    console.error(`Failed to send email to ${recipientEmail}:`, error);
    throw error;
  }
};

// Send confirmation email after response
const sendResponseConfirmation = async (recipientEmail, recipientName, proposal, response) => {
  const transporter = createTransporter();

  const responseText =
    response === 'yes' ? '✅ You accepted the meeting invitation' :
    response === 'no' ? '❌ You declined the meeting invitation' :
    '🔄 You proposed an alternate time';

  const mailOptions = {
    from: process.env.FROM_EMAIL || '"Blue Moon Scheduler" <noreply@bluemoon.com>',
    to: recipientEmail,
    subject: `Response Confirmed: ${proposal.title}`,
    html: `
<!DOCTYPE html>
<html>
<head>
  <style>
    body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
    .container { max-width: 600px; margin: 20px auto; padding: 20px; background: white; border-radius: 8px; }
    .header { text-align: center; margin-bottom: 20px; }
    .content { padding: 20px; background: #f8f9fa; border-radius: 4px; }
  </style>
</head>
<body>
  <div class="container">
    <div class="header">
      <h2>Response Confirmed</h2>
    </div>
    <div class="content">
      <p>Hi ${recipientName},</p>
      <p>${responseText}</p>
      <p><strong>Meeting:</strong> ${proposal.title}</p>
      <p><strong>Date:</strong> ${new Date(proposal.proposedDate).toLocaleDateString()}</p>
      <p><strong>Time:</strong> ${proposal.proposedTime}</p>
      <p>The organizer has been notified of your response.</p>
    </div>
  </div>
</body>
</html>
    `,
  };

  try {
    await transporter.sendMail(mailOptions);
    console.log(`Confirmation email sent to ${recipientEmail}`);
  } catch (error) {
    console.error(`Failed to send confirmation to ${recipientEmail}:`, error);
  }
};

module.exports = {
  sendProposalEmail,
  sendResponseConfirmation,
  generateResponseToken,
};
