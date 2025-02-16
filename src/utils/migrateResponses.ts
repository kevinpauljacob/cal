import fs from "fs/promises";
import { parse } from "csv-parse/sync";
import connectToDatabase from "@/utils/database";
import { Listing } from "@/models/listing";
import { MindShare } from "@/models/mindshare";
import { type Tweet } from "@/utils/types";

// Simplified CSV row interface
interface CsvRow {
  Twitter: string;
  Telegram: string;
  "Launch Date": string;
}

// Default values
const DEFAULT_CATEGORY = "utility";

interface UserInfoResponse {
  data: {
    userName: string;
    name: string;
    profilePicture: string;
    description: string;
    followers: number;
    isBlueVerified: boolean;
  };
  status: "success" | "error";
  msg: string;
}

function cleanTwitterUsername(username: string): string {
  if (!username) return "";

  // Remove @ symbol if present
  if (username.startsWith("@")) {
    username = username.slice(1);
  }

  // Remove Twitter/X URLs if present
  const twitterPatterns = [
    /^https?:\/\/(?:www\.)?twitter\.com\//i,
    /^https?:\/\/(?:www\.)?x\.com\/([^/?]+).*/i, // Updated to capture username before query params
  ];

  for (const pattern of twitterPatterns) {
    const match = username.match(pattern);
    if (match && match[1]) {
      // If we captured a username group, use that
      username = match[1];
    } else {
      // Otherwise just remove the pattern
      username = username.replace(pattern, "");
    }
  }

  // Remove any trailing slashes or query parameters
  username = username.split("?")[0].split("/")[0];

  return username.trim();
}

function cleanTelegramUsername(username: string): string {
  if (!username) return "";

  // Handle discord links - return empty as they're not valid telegram usernames
  if (username.includes("discord.com")) return "";

  // Remove @ symbol if present
  if (username.startsWith("@")) {
    username = username.slice(1);
  }

  // Remove Telegram URL if present
  const telegramPattern = /^https?:\/\/(?:www\.)?t\.me\//i;
  username = username.replace(telegramPattern, "");

  // Remove any trailing slashes or query parameters
  username = username.split("?")[0].split("/")[0];

  return username.trim();
}

function parseLaunchDate(dateStr: string): Date | null {
  if (!dateStr) return null;

  try {
    // Handle the M/D/YYYY format
    const [month, day, year] = dateStr.split("/");
    return new Date(
      `${year}-${month.padStart(2, "0")}-${day.padStart(2, "0")}`
    );
  } catch (error) {
    console.log(`Error parsing date: ${dateStr}, returning null`);
    return null;
  }
}

async function getUserInfo(
  username: string,
  apiKey: string
): Promise<UserInfoResponse> {
  const apiUrl = new URL("https://api.twitterapi.io/twitter/user/info");
  apiUrl.searchParams.append("userName", username);

  const response = await fetch(apiUrl.toString(), {
    method: "GET",
    headers: {
      "X-API-Key": apiKey,
      Accept: "application/json",
    },
  });

  if (!response.ok) {
    throw new Error(`HTTP error! status: ${response.status}`);
  }

  const data = await response.json();
  if (data.status === "error") {
    throw new Error(`Twitter API error: ${data.msg}`);
  }

  return data;
}

async function fetchAllTweets(
  username: string,
  apiKey: string
): Promise<Tweet[]> {
  const yesterday = new Date();
  yesterday.setDate(yesterday.getDate() - 1);
  const formattedDate = yesterday.toISOString().split(".")[0] + "_UTC";

  let allTweets: Tweet[] = [];
  let hasNextPage = true;
  let cursor = "";

  while (hasNextPage) {
    const query = `from:${username} since:${formattedDate}`;
    const apiUrl = new URL(
      "https://api.twitterapi.io/twitter/tweet/advanced_search"
    );
    apiUrl.searchParams.append("query", query);
    apiUrl.searchParams.append("queryType", "Latest");
    if (cursor) {
      apiUrl.searchParams.append("cursor", cursor);
    }

    const response = await fetch(apiUrl.toString(), {
      method: "GET",
      headers: {
        "X-API-Key": apiKey,
        Accept: "application/json",
      },
    });

    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }

    const data = await response.json();
    if (!data.tweets) {
      break;
    }

    allTweets = [...allTweets, ...data.tweets];
    hasNextPage = data.has_next_page;
    cursor = data.next_cursor;

    if (hasNextPage) {
      await new Promise((resolve) => setTimeout(resolve, 1000));
    }
  }

  return allTweets;
}

