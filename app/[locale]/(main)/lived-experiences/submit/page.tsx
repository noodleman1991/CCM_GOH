import type { Metadata } from "next"
import { auth } from "@clerk/nextjs/server"
import { redirect } from "next/navigation"
import { getTranslations } from "next-intl/server"
import { client } from "@/sanity/lib/client"
import { PageContainer } from "@/components/ui/page-container"
import { LivedExperienceForm } from "@/components/forms/lived-experience-form"
import { loadEditableLivedExperience } from "@/lib/lived-experiences/edit"

async function fetchAvailableTags() {
  return await client.fetch(`*[_type == "tag"] | order(label.en asc) { _id, label, value }`)
}

async function fetchRegionalCommunities() {
  return await client.fetch(
    `*[_type == "regionalCommunity" && active == true] | order(name.en asc) { _id, name, slug }`
  )
}

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
  await params
  const { workspace, edit } = await searchParams
  const { userId } = await auth()
  if (!userId) redirect("/sign-in")

  const [availableTags, regionalCommunities] = await Promise.all([
    fetchAvailableTags(),
    fetchRegionalCommunities(),
  ])

  // X7 edit mode: reopen your own (or your workspace's) draft/pending doc.
  let editDoc = null
  if (edit) {
    editDoc = await loadEditableLivedExperience(edit, userId)
    if (!editDoc) redirect("/lived-experiences/submit")
  }

  return (
    <PageContainer width="max-w-3xl">
      <LivedExperienceForm
        availableTags={availableTags}
        regionalCommunities={regionalCommunities}
        workspaceId={workspace ?? null}
        editDoc={editDoc}
      />
    </PageContainer>
  )
}
