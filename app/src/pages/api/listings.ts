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

    // Calculate the date 7 days ago
    const sevenDaysAgo = new Date();
    sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);

    // Fetch listings with their mindshare data
    const listings = await Listing.aggregate([
      {
        $lookup: {
          from: "mindshares", // Make sure this matches your collection name
          let: { username: "$twitterUsername" },
          pipeline: [
            {
              $match: {
                $expr: {
                  $and: [
                    { $eq: ["$twitterUsername", "$$username"] },
                    { $gte: ["$date", sevenDaysAgo] }, // Direct date comparison since field is already a Date
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
          latestMindShare: {
            $cond: {
              if: { $gt: [{ $size: "$mindShareHistory" }, 0] },
              then: { $arrayElemAt: ["$mindShareHistory", 0] },
              else: null,
            },
          },
        },
      },
      {
        $sort: {
          createdAt: -1,
        },
      },
      {
        $skip: skip,
      },
      {
        $limit: pageSize,
      },
    ]);

    // Add a debug log to check the MongoDB query results
    console.log("Fetched listings:", JSON.stringify(listings, null, 2));

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
