// scripts/migrate-to-clerk.js
/**
 * Comprehensive User Migration Script: Supabase → Clerk
 * For Connecting Climate Minds Hub
 *
 * Features:
 * - Migrates users from Supabase Auth to Clerk
 * - Preserves bcrypt password hashes
 * - Downloads and uploads profile images
 * - Syncs user data to Prisma database
 * - Sends welcome emails via Resend
 * - Handles rate limiting and retries
 * - Dry run and test modes
 */

import fs from 'fs';
import path from 'path';
import { createClerkClient } from '@clerk/backend';
import { Resend } from 'resend';
import { PrismaClient } from '../generated/prisma/index.js';
import * as dotenv from 'dotenv';
import fetch from 'node-fetch';

// Load environment variables
dotenv.config({ path: '.env' });

// ============ CONFIGURATION ============
const CONFIG = {
  DRY_RUN: process.env.DRY_RUN === 'true',
  TEST_LIMIT: process.env.TEST_LIMIT ? parseInt(process.env.TEST_LIMIT) : null,
  DELAY_MS: parseInt(process.env.DELAY_MS || '1500'), // Delay between requests (1.5s default)
  RETRY_DELAY_MS: parseInt(process.env.RETRY_DELAY_MS || '12000'), // Rate limit retry delay (12s)
  MAX_RETRIES: parseInt(process.env.MAX_RETRIES || '3'),
  SEND_EMAILS: process.env.SEND_EMAILS !== 'false', // Default true
  SKIP_IMAGES: process.env.SKIP_IMAGES === 'true', // Skip image processing
  APP_URL: process.env.NEXT_PUBLIC_APP_URL || process.env.NEXT_PUBLIC_SITE_URL || 'https://connectingclimateminds.org',
  INPUT_FILE: process.env.INPUT_FILE || 'supabase-users.json',
};

// Initialize clients
const clerk = CONFIG.DRY_RUN ? null : createClerkClient({ secretKey: process.env.CLERK_SECRET_KEY });
const resend = CONFIG.DRY_RUN ? null : new Resend(process.env.RESEND_API_KEY);
const prisma = CONFIG.DRY_RUN ? null : new PrismaClient();

// ============ MIGRATION STATS ============
const stats = {
  total: 0,
  successful: 0,
  failed: 0,
  skipped: 0,
  emailsSent: 0,
  emailsFailed: 0,
  imagesUploaded: 0,
  imagesFailed: 0,
  startTime: new Date(),
};

// ============ ERROR LOGGING ============
const errors = [];
const logFile = `migration-log-${new Date().toISOString().replace(/:/g, '-')}.json`;

function logError(userId, email, error, context = '') {
  const errorEntry = {
    userId,
    email,
    context,
    error: error.message || error,
    stack: error.stack,
    timestamp: new Date().toISOString(),
  };
  errors.push(errorEntry);
  console.error(`  ❌ Error [${context}]: ${error.message}`);
}

// ============ ENUM MAPPING HELPERS ============
function mapAgeRange(ageRange) {
  if (!ageRange) return null;
  const lower = ageRange.toLowerCase();
  if (lower.includes('under') || lower.includes('<18') || lower.includes('< 18')) {
    return 'UNDER_18';
  }
  return 'ABOVE_18';
}

function mapLanguage(lang) {
  if (!lang) return 'EN';
  const langMap = {
    'en': 'EN',
    'english': 'EN',
    'es': 'ES',
    'spanish': 'ES',
    'español': 'ES',
    'fr': 'FR',
    'french': 'FR',
    'français': 'FR',
    'ar': 'AR',
    'arabic': 'AR',
    'عربي': 'AR',
  };
  return langMap[lang.toLowerCase()] || 'EN';
}

