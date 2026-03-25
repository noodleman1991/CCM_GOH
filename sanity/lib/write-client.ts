import { createClient } from "next-sanity"
import { projectId, dataset, apiVersion } from "../env"

// Server-only Sanity client with editor permissions for mutations
// DO NOT import this in client-side code — the token must stay server-side
export const writeClient = createClient({
    projectId,
    dataset,
    apiVersion,
    useCdn: false,
    token: process.env.SANITY_API_EDITOR_TOKEN,
})
