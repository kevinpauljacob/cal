import mongoose from "mongoose";

const MindShareSchema = new mongoose.Schema({
  twitterUsername: { type: String, required: true },
  date: { type: Date, required: true },
  engagementRate: { type: Number, required: true },
  tweetCount: { type: Number, required: true, default: 0 },
  viewsCount: { type: Number, required: true, default: 0 },
  metrics: {
    "24h": {
      score: { type: Number, required: true, default: 0 },
      change: { type: Number, required: true, default: 0 }, // percentage change
    },
    "7d": {
      score: { type: Number, required: true, default: 0 },
      change: { type: Number, required: true, default: 0 }, // percentage change
    },
  },
});

MindShareSchema.index({ twitterUsername: 1, date: -1 });

export const MindShare =
  mongoose.models.MindShare || mongoose.model("MindShare", MindShareSchema);
