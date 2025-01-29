import mongoose from "mongoose";

const ListingSchema = new mongoose.Schema({
  twitterUsername: { type: String, required: true, unique: true, index: true },
  screenName: { type: String, required: true },
  profileImageUrl: { type: String, required: true },
  bio: { type: String, required: true },
  followers: { type: Number, required: true },
  category: {
    type: String,
    required: true,
    enum: ["ai", "gaming", "meme", "political"],
  },
  launchDate: { type: Date, required: true, index: true },
  createdAt: { type: Date, default: Date.now, index: true },
  lastUpdated: { type: Date, default: Date.now },
});

export const Listing =
  mongoose.models.Listing || mongoose.model("Listing", ListingSchema);
