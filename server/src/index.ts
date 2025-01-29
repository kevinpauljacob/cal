import { Listing } from "./models/listing";
import { MindShare } from "./models/mindshare";
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
  const listings = await Listing.find({});

  for (const listing of listings) {
    try {
      const yesterday = new Date(Date.now() - 24 * 60 * 60 * 1000);
      const formattedDate = yesterday.toISOString().split(".")[0] + "_UTC";

      const query = `from:${listing.twitterUsername} since:${formattedDate}`;

      let allTweets: Tweet[] = [];
      let cursor = "";
      let hasNextPage = true;

      while (hasNextPage) {
        const url = new URL(
          "https://api.twitterapi.io/twitter/tweet/advanced_search"
        );
        url.searchParams.append("query", query);
        url.searchParams.append("queryType", "Latest");
        if (cursor) url.searchParams.append("cursor", cursor);

        const tweetsResponse = await fetch(url.toString(), {
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
        allTweets = [...allTweets, ...tweetsData.tweets];

        hasNextPage = tweetsData.has_next_page;
        cursor = tweetsData.next_cursor;
      }

      const followersCount = allTweets[0]?.author.followers;

      // Updated engagement calculation to include bookmarks and quotes
      const totalEngagement = allTweets.reduce((sum: number, tweet: Tweet) => {
        return (
          sum +
          tweet.likeCount +
          tweet.retweetCount +
          tweet.replyCount +
          tweet.bookmarkCount +
          tweet.quoteCount
        );
      }, 0);

      const totalViews = allTweets.reduce((sum: number, tweet: Tweet) => {
        return sum + tweet.viewCount;
      }, 0);

      const mindShareScore =
        totalViews > 0 ? (totalEngagement / totalViews) * 100 : 0;

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

      if (followersCount) {
        await Listing.findByIdAndUpdate(listing._id, {
          followers: followersCount,
          lastUpdated: new Date(),
        });
      }
    } catch (error) {
      console.error(
        `Error updating mindshare for ${listing.twitterUsername}:`,
        error
      );
      continue;
    }
  }
}

main();
