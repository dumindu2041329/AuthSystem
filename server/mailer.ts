import nodemailer from 'nodemailer';

// Create a transporter for sending emails
// This is using a test account for demo purposes
// For production, you would use your own email service credentials
let transporter: nodemailer.Transporter;

// Initialize the email transporter
async function initializeTransporter() {
  try {
    // Create a test account on Ethereal (for demo purposes)
    // This allows sending real emails to a test inbox
    const testAccount = await nodemailer.createTestAccount();
    
    console.log('Created test email account:', testAccount.user);
    console.log('Test account password:', testAccount.pass);
    
    // Create a transporter using the test account
    transporter = nodemailer.createTransport({
      host: 'smtp.ethereal.email',
      port: 587,
      secure: false, // true for 465, false for other ports
      auth: {
        user: testAccount.user,
        pass: testAccount.pass
      }
    });
    
    console.log('Nodemailer initialized with Ethereal test account');
    return true;
  } catch (error) {
    console.error('Failed to create test email account:', error);
    return false;
  }
}

// Initialize the transporter when this module is loaded
initializeTransporter().catch(console.error);

// Interface for email options
interface EmailOptions {
  to: string;
  subject: string;
  text?: string;
  html?: string;
  from?: string;
}

/**
 * Send an email using Nodemailer and Ethereal test accounts
 */
export async function sendEmail(options: EmailOptions): Promise<{success: boolean, previewUrl?: string}> {
  try {
    // Make sure transporter is initialized
    if (!transporter) {
      console.log('Initializing email transporter');
      await initializeTransporter();
    }
    
    const { to, subject, text, html, from } = options;
    
    // Default sender address
    const fromEmail = from || 'passwordreset@portfolio-app.com';
    
    // Send the email
    const info = await transporter.sendMail({
      from: fromEmail,
      to,
      subject,
      text: text || '',
      html: html || ''
    });
    
    console.log('Message sent: %s', info.messageId);
    
    // Preview URL for Ethereal test accounts
    // This is a special feature that allows viewing the sent email in a browser
    const previewUrl = nodemailer.getTestMessageUrl(info);
    console.log('Preview URL: %s', previewUrl);
    
    return { 
      success: true,
      previewUrl: previewUrl as string 
    };
  } catch (error) {
    console.error('Error sending email:', error);
    return { success: false };
  }
}

