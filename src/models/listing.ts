import mongoose from "mongoose";
import { FaAudioDescription } from "react-icons/fa";

const ListingSchema = new mongoose.Schema({
  twitterUsername: { type: String, required: true, unique: true, index: true },
  screenName: { type: String, required: true },
  profileImageUrl: { type: String, required: true },
  bio: { type: String, required: true },
  followers: { type: Number, required: true, default: 0 },
  category: {
    type: String,
    required: true,
    enum: ["ai", "gaming", "meme", "political"],
  },
  launchDate: { type: Date, required: true, index: true },
  createdAt: { type: Date, default: Date.now, index: true },
  lastUpdated: { type: Date, default: Date.now },
  active: { type: Boolean, default: true },
  telegramUserName: { type: String, required: true },
  description: { type: String, required: true },
});

export const Listing =
  mongoose.models.Listing || mongoose.model("Listing", ListingSchema);
