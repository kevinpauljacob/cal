import mongoose from "mongoose";

const MindShareSchema = new mongoose.Schema({
  twitterUsername: { type: String, required: true },
  followers: { type: Number, required: true },
  date: { type: Date, required: true },
  engagementRate: { type: Number, required: true },
  viewsCount: { type: Number, required: true },
  mindShareScore: { type: Number, required: true },
  tweetCount: { type: Number, required: true },
});

// Compound index for efficient queries
MindShareSchema.index({ twitterUsername: 1, date: 1 });

export const MindShare =
  mongoose.models.MindShare || mongoose.model("MindShare", MindShareSchema);
