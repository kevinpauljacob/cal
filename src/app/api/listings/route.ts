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
          // For launch date sorting
          ...(sortField === "launchDate"
            ? {
                hasLaunchDate: { $ne: ["$launchDate", null] },
              }
            : {
                // For other fields, we'll use this to push zeros to the end
                hasNonZeroValue: {
                  $cond: [
                    {
                      $gt: [
                        {
                          $abs: {
                            $ifNull: ["$" + VALID_SORT_FIELDS[sortField], 0],
                          },
                        },
                        0,
                      ],
                    },
                    1,
                    0,
                  ],
                },
              }),
        },
      },
    ];

    // Construct sort stage based on sort field
    const sortStage: PipelineStage = {
      $sort:
        sortField === "launchDate"
          ? {
              // For launchDate sorting:
              // In ASC: hasLaunchDate: -1 puts listings WITH dates first
              // In DESC: hasLaunchDate: 1 puts listings WITHOUT dates first
              hasLaunchDate: sortOrder === "asc" ? -1 : 1,
              [VALID_SORT_FIELDS[sortField]]: sortOrder === "desc" ? -1 : 1,
            }
          : {
              // For other fields, push zeros to the end regardless of sort order
              hasNonZeroValue: -1, // Non-zero values (1) come before zero values (0)
              [VALID_SORT_FIELDS[sortField]]: sortOrder === "desc" ? -1 : 1,
            },
    };

    pipeline.push(sortStage);

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
