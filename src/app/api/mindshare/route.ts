import { NextResponse } from "next/server";
import { Listing } from "@/models/listing";
import { MindShare } from "@/models/mindshare";
import connectToDatabase from "@/utils/database";
import { delay } from "@/utils/helper";

interface Author {
  followers: number;
}

interface Tweet {
  createdAt: string;
  retweetCount: number;
  replyCount: number;
  likeCount: number;
  viewCount: number;
  bookmarkCount: number;
  quoteCount: number;
  author: Author;
}

interface TwitterResponse {
  tweets: Tweet[];
  has_next_page: boolean;
  next_cursor: string;
}

async function calculateMetrics(twitterUsername: string, currentScore: number) {
  console.log("\n=== Debug Info for", twitterUsername, "===");
  console.log("Current Score:", currentScore);

  // Get historical mindshare data - last 14 days for 7d average
  const fourteenDaysAgo = new Date();
  fourteenDaysAgo.setDate(fourteenDaysAgo.getDate() - 14);

  const mindshareHistory = await MindShare.find({
    twitterUsername,
    date: { $gte: fourteenDaysAgo },
  }).sort({ date: -1 });

  console.log("Found historical records:", mindshareHistory.length);

  // For 24h change, just get the last document
  const previousDocument = mindshareHistory[0]; // Current most recent document
  const previousDayScore = previousDocument
    ? previousDocument.metrics["24h"].score
    : currentScore;

  console.log("Previous document score:", previousDayScore);

  // For 7d average, use the last 7 documents (excluding the most recent)
  const last7Docs = mindshareHistory.slice(0, 7);
  const previous7Docs = mindshareHistory.slice(7, 14);

  const last7DayAvg =
    last7Docs.length > 0
      ? last7Docs.reduce((sum, m) => sum + m.metrics["24h"].score, 0) /
        last7Docs.length
      : currentScore;

  const previous7DayAvg =
    previous7Docs.length > 0
      ? previous7Docs.reduce((sum, m) => sum + m.metrics["24h"].score, 0) /
        previous7Docs.length
      : last7DayAvg;

  console.log("7-day calculations:");
  console.log("Last 7 docs count:", last7Docs.length);
  console.log("Previous 7 docs count:", previous7Docs.length);
  console.log("Last 7 day average:", last7DayAvg);
  console.log("Previous 7 day average:", previous7DayAvg);

  // Calculate percentage changes
  const calculate24hChange = () => {
    if (previousDayScore === 0) return 0;
    const change = ((currentScore - previousDayScore) / previousDayScore) * 100;
    return Number(change.toFixed(2));
  };

  const calculate7dChange = () => {
    if (previous7DayAvg === 0) return 0;
    const change = ((last7DayAvg - previous7DayAvg) / previous7DayAvg) * 100;
    return Number(change.toFixed(2));
  };

  const metrics = {
    "24h": {
      score: Number(currentScore.toFixed(2)),
      change: calculate24hChange(),
    },
    "7d": {
      score: Number(last7DayAvg.toFixed(2)),
      change: calculate7dChange(),
    },
  };

  console.log("Final calculated metrics:", metrics);

  return metrics;
}

export async function GET() {
  try {
    await connectToDatabase();
    console.log("Database connection established successfully");

    // Get and process active listings
    const listings = await Listing.find({ active: true });
    console.log(`Found ${listings.length} active listings to process`);

    // Check and deactivate passed launch dates
    const currentTime = new Date();
    await Promise.all(
      listings.map(async (listing) => {
        if (currentTime >= listing.launchDate) {
          await Listing.findByIdAndUpdate(listing._id, { active: false });
        }
      })
    );

    // Process remaining active listings
    const activeListings = await Listing.find({ active: true });

    for (const listing of activeListings) {
      console.log(`\nProcessing Twitter user: ${listing.twitterUsername}`);
      try {
        // Construct Twitter search query
        const query = `(from:${listing.twitterUsername} OR (@${listing.twitterUsername} -from:${listing.twitterUsername})) within_time:24h -filter:retweets (filter:self_threads OR -filter:replies)`;

        // Fetch tweets with pagination
        let allTweets: Tweet[] = [];
        let cursor = "";

        while (true) {
          await delay(500, 1000);

          const url = new URL(
            "https://api.twitterapi.io/twitter/tweet/advanced_search"
          );
          url.searchParams.append("query", query);
          url.searchParams.append("queryType", "Latest");
          if (cursor) url.searchParams.append("cursor", cursor);

          const response = await fetch(url.toString(), {
            headers: {
              "X-API-Key": process.env.X_API_KEY!,
            },
          });

          if (!response.ok) {
            throw new Error(`Twitter API error: ${response.statusText}`);
          }

          const data: TwitterResponse = await response.json();
          if (data.tweets.length === 0) break;

          allTweets = [...allTweets, ...data.tweets];

          if (!data.has_next_page || !data.next_cursor) break;
          cursor = data.next_cursor;
        }

        if (allTweets.length === 0) {
          console.log(`No tweets found for ${listing.twitterUsername}`);
          continue;
        }

        // Calculate engagement metrics
        const totalEngagement = allTweets.reduce((sum, tweet) => {
          return (
            sum +
            tweet.likeCount +
            tweet.retweetCount +
            tweet.replyCount +
            tweet.bookmarkCount +
            tweet.quoteCount
          );
        }, 0);

        const totalViews = allTweets.reduce(
          (sum, tweet) => sum + tweet.viewCount,
          0
        );

        // Calculate mindshare score (engagement/views ratio)
        const mindShareScore =
          totalViews > 0 ? (totalEngagement / totalViews) * 100 : 0;

        // Calculate engagement rate per tweet
        const engagementRate =
          allTweets.length > 0 ? totalEngagement / allTweets.length : 0;

        // Calculate metrics including 24h and 7d changes
        const metrics = await calculateMetrics(
          listing.twitterUsername,
          mindShareScore
        );

        // Create new MindShare document
        const mindShare = new MindShare({
          twitterUsername: listing.twitterUsername,
          date: new Date(),
          engagementRate,
          tweetCount: allTweets.length,
          viewsCount: totalViews,
          metrics,
        });

        await mindShare.save();
        console.log(`Mindshare data saved for ${listing.twitterUsername}`);

        // Update listing followers count
        const followersCount = allTweets[0]?.author.followers;
        if (followersCount) {
          await Listing.findByIdAndUpdate(listing._id, {
            followers: followersCount,
            lastUpdated: new Date(),
          });
        }
      } catch (error) {
        console.error(`Error processing ${listing.twitterUsername}:`, error);
        continue;
      }
    }

    return NextResponse.json({
      status: "success",
      message: "Mindshare calculation completed",
      processedListings: activeListings.length,
    });
  } catch (error) {
    console.error("Fatal error:", error);
    return NextResponse.json(
      { success: false, error: String(error) },
      { status: 500 }
    );
  }
}
