import { NextApiRequest, NextApiResponse } from "next";

export default function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== "POST") {
    res.setHeader("Allow", ["POST"]);
    return res.status(405).end(`Method ${req.method} Not Allowed`);
  }

  // Clear all Twitter-related cookies by setting them to expire immediately
  res.setHeader("Set-Cookie", [
    "twitter_user=; Path=/; HttpOnly; Secure; SameSite=Lax; Max-Age=0",
    "code_verifier=; Path=/; HttpOnly; Secure; SameSite=Lax; Max-Age=0",
    "redirect_url=; Path=/; HttpOnly; Secure; SameSite=Lax; Max-Age=0",
  ]);

  return res.status(200).json({ message: "Signed out successfully" });
}
