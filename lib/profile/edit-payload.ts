import type { UserProfileUpdateData } from "@/types/prisma";

type FormValues = Omit<UserProfileUpdateData, "recentWork"> & {
  recentWork?: UserProfileUpdateData["recentWork"];
};

const orNull = (v: string | null | undefined) => v?.trim() || null;

/**
 * Edit profile's form values as the profile API takes them. The API writes
 * every field it knows (a missing one becomes null / [] / false), so this sends
 * them all — before 2026-10-05 it left out the K4 fields and each save erased
 * them. Empty text clears the field. Pure.
 */
export function profileUpdateFromForm(values: FormValues): UserProfileUpdateData {
  return {
    firstName: values.firstName,
    lastName: values.lastName,
    username: values.username,
    bio: orNull(values.bio),
    ageGroup: values.ageGroup || null,
    country: orNull(values.country),
    city: orNull(values.city),
    workTypes: values.workTypes || [],
    expertiseAreas: values.expertiseAreas || [],
    organization: orNull(values.organization),
    position: orNull(values.position),
    workBio: orNull(values.workBio),
    personalWebsite: orNull(values.personalWebsite),
    linkedinProfile: orNull(values.linkedinProfile),
    otherSocialLinks: values.otherSocialLinks || [],
    isSearchable: values.isSearchable,
    profileVisibility: values.profileVisibility,
    showEmail: values.showEmail,
    showPhoneNumber: values.showPhoneNumber,
    showWorkDetails: values.showWorkDetails,
    showSocialLinks: values.showSocialLinks,
    showLocation: values.showLocation,
    communityIds: values.communityIds || [],
    recentWork: values.recentWork || [],
    // The member's own words (K4)
    headline: orNull(values.headline),
    pronouns: orNull(values.pronouns),
    languages: values.languages || [],
    motivation: orNull(values.motivation),
    focusTopics: values.focusTopics || [],
    lookingFor: values.lookingFor || [],
    openToCollaboration: values.openToCollaboration ?? false,
    collaborationInterests: orNull(values.collaborationInterests),
    livedExperienceStatement: orNull(values.livedExperienceStatement),
    showLivedExperience: values.showLivedExperience ?? false,
    orcidId: orNull(values.orcidId),
  };
}
