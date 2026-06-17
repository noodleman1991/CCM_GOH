import { defineField, defineType } from "sanity";
import { isUniqueOtherThanLanguage } from '@/sanity/lib/isUniqueOtherThanLanguage';

export default defineType({
  name: 'onboardingContent',
  title: 'Onboarding Content',
  type: 'document',
  // Groups ordered to follow the onboarding journey the visitor experiences —
  // Welcome → the steps → Privacy → Review → the redirect prompt — then the
  // shared UI labels, and finally internal Settings/metadata.
  groups: [
    {
      name: 'welcome',
      title: '1. Welcome Step',
      default: true,
    },
    {
      name: 'steps',
      title: '2. Step Intros',
    },
    {
      name: 'privacy',
      title: '3. Privacy Step',
    },
    {
      name: 'review',
      title: '4. Review & Submit',
    },
    {
      name: 'redirectDialog',
      title: '5. Redirect Prompt',
    },
    {
      name: 'labels',
      title: 'UI Labels & Messages',
    },
    {
      name: 'settings',
      title: 'Settings',
    },
    {
      name: 'content',
      title: 'Internal',
    },
  ],
  fields: [
    defineField({
      name: 'title',
      title: 'Content Title',
      type: 'string',
      group: 'content',
      validation: Rule => Rule.required(),
      description: 'Internal title for this content (e.g., "Onboarding Content")',
    }),
    defineField({
      name: "slug",
      title: "Slug",
      type: "slug",
      group: "settings",
      options: {
        source: "title",
        maxLength: 96,
        isUnique: isUniqueOtherThanLanguage,
      },
      validation: (Rule) => Rule.required(),
    }),
    defineField({
      name: "language",
      title: "Language",
      type: "string",
      description: "The locale this onboarding content is written for (set by the translation system).",
      readOnly: true,
      group: "settings",
    }),

    // Welcome Step Content
    defineField({
      name: 'welcomeTitle',
      title: 'Welcome Title',
      type: 'string',
      group: 'welcome',
      validation: Rule => Rule.required(),
    }),
    defineField({
      name: 'welcomeSubtitle',
      title: 'Welcome Subtitle',
      type: 'text',
      group: 'welcome',
      validation: Rule => Rule.required(),
    }),
    defineField({
      name: 'welcomeDescription',
      title: 'Welcome Description',
      type: 'text',
      group: 'welcome',
      validation: Rule => Rule.required(),
    }),
    defineField({
      name: 'welcomeFeatures',
      title: 'Welcome Features',
      type: 'array',
      group: 'welcome',
      of: [
        {
          type: 'object',
          fields: [
            { name: 'title', title: 'Feature Title', type: 'string' },
            { name: 'description', title: 'Feature Description', type: 'text' },
          ],
        },
      ],
    }),
    defineField({
      name: 'welcomeSteps',
      title: 'What to Expect Steps',
      type: 'array',
      group: 'welcome',
      of: [{ type: 'string' }],
      validation: Rule => Rule.max(4),
    }),
    defineField({
      name: 'gettingStartedTitle',
      title: 'Getting Started Title',
      type: 'string',
      group: 'welcome',
      validation: Rule => Rule.required(),
    }),
    defineField({
      name: 'gettingStartedDescription',
      title: 'Getting Started Description',
      type: 'text',
      group: 'welcome',
      validation: Rule => Rule.required(),
    }),
    defineField({
      name: 'getStartedText',
      title: 'Get Started Button Text',
      type: 'string',
      group: 'welcome',
      initialValue: 'Get Started',
    }),
    defineField({
      name: 'timeEstimate',
      title: 'Time Estimate Text',
      type: 'string',
      group: 'welcome',
      initialValue: 'Takes about 5 minutes',
    }),

    // Step Descriptions and Field Explanations
    defineField({
      name: 'basicInfoTitle',
      title: 'Basic Info Step Title',
      type: 'string',
      group: 'steps',
      initialValue: 'Basic Information',
    }),
    defineField({
      name: 'basicInfoDescription',
      title: 'Basic Info Step Description',
      type: 'text',
      group: 'steps',
      description: 'Explanation text shown at the top of basic info step',
    }),
    defineField({
      name: 'basicInfoFieldHints',
      title: 'Basic Info Field Hints',
      type: 'object',
      group: 'steps',
      fields: [
        { name: 'usernameHint', title: 'Username Hint', type: 'text' },
        { name: 'headlineHint', title: 'Headline Hint', type: 'text' },
        { name: 'bioHint', title: 'Bio Hint', type: 'text' },
        { name: 'motivationHint', title: 'Motivation Hint', type: 'text' },
        { name: 'languageHint', title: 'Language Hint', type: 'text' },
      ],
    }),
    defineField({
      name: 'workInfoTitle',
      title: 'Work Info Step Title',
      type: 'string',
      group: 'steps',
      initialValue: 'Work & Expertise',
    }),
    defineField({
      name: 'workInfoDescription',
      title: 'Work Info Step Description',
      type: 'text',
      group: 'steps',
      description: 'Explanation text shown at the top of work info step',
    }),
    defineField({
      name: 'workInfoFieldHints',
      title: 'Work Info Field Hints',
      type: 'object',
      group: 'steps',
      fields: [
        { name: 'workTypesDescription', title: 'Work Types Description', type: 'text' },
        { name: 'expertiseDescription', title: 'Expertise Areas Description', type: 'text' },
        { name: 'workBioHint', title: 'Work Bio Hint', type: 'text' },
        { name: 'socialLinksDescription', title: 'Social Links Description', type: 'text' },
        { name: 'communitiesDescription', title: 'Communities Description', type: 'text' },
      ],
    }),
    defineField({
      name: 'communityInfoTitle',
      title: 'Community Selection Step Title',
      type: 'string',
      group: 'steps',
      initialValue: 'Regional Communities',
    }),
    defineField({
      name: 'communityInfoDescription',
      title: 'Community Selection Step Description',
      type: 'text',
      group: 'steps',
      description: 'Explanation text shown at the top of community selection step',
    }),
    defineField({
      name: 'communityInfoFieldHints',
      title: 'Community Selection Field Hints',
      type: 'object',
      group: 'steps',
      fields: [
        { name: 'communitiesDescription', title: 'Communities Selection Description', type: 'text' },
        { name: 'communitiesHint', title: 'Communities Selection Hint', type: 'text' },
        { name: 'optionalNote', title: 'Optional Note', type: 'text' },
      ],
    }),
    defineField({
      name: 'recentWorkTitle',
      title: 'Recent Work Step Title',
      type: 'string',
      group: 'steps',
      initialValue: 'Recent Work',
    }),
    defineField({
      name: 'recentWorkDescription',
      title: 'Recent Work Step Description',
      type: 'text',
      group: 'steps',
      description: 'Explanation text shown at the top of recent work step',
    }),
    defineField({
      name: 'recentWorkFieldHints',
      title: 'Recent Work Field Hints',
      type: 'object',
      group: 'steps',
      fields: [
        { name: 'workLinkHint', title: 'Work Link Hint', type: 'text' },
        { name: 'isOngoingHint', title: 'Is Ongoing Hint', type: 'text' },
        { name: 'noWorkDescription', title: 'No Work Added Description', type: 'text' },
      ],
    }),

    // Privacy Settings Explanations
    defineField({
      name: 'privacyTitle',
      title: 'Privacy Settings Title',
      type: 'string',
      group: 'privacy',
      initialValue: 'Privacy Settings',
    }),
    defineField({
      name: 'privacyDescription',
      title: 'Privacy Settings Description',
      type: 'text',
      group: 'privacy',
      description: 'Main description for privacy settings step',
    }),
    defineField({
      name: 'searchabilityTitle',
      title: 'Searchability Section Title',
      type: 'string',
      group: 'privacy',
    }),
    defineField({
      name: 'searchabilityDescription',
      title: 'Searchability Description',
      type: 'text',
      group: 'privacy',
    }),
    defineField({
      name: 'searchabilityHint',
      title: 'Searchability Toggle Hint',
      type: 'text',
      group: 'privacy',
    }),
    defineField({
      name: 'visibilityTitle',
      title: 'Profile Visibility Title',
      type: 'string',
      group: 'privacy',
    }),
    defineField({
      name: 'visibilityDescription',
      title: 'Profile Visibility Description',
      type: 'text',
      group: 'privacy',
    }),
    defineField({
      name: 'visibilityOptions',
      title: 'Visibility Options Explanations',
      type: 'object',
      group: 'privacy',
      fields: [
        { name: 'publicTitle', title: 'Public Option Title', type: 'string' },
        { name: 'publicDescription', title: 'Public Option Description', type: 'text' },
        { name: 'membersTitle', title: 'Members Only Title', type: 'string' },
        { name: 'membersDescription', title: 'Members Only Description', type: 'text' },
        { name: 'privateTitle', title: 'Private Option Title', type: 'string' },
        { name: 'privateDescription', title: 'Private Option Description', type: 'text' },
      ],
    }),
    defineField({
      name: 'profileInfoTitle',
      title: 'Profile Information Visibility Title',
      type: 'string',
      group: 'privacy',
    }),
    defineField({
      name: 'profileInfoDescription',
      title: 'Profile Information Visibility Description',
      type: 'text',
      group: 'privacy',
    }),
    defineField({
      name: 'privacyFieldHints',
      title: 'Privacy Field Hints',
      type: 'object',
      group: 'privacy',
      fields: [
        { name: 'emailHint', title: 'Show Email Hint', type: 'text' },
        { name: 'phoneHint', title: 'Show Phone Hint', type: 'text' },
        { name: 'workHint', title: 'Show Work Details Hint', type: 'text' },
        { name: 'socialHint', title: 'Show Social Links Hint', type: 'text' },
        { name: 'locationHint', title: 'Show Location Hint', type: 'text' },
      ],
    }),

    // Review & Submit
    defineField({
      name: 'reviewTitle',
      title: 'Review Step Title',
      type: 'string',
      group: 'review',
      initialValue: 'Almost Done!',
    }),
    defineField({
      name: 'reviewDescription',
      title: 'Review Step Description',
      type: 'text',
      group: 'review',
    }),
    defineField({
      name: 'reviewReadyTitle',
      title: 'Ready to Submit Title',
      type: 'string',
      group: 'review',
      initialValue: 'Ready to Join',
    }),
    defineField({
      name: 'reviewReadyDescription',
      title: 'Ready to Submit Description',
      type: 'text',
      group: 'review',
    }),
    defineField({
      name: 'completeOnboardingText',
      title: 'Complete Onboarding Button Text',
      type: 'string',
      group: 'review',
      initialValue: 'Complete Setup',
    }),

    // Redirect Dialog Content
    defineField({
      name: 'redirectDialogTitle',
      title: 'Redirect Dialog Title',
      type: 'string',
      group: 'redirectDialog',
      initialValue: 'Complete Your Profile',
    }),
    defineField({
      name: 'redirectDialogMessage',
      title: 'Redirect Dialog Message',
      type: 'text',
      group: 'redirectDialog',
    }),
    defineField({
      name: 'proceedToOnboardingText',
      title: 'Proceed to Onboarding Button Text',
      type: 'string',
      group: 'redirectDialog',
      initialValue: 'Complete Profile',
    }),
    defineField({
      name: 'continueToHubText',
      title: 'Continue to Hub Button Text',
      type: 'string',
      group: 'redirectDialog',
      initialValue: 'Continue to Hub',
    }),
    defineField({
      name: 'oneTimeWaiverText',
      title: 'One-time Waiver Text',
      type: 'string',
      group: 'redirectDialog',
      initialValue: 'You can complete this later',
    }),

    // Navigation texts
    defineField({
      name: 'navigationTexts',
      title: 'Navigation Button Texts',
      type: 'object',
      group: 'labels',
      fields: [
        { name: 'continue', title: 'Continue Button', type: 'string', initialValue: 'Continue' },
        { name: 'back', title: 'Back Button', type: 'string', initialValue: 'Back' },
        { name: 'submit', title: 'Submit Button', type: 'string', initialValue: 'Submit' },
        { name: 'submitting', title: 'Submitting Text', type: 'string', initialValue: 'Submitting...' },
      ],
    }),

    // Validation Messages
    defineField({
      name: 'validationMessages',
      title: 'Form Validation Messages',
      type: 'object',
      group: 'labels',
      fields: [
        // Basic Info Validations
        {
          name: 'basicInfo',
          title: 'Basic Info Validation Messages',
          type: 'object',
          fields: [
            { name: 'firstNameRequired', title: 'First Name Required', type: 'string', initialValue: 'First name is required' },
            { name: 'firstNameTooLong', title: 'First Name Too Long', type: 'string', initialValue: 'First name must be less than 50 characters' },
            { name: 'lastNameRequired', title: 'Last Name Required', type: 'string', initialValue: 'Last name is required' },
            { name: 'lastNameTooLong', title: 'Last Name Too Long', type: 'string', initialValue: 'Last name must be less than 50 characters' },
            { name: 'usernameRequired', title: 'Username Required', type: 'string', initialValue: 'Username is required' },
            { name: 'usernameTooShort', title: 'Username Too Short', type: 'string', initialValue: 'Username must be at least 3 characters' },
            { name: 'usernameTooLong', title: 'Username Too Long', type: 'string', initialValue: 'Username must be less than 30 characters' },
            { name: 'usernameInvalidFormat', title: 'Username Invalid Format', type: 'string', initialValue: 'Username can only contain letters, numbers and underscores' },
            { name: 'bioTooLong', title: 'Bio Too Long', type: 'string', initialValue: 'Bio must be less than 500 characters' },
            { name: 'countryRequired', title: 'Country Required', type: 'string', initialValue: 'Country is required' },
            { name: 'cityRequired', title: 'City Required', type: 'string', initialValue: 'City is required' },
          ],
        },
        // Work Info Validations
        {
          name: 'workInfo',
          title: 'Work Info Validation Messages',
          type: 'object',
          fields: [
            { name: 'workTypesRequired', title: 'Work Types Required', type: 'string', initialValue: 'Please select at least one work type' },
            { name: 'expertiseAreasRequired', title: 'Expertise Areas Required', type: 'string', initialValue: 'Please select at least one expertise area' },
            { name: 'workBioTooLong', title: 'Work Bio Too Long', type: 'string', initialValue: 'Work bio must be less than 1000 characters' },
            { name: 'invalidLinkedInUrl', title: 'Invalid LinkedIn URL', type: 'string', initialValue: 'Please enter a valid LinkedIn URL' },
            { name: 'invalidWebsiteUrl', title: 'Invalid Website URL', type: 'string', initialValue: 'Please enter a valid website URL' },
            { name: 'invalidSocialLinkUrl', title: 'Invalid Social Link URL', type: 'string', initialValue: 'Please enter a valid URL' },
            { name: 'socialLinkPlatformRequired', title: 'Social Link Platform Required', type: 'string', initialValue: 'Platform name is required' },
          ],
        },
        // Recent Work Validations
        {
          name: 'recentWork',
          title: 'Recent Work Validation Messages',
          type: 'object',
          fields: [
            { name: 'titleRequired', title: 'Title Required', type: 'string', initialValue: 'Title is required' },
            { name: 'titleTooLong', title: 'Title Too Long', type: 'string', initialValue: 'Title must be less than 100 characters' },
            { name: 'descriptionRequired', title: 'Description Required', type: 'string', initialValue: 'Description is required' },
            { name: 'descriptionTooLong', title: 'Description Too Long', type: 'string', initialValue: 'Description must be less than 500 characters' },
            { name: 'invalidUrl', title: 'Invalid URL', type: 'string', initialValue: 'Please enter a valid URL' },
            { name: 'startDateRequired', title: 'Start Date Required', type: 'string', initialValue: 'Start date is required' },
            { name: 'endDateRequired', title: 'End Date Required', type: 'string', initialValue: 'End date is required for completed projects' },
          ],
        },
        // General Validations
        {
          name: 'general',
          title: 'General Validation Messages',
          type: 'object',
          fields: [
            { name: 'pleaseCompleteRequired', title: 'Please Complete Required', type: 'string', initialValue: 'Please complete all required fields before continuing' },
            { name: 'validationError', title: 'Validation Error', type: 'string', initialValue: 'Please fix the following errors before continuing:' },
            { name: 'submissionError', title: 'Submission Error', type: 'string', initialValue: 'Failed to submit your information. Please try again.' },
          ],
        },
      ],
    }),

    // Field Labels and Placeholders
    defineField({
      name: 'fieldLabels',
      title: 'Form Field Labels and Placeholders',
      type: 'object',
      group: 'labels',
      fields: [
        // Basic Info Labels
        {
          name: 'basicInfo',
          title: 'Basic Info Field Labels',
          type: 'object',
          fields: [
            { name: 'firstName', title: 'First Name', type: 'string', initialValue: 'First Name' },
            { name: 'lastName', title: 'Last Name', type: 'string', initialValue: 'Last Name' },
            { name: 'username', title: 'Username', type: 'string', initialValue: 'Username' },
            { name: 'headline', title: 'Headline', type: 'string', initialValue: 'Headline' },
            { name: 'headlinePlaceholder', title: 'Headline Placeholder', type: 'string', initialValue: 'e.g. Researcher on climate anxiety in youth' },
            { name: 'bio', title: 'Bio', type: 'string', initialValue: 'Bio' },
            { name: 'bioPlaceholder', title: 'Bio Placeholder', type: 'string', initialValue: 'Tell us about yourself...' },
            { name: 'motivation', title: 'Motivation', type: 'string', initialValue: 'What brought you here?' },
            { name: 'motivationPlaceholder', title: 'Motivation Placeholder', type: 'string', initialValue: 'What draws you to climate change and mental health…' },
            { name: 'ageGroup', title: 'Age Group', type: 'string', initialValue: 'Age Group' },
            { name: 'selectAge', title: 'Select Age', type: 'string', initialValue: 'Select your age group' },
            { name: 'under18', title: 'Under 18', type: 'string', initialValue: 'Under 18' },
            { name: 'above18', title: 'Above 18', type: 'string', initialValue: '18 or above' },
            { name: 'country', title: 'Country', type: 'string', initialValue: 'Country' },
            { name: 'city', title: 'City', type: 'string', initialValue: 'City' },
            { name: 'preferredLanguage', title: 'Preferred Language', type: 'string', initialValue: 'Preferred Language' },
            { name: 'firstNamePlaceholder', title: 'First Name Placeholder', type: 'string', initialValue: 'Enter your first name' },
            { name: 'lastNamePlaceholder', title: 'Last Name Placeholder', type: 'string', initialValue: 'Enter your last name' },
            { name: 'usernamePlaceholder', title: 'Username Placeholder', type: 'string', initialValue: 'Enter a unique username' },
            { name: 'countryPlaceholder', title: 'Country Placeholder', type: 'string', initialValue: 'Enter your country' },
            { name: 'cityPlaceholder', title: 'City Placeholder', type: 'string', initialValue: 'Enter your city' },
          ],
        },
        // Work Info Labels
        {
          name: 'workInfo',
          title: 'Work Info Field Labels',
          type: 'object',
          fields: [
            { name: 'workTypes', title: 'Work Types', type: 'string', initialValue: 'Work Types' },
            { name: 'expertiseAreas', title: 'Expertise Areas', type: 'string', initialValue: 'Areas of Expertise' },
            { name: 'regionalCommunities', title: 'Regional Communities', type: 'string', initialValue: 'Regional Communities' },
            { name: 'regionalCommunitiesHint', title: 'Regional Communities Hint', type: 'string', initialValue: 'Select the regional communities you want to join' },
            { name: 'organization', title: 'Organization', type: 'string', initialValue: 'Organization' },
            { name: 'organizationPlaceholder', title: 'Organization Placeholder', type: 'string', initialValue: 'Your organization or company' },
            { name: 'position', title: 'Position', type: 'string', initialValue: 'Position' },
            { name: 'positionPlaceholder', title: 'Position Placeholder', type: 'string', initialValue: 'Your role or title' },
            { name: 'workBio', title: 'Work Bio', type: 'string', initialValue: 'Professional Bio' },
            { name: 'workBioPlaceholder', title: 'Work Bio Placeholder', type: 'string', initialValue: 'Describe your professional experience and goals...' },
            { name: 'socialLinks', title: 'Social Links', type: 'string', initialValue: 'Professional Links' },
            { name: 'linkedin', title: 'LinkedIn', type: 'string', initialValue: 'LinkedIn Profile' },
            { name: 'linkedinPlaceholder', title: 'LinkedIn Placeholder', type: 'string', initialValue: 'https://linkedin.com/in/username' },
            { name: 'otherLinks', title: 'Other Links', type: 'string', initialValue: 'Other Professional Links' },
            { name: 'otherLinksHint', title: 'Other Links Hint', type: 'string', initialValue: 'Add links to your professional profiles (Twitter, GitHub, Portfolio, etc.)' },
            { name: 'website', title: 'Website', type: 'string', initialValue: 'Personal Website' },
            { name: 'websitePlaceholder', title: 'Website Placeholder', type: 'string', initialValue: 'https://yourwebsite.com' },
          ],
        },
        // Recent Work Labels
        {
          name: 'recentWork',
          title: 'Recent Work Field Labels',
          type: 'object',
          fields: [
            { name: 'yourWork', title: 'Your Work', type: 'string', initialValue: 'Your Recent Work' },
            { name: 'addWork', title: 'Add Work', type: 'string', initialValue: 'Add Work' },
            { name: 'editWork', title: 'Edit Work', type: 'string', initialValue: 'Edit Work' },
            { name: 'updateWork', title: 'Update Work', type: 'string', initialValue: 'Update Work' },
            { name: 'workTitle', title: 'Work Title', type: 'string', initialValue: 'Project Title' },
            { name: 'workTitlePlaceholder', title: 'Work Title Placeholder', type: 'string', initialValue: 'Enter project title' },
            { name: 'description', title: 'Description', type: 'string', initialValue: 'Description' },
            { name: 'descriptionPlaceholder', title: 'Description Placeholder', type: 'string', initialValue: 'Describe your project or achievement...' },
            { name: 'projectLink', title: 'Project Link', type: 'string', initialValue: 'Project Link' },
            { name: 'startDate', title: 'Start Date', type: 'string', initialValue: 'Start Date' },
            { name: 'endDate', title: 'End Date', type: 'string', initialValue: 'End Date' },
            { name: 'ongoingProject', title: 'Ongoing Project', type: 'string', initialValue: 'This is an ongoing project' },
            { name: 'ongoing', title: 'Ongoing', type: 'string', initialValue: 'Ongoing' },
            { name: 'viewProject', title: 'View Project', type: 'string', initialValue: 'View Project' },
            { name: 'cancel', title: 'Cancel', type: 'string', initialValue: 'Cancel' },
            { name: 'noWorkAdded', title: 'No Work Added', type: 'string', initialValue: 'No work has been added yet' },
            { name: 'addWorkHint', title: 'Add Work Hint', type: 'string', initialValue: 'Add your recent projects, publications, or achievements to showcase your work' },
          ],
        },
        // Review Labels
        {
          name: 'review',
          title: 'Review Field Labels',
          type: 'object',
          fields: [
            { name: 'basicInfo', title: 'Basic Information', type: 'string', initialValue: 'Basic Information' },
            { name: 'workInfo', title: 'Work Information', type: 'string', initialValue: 'Work & Expertise' },
            { name: 'recentWork', title: 'Recent Work', type: 'string', initialValue: 'Recent Work' },
            { name: 'privacySettings', title: 'Privacy Settings', type: 'string', initialValue: 'Privacy Settings' },
            { name: 'name', title: 'Name', type: 'string', initialValue: 'Name' },
            { name: 'username', title: 'Username', type: 'string', initialValue: 'Username' },
            { name: 'location', title: 'Location', type: 'string', initialValue: 'Location' },
            { name: 'language', title: 'Language', type: 'string', initialValue: 'Preferred Language' },
            { name: 'ageGroup', title: 'Age Group', type: 'string', initialValue: 'Age Group' },
            { name: 'bio', title: 'Bio', type: 'string', initialValue: 'Bio' },
            { name: 'workTypes', title: 'Work Types', type: 'string', initialValue: 'Work Types' },
            { name: 'expertiseAreas', title: 'Expertise Areas', type: 'string', initialValue: 'Areas of Expertise' },
            { name: 'regionalCommunities', title: 'Regional Communities', type: 'string', initialValue: 'Regional Communities' },
            { name: 'organization', title: 'Organization', type: 'string', initialValue: 'Organization' },
            { name: 'position', title: 'Position', type: 'string', initialValue: 'Position' },
            { name: 'workBio', title: 'Work Bio', type: 'string', initialValue: 'Professional Bio' },
            { name: 'socialLinks', title: 'Social Links', type: 'string', initialValue: 'Professional Links' },
            { name: 'profileVisibility', title: 'Profile Visibility', type: 'string', initialValue: 'Profile Visibility' },
            { name: 'searchable', title: 'Searchable', type: 'string', initialValue: 'Searchable' },
            { name: 'showEmail', title: 'Show Email', type: 'string', initialValue: 'Show Email' },
            { name: 'showPhone', title: 'Show Phone', type: 'string', initialValue: 'Show Phone' },
            { name: 'showWork', title: 'Show Work', type: 'string', initialValue: 'Show Work Details' },
            { name: 'showSocial', title: 'Show Social', type: 'string', initialValue: 'Show Social Links' },
            { name: 'showLocation', title: 'Show Location', type: 'string', initialValue: 'Show Location' },
            { name: 'yes', title: 'Yes', type: 'string', initialValue: 'Yes' },
            { name: 'no', title: 'No', type: 'string', initialValue: 'No' },
            { name: 'under18', title: 'Under 18', type: 'string', initialValue: 'Under 18' },
            { name: 'above18', title: 'Above 18', type: 'string', initialValue: '18 or above' },
            { name: 'readyToSubmit', title: 'Ready to Submit', type: 'string', initialValue: 'Ready to Submit' },
            { name: 'submissionNote', title: 'Submission Note', type: 'string', initialValue: 'Your information will be saved and you can update it later from your profile settings.' },
          ],
        },
      ],
    }),

    // Privacy Field Labels
    defineField({
      name: 'privacyFieldLabels',
      title: 'Privacy Settings Field Labels',
      type: 'object',
      group: 'labels',
      fields: [
        { name: 'allowSearch', title: 'Allow Search', type: 'string', initialValue: 'Allow others to find me in search' },
        { name: 'searchHint', title: 'Search Hint', type: 'string', initialValue: 'Other members can discover your profile through search' },
        { name: 'showEmail', title: 'Show Email', type: 'string', initialValue: 'Show email address' },
        { name: 'emailHint', title: 'Email Hint', type: 'string', initialValue: 'Display your email on your public profile' },
        { name: 'showPhone', title: 'Show Phone', type: 'string', initialValue: 'Show phone number' },
        { name: 'phoneHint', title: 'Phone Hint', type: 'string', initialValue: 'Display your phone number on your profile' },
        { name: 'showWork', title: 'Show Work', type: 'string', initialValue: 'Show work details' },
        { name: 'workHint', title: 'Work Hint', type: 'string', initialValue: 'Display your professional information' },
        { name: 'showSocial', title: 'Show Social', type: 'string', initialValue: 'Show social links' },
        { name: 'socialHint', title: 'Social Hint', type: 'string', initialValue: 'Display your professional social media links' },
        { name: 'showLocation', title: 'Show Location', type: 'string', initialValue: 'Show location' },
        { name: 'locationHint', title: 'Location Hint', type: 'string', initialValue: 'Display your city and country' },
      ],
    }),

    // Visibility Options Labels
    defineField({
      name: 'visibilityLabels',
      title: 'Profile Visibility Labels',
      type: 'object',
      group: 'labels',
      fields: [
        { name: 'public', title: 'Public', type: 'string', initialValue: 'Public' },
        { name: 'members', title: 'Members Only', type: 'string', initialValue: 'Members Only' },
        { name: 'private', title: 'Private', type: 'string', initialValue: 'Private' },
      ],
    }),
  ],
  preview: {
    select: {
      title: 'title',
      language: 'language',
      media: 'image',
    },
    prepare(select) {
      const {title, language, media} = select

      return {
        title,
        subtitle: language ? language.toUpperCase() : 'EN',
        media,
      }
    },
  },
})