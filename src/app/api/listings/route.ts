import { NextResponse } from "next/server";
import connectToDatabase from "@/utils/database";
import { Listing } from "@/models/listing";

export async function GET(request: Request) {
  try {
    await connectToDatabase();

    // Get URL parameters
    const { searchParams } = new URL(request.url);
    const page = Math.max(1, parseInt(searchParams.get("page") || "1"));
    const pageSize = 10;
    const skip = (page - 1) * pageSize;

    const totalListings = await Listing.countDocuments();

    // Calculate reference dates
    const now = new Date();
    const sevenDaysAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
    const fourteenDaysAgo = new Date(now.getTime() - 14 * 24 * 60 * 60 * 1000);

    const listings = await Listing.aggregate([
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
          // Latest metrics (most recent record)
          latestMetrics: { $arrayElemAt: ["$mindShareHistory", 0] },
          // Second latest metrics (for 24h change)
          previousMetrics: { $arrayElemAt: ["$mindShareHistory", 1] },
          // Last 7 days metrics
          sevenDayMetrics: {
            $filter: {
              input: "$mindShareHistory",
              as: "item",
              cond: { $gte: ["$$item.date", sevenDaysAgo] },
            },
          },
          // Previous 7 days metrics
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
      {
        $sort: {
          "mindshare.24h.score": -1,
        },
      },
      {
        $skip: skip,
      },
      {
        $limit: pageSize,
      },
    ]);

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