function calculateEngagement(tweets: Tweet[]): number {
  if (tweets.length === 0) return 0;

  const totalEngagement = tweets.reduce((sum, tweet) => {
    return (
      sum +
      ((tweet.likeCount || 0) +
        (tweet.retweetCount || 0) +
        (tweet.replyCount || 0) +
        (tweet.quoteCount || 0) +
        (tweet.bookmarkCount || 0))
    );
  }, 0);

  return totalEngagement / tweets.length;
}

function calculateViews(tweets: Tweet[]): number {
  return tweets.reduce((sum, tweet) => sum + (tweet.viewCount || 0), 0);
}

function calculateMindShareScore(tweets: Tweet[]): number {
  if (tweets.length === 0) return 0;

  const totalEngagement = tweets.reduce((sum, tweet) => {
    return (
      sum +
      ((tweet.likeCount || 0) +
        (tweet.retweetCount || 0) +
        (tweet.replyCount || 0) +
        (tweet.quoteCount || 0) +
        (tweet.bookmarkCount || 0))
    );
  }, 0);

  const totalViews = calculateViews(tweets);
  return totalViews > 0 ? (totalEngagement / totalViews) * 100 : 0;
}

async function processCsvFile(filePath: string) {
  try {
    await connectToDatabase();

    const fileContent = await fs.readFile(filePath, "utf-8");
    const records = parse(fileContent, {
      columns: true,
      skip_empty_lines: true,
      trim: true,
    }) as CsvRow[];

    console.log(`Found ${records.length} records to process`);

    const apiKey = process.env.X_API_KEY;
    if (!apiKey) {
      throw new Error("Twitter API key is not configured");
    }

    const results = {
      successful: [] as any[],
      failed: [] as any[],
    };

    for (const record of records) {
      try {
        const twitterUsername = cleanTwitterUsername(record.Twitter);
        const telegramUsername = cleanTelegramUsername(record.Telegram);

        if (!twitterUsername) {
          results.failed.push({
            record,
            error: "Invalid or missing Twitter username",
          });
          continue;
        }

        // Check if listing already exists
        const existingListing = await Listing.findOne({
          twitterUsername,
        });

        if (existingListing) {
          results.failed.push({
            username: twitterUsername,
            error: "Listing already exists",
          });
          continue;
        }

        // Get user info
        const userInfo = await getUserInfo(twitterUsername, apiKey);

        // Fetch tweets
        const tweets = await fetchAllTweets(twitterUsername, apiKey);

        // Create listing with default values
        const listing = new Listing({
          twitterUsername: userInfo.data.userName,
          screenName: userInfo.data.name,
          profileImageUrl: userInfo.data.profilePicture,
          bio: userInfo.data.description,
          followers: userInfo.data.followers,
          category: DEFAULT_CATEGORY,
          description: userInfo.data.description,
          launchDate: parseLaunchDate(record["Launch Date"]),
          isVerified: userInfo.data.isBlueVerified,
          telegramUserName: telegramUsername || twitterUsername, // Use Twitter username as fallback
        });

        await listing.save();

        // Create mindshare
        const mindShare = new MindShare({
          twitterUsername: userInfo.data.userName,
          date: new Date(),
          engagementRate: tweets.length ? calculateEngagement(tweets) : 0,
          viewsCount: tweets.length ? calculateViews(tweets) : 0,
          mindShareScore: tweets.length ? calculateMindShareScore(tweets) : 0,
          tweetCount: tweets.length,
        });

        await mindShare.save();

        results.successful.push({
          username: twitterUsername,
          telegramUsername,
          listing,
          mindShare,
        });

        // Add delay between processing each record to avoid rate limits
        await new Promise((resolve) => setTimeout(resolve, 2000));
      } catch (error) {
        results.failed.push({
          twitter: record.Twitter,
          error: error instanceof Error ? error.message : "Unknown error",
        });
      }
    }

    // Write results to log files
    const timestamp = new Date().toISOString().replace(/[:.]/g, "-");
    await fs.writeFile(
      `processing-results-${timestamp}.json`,
      JSON.stringify(results, null, 2)
    );

    console.log(`Processing completed:
      Successful: ${results.successful.length}
      Failed: ${results.failed.length}
      See processing-results-${timestamp}.json for details`);
  } catch (error) {
    console.error("Error processing CSV file:", error);
    throw error;
  }
}

await processCsvFile("./responses.csv");
