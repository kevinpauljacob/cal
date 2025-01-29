import { Listing } from "../models/listing";
import { MindShare } from "../models/mindshare";
import connectToDatabase from "./database";

// Helper function to generate random number within range
const randomNumber = (min: number, max: number) => {
  return Math.floor(Math.random() * (max - min + 1)) + min;
};

// Helper function to generate random date within range
const randomDate = (start: Date, end: Date) => {
  return new Date(
    start.getTime() + Math.random() * (end.getTime() - start.getTime())
  );
};

// Generate realistic Twitter usernames
const generateTwitterUsername = () => {
  const prefixes = [
    "crypto",
    "token",
    "web3",
    "defi",
    "meta",
    "nft",
    "dao",
    "ai",
  ];
  const suffixes = ["protocol", "labs", "finance", "core", "dao", "tech", "ai"];
  const numbers = randomNumber(1, 999).toString().padStart(2, "0");

  return `${prefixes[randomNumber(0, prefixes.length - 1)]}${numbers}${
    suffixes[randomNumber(0, suffixes.length - 1)]
  }`;
};

// Generate screen names
const generateScreenName = (username: string) => {
  return (
    username.charAt(0).toUpperCase() + username.slice(1).replace(/[0-9]/g, "")
  );
};

// Categories
const categories = ["ai", "gaming", "meme", "political"] as const;

// Generate mindshare data for one day
const generateMindShareData = (
  twitterUsername: string,
  date: Date,
  prevScore?: number
) => {
  const baseEngagement = randomNumber(1, 5);
  const baseTweets = randomNumber(3, 15);
  const baseViews = randomNumber(1000, 10000);
  const baseFollowers = randomNumber(100, 1000);

  // If there's a previous score, generate new score with some correlation
  const mindShareScore = prevScore
    ? prevScore + randomNumber(-15, 15)
    : randomNumber(20, 80);

  return {
    twitterUsername,
    date,
    engagementRate: baseEngagement + Math.random() * 2,
    viewsCount: baseViews + randomNumber(-500, 500),
    mindShareScore: Math.max(0, Math.min(100, mindShareScore)),
    tweetCount: baseTweets + randomNumber(-2, 2),
    followers: baseFollowers + randomNumber(-50, 50),
  };
};

const generateData = async () => {
  // Clear existing data
  await Listing.deleteMany({});
  await MindShare.deleteMany({});

  const listings = [];
  const mindshareData = [];

  // Generate 10 listings
  for (let i = 0; i < 10; i++) {
    const twitterUsername = generateTwitterUsername();
    const screenName = generateScreenName(twitterUsername);

    // Create listing
    const listing = {
      twitterUsername,
      screenName,
      profileImageUrl: `https://api.dicebear.com/7.x/shapes/svg?seed=${twitterUsername}`,
      bio: `${screenName} is a next-generation ${
        categories[i % categories.length]
      } platform revolutionizing the space.`,
      followers: randomNumber(1000, 50000),
      category: categories[i % categories.length],
      launchDate: randomDate(
        new Date(),
        new Date(new Date().setDate(new Date().getDate() + 30))
      ),
      createdAt: new Date(),
      lastUpdated: new Date(),
    };

    listings.push(listing);

    // Generate past week of mindshare data
    let lastScore;
    for (let j = 7; j >= 0; j--) {
      const date = new Date();
      date.setDate(date.getDate() - j);
      date.setHours(0, 0, 0, 0);

      const mindshareEntry = generateMindShareData(
        twitterUsername,
        date,
        lastScore
      );
      lastScore = mindshareEntry.mindShareScore;
      mindshareData.push(mindshareEntry);
    }
  }

  // Insert all data
  try {
    await Listing.insertMany(listings);
    await MindShare.insertMany(mindshareData);
    console.log("Successfully inserted", listings.length, "listings");
    console.log(
      "Successfully inserted",
      mindshareData.length,
      "mindshare entries"
    );
  } catch (error) {
    console.error("Error inserting data:", error);
  }
};

// Run the script
const runSeed = async () => {
  await connectToDatabase();
  await generateData();
  console.log("Seed completed");
  process.exit(0);
};

runSeed().catch(console.error);
