import { Listing } from "./models/listing";
import { MindShare } from "./models/mindshare";
import { config } from "dotenv";
config();

export async function main() {
  const listings = await Listing.find({});

  for (const listing of listings) {
    try {
      // Fetch last 24h tweets
      const tweetsResponse = await fetch(
        `https://api.twitterapi.io/twitter/user/last_tweets?username=${listing.twitterUsername}&count=100`,
        {
          headers: {
            "X-API-Key": process.env.X_API_KEY!,
          },
        }
      );

      if (!tweetsResponse.ok) continue;

      const tweetsData = await tweetsResponse.json();

      const last24hTweets = tweetsData.tweets.filter((tweet: any) => {
        const tweetDate = new Date(tweet.created_at);
        const yesterday = new Date(Date.now() - 24 * 60 * 60 * 1000);
        return tweetDate >= yesterday;
      });

      const totalEngagement = last24hTweets.reduce(
        (sum: number, tweet: any) => {
          return (
            sum +
            tweet.public_metrics.like_count +
            tweet.public_metrics.retweet_count +
            tweet.public_metrics.reply_count
          );
        },
        0
      );

      const totalViews = last24hTweets.reduce((sum: number, tweet: any) => {
        return sum + tweet.public_metrics.impression_count;
      }, 0);

      const mindShareScore =
        totalViews > 0 ? (totalEngagement / totalViews) * 100 : 0;

      // Create new mindshare entry
      const mindShare = new MindShare({
        twitterUsername: listing.twitterUsername,
        date: new Date(),
        engagementRate: totalEngagement / last24hTweets.length,
        viewsCount: totalViews,
        mindShareScore,
        tweetCount: last24hTweets.length,
      });

      await mindShare.save();

      // Update listing last updated timestamp
      await Listing.findByIdAndUpdate(listing._id, {
        lastUpdated: new Date(),
      });
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
