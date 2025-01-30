import mongoose from "mongoose";

const MindShareSchema = new mongoose.Schema({
  twitterUsername: { type: String, required: true },
  date: { type: Date, required: true },
  engagementRate: { type: Number, required: true, default: 0 },
  viewsCount: { type: Number, required: true, default: 0 },
  mindShareScore: { type: Number, required: true, default: 0 },
  tweetCount: { type: Number, required: true, default: 0 },
});

// Compound index for efficient queries
MindShareSchema.index({ twitterUsername: 1, date: 1 });

export const MindShare =
  mongoose.models.MindShare || mongoose.model("MindShare", MindShareSchema);