function mapWorkTypes(typesOfWork) {
  if (!Array.isArray(typesOfWork)) return [];

  const workTypeMap = {
    'research': 'RESEARCH',
    'policy': 'POLICY',
    'lived experience expert': 'LIVED_EXPERIENCE_EXPERT',
    'lived_experience_expert': 'LIVED_EXPERIENCE_EXPERT',
    'ngo': 'NGO',
    'community organization': 'COMMUNITY_ORGANIZATION',
    'community_organization': 'COMMUNITY_ORGANIZATION',
    'education': 'EDUCATION_TEACHING',
    'teaching': 'EDUCATION_TEACHING',
    'education_teaching': 'EDUCATION_TEACHING',
    'education/teaching': 'EDUCATION_TEACHING',
  };

  return typesOfWork
    .map(type => workTypeMap[type.toLowerCase().trim()])
    .filter(Boolean);
}

function mapExpertiseAreas(expertise) {
  if (!Array.isArray(expertise)) return [];

  const expertiseMap = {
    'climate change': 'CLIMATE_CHANGE',
    'climate_change': 'CLIMATE_CHANGE',
    'climate': 'CLIMATE_CHANGE',
    'mental health': 'MENTAL_HEALTH',
    'mental_health': 'MENTAL_HEALTH',
    'health': 'HEALTH',
    'education': 'EDUCATION',
    'social justice': 'SOCIAL_JUSTICE',
    'social_justice': 'SOCIAL_JUSTICE',
  };

  return expertise
    .map(area => expertiseMap[area.toLowerCase().trim()])
    .filter(Boolean);
}

function mapRole(authRole, isSuperAdmin) {
  if (isSuperAdmin) return 'admin';
  if (!authRole) return 'community_member';

  const roleMap = {
    'admin': 'admin',
    'team_editor': 'team_editor',
    'community_editor': 'community_editor',
    'community_member': 'community_member',
    'authenticated': 'community_member', // Default Supabase role
  };

  return roleMap[authRole.toLowerCase()] || 'community_member';
}

function buildOtherSocialLinks(user) {
  const links = {};

  if (user.twitter) links.twitter = user.twitter;
  if (user.website_blog) links.blog = user.website_blog;

  return Object.keys(links).length > 0 ? links : null;
}

function calculateProfileCompleteness(user) {
  const fields = [
    user.firstName,
    user.lastName,
    user.imageUrl,
    user.country,
    user.city_town,
    user.organization,
    user.position,
    user.work_bio,
    user.types_of_work?.length > 0,
    user.expertise?.length > 0,
  ];

  const filled = fields.filter(Boolean).length;
  return Math.round((filled / fields.length) * 100);
}

// ============ DATA TRANSFORMATION ============
function transformSupabaseUser(supabaseUser) {
  // Get data from raw_user_meta_data or top-level fields
  const firstName = supabaseUser.first_name || supabaseUser.raw_user_meta_data?.first_name;
  const lastName = supabaseUser.last_name || supabaseUser.raw_user_meta_data?.last_name;
  const email = supabaseUser.email || supabaseUser.raw_user_meta_data?.email;

  return {
    // Core identity
    supabaseId: supabaseUser.user_id,
    email: email,
    firstName: firstName || null,
    lastName: lastName || null,
    username: supabaseUser.username || null,

    // Password (bcrypt hash)
    passwordHash: supabaseUser.encrypted_password,

    // Profile image
    imageUrl: supabaseUser.avatar_url || supabaseUser.profile_pic || null,

    // Location
    country: supabaseUser.country || null,
    cityTown: supabaseUser.city_town || null,

    // Professional info
    organization: supabaseUser.organization || null,
    position: supabaseUser.position || null,
    workBio: supabaseUser.work_bio || null,
    typesOfWork: supabaseUser.types_of_work || [],
    expertise: supabaseUser.expertise || [],

    // Social links
    linkedin: supabaseUser.linkedin || null,
    twitter: supabaseUser.twitter || null,
    website: supabaseUser.website || null,
    websiteBlog: supabaseUser.website_blog || null,

    // Settings
    ageRange: supabaseUser.age_range || null,
    lang: supabaseUser.lang || 'en',
    publicEmail: supabaseUser.public_email || false,
    newsletter: supabaseUser.newsletter || false,
    shareWithAffiliates: supabaseUser.share_with_affiliates || false,
    privacyPolicy: supabaseUser.privacy_policy || false,

    // Contact
    phone: supabaseUser.phone || null,
    phoneVerified: supabaseUser.phone_confirmed_at || supabaseUser.phone_verified || null,

    // Onboarding
    hasOnboarded: supabaseUser.has_onboarded || false,
    hasProfile: supabaseUser.has_profile || false,

    // Auth metadata
    emailVerified: supabaseUser.email_confirmed_at || supabaseUser.email_verified || null,
    authRole: supabaseUser.auth_role || 'authenticated',
    isSuperAdmin: supabaseUser.is_super_admin || false,
    createdAt: supabaseUser.auth_created_at || new Date().toISOString(),
    lastSignIn: supabaseUser.last_sign_in_at || null,

    // Additional
    recentWork: supabaseUser.recent_work || null,
    regionalCommunity: supabaseUser.regional_community || null,
    communityIdentity: supabaseUser.community_identity || null,
  };
}

