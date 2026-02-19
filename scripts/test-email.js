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

    const emailPayload = {
      from: 'hello@connectingclimateminds.org',
      to: 'amit2@pm.me',
      subject: 'Your Connecting Climate Minds Hub Just Got an Upgrade',
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
                background: #ffffff;
                margin: 0;
                padding: 20px;
              }
              .container {
                max-width: 600px;
                margin: 0 auto;
                background: #ffffff;
                border-radius: 8px;
                padding: 40px;
              }
              .logo {
                text-align: center;
                margin-bottom: 32px;
                background: #ffffff;
                padding: 20px;
              }
              .logo img {
                max-width: 250px;
                height: auto;
              }
              h1 {
                color: #1a1a1a;
                margin: 0 0 24px 0;
                font-size: 24px;
                font-weight: 600;
              }
              p {
                margin: 16px 0;
                color: #333;
              }
              .button {
                display: inline-block;
                padding: 14px 32px;
                background: #003366;
                color: white !important;
                text-decoration: none;
                border-radius: 6px;
                margin: 24px 0;
                font-weight: 600;
              }
              .highlight {
                background: #f0f9ff;
                border-left: 4px solid #003366;
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
                color: #333;
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
              <div class="logo">
                <img src="https://res.cloudinary.com/ccm-media/image/upload/v1710300030/FINAL_LOGO_-_navy_wzutxa.png" alt="Connecting Climate Minds">
              </div>

              <p>Hi there,</p>

              <p>We're excited to share that the Connecting Climate Minds Hub has received a major upgrade. The platform is now faster, smoother, and equipped with helpful new features to make connecting and collaborating even easier.</p>

              <p>Your account is already set up on the new platform. We'd love for you to pop in and complete your profile so you can fully join a growing community of people working together to address the rising impacts of the climate crisis on mental health worldwide.</p>

              <div class="highlight">
                <strong>Your login details haven't changed</strong><br>
                You can sign in with your usual email and password.
              </div>

              <h3>What's new?</h3>
              <ul>
                <li>Enhanced collaboration tools for richer community engagement</li>
                <li>Improved profiles to showcase your work and expertise</li>
                <li>Faster performance and a more streamlined experience</li>
                <li>New community features to connect with climate minds globally</li>
                <li>...and more features coming soon!</li>
              </ul>

              <center>
                <a href="https://hub.connectingclimateminds.org/sign-in" class="button">
                  Sign in to the Hub
                </a>
              </center>

              <p>We invite you to explore the refreshed platform and discover how these updates can make your experience smoother, more connected, and genuinely enjoyable.</p>

              <p>If you have questions or need a hand, feel free to reach out to Amit at support@spiro-spero.zone.</p>

              <p style="margin-top: 32px;">Warmly,<br>The Connecting Climate Minds Team</p>
            </div>
          </body>
        </html>
      `,
    };

    const { data, error } = await resend.emails.send(emailPayload);

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
