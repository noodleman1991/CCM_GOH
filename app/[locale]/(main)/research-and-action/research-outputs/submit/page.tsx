import type { Metadata } from "next"
import { auth } from "@clerk/nextjs/server"
import { redirect } from "next/navigation"
import { getTranslations } from "next-intl/server"
import { PageContainer } from "@/components/ui/page-container"
import { ResearchOutputForm } from "@/components/forms/research-output-form"
import {
  getResearchOutputTags,
  getResearchOutputRegionalCommunities,
  loadEditableResearchOutput,
} from "@/lib/content/outputs"

export async function generateMetadata({ params }: { params: Promise<{ locale: string }> }): Promise<Metadata> {
  const { locale } = await params
  const t = await getTranslations({ locale, namespace: "researchOutputSubmission" })
  return { title: t("pageTitle"), description: t("pageDescription") }
}

export default async function SubmitResearchOutputPage({
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
    getResearchOutputTags(),
    getResearchOutputRegionalCommunities(),
  ])

  // X7 edit mode: reopen your own (or your workspace's) draft/pending doc.
  let editDoc = null
  if (edit) {
    editDoc = await loadEditableResearchOutput(edit, userId)
    if (!editDoc) redirect("/research-and-action/research-outputs/submit")
  }

  return (
    <PageContainer width="max-w-3xl">
      {/* The form's local Tag/Community types describe the same raw tag/
          regionalCommunity doc shape returned here; cast at this seam rather
          than loosen either side's types (same precedent as the
          lived-experience submit page). */}
      <ResearchOutputForm
        availableTags={availableTags as never}
        regionalCommunities={regionalCommunities as never}
        workspaceId={workspace ?? null}
        editDoc={editDoc}
      />
    </PageContainer>
  )
}
