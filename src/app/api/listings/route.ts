import { NextResponse } from "next/server";
import connectToDatabase from "@/utils/database";
import { Listing } from "@/models/listing";
import { type ListingResponse } from "@/utils/types";
import { PipelineStage } from "mongoose";

const VALID_SORT_FIELDS = {
  followers: "followers",
  mindshare: "mindshare.metrics.24h.score",
  change: "mindshare.metrics.24h.change",
  launchDate: "launchDate",
} as const;

type SortField = keyof typeof VALID_SORT_FIELDS;
type SortOrder = "asc" | "desc";

const isValidSortField = (field: string): field is SortField => {
  return field in VALID_SORT_FIELDS;
};

const isValidSortOrder = (order: string): order is SortOrder => {
  return order === "asc" || order === "desc";
};

export async function GET(request: Request) {
  try {
    await connectToDatabase();

    const { searchParams } = new URL(request.url);
    const page = Math.max(1, parseInt(searchParams.get("page") || "1"));
    const pageSize = 10;
    const skip = (page - 1) * pageSize;

    const sortField = searchParams.get("sort") || "launchDate";
    const sortOrder = searchParams.get("order") || "asc";

    if (!isValidSortField(sortField)) {
      return NextResponse.json(
        {
          status: "error",
          code: "INVALID_SORT_FIELD",
          message: `Invalid sort field. Valid fields are: ${Object.keys(
            VALID_SORT_FIELDS
          ).join(", ")}`,
        },
        { status: 400 }
      );
    }

    if (!isValidSortOrder(sortOrder)) {
      return NextResponse.json(
        {
          status: "error",
          code: "INVALID_SORT_ORDER",
          message: "Sort order must be either 'asc' or 'desc'",
        },
        { status: 400 }
      );
    }

    const totalListings = await Listing.countDocuments({ active: true });

    const pipeline: PipelineStage[] = [
      {
        $match: { active: true },
      },
      {
        $lookup: {
          from: "mindshares",
          let: { username: "$twitterUsername" },
          pipeline: [
            {
              $match: {
                $expr: { $eq: ["$twitterUsername", "$$username"] },
              },
            },
            {
              $sort: { date: -1 },
            },
            {
              $limit: 1,
            },
          ],
          as: "mindshare",
        },
      },
      {
        $addFields: {
          mindshare: {
            $ifNull: [
              { $arrayElemAt: ["$mindshare", 0] },
              {
                engagementRate: 0,
                viewsCount: 0,
                tweetCount: 0,
                metrics: {
                  "24h": { score: 0, change: 0 },
                  "7d": { score: 0, change: 0 },
                },
              },
            ],
          },
        },
      },
      {
        $addFields: {
          hasMindshare: { $gt: ["$mindshare.metrics.24h.score", 0] },
        },
      },
    ];

    // Add sort stages
    pipeline.push({
      $sort: {
        // First sort by whether they have mindshare (pushes 0 scores to end)
        hasMindshare: -1,
        // Then apply the requested sort
        [VALID_SORT_FIELDS[sortField]]: sortOrder === "desc" ? -1 : 1,
        // For items with same sort value, use launch date as tiebreaker
        launchDate: 1,
      },
    });

    pipeline.push(
      {
        $project: {
          _id: 0,
          twitterUsername: 1,
          telegramUsername: 1,
          screenName: 1,
          profileImageUrl: 1,
          bio: 1,
          platform: 1,
          website: 1,
          followers: 1,
          category: 1,
          launchDate: 1,
          engagementRate: "$mindshare.engagementRate",
          viewsCount: "$mindshare.viewsCount",
          tweetCount: "$mindshare.tweetCount",
          mindshare: {
            "24h": {
              score: "$mindshare.metrics.24h.score",
              change: "$mindshare.metrics.24h.change",
            },
            "7d": {
              score: "$mindshare.metrics.7d.score",
              change: "$mindshare.metrics.7d.change",
            },
          },
        },
      },
      {
        $skip: skip,
      },
      {
        $limit: pageSize,
      }
    );

    const listings = await Listing.aggregate<ListingResponse>(pipeline);

    if (!listings.length && page > 1) {
      return NextResponse.json(
        {
          status: "error",
          code: "NO_RESULTS",
          message: "No listings found for this page",
        },
        { status: 404 }
      );
    }

    return NextResponse.json({
      status: "success",
      data: {
        listings,
        pagination: {
          total: totalListings,
          pages: Math.ceil(totalListings / pageSize),
          currentPage: page,
          pageSize,
        },
      },
    });
  } catch (error) {
    console.error("Error fetching listings:", error);
    return NextResponse.json(
      {
        status: "error",
        code: "INTERNAL_SERVER_ERROR",
        message: "Error fetching listings",
        details:
          error instanceof Error ? error.message : "Unknown error occurred",
      },
      { status: 500 }
    );
  }
}
