import { NextResponse } from "next/server";
import connectToDatabase from "@/utils/database";
import { Listing } from "@/models/listing";
import { PipelineStage } from "mongoose";

// Valid sort fields and their corresponding MongoDB field paths
const VALID_SORT_FIELDS = {
  followers: "followers",
  mindshare: "mindshare.24h.score",
  change: "mindshare.24h.change",
  launchDate: "launchDate",
} as const;

type SortField = keyof typeof VALID_SORT_FIELDS;
type SortOrder = "asc" | "desc";

// Validation functions
const isValidSortField = (field: string): field is SortField => {
  return field in VALID_SORT_FIELDS;
};

const isValidSortOrder = (order: string): order is SortOrder => {
  return order === "asc" || order === "desc";
};

export async function GET(request: Request) {
  try {
    await connectToDatabase();

    // Get URL parameters
    const { searchParams } = new URL(request.url);
    const page = Math.max(1, parseInt(searchParams.get("page") || "1"));
    const pageSize = 10;
    const skip = (page - 1) * pageSize;

    // Get and validate sort parameters
    const sortField = searchParams.get("sort") || "launchDate";
    const sortOrder = searchParams.get("order") || "asc";

    // Validate sort parameters
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

    const totalListings = await Listing.countDocuments();

    // Calculate reference dates
    const now = new Date();
    const sevenDaysAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
    const fourteenDaysAgo = new Date(now.getTime() - 14 * 24 * 60 * 60 * 1000);

    // Build sort pipeline stages
    const sortPipeline: PipelineStage[] = [];

    if (sortField === "launchDate") {
      // Add a stage to compute the sort field
      sortPipeline.push({
        $addFields: {
          _tempSortField: {
            $cond: {
              if: { $eq: ["$launchDate", null] },
              then: sortOrder === "desc" ? new Date(0) : new Date("2099-12-31"),
              else: "$launchDate",
            },
          },
        },
      });

      // Add the sort stage
      sortPipeline.push({
        $sort: {
          _tempSortField: sortOrder === "desc" ? -1 : 1,
        },
      });
    } else {
      // For other fields, sort directly
      sortPipeline.push({
        $sort: {
          [VALID_SORT_FIELDS[sortField]]: sortOrder === "desc" ? -1 : 1,
        },
      });
    }

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
                $expr: {
                  $and: [
                    { $eq: ["$twitterUsername", "$$username"] },
                    { $gte: ["$date", fourteenDaysAgo] },
                  ],
                },
              },
            },
            {
              $sort: { date: -1 },
            },
          ],
          as: "mindShareHistory",
        },
      },
      {
        $addFields: {
          latestMetrics: { $arrayElemAt: ["$mindShareHistory", 0] },
          previousMetrics: { $arrayElemAt: ["$mindShareHistory", 1] },
          sevenDayMetrics: {
            $filter: {
              input: "$mindShareHistory",
              as: "item",
              cond: { $gte: ["$$item.date", sevenDaysAgo] },
            },
          },
          previousSevenDayMetrics: {
            $filter: {
              input: "$mindShareHistory",
              as: "item",
              cond: {
                $and: [
                  { $gte: ["$$item.date", fourteenDaysAgo] },
                  { $lt: ["$$item.date", sevenDaysAgo] },
                ],
              },
            },
          },
        },
      },
      {
        $addFields: {
          mindshare: {
            "24h": {
              score: {
                $ifNull: ["$latestMetrics.mindShareScore", 0],
              },
              change: {
                $ifNull: [
                  {
                    $subtract: [
                      "$latestMetrics.mindShareScore",
                      { $ifNull: ["$previousMetrics.mindShareScore", 0] },
                    ],
                  },
                  0,
                ],
              },
            },
            "7d": {
              score: {
                $ifNull: [{ $avg: "$sevenDayMetrics.mindShareScore" }, 0],
              },
              change: {
                $ifNull: [
                  {
                    $subtract: [
                      {
                        $ifNull: [
                          { $avg: "$sevenDayMetrics.mindShareScore" },
                          0,
                        ],
                      },
                      {
                        $ifNull: [
                          { $avg: "$previousSevenDayMetrics.mindShareScore" },
                          0,
                        ],
                      },
                    ],
                  },
                  0,
                ],
              },
            },
          },
          engagementRate: { $ifNull: ["$latestMetrics.engagementRate", 0] },
          viewsCount: { $ifNull: ["$latestMetrics.viewsCount", 0] },
          tweetCount: { $ifNull: ["$latestMetrics.tweetCount", 0] },
        },
      },
      {
        $project: {
          _id: 0,
          twitterUsername: 1,
          screenName: 1,
          profileImageUrl: 1,
          bio: 1,
          followers: 1,
          category: 1,
          launchDate: 1,
          engagementRate: 1,
          viewsCount: 1,
          tweetCount: 1,
          mindshare: 1,
        },
      },
      ...sortPipeline,
      {
        $skip: skip,
      },
      {
        $limit: pageSize,
      },
    ];

    const listings = await Listing.aggregate(pipeline);

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
