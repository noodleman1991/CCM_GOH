/**
 * A Content feed section's raw values → its settings, exactly as the page maps
 * them. The public door to that mapper for the admin's "What will show now"
 * route (app/ may not import lib/content/internal directly).
 */
export { contentFeedSettings } from "@/lib/content/internal/payload/blocks";
