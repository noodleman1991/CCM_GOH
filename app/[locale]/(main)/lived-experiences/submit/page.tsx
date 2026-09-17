import type { Metadata } from "next"
import { auth } from "@clerk/nextjs/server"
import { redirect } from "@/i18n/navigation"
import { getTranslations, getLocale } from "next-intl/server"
import { PageContainer } from "@/components/ui/page-container"
import { LivedExperienceForm } from "@/components/forms/lived-experience-form"
import {
  getActiveRegionalCommunities,
  getAvailableLivedExperienceTags,
  loadEditableLivedExperience,
} from "@/lib/content/lived-experiences"

export async function generateMetadata({ params }: { params: Promise<{ locale: string }> }): Promise<Metadata> {
  const { locale } = await params
  const t = await getTranslations({ locale, namespace: "livedExperienceSubmission" })
  return { title: t("pageTitle"), description: t("pageDescription") }
}

export default async function SubmitLivedExperiencePage({
  params,
  searchParams,
}: {
  params: Promise<{ locale: string }>
  searchParams: Promise<{ workspace?: string; edit?: string }>
}) {
  const locale = await getLocale();
  await params
  const { workspace, edit } = await searchParams
  const { userId } = await auth()
  if (!userId) redirect({ href: "/sign-in", locale })

  const [availableTags, regionalCommunities] = await Promise.all([
    getAvailableLivedExperienceTags(),
    getActiveRegionalCommunities(),
  ])

  // X7 edit mode: reopen your own (or your workspace's) draft/pending doc.
  let editDoc = null
  if (edit) {
    editDoc = await loadEditableLivedExperience(edit, userId)
    if (!editDoc) redirect({ href: "/lived-experiences/submit", locale })
  }

  return (
    <PageContainer width="max-w-3xl">
      {/* The form's local Tag/Community types describe the same raw tag/
          regionalCommunity doc shape returned here; cast at this seam rather
          than loosen either side's types. */}
      <LivedExperienceForm
        availableTags={availableTags as never}
        regionalCommunities={regionalCommunities as never}
        workspaceId={workspace ?? null}
        editDoc={editDoc}
      />
    </PageContainer>
  )
}
