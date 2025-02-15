import { NextRequest, NextResponse } from "next/server";
import connectToDatabase from "@/utils/database";
import { Listing } from "@/models/listing";

export async function GET(request: NextRequest) {
  try {
    await connectToDatabase();

    const searchParams = request.nextUrl.searchParams;
    const query = (searchParams.get("q") || "").trim();
    const page = Math.max(1, parseInt(searchParams.get("page") || "1"));
    const pageSize = 10;
    const skip = (page - 1) * pageSize;

    // Get sort parameters
    const sortField = searchParams.get("sort") || "mindshare.24h.score";
    const sortOrder = searchParams.get("order") || "desc";

    if (!query) {
      return NextResponse.json(
        {
          status: "error",
          code: "INVALID_QUERY",
          message: "Search query is required",
        },
        { status: 400 }
      );
    }

    // Create search conditions
    const searchConditions = {
      $or: [
        { screenName: { $regex: query, $options: "i" } },
        { twitterUsername: { $regex: query, $options: "i" } },
      ],
    };

    // Get total count for pagination
    const totalResults = await Listing.countDocuments(searchConditions);

    // Calculate reference dates (same as listings API)
    const now = new Date();
    const sevenDaysAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
    const fourteenDaysAgo = new Date(now.getTime() - 14 * 24 * 60 * 60 * 1000);

    // Create the sort object
    const sortObj: any = {};
    sortObj[sortField] = sortOrder === "asc" ? 1 : -1;

    const searchResults = await Listing.aggregate([
      {
        $match: searchConditions,
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
      // Rest of the aggregation pipeline same as listings API
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
              score: { $ifNull: ["$latestMetrics.mindShareScore", 0] },
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
        $sort: sortObj,
      },
      {
        $skip: skip,
      },
      {
        $limit: pageSize,
      },
    ]);

    return NextResponse.json(
      {
        status: "success",
        data: {
          results: searchResults,
          pagination: {
            total: totalResults,
            pages: Math.ceil(totalResults / pageSize),
            currentPage: page,
            pageSize,
          },
        },
      },
      { status: 200 }
    );
  } catch (error) {
    return NextResponse.json(
      {
        status: "error",
        code: "INTERNAL_SERVER_ERROR",
        message: "An error occurred while processing your request",
        details:
          error instanceof Error ? error.message : "Unknown error occurred",
      },
      { status: 500 }
    );
  }
}
