const nodemailer = require('nodemailer');

/**
 * Email Service Configuration
*/
const emailConfig = {
	host: process.env.EMAIL_HOST || "smtp.gmail.com",
	port: process.env.EMAIL_PORT || 587,
	secure: false, // true for 465, false for other ports
    auth: {
        user: process.env.EMAIL_USER,
        pass: process.env.EMAIL_PASSWORD,
    },
};

/**
 * Create email transporter
*/
const createTransporter = () => {
    if (!process.env.EMAIL_USER || !process.env.EMAIL_PASSWORD) {
        console.warn('-- Email credentials not configured');
        return null;
    }

    return nodemailer.createTransport(emailConfig);
};

/**
 * Send password reset email
*/
const sendPasswordResetEmail = async (email, resetToken) => {
    const transporter = createTransporter();

    if (!transporter) {
        console.log('Email not sent: Email service not configured');
        return {
            success: false,
            message: 'Email service not configured',
        };
    }

    const resetUrl = `${process.env.FRONTEND_URL}/reset-password=${resetToken}`;

    const mailOptions = {
        from: `"${process.env.APP_NAME || 'News Aggregator'}" <${process.env.EMAIL_FROM || process.env.EMAIL_USER}>`,
        to: email,
        subject: 'Password Reset Request',
        html: `
            <!DOCTYPE html>
            <html>
            <head>
                <style>
                    body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
                    .container { max-width: 600px; margin: 0 auto; padding: 20px; }
                    .header { background: #4CAF50; color: white; padding: 20px; text-align: center; }
                    .content { padding: 20px; background: #f9f9f9; }
                    .button { display: inline-block; padding: 12px 24px; background: #4CAF50; color: white; text-decoration: none; border-radius: 4px; margin: 20px 0; }
                    .footer { text-align: center; padding: 20px; color: #666; font-size: 12px; }
                </style>
            </head>
            <body>
                <div class="container">
                    <div class="header">
                        <h1>Password Reset Request</h1>
                    </div>
                    <div class="content">
                        <p>Hello,</p>
                        <p>You requested to reset your password for your News Aggregator account.</p>
                        <p>Click the button below to reset your password:</p>
                        <a href="${resetUrl}" class="button">Reset Password</a>
                        <p>Or copy and paste this link into your browser:</p>
                        <p style="word-break: break-all;">${resetUrl}</p>
                        <p><strong>This link will expire in 1 hour.</strong></p>
                        <p>If you didn't request this, please ignore this email.</p>
                    </div>
                    <div class="footer">
                        <p>© ${new Date().getFullYear()} News Aggregator. All rights reserved.</p>
                    </div>
                </div>
            </body>
            </html>
        `,
        text: `
            Password Reset Request
            
            You requested to reset your password for your News Aggregator account.
            
            Click this link to reset your password:
            ${resetUrl}
            
            This link will expire in 1 hour.
            
            If you didn't request this, please ignore this email.
        `,
    };

    try {
        await transporter.sendMail(mailOptions);
        console.log(`-- Password reset email sent to ${email}`);
        return {
            success: true,
            message: 'Email sent successfully',
        };
    } catch (error) {
        console.error('-- Error sending email:', error);
        return {
            success: false,
            message: error.message,
        };
    };
};

/**
 * Send welcome email to new users
*/
const sendWelcomeEmail = async (email, name) => {
    const transporter = createTransporter();

    if (!transporter) {
        return {
            success: false,
            message: 'Email service not configured',
        };
    }

    const mailOptions = {
        from: `"${process.env.APP_NAME || 'News Aggregator'}" <${process.env.EMAIL_FROM || process.env.EMAIL_USER}>`,
        to: email,
        subject: 'Welcome to News Aggregator!',
        html: `
            <!DOCTYPE html>
            <html>
            <head>
                <style>
                    body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
                    .container { max-width: 600px; margin: 0 auto; padding: 20px; }
                    .header { background: #4CAF50; color: white; padding: 20px; text-align: center; }
                    .content { padding: 20px; background: #f9f9f9; }
                    .footer { text-align: center; padding: 20px; color: #666; font-size: 12px; }
                </style>
            </head>
            <body>
                <div class="container">
                    <div class="header">
                        <h1>Welcome to News Aggregator! 🎉</h1>
                    </div>
                    <div class="content">
                        <p>Hi ${name},</p>
                        <p>Thank you for joining News Aggregator!</p>
                        <p>You can now:</p>
                        <ul>
                            <li>Browse articles from multiple news sources</li>
                            <li>Save your favorite articles</li>
                            <li>Customize your news preferences</li>
                            <li>Get personalized news recommendations</li>
                        </ul>
                        <p>Start exploring news from around the world!</p>
                    </div>
                    <div class="footer">
                        <p>© ${new Date().getFullYear()} News Aggregator. All rights reserved.</p>
                    </div>
                </div>
            </body>
            </html>
        `,
    };

    try {
        await transporter.sendMail(mailOptions);
        return {
            success: true,
            message: 'Welcome email sent',
        };
    } catch (error) {
        console.error('Error sending welcome email: ', error);
        return {
            success: false,
            message: error.message,
        };
    };
};

/**
 * Test email configuration
*/
const testEmailConfig = async () => {
    const transporter = createTransporter();

    if (!transporter) {
        return {
            success: false,
            message: 'Email service not configured',
        };
    }

    try {
        await transporter.verify();
        console.log('-- Email config is valid');
        return {
            success: true,
            message: 'Email config is valid',
        };
    } catch (error) {
        console.error('-- Email configuration error:', error);
        return { 
            success: false, 
            message: error.message 
        };
    };
};

module.exports = {
    sendPasswordResetEmail,
    sendWelcomeEmail,
    testEmailConfig,
};