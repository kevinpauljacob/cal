import { NextResponse } from "next/server";
import connectToDatabase from "@/utils/database";
import { MindShare } from "@/models/mindshare";
import { Listing } from "@/models/listing";

export async function GET(request: Request) {
  try {
    await connectToDatabase();

    const { searchParams } = new URL(request.url);
    const timeframe = (searchParams.get("timeframe") as "24h" | "7d") || "24h";

    // Get recent mindshare data (last 7 days to cover both timeframes)
    const sevenDaysAgo = new Date();
    sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);

    const mindshareData = await MindShare.find({
      date: { $gte: sevenDaysAgo },
    }).sort({ date: -1 });

    // Get latest entry for each token and filter positive changes
    const latestByToken = new Map();
    mindshareData.forEach((entry) => {
      if (!latestByToken.has(entry.twitterUsername)) {
        latestByToken.set(entry.twitterUsername, entry);
      }
    });

    // Convert to array, filter positive changes and sort
    const trendingData = Array.from(latestByToken.values())
      .filter((entry) => entry.metrics[timeframe].change > 0)
      .sort((a, b) => b.metrics[timeframe].change - a.metrics[timeframe].change)
      .slice(0, 10);

    // console.log("Found trending data:", trendingData);

    // Get listing details
    const twitterUsernames = trendingData.map((item) => item.twitterUsername);
    const listingDetails = await Listing.find({
      twitterUsername: { $in: twitterUsernames },
    }).select("twitterUsername screenName profileImageUrl");

    // console.log("Found listing details:", listingDetails);

    // Combine and format the response
    const trending = trendingData.map((mindshare) => {
      const listing = listingDetails.find(
        (l) => l.twitterUsername === mindshare.twitterUsername
      );

      return {
        name: listing?.screenName || "",
        avatar: listing?.profileImageUrl || "",
        percentage: mindshare.metrics[timeframe].change,
      };
    });

    // console.log("Final trending response:", trending);

    return NextResponse.json({
      success: true,
      data: trending,
    });
  } catch (error) {
    console.error("Error in trending API:", error);
    return NextResponse.json(
      { success: false, error: "Internal server error" },
      { status: 500 }
    );
  }
}
