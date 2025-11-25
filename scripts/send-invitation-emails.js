// scripts/send-invitation-emails.js
import { Resend } from 'resend';
import { createClerkClient } from '@clerk/backend';
import * as dotenv from 'dotenv';
import { promises as fs } from 'fs';
import path from 'path';

// Load environment variables
dotenv.config({ path: '.env' });

const resend = new Resend(process.env.RESEND_API_KEY);
const clerkClient = createClerkClient({ secretKey: process.env.CLERK_SECRET_KEY });
const TRACKING_FILE = path.join(process.cwd(), 'email-tracking.json');
const BATCH_SIZE = 100;
const DELAY_BETWEEN_EMAILS = 1000; // 1 second delay to avoid rate limits

// Email template (latest draft from test-email.js)
function getEmailHTML(firstName = '') {
  const greeting = firstName ? `Hi ${firstName},` : 'Hi there,';

  return `
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

          <p>${greeting}</p>

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
  `;
}

// Load tracking data
async function loadTrackingData() {
  try {
    const data = await fs.readFile(TRACKING_FILE, 'utf-8');
    return JSON.parse(data);
  } catch (error) {
    if (error.code === 'ENOENT') {
      // File doesn't exist, return empty tracking data
      return {
        sentEmails: [],
        batches: [],
        lastUpdated: null
      };
    }
    throw error;
  }
}

// Save tracking data
async function saveTrackingData(data) {
  data.lastUpdated = new Date().toISOString();
  await fs.writeFile(TRACKING_FILE, JSON.stringify(data, null, 2));
}

// Fetch all users from Clerk
async function fetchAllClerkUsers() {
  console.log('📥 Fetching all users from Clerk...');
  const allUsers = [];
  let offset = 0;
  const limit = 100; // Clerk's pagination limit

  while (true) {
    const response = await clerkClient.users.getUserList({
      limit,
      offset
    });

    allUsers.push(...response.data);

    console.log(`   Fetched ${allUsers.length} users so far...`);

    // Check if we've fetched all users
    if (response.data.length < limit) {
      break;
    }

    offset += limit;
  }

  console.log(`✅ Total users in Clerk: ${allUsers.length}`);
  return allUsers;
}

// Send email to a single user
async function sendEmail(user) {
  const email = user.emailAddresses.find(e => e.id === user.primaryEmailAddressId);
  if (!email) {
    throw new Error('No primary email address found');
  }

  const emailPayload = {
    from: 'hello@connectingclimateminds.org',
    to: email.emailAddress,
    subject: 'Your Connecting Climate Minds Hub Just Got an Upgrade',
    html: getEmailHTML(user.firstName),
  };

  const { data, error } = await resend.emails.send(emailPayload);

  if (error) {
    throw error;
  }

  return {
    emailId: data.id,
    emailAddress: email.emailAddress
  };
}

// Delay helper
function delay(ms) {
  return new Promise(resolve => setTimeout(resolve, ms));
}

