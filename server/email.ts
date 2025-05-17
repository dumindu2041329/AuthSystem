import sgMail from '@sendgrid/mail';

// Initialize SendGrid with API key
if (!process.env.SENDGRID_API_KEY) {
  console.warn('SENDGRID_API_KEY not found. Email sending will not work.');
} else {
  sgMail.setApiKey(process.env.SENDGRID_API_KEY);
  console.log('SendGrid initialized successfully');
}

// Email sending interface
export interface EmailOptions {
  to: string;
  subject: string;
  text?: string;
  html?: string;
  from?: string;
}

/**
 * Send an email using SendGrid
 */
export async function sendEmail(options: EmailOptions): Promise<boolean> {
  try {
    const { to, subject, text, html, from } = options;
    
    // You must verify this email address in your SendGrid account
    // before it can be used as a sender
    const fromEmail = from || 'dumindudamsara60@gmail.com';
    
    // Prepare email message
    const msg = {
      to,
      from: fromEmail,
      subject,
      text: text || '',
      html: html || '',
    };
    
    // Send email
    await sgMail.send(msg);
    console.log(`Email sent successfully to ${to}`);
    return true;
  } catch (error: any) {
    console.error('Error sending email:', error);
    if (error.response && typeof error.response === 'object') {
      console.error('SendGrid API error:', error.response.body);
    }
    return false;
  }
}

