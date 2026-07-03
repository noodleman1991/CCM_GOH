import type { Metadata } from "next"
import { auth } from "@clerk/nextjs/server"
import { redirect } from "next/navigation"
import { getTranslations } from "next-intl/server"
import { client } from "@/sanity/lib/client"
import { PageContainer } from "@/components/ui/page-container"
import { LivedExperienceForm } from "@/components/forms/lived-experience-form"

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
  searchParams: Promise<{ workspace?: string }>
}) {
  await params
  const { workspace } = await searchParams
  const { userId } = await auth()
  if (!userId) redirect("/sign-in")

  const [availableTags, regionalCommunities] = await Promise.all([
    fetchAvailableTags(),
    fetchRegionalCommunities(),
  ])

  return (
    <PageContainer width="max-w-3xl">
      <LivedExperienceForm
        availableTags={availableTags}
        regionalCommunities={regionalCommunities}
        workspaceId={workspace ?? null}
      />
    </PageContainer>
  )
}
