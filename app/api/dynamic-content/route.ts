import { NextRequest, NextResponse } from "next/server";
import { executePredefinedQuery } from "@/lib/dynamic-queries";
import { validateQueryParams, type QueryType } from "@/lib/dynamic-queries-types";

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const queryType = searchParams.get("queryType") as QueryType;
    const communitySlug = searchParams.get("communitySlug");
    const count = parseInt(searchParams.get("count") || "6");

    if (!queryType || !communitySlug) {
      return NextResponse.json(
        { error: "Missing required parameters: queryType and communitySlug" },
        { status: 400 }
      );
    }

    const params = { communitySlug, count };

    if (!validateQueryParams(params)) {
      return NextResponse.json(
        { error: "Invalid query parameters" },
        { status: 400 }
      );
    }

    const data = await executePredefinedQuery(queryType, params);

    return NextResponse.json({ data }, { status: 200 });
  } catch (error) {
    console.error("Error in dynamic content API:", error);
    return NextResponse.json(
      { error: "Failed to fetch dynamic content" },
      { status: 500 }
    );
  }
}