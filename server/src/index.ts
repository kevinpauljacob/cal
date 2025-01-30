import { Listing } from "./models/listing";
import { MindShare } from "./models/mindshare";
import connectToDatabase from "./utils/database";
import { config } from "dotenv";
config();

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

export async function main() {
  try {
    await connectToDatabase();
    console.log("Database connection established successfully");
    const listings = await Listing.find({});
    console.log(`Found ${listings.length} listings to process`);

    for (const listing of listings) {
      console.log(`\n----------------------------------------`);
      console.log(`Processing Twitter user: ${listing.twitterUsername}`);
      try {
        const yesterday = new Date(Date.now() - 24 * 60 * 60 * 1000);
        const formattedDate = yesterday.toISOString().split(".")[0] + "_UTC";

        const query = `from:${listing.twitterUsername} since:${formattedDate}`;

        let allTweets: Tweet[] = [];
        let cursor = "";
        let hasNextPage = true;
        let pageCount = 0;

        while (hasNextPage) {
          pageCount++;
          console.log(`\nFetching page ${pageCount} of tweets...`);

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

          const recentTweets = tweetsData.tweets.filter((tweet) => {
            const tweetDate = new Date(tweet.createdAt);
            return tweetDate >= yesterday;
          });

          allTweets = [...allTweets, ...tweetsData.tweets];

          if (recentTweets.length === 0) {
            console.log(`Total tweets collected so far: ${allTweets.length}`);
            console.log("No more recent tweets found, stopping pagination");
            hasNextPage = false;
          } else {
            hasNextPage = tweetsData.has_next_page;
            cursor = tweetsData.next_cursor;
            console.log(`Has next page: ${hasNextPage}`);
          }
        }

        if (allTweets.length === 0) {
          console.log(
            `No tweets found in the last 24 hours for ${listing.twitterUsername}`
          );
          continue;
        }

        const followersCount = allTweets[0]?.author.followers;
        console.log(`\nCalculating metrics for ${allTweets.length} tweets`);
        console.log(`Current follower count: ${followersCount}`);

        // Updated engagement calculation to include bookmarks and quotes
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

    console.log("\nScript execution completed successfully");
    process.exit(0);
  } catch (error) {
    console.error(
      "Fatal error occurred:",
      error instanceof Error ? error.message : error
    );
    process.exit(1);
  }
}

main();
