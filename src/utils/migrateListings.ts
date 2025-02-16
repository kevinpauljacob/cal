import mongoose, { Document } from "mongoose";
import { config } from "dotenv";

// Load environment variables
config();

// Define source and target connection strings
const SOURCE_DB_URI = process.env.DB_URI || "";
const TARGET_DB_URI = process.env.TARGET_MONGODB_URI || "";

// Validation check for environment variables
if (!SOURCE_DB_URI || !TARGET_DB_URI) {
  console.error(
    "Please provide both SOURCE_MONGODB_URI and TARGET_MONGODB_URI in your .env file"
  );
  process.exit(1);
}

// Define interface for the listing document
interface IListing extends Document {
  twitterUsername: string;
  screenName: string;
  profileImageUrl: string;
  bio: string;
  followers: number;
  category: "meme" | "utility";
  launchDate?: Date;
  createdAt: Date;
  lastUpdated: Date;
  active: boolean;
  telegramUserName: string;
  description: string;
  platform?: string;
  website?: string;
  __v?: number;
}

// Schema definition matching your current schema
const ListingSchema = new mongoose.Schema({
  twitterUsername: { type: String, required: true, unique: true, index: true },
  screenName: { type: String, required: true },
  profileImageUrl: { type: String, required: true },
  bio: { type: String, required: true },
  followers: { type: Number, required: true, default: 0 },
  category: {
    type: String,
    required: true,
    enum: ["meme", "utility"],
  },
  launchDate: { type: Date },
  createdAt: { type: Date, default: Date.now, index: true },
  lastUpdated: { type: Date, default: Date.now },
  active: { type: Boolean, default: true },
  telegramUserName: { type: String, required: true },
  description: { type: String, required: true },
  platform: { type: String },
  website: { type: String },
});

async function migrateData() {
  // Create separate connections for source and target
  const sourceConnection = await mongoose.createConnection(SOURCE_DB_URI!);
  const targetConnection = await mongoose.createConnection(TARGET_DB_URI!);

  console.log("Connected to both databases successfully");

  // Create models for both connections
  const SourceListing = sourceConnection.model<IListing>(
    "Listing",
    ListingSchema
  );
  const TargetListing = targetConnection.model<IListing>(
    "Listing",
    ListingSchema
  );

  try {
    // Get total count for progress tracking
    const totalDocuments = await SourceListing.countDocuments();
    console.log(`Found ${totalDocuments} documents to migrate`);

    // Fetch all documents from source database
    const batchSize = 100;
    let processedCount = 0;
    let successCount = 0;
    let errorCount = 0;
    const errors: Array<{ username: string; error: string }> = [];

    // Process in batches
    for (let skip = 0; skip < totalDocuments; skip += batchSize) {
      const listings = await SourceListing.find().skip(skip).limit(batchSize);

      // Process each listing in the batch
      for (const listing of listings) {
        try {
          // Convert to plain object and remove _id
          const listingData = listing.toObject();
          const { _id, __v, ...cleanedData } = listingData;

          // Check if document already exists in target database
          const existingListing = await TargetListing.findOne({
            twitterUsername: cleanedData.twitterUsername,
          });

          if (existingListing) {
            // Update existing document
            await TargetListing.findByIdAndUpdate(
              existingListing._id,
              cleanedData
            );
            console.log(
              `Updated existing listing for ${cleanedData.twitterUsername}`
            );
          } else {
            // Create new document
            await TargetListing.create(cleanedData);
            console.log(
              `Created new listing for ${cleanedData.twitterUsername}`
            );
          }

          successCount++;
        } catch (error: any) {
          errorCount++;
          errors.push({
            username: listing.twitterUsername,
            error: error.message,
          });
          console.error(
            `Error migrating ${listing.twitterUsername}:`,
            error.message
          );
        }

        processedCount++;
        if (processedCount % 10 === 0) {
          console.log(
            `Progress: ${processedCount}/${totalDocuments} (${Math.round(
              (processedCount / totalDocuments) * 100
            )}%)`
          );
        }
      }
    }

    // Print final summary
    console.log("\nMigration Summary:");
    console.log(`Total documents processed: ${processedCount}`);
    console.log(`Successful migrations: ${successCount}`);
    console.log(`Failed migrations: ${errorCount}`);

    if (errors.length > 0) {
      console.log("\nErrors encountered:");
      errors.forEach(({ username, error }) => {
        console.log(`- ${username}: ${error}`);
      });
    }
  } catch (error) {
    console.error("Fatal error during migration:", error);
  } finally {
    // Close both connections
    await sourceConnection.close();
    await targetConnection.close();
    console.log("\nDatabase connections closed");
  }
}

// Run the migration
migrateData()
  .then(() => {
    console.log("Migration script completed");
    process.exit(0);
  })
  .catch((error) => {
    console.error("Migration script failed:", error);
    process.exit(1);
  });
