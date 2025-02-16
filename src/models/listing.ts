import mongoose from "mongoose";

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

export const Listing =
  mongoose.models.Listing || mongoose.model("Listing", ListingSchema);
