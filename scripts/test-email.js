// scripts/test-email.js
import { Resend } from 'resend';
import * as dotenv from 'dotenv';

// Load environment variables
dotenv.config({ path: '.env' });

const resend = new Resend(process.env.RESEND_API_KEY);

async function sendTestEmail() {
  try {
    // Use production URL or fallback to NEXT_PUBLIC_SITE_URL
    const appUrl = process.env.NEXT_PUBLIC_APP_URL || process.env.NEXT_PUBLIC_SITE_URL || 'https://connectingclimateminds.org';

    const { data, error } = await resend.emails.send({
      from: 'Spiro Spero <[email protected]>',
      to: 'amit2@pm.me',
      replyTo: 'support@spiro-spero.zone',
      subject: '🎉 Welcome to the Upgraded Connecting Climate Minds Hub!',
      html: `
        <!DOCTYPE html>
        <html>
          <head>
            <meta charset="utf-8">
            <meta name="viewport" content="width=device-width, initial-scale=1.0">
            <style>
              body {
                font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
                line-height: 1.6;
                color: #333;
                background: #f5f5f5;
                margin: 0;
                padding: 20px;
              }
              .container {
                max-width: 600px;
                margin: 0 auto;
                background: #ffffff;
                border-radius: 8px;
                padding: 40px;
                box-shadow: 0 2px 8px rgba(0,0,0,0.1);
              }
              h1 {
                color: #1a1a1a;
                margin: 0 0 24px 0;
                font-size: 28px;
              }
              .button {
                display: inline-block;
                padding: 14px 32px;
                background: #0070f3;
                color: white !important;
                text-decoration: none;
                border-radius: 6px;
                margin: 24px 0;
                font-weight: 600;
              }
              .highlight {
                background: #f0f9ff;
                border-left: 4px solid #0070f3;
                padding: 16px;
                margin: 20px 0;
                border-radius: 4px;
              }
              ul {
                padding-left: 24px;
                margin: 16px 0;
              }
              li {
                margin: 12px 0;
              }
              .footer {
                margin-top: 40px;
                padding-top: 24px;
                border-top: 1px solid #e5e5e5;
                font-size: 14px;
                color: #666;
              }
            </style>
          </head>
          <body>
            <div class="container">
              <h1>🌍 Welcome to the Upgraded Hub!</h1>

              <p>Hi there,</p>

              <p>We've upgraded the <strong>Connecting Climate Minds Hub</strong> with exciting new features and improvements! Your account has been successfully migrated to our enhanced platform.</p>

              <div class="highlight">
                <strong>✅ Your login credentials remain the same</strong><br>
                Use your existing email and password to sign in.
              </div>

              <h3>What's new in Collaborate?</h3>
              <ul>
                <li><strong>Enhanced collaboration features</strong> for better community engagement</li>
                <li><strong>Improved profile system</strong> to showcase your work and expertise</li>
                <li><strong>Better performance</strong> and streamlined user experience</li>
                <li><strong>New community tools</strong> to connect with climate minds globally</li>
              </ul>

              <center>
                <a href="${appUrl}/sign-in" class="button">
                  Sign In to the Hub →
                </a>
              </center>

              <p>We invite you to explore the upgraded Collaborate section and discover how these improvements can enhance your experience connecting with the global climate community.</p>

              <p>If you experience any issues or have questions, our support team is here to help!</p>

              <div class="footer">
                <p><strong>The Spiro Spero Team</strong></p>
                <p style="font-size: 12px; color: #999;">
                  Questions or need help? Contact us at <a href="mailto:support@spiro-spero.zone">support@spiro-spero.zone</a>
                </p>
              </div>
            </div>
          </body>
        </html>
      `,
    });

    if (error) {
      console.error('❌ Error:', error);
      return;
    }

    console.log('✅ Test email sent successfully!');
    console.log('📧 Email ID:', data.id);
    console.log('📬 Sent to: amit2@pm.me');
    console.log(`🔗 Sign-in URL used: ${appUrl}/sign-in`);
  } catch (error) {
    console.error('💥 Failed to send test email:', error);
  }
}

sendTestEmail();
