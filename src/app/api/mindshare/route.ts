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

export async function GET() {
  try {
    await connectToDatabase();
    console.log("Database connection established successfully");
    // Get active listings and check launch dates
    const listings = await Listing.find({ active: true });
    const currentTime = new Date();
    console.log(`Found ${listings.length} listings to process`);

    // Deactivate listings with passed launch dates
    await Promise.all(
      listings.map(async (listing) => {
        if (currentTime >= listing.launchDate) {
          await Listing.findByIdAndUpdate(listing._id, { active: false });
        }
      })
    );

    // Get remaining active listings
    const activeListings = await Listing.find({ active: true });

    for (const listing of activeListings) {
      console.log(`\n----------------------------------------`);
      console.log(`Processing Twitter user: ${listing.twitterUsername}`);
      try {
        const query = `from:${listing.twitterUsername} within_time:3h`;
        console.log(`Search query: ${query}`);

        let allTweets: Tweet[] = [];
        let cursor = "";
        let pageCount = 0;

        while (true) {
          pageCount++;
          console.log(`\nFetching page ${pageCount} of tweets...`);

          await delay(500, 1000);

          const url = new URL(
            "https://api.twitterapi.io/twitter/tweet/advanced_search"
          );
          url.searchParams.append("query", query);
          url.searchParams.append("queryType", "Latest");
          if (cursor) url.searchParams.append("cursor", cursor);

          console.log(`Making API request to: ${url.toString()}`);

          const tweetsResponse = await fetch(url.toString(), {
            method: "GET",
            headers: {
              "X-API-Key": process.env.X_API_KEY!,
            },
          });

          if (!tweetsResponse.ok) {
            console.error(
              `Failed to fetch tweets for ${listing.twitterUsername}`
            );
            break;
          }

          const tweetsData: TwitterResponse = await tweetsResponse.json();
          console.log(
            `Received ${tweetsData.tweets.length} tweets in this page`
          );

          if (tweetsData.tweets.length === 0) {
            console.log("No tweets found in this page, stopping pagination");
            break;
          }

          allTweets = [...allTweets, ...tweetsData.tweets];

          if (!tweetsData.has_next_page || !tweetsData.next_cursor) {
            console.log("No more pages available");
            break;
          }

          cursor = tweetsData.next_cursor;
          console.log(`Moving to next page with cursor: ${cursor}`);
        }

        if (allTweets.length === 0) {
          console.log(
            `No tweets found for ${listing.twitterUsername} in the last 24 hours`
          );
          continue;
        }

        const followersCount = allTweets[0]?.author.followers;
        console.log(`\nCalculating metrics for ${allTweets.length} tweets`);
        console.log(`Current follower count: ${followersCount}`);

        const totalEngagement = allTweets.reduce(
          (sum: number, tweet: Tweet) => {
            return (
              sum +
              tweet.likeCount +
              tweet.retweetCount +
              tweet.replyCount +
              tweet.bookmarkCount +
              tweet.quoteCount
            );
          },
          0
        );

        const totalViews = allTweets.reduce((sum: number, tweet: Tweet) => {
          return sum + tweet.viewCount;
        }, 0);

        const mindShareScore =
          totalViews > 0 ? (totalEngagement / totalViews) * 100 : 0;

        console.log(`Metrics calculated:`);
        console.log(`- Total engagement: ${totalEngagement}`);
        console.log(`- Total views: ${totalViews}`);
        console.log(`- Mind share score: ${mindShareScore.toFixed(2)}%`);
        console.log(`- Tweet count: ${allTweets.length}`);

        const mindShare = new MindShare({
          twitterUsername: listing.twitterUsername,
          date: new Date(),
          engagementRate:
            allTweets.length > 0 ? totalEngagement / allTweets.length : 0,
          viewsCount: totalViews,
          mindShareScore,
          tweetCount: allTweets.length,
        });

        await mindShare.save();
        console.log("Mind share data saved successfully");

        if (followersCount) {
          await Listing.findByIdAndUpdate(listing._id, {
            followers: followersCount,
            lastUpdated: new Date(),
          });
          console.log("Listing updated successfully");
        }
      } catch (error) {
        console.error(
          `Error processing ${listing.twitterUsername}:`,
          error instanceof Error ? error.message : error
        );
        continue;
      }
    }

    console.log("Script execution completed successfully");

    return NextResponse.json(
      {
        status: "success",
        message: "Script execution completed successfully",
        processedListings: listings.length,
      },
      { status: 200 }
    );
  } catch (error) {
    console.error(
      "Fatal error occurred:",
      error instanceof Error ? error.message : error
    );
    return NextResponse.json(
      {
        success: false,
        error: error instanceof Error ? error.message : String(error),
      },
      { status: 500 }
    );
  }
}
