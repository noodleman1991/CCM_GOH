import { type QueryType, type DynamicQueryParams } from "@/lib/dynamic-queries-types";

/**
 * Client-side function to fetch dynamic content via API route
 */
export async function fetchDynamicContent(
  queryType: QueryType,
  params: DynamicQueryParams
): Promise<unknown[] | null> {
  try {
    const searchParams = new URLSearchParams({
      queryType,
      communitySlug: params.communitySlug,
      count: params.count.toString(),
    });

    const response = await fetch(`/api/dynamic-content?${searchParams}`);

    if (!response.ok) {
      const errorData = await response.json();
      throw new Error(errorData.error || `HTTP error! status: ${response.status}`);
    }

    const result = await response.json();
    return result.data;
  } catch (error) {
    console.error(`Error fetching dynamic content for ${queryType}:`, error);
    throw error;
  }
}