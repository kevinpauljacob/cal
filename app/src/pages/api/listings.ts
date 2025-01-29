import { NextApiRequest, NextApiResponse } from "next";
import connectToDatabase from "@/utils/database";
import { Listing } from "@/models/listing";

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse
) {
  if (req.method !== "GET") {
    return res.status(405).json({
      status: "error",
      code: "METHOD_NOT_ALLOWED",
      message: "Method not allowed",
    });
  }

  try {
    await connectToDatabase();

    const page = Math.max(1, parseInt((req.query.page as string) || "1"));
    const pageSize = 10;
    const skip = (page - 1) * pageSize;

    const totalListings = await Listing.countDocuments();

    // Calculate reference dates
    const now = new Date();
    const twentyFourHoursAgo = new Date(now.getTime() - 24 * 60 * 60 * 1000);
    const fortyEightHoursAgo = new Date(now.getTime() - 48 * 60 * 60 * 1000);
    const sevenDaysAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
    const fourteenDaysAgo = new Date(now.getTime() - 14 * 24 * 60 * 60 * 1000);

    const listings = await Listing.aggregate([
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
          // Latest metrics
          latestMetrics: {
            $arrayElemAt: ["$mindShareHistory", 0],
          },
          // 24h ago metrics
          twentyFourHoursAgoMetrics: {
            $filter: {
              input: "$mindShareHistory",
              as: "item",
              cond: {
                $and: [
                  { $gte: ["$$item.date", twentyFourHoursAgo] },
                  { $lt: ["$$item.date", now] },
                ],
              },
            },
          },
          // Previous 24h metrics (for change calculation)
          previousTwentyFourHoursMetrics: {
            $filter: {
              input: "$mindShareHistory",
              as: "item",
              cond: {
                $and: [
                  { $gte: ["$$item.date", fortyEightHoursAgo] },
                  { $lt: ["$$item.date", twentyFourHoursAgo] },
                ],
              },
            },
          },
          // 7d metrics
          sevenDayMetrics: {
            $filter: {
              input: "$mindShareHistory",
              as: "item",
              cond: {
                $and: [
                  { $gte: ["$$item.date", sevenDaysAgo] },
                  { $lt: ["$$item.date", now] },
                ],
              },
            },
          },
          // Previous 7d metrics (for change calculation)
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
                $avg: "$twentyFourHoursAgoMetrics.mindShareScore",
              },
              change: {
                $subtract: [
                  { $avg: "$twentyFourHoursAgoMetrics.mindShareScore" },
                  { $avg: "$previousTwentyFourHoursMetrics.mindShareScore" },
                ],
              },
            },
            "7d": {
              score: {
                $avg: "$sevenDayMetrics.mindShareScore",
              },
              change: {
                $subtract: [
                  { $avg: "$sevenDayMetrics.mindShareScore" },
                  { $avg: "$previousSevenDayMetrics.mindShareScore" },
                ],
              },
            },
          },
          engagementRate: "$latestMetrics.engagementRate",
          viewsCount: "$latestMetrics.viewsCount",
          tweetCount: "$latestMetrics.tweetCount",
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
      return res.status(404).json({
        status: "error",
        code: "NO_RESULTS",
        message: "No listings found for this page",
      });
    }

    res.status(200).json({
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
    res.status(500).json({
      status: "error",
      code: "FETCH_ERROR",
      message: "Error fetching listings",
      details:
        error instanceof Error ? error.message : "Unknown error occurred",
    });
  }
}
