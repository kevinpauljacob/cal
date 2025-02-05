import { NextResponse } from "next/server";
import connectToDatabase from "@/utils/database";
import { Listing } from "@/models/listing";
import { MindShare } from "@/models/mindshare";
import { type Tweet } from "@/utils/types";

interface AdvancedSearchResponse {
  tweets: Tweet[];
  has_next_page: boolean;
  next_cursor: string;
}

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

async function checkExistingListing(twitterUsername: string): Promise<void> {
  const existingListing = await Listing.findOne({ twitterUsername });
  if (existingListing) {
    throw new Error(
      `Listing already exists for Twitter username: ${twitterUsername}`
    );
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
  console.log(data);
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

    const data: AdvancedSearchResponse = await response.json();

    if (!data.tweets) {
      break;
    }

    allTweets = [...allTweets, ...data.tweets];
    hasNextPage = data.has_next_page;
    cursor = data.next_cursor;

    // Add a small delay between requests to avoid rate limiting
    if (hasNextPage) {
      await new Promise((resolve) => setTimeout(resolve, 1000));
    }
  }

  return allTweets;
}

async function createListingAndMindshare(
  userData: UserInfoResponse["data"],
  category: string,
  launchDate: string,
  tweets: Tweet[] = [],
  telegramUserName: string,
  creatorPublicKey: string
) {
  const listing = new Listing({
    twitterUsername: userData.userName,
    screenName: userData.name,
    profileImageUrl: userData.profilePicture,
    bio: userData.description,
    followers: userData.followers,
    category,
    launchDate: new Date(launchDate),
    isVerified: userData.isBlueVerified,
    creatorPublicKey: creatorPublicKey,
    telegramUserName: telegramUserName,
  });

  await listing.save();

  const mindShare = new MindShare({
    twitterUsername: userData.userName,
    date: new Date(),
    engagementRate: tweets.length ? calculateEngagement(tweets) : 0,
    viewsCount: tweets.length ? calculateViews(tweets) : 0,
    mindShareScore: tweets.length ? calculateMindShareScore(tweets) : 0,
    tweetCount: tweets.length,
  });

  await mindShare.save();

  return { listing, mindShare };
}

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const {
      twitterUsername,
      category,
      launchDate,
      telegramUserName,
      creatorPublicKey,
    } = body;

    if (!twitterUsername) {
      return NextResponse.json(
        { message: "Twitter username is required" },
        { status: 400 }
      );
    }

    await connectToDatabase();
    await checkExistingListing(twitterUsername);

    const apiKey = process.env.X_API_KEY;
    if (!apiKey) {
      throw new Error("Twitter API key is not configured");
    }
    // First get user info
    const userInfo = await getUserInfo(twitterUsername, apiKey);

    // Then try to fetch tweets
    const tweets = await fetchAllTweets(twitterUsername, apiKey);

    // Create listing and mindshare with available data
    const { listing, mindShare } = await createListingAndMindshare(
      userInfo.data,
      category,
      launchDate,
      tweets,
      telegramUserName,
      creatorPublicKey
    );

    return NextResponse.json(
      {
        message: tweets.length
          ? "Listing created successfully"
          : "Listing created successfully with no recent tweets",
        listing,
        mindShare,
      },
      { status: 201 }
    );
  } catch (error) {
    console.error("Error creating listing:", error);

    if (error instanceof Error) {
      if (error.message.includes("Twitter API error")) {
        return NextResponse.json(
          {
            message: "Twitter API error",
            error: error.message,
          },
          { status: 400 }
        );
      } else if (error.message.includes("HTTP error")) {
        return NextResponse.json(
          {
            message: "Failed to fetch user data",
            error: error.message,
          },
          { status: 502 }
        );
      } else if (error.message.includes("Listing already exists")) {
        return NextResponse.json(
          {
            message: "A listing already exists with this account",
            error: error.message,
          },
          { status: 400 }
        );
      }
    }

    return NextResponse.json(
      {
        message: "Error creating listing",
        error:
          error instanceof Error ? error.message : "Unknown error occurred",
      },
      { status: 500 }
    );
  }
}