// Main function
async function main() {
  const args = process.argv.slice(2);
  const dryRun = args.includes('--dry-run');
  const batchCount = args.includes('--batch') ? parseInt(args[args.indexOf('--batch') + 1]) || 1 : 2;

  console.log('🚀 Invitation Email Sender');
  console.log('='.repeat(50));
  console.log(`Mode: ${dryRun ? '🔍 DRY RUN' : '📧 LIVE'}`);
  console.log(`Batches to send: ${batchCount}`);
  console.log(`Batch size: ${BATCH_SIZE} users`);
  console.log('='.repeat(50));
  console.log();

  // Load tracking data
  const tracking = await loadTrackingData();
  console.log(`📊 Previously sent emails: ${tracking.sentEmails.length}`);
  console.log(`📊 Previous batches: ${tracking.batches.length}`);
  console.log();

  // Fetch all users from Clerk
  const allUsers = await fetchAllClerkUsers();

  // Filter out users who already received emails
  const sentEmailAddresses = new Set(tracking.sentEmails.map(e => e.emailAddress));
  const remainingUsers = allUsers.filter(user => {
    const email = user.emailAddresses.find(e => e.id === user.primaryEmailAddressId);
    return email && !sentEmailAddresses.has(email.emailAddress);
  });

  console.log(`✅ Users who haven't received emails: ${remainingUsers.length}`);
  console.log();

  if (remainingUsers.length === 0) {
    console.log('🎉 All users have already received invitation emails!');
    return;
  }

  // Calculate how many users to send to
  const usersToSend = remainingUsers.slice(0, BATCH_SIZE * batchCount);

  console.log(`📬 Will send to ${usersToSend.length} users across ${batchCount} batch(es)`);
  console.log();

  if (dryRun) {
    console.log('🔍 DRY RUN - Preview of recipients:');
    console.log('='.repeat(50));
    usersToSend.slice(0, 10).forEach((user, i) => {
      const email = user.emailAddresses.find(e => e.id === user.primaryEmailAddressId);
      console.log(`${i + 1}. ${user.firstName || 'No name'} ${user.lastName || ''} - ${email.emailAddress}`);
    });
    if (usersToSend.length > 10) {
      console.log(`... and ${usersToSend.length - 10} more users`);
    }
    console.log();
    console.log('💡 Run without --dry-run to send emails');
    return;
  }

  // Send emails in batches
  let totalSent = 0;
  let totalFailed = 0;

  for (let batchNum = 0; batchNum < batchCount; batchNum++) {
    const batchStart = batchNum * BATCH_SIZE;
    const batchEnd = Math.min(batchStart + BATCH_SIZE, usersToSend.length);
    const batch = usersToSend.slice(batchStart, batchEnd);

    console.log(`📤 Sending Batch ${batchNum + 1}/${batchCount} (${batch.length} users)`);
    console.log('='.repeat(50));

    const batchResults = {
      batchNumber: tracking.batches.length + batchNum + 1,
      timestamp: new Date().toISOString(),
      sent: [],
      failed: []
    };

    for (let i = 0; i < batch.length; i++) {
      const user = batch[i];
      const email = user.emailAddresses.find(e => e.id === user.primaryEmailAddressId);

      try {
        console.log(`  [${i + 1}/${batch.length}] Sending to ${email.emailAddress}...`);
        const result = await sendEmail(user);

        const sentRecord = {
          userId: user.id,
          emailAddress: result.emailAddress,
          emailId: result.emailId,
          timestamp: new Date().toISOString(),
          batch: batchResults.batchNumber
        };

        tracking.sentEmails.push(sentRecord);
        batchResults.sent.push(sentRecord);
        totalSent++;

        console.log(`  ✅ Sent (Email ID: ${result.emailId})`);

        // Delay between emails to avoid rate limits
        if (i < batch.length - 1) {
          await delay(DELAY_BETWEEN_EMAILS);
        }
      } catch (error) {
        const failedRecord = {
          userId: user.id,
          emailAddress: email.emailAddress,
          error: error.message,
          timestamp: new Date().toISOString(),
          batch: batchResults.batchNumber
        };

        batchResults.failed.push(failedRecord);
        totalFailed++;

        console.log(`  ❌ Failed: ${error.message}`);
      }
    }

    tracking.batches.push(batchResults);
    await saveTrackingData(tracking);

    console.log();
    console.log(`✅ Batch ${batchNum + 1} complete: ${batchResults.sent.length} sent, ${batchResults.failed.length} failed`);
    console.log();

    // Add delay between batches
    if (batchNum < batchCount - 1) {
      console.log('⏳ Waiting 5 seconds before next batch...');
      await delay(5000);
      console.log();
    }
  }

  // Final summary
  console.log('='.repeat(50));
  console.log('📊 FINAL SUMMARY');
  console.log('='.repeat(50));
  console.log(`Total emails sent: ${totalSent}`);
  console.log(`Total failures: ${totalFailed}`);
  console.log(`Remaining users: ${remainingUsers.length - usersToSend.length}`);
  console.log(`Total emails sent (all time): ${tracking.sentEmails.length}`);
  console.log(`Total batches (all time): ${tracking.batches.length}`);
  console.log();
  console.log(`📁 Tracking file: ${TRACKING_FILE}`);
  console.log('✅ Done!');
}

// Run the script
main().catch(error => {
  console.error('💥 Fatal error:', error);
  process.exit(1);
});