// ============ IMAGE HANDLING ============
async function downloadImage(url, retries = 3) {
  if (!url || CONFIG.SKIP_IMAGES) return null;

  for (let attempt = 1; attempt <= retries; attempt++) {
    try {
      const response = await fetch(url, {
        timeout: 10000,
        headers: {
          'User-Agent': 'CCM-Migration-Script/1.0',
        },
      });

      if (!response.ok) {
        throw new Error(`HTTP ${response.status}: ${response.statusText}`);
      }

      const contentType = response.headers.get('content-type');
      if (!contentType?.startsWith('image/')) {
        throw new Error(`Invalid content type: ${contentType}`);
      }

      const buffer = await response.buffer();
      return { buffer, contentType };
    } catch (error) {
      if (attempt === retries) {
        throw error;
      }
      await sleep(2000 * attempt); // Exponential backoff
    }
  }
}

async function uploadImageToClerk(clerkUserId, imageData) {
  if (!imageData || CONFIG.SKIP_IMAGES) return false;

  try {
    // Create a File-like object from the buffer
    const blob = new Blob([imageData.buffer], { type: imageData.contentType });

    await clerk.users.updateUserProfileImage(clerkUserId, {
      file: blob,
    });

    return true;
  } catch (error) {
    throw new Error(`Image upload failed: ${error.message}`);
  }
}

