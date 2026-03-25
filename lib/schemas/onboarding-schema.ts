import * as z from "zod"

// Default validation messages as fallback
const defaultMessages = {
  basicInfo: {
    firstName: "First name is required",
    lastName: "Last name is required",
    username: "Username must be at least 3 characters",
    usernameMax: "Username must be less than 30 characters",
    usernamePattern: "Username can only contain letters, numbers and underscores",
    bio: "Bio must be less than 500 characters",
    country: "Country is required",
    city: "City is required"
  },
  workInfo: {
    workTypes: "Please select at least one work type",
    expertiseAreas: "Please select at least one expertise area",
    workBio: "Work bio must be less than 1000 characters",
    linkedinUrl: "Please enter a valid LinkedIn URL",
    websiteUrl: "Please enter a valid website URL",
    socialLinkUrl: "Please enter a valid URL"
  },
  recentWork: {
    title: "Title is required",
    titleMax: "Title must be less than 100 characters",
    description: "Description is required",
    descriptionMax: "Description must be less than 500 characters",
    link: "Please enter a valid URL",
    startDate: "Start date is required"
  }
}

// Factory function to create schema with custom validation messages
export const createOnboardingSchema = (validationMessages?: any) => {
  const messages = validationMessages || defaultMessages

  return z.object({
    // Basic Info Step (Step 1)
    basicInfo: z.object({
      firstName: z.string().min(1, messages.basicInfo?.firstName || defaultMessages.basicInfo.firstName).max(50),
      lastName: z.string().min(1, messages.basicInfo?.lastName || defaultMessages.basicInfo.lastName).max(50),
      username: z.string()
        .min(3, messages.basicInfo?.username || defaultMessages.basicInfo.username)
        .max(30, messages.basicInfo?.usernameMax || defaultMessages.basicInfo.usernameMax)
        .regex(/^[a-zA-Z0-9_]+$/, messages.basicInfo?.usernamePattern || defaultMessages.basicInfo.usernamePattern),
      bio: z.string().max(500, messages.basicInfo?.bio || defaultMessages.basicInfo.bio).optional(),
      ageGroup: z.enum(["UNDER_18", "ABOVE_18"]).optional(),
      country: z.string().min(1, messages.basicInfo?.country || defaultMessages.basicInfo.country),
      city: z.string().min(1, messages.basicInfo?.city || defaultMessages.basicInfo.city),
      preferredLanguage: z.enum(["EN", "ES", "FR", "AR"], {
        errorMap: () => ({ message: "Please choose your preferred language" })
      })
    }),

    // Work Info Step (Step 2)
    workInfo: z.object({
      workTypes: z.array(z.string()).min(1, messages.workInfo?.workTypes || defaultMessages.workInfo.workTypes),
      expertiseAreas: z.array(z.string()).min(1, messages.workInfo?.expertiseAreas || defaultMessages.workInfo.expertiseAreas),
      communityIds: z.array(z.string()).max(10).optional().default([]),
      organization: z.string().optional(),
      position: z.string().optional(),
      workBio: z.string().max(1000, messages.workInfo?.workBio || defaultMessages.workInfo.workBio).optional(),
      linkedinProfile: z.string().url(messages.workInfo?.linkedinUrl || defaultMessages.workInfo.linkedinUrl).optional().or(z.literal("")),
      personalWebsite: z.string().url(messages.workInfo?.websiteUrl || defaultMessages.workInfo.websiteUrl).optional().or(z.literal("")),
      otherSocialLinks: z.array(z.object({
        platform: z.string().min(1, "Platform name is required"),
        url: z.string().url(messages.workInfo?.socialLinkUrl || defaultMessages.workInfo.socialLinkUrl)
      })).optional().default([])
    }),

    // Recent Work Step (Step 3) - Optional step with optional array
    recentWork: z.array(z.object({
      title: z.string()
        .min(1, messages.recentWork?.title || defaultMessages.recentWork.title)
        .max(100, messages.recentWork?.titleMax || defaultMessages.recentWork.titleMax),
      description: z.string()
        .min(1, messages.recentWork?.description || defaultMessages.recentWork.description)
        .max(500, messages.recentWork?.descriptionMax || defaultMessages.recentWork.descriptionMax),
      link: z.string().url(messages.recentWork?.link || defaultMessages.recentWork.link).optional().or(z.literal("")),
      isOngoing: z.boolean(),
      startDate: z.string().min(1, messages.recentWork?.startDate || defaultMessages.recentWork.startDate),
      endDate: z.string().optional()
    })).optional().default([]),

    // Privacy Step (Step 4)
    privacy: z.object({
      isSearchable: z.boolean().default(true),
      profileVisibility: z.enum(["PUBLIC", "MEMBERS", "PRIVATE"]).default("PUBLIC"),
      showEmail: z.boolean().default(false),
      showPhoneNumber: z.boolean().default(false),
      showWorkDetails: z.boolean().default(true),
      showSocialLinks: z.boolean().default(true),
      showLocation: z.boolean().default(true)
    })
  })
}

// Default schema using fallback messages
export const onboardingSchema = createOnboardingSchema()

export type OnboardingFormData = z.infer<typeof onboardingSchema>

// Step-specific schemas for validation
export const stepSchemas = {
  0: z.object({}), // Welcome step - no validation needed
  1: onboardingSchema.pick({ basicInfo: true }),
  2: onboardingSchema.pick({ workInfo: true }),
  3: onboardingSchema.pick({ recentWork: true }),
  4: onboardingSchema.pick({ privacy: true }),
  5: onboardingSchema // Review step - validate everything
} as const

// Default values for the form
export const defaultOnboardingValues: OnboardingFormData = {
  basicInfo: {
    firstName: "",
    lastName: "",
    username: "",
    bio: "",
    ageGroup: undefined,
    country: "",
    city: "",
    preferredLanguage: "EN" as const
  },
  workInfo: {
    workTypes: [],
    expertiseAreas: [],
    organization: "",
    position: "",
    workBio: "",
    linkedinProfile: "",
    personalWebsite: "",
    otherSocialLinks: [],
    communityIds: []
  },
  recentWork: [],
  privacy: {
    isSearchable: true,
    profileVisibility: "PUBLIC" as const,
    showEmail: false,
    showPhoneNumber: false,
    showWorkDetails: true,
    showSocialLinks: true,
    showLocation: true
  }
}

// Helper to get fields for each step for validation
export const getStepFieldNames = (step: number): (keyof OnboardingFormData)[] => {
  switch (step) {
    case 0: return [] // Welcome
    case 1: return ["basicInfo"]
    case 2: return ["workInfo"]
    case 3: return [] // Recent work is optional - no validation needed
    case 4: return ["privacy"]
    case 5: return ["basicInfo", "workInfo", "privacy"] // Review - validate required steps only
    default: return []
  }
}