// ============ EMAIL SENDING ============
function getInvitationEmailTemplate({ email, firstName, hasOnboarded }) {
  const name = firstName || 'there';
  const signInUrl = `${CONFIG.APP_URL}/sign-in`;

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

          <p>Hi ${name},</p>

          <p>We've upgraded the <strong>Connecting Climate Minds Hub</strong> with exciting new features and improvements! Your account has been successfully migrated to our enhanced platform.</p>

          <div class="highlight">
            <strong>✅ Your login credentials remain the same</strong><br>
            Use your existing email (<strong>${email}</strong>) and password to sign in.
          </div>

          <h3>What's new in Collaborate?</h3>
          <ul>
            <li><strong>Enhanced collaboration features</strong> for better community engagement</li>
            <li><strong>Improved profile system</strong> to showcase your work and expertise</li>
            <li><strong>Better performance</strong> and streamlined user experience</li>
            <li><strong>New community tools</strong> to connect with climate minds globally</li>
          </ul>

          <center>
            <a href="${signInUrl}" class="button">
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
  `;
}

async function sendInvitationEmail(user, retries = 2) {
  if (!CONFIG.SEND_EMAILS) {
    console.log(`  📧 [DRY RUN] Would send email to ${user.email}`);
    return true;
  }

  for (let attempt = 1; attempt <= retries; attempt++) {
    try {
      const { data, error } = await resend.emails.send({
        from: 'Spiro Spero <[email protected]>',
        to: user.email,
        replyTo: 'support@spiro-spero.zone',
        subject: '🎉 Welcome to the Upgraded Connecting Climate Minds Hub!',
        html: getInvitationEmailTemplate({
          email: user.email,
          firstName: user.firstName,
          hasOnboarded: user.hasOnboarded,
        }),
      });

      if (error) {
        throw new Error(error.message || JSON.stringify(error));
      }

      console.log(`  ✅ Email sent (${data.id})`);
      return true;
    } catch (error) {
      if (attempt === retries) {
        throw error;
      }
      await sleep(3000 * attempt);
    }
  }
}

// ============ CLERK USER CREATION ============
async function createClerkUser(user, retryCount = 0) {
  if (CONFIG.DRY_RUN) {
    console.log(`  👤 [DRY RUN] Would create Clerk user: ${user.email}`);
    return {
      id: `clerk_dry_run_${user.supabaseId}`,
      emailAddresses: [{ emailAddress: user.email }],
    };
  }

  try {
    // Prepare metadata (keep under 8KB total, ideally <1.2KB)
    const publicMetadata = {
      supabaseId: user.supabaseId,
      originalImageUrl: user.imageUrl,
      migratedAt: new Date().toISOString(),
    };

    const privateMetadata = {
      newsletter: user.newsletter,
      shareWithAffiliates: user.shareWithAffiliates,
      privacyPolicy: user.privacyPolicy,
    };

    // Create user with password hash
    const clerkUser = await clerk.users.createUser({
      externalId: user.supabaseId, // Store Supabase ID for reference
      emailAddress: [user.email],
      password: user.passwordHash,
      passwordDigest: user.passwordHash,
      passwordHasher: 'bcrypt',
      skipPasswordRequirement: false,
      skipPasswordChecks: true, // Trust our bcrypt hash
      firstName: user.firstName || undefined,
      lastName: user.lastName || undefined,
      username: user.username || undefined,
      publicMetadata,
      privateMetadata,
    });

    console.log(`  ✅ Clerk user created: ${clerkUser.id}`);
    return clerkUser;
  } catch (error) {
    // Handle rate limiting
    if (error.status === 429) {
      if (retryCount < CONFIG.MAX_RETRIES) {
        console.log(`  ⏳ Rate limit hit, waiting ${CONFIG.RETRY_DELAY_MS}ms...`);
        await sleep(CONFIG.RETRY_DELAY_MS);
        return createClerkUser(user, retryCount + 1);
      }
    }

    // Handle duplicate user
    if (error.status === 422 && error.message?.includes('already exists')) {
      console.log(`  ⚠️  User already exists in Clerk`);
      stats.skipped++;
      return null;
    }

    throw error;
  }
}

// ============ PRISMA DATABASE SYNC ============
async function syncPrismaDatabase(user, clerkUserId, imageUploaded) {
  if (CONFIG.DRY_RUN) {
    console.log(`  💾 [DRY RUN] Would sync to Prisma: ${user.email}`);
    return;
  }

  try {
    const userData = {
      id: clerkUserId, // Use Clerk ID as primary ID
      email: user.email,
      emailVerified: user.emailVerified ? new Date(user.emailVerified) : null,
      username: user.username,
      image: imageUploaded ? null : user.imageUrl, // Image URL or null if uploaded to Clerk
      bio: user.workBio,
      role: mapRole(user.authRole, user.isSuperAdmin),

      // Age and location
      ageGroup: mapAgeRange(user.ageRange),
      city: user.cityTown,
      country: user.country,

      // Professional info
      firstName: user.firstName,
      lastName: user.lastName,
      organization: user.organization,
      position: user.position,
      workBio: user.workBio,
      linkedinProfile: user.linkedin,
      personalWebsite: user.website,

      // Arrays (map to enums)
      workTypes: mapWorkTypes(user.typesOfWork),
      expertiseAreas: mapExpertiseAreas(user.expertise),

      // Contact preferences
      phoneNumber: user.phone,
      phoneVerified: user.phoneVerified ? new Date(user.phoneVerified) : null,
      showPhoneNumber: false, // Default to private
      showEmail: user.publicEmail || false,
      showLocation: true,
      showSocialLinks: true,
      showWorkDetails: true,

      // Onboarding
      onboardingCompleted: user.hasOnboarded || false,
      onboardingStep: user.hasOnboarded ? 5 : 0,

      // Language
      preferredLanguage: mapLanguage(user.lang),

      // Other
      otherSocialLinks: buildOtherSocialLinks(user),
      isSearchable: true,
      profileVisibility: 'PUBLIC',
      welcomeMessageSeen: false,

      // Timestamps
      createdAt: new Date(user.createdAt),
      lastLoginAt: user.lastSignIn ? new Date(user.lastSignIn) : null,

      // Profile completeness
      profileCompleteness: calculateProfileCompleteness(user),
    };

    await prisma.user.upsert({
      where: { id: clerkUserId },
      update: {
        ...userData,
        updatedAt: new Date(),
      },
      create: userData,
    });

    console.log(`  💾 Synced to Prisma database`);
  } catch (error) {
    // Log but don't fail the migration if Prisma sync fails
    console.error(`  ⚠️  Prisma sync failed: ${error.message}`);
    logError(user.supabaseId, user.email, error, 'Prisma Sync');
  }
}

// ============ MAIN MIGRATION FUNCTION ============
async function migrateUser(supabaseUser, index) {
  const user = transformSupabaseUser(supabaseUser);

  console.log(`\n[${index + 1}/${stats.total}] Migrating: ${user.email}`);
  console.log(`  📋 Supabase ID: ${user.supabaseId}`);

  try {
    // Step 1: Create Clerk user
    const clerkUser = await createClerkUser(user);
    if (!clerkUser) {
      return; // User already exists, skipped
    }

    const clerkUserId = clerkUser.id;

    // Step 2: Handle profile image
    let imageUploaded = false;
    if (user.imageUrl && !CONFIG.SKIP_IMAGES) {
      try {
        console.log(`  🖼️  Downloading image...`);
        const imageData = await downloadImage(user.imageUrl);

        if (imageData) {
          console.log(`  📤 Uploading to Clerk...`);
          imageUploaded = await uploadImageToClerk(clerkUserId, imageData);
          if (imageUploaded) {
            stats.imagesUploaded++;
            console.log(`  ✅ Image uploaded`);
          }
        }
      } catch (error) {
        stats.imagesFailed++;
        console.error(`  ⚠️  Image processing failed: ${error.message}`);
        logError(user.supabaseId, user.email, error, 'Image Upload');
        // Continue migration even if image fails
      }
    }

    // Step 3: Sync to Prisma database
    await syncPrismaDatabase(user, clerkUserId, imageUploaded);

    // Step 4: Send invitation email
    if (CONFIG.SEND_EMAILS) {
      try {
        await sendInvitationEmail(user);
        stats.emailsSent++;
      } catch (error) {
        stats.emailsFailed++;
        console.error(`  ⚠️  Email send failed: ${error.message}`);
        logError(user.supabaseId, user.email, error, 'Email Send');
        // Continue even if email fails
      }
    }

    stats.successful++;
    console.log(`  ✅ Migration complete!`);

    return {
      success: true,
      supabaseId: user.supabaseId,
      clerkId: clerkUserId,
      email: user.email,
    };
  } catch (error) {
    stats.failed++;
    logError(user.supabaseId, user.email, error, 'User Migration');
    console.error(`  ❌ Migration failed: ${error.message}`);

    return {
      success: false,
      supabaseId: user.supabaseId,
      email: user.email,
      error: error.message,
    };
  }
}

// ============ UTILITY FUNCTIONS ============
function sleep(ms) {
  return new Promise(resolve => setTimeout(resolve, ms));
}

function formatDuration(ms) {
  const seconds = Math.floor(ms / 1000);
  const minutes = Math.floor(seconds / 60);
  const hours = Math.floor(minutes / 60);

  if (hours > 0) {
    return `${hours}h ${minutes % 60}m ${seconds % 60}s`;
  } else if (minutes > 0) {
    return `${minutes}m ${seconds % 60}s`;
  }
  return `${seconds}s`;
}

// ============ MAIN EXECUTION ============
async function main() {
  console.log('🚀 Connecting Climate Minds Hub - User Migration\n');
  console.log('📋 Configuration:');
  console.log(`   Mode: ${CONFIG.DRY_RUN ? '🧪 DRY RUN' : '🔴 LIVE MIGRATION'}`);
  console.log(`   Test Limit: ${CONFIG.TEST_LIMIT || 'None (full migration)'}`);
  console.log(`   Send Emails: ${CONFIG.SEND_EMAILS ? 'Yes' : 'No'}`);
  console.log(`   Process Images: ${CONFIG.SKIP_IMAGES ? 'No' : 'Yes'}`);
  console.log(`   Delay between requests: ${CONFIG.DELAY_MS}ms`);
  console.log(`   Rate limit retry delay: ${CONFIG.RETRY_DELAY_MS}ms\n`);

  // Validate environment variables
  if (!CONFIG.DRY_RUN) {
    if (!process.env.CLERK_SECRET_KEY) {
      console.error('❌ CLERK_SECRET_KEY is required');
      process.exit(1);
    }
    if (CONFIG.SEND_EMAILS && !process.env.RESEND_API_KEY) {
      console.error('❌ RESEND_API_KEY is required for sending emails');
      process.exit(1);
    }
    if (!process.env.DATABASE_URL) {
      console.error('❌ DATABASE_URL is required for Prisma');
      process.exit(1);
    }
  }

  // Load users
  console.log(`📂 Loading users from ${CONFIG.INPUT_FILE}...`);
  const usersData = JSON.parse(fs.readFileSync(CONFIG.INPUT_FILE, 'utf-8'));
  let users = Array.isArray(usersData) ? usersData : [usersData];

  // Apply test limit
  if (CONFIG.TEST_LIMIT) {
    users = users.slice(0, CONFIG.TEST_LIMIT);
    console.log(`⚠️  TEST MODE: Processing only ${CONFIG.TEST_LIMIT} users\n`);
  }

  stats.total = users.length;
  console.log(`👥 Found ${stats.total} users to migrate\n`);

  if (!CONFIG.DRY_RUN) {
    console.log('⚠️  This is a LIVE migration. Press Ctrl+C to cancel...');
    await sleep(5000);
    console.log('\n🏃 Starting migration...\n');
  }

  // Migrate users
  const results = [];
  for (let i = 0; i < users.length; i++) {
    const result = await migrateUser(users[i], i);
    if (result) {
      results.push(result);
    }

    // Delay between requests to respect rate limits
    if (i < users.length - 1) {
      await sleep(CONFIG.DELAY_MS);
    }
  }

  // Calculate duration
  const duration = Date.now() - stats.startTime;

  // Print summary
  console.log('\n' + '='.repeat(60));
  console.log('📊 MIGRATION SUMMARY');
  console.log('='.repeat(60));
  console.log(`Total users:          ${stats.total}`);
  console.log(`✅ Successful:        ${stats.successful}`);
  console.log(`❌ Failed:            ${stats.failed}`);
  console.log(`⏭️  Skipped:           ${stats.skipped}`);
  console.log(`📧 Emails sent:       ${stats.emailsSent}`);
  console.log(`📧 Emails failed:     ${stats.emailsFailed}`);
  console.log(`🖼️  Images uploaded:   ${stats.imagesUploaded}`);
  console.log(`🖼️  Images failed:     ${stats.imagesFailed}`);
  console.log(`⏱️  Duration:          ${formatDuration(duration)}`);
  console.log('='.repeat(60));

  // Save error log if there were errors
  if (errors.length > 0) {
    const logData = {
      summary: stats,
      errors: errors,
      timestamp: new Date().toISOString(),
      config: CONFIG,
    };
    fs.writeFileSync(logFile, JSON.stringify(logData, null, 2));
    console.log(`\n📝 Error log saved to: ${logFile}`);
  }

  // Save results
  const resultsFile = `migration-results-${new Date().toISOString().replace(/:/g, '-')}.json`;
  fs.writeFileSync(resultsFile, JSON.stringify(results, null, 2));
  console.log(`📄 Migration results saved to: ${resultsFile}\n`);

  // Cleanup
  if (prisma) {
    await prisma.$disconnect();
  }
  console.log('✨ Migration complete!\n');
}

// ============ RUN ============
main().catch((error) => {
  console.error('💥 Fatal error:', error);
  process.exit(1);
});
