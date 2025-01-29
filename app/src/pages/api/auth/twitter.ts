import crypto from "crypto";
import { NextApiRequest, NextApiResponse } from "next";

function base64URLEncode(str: Buffer) {
  return str
    .toString("base64")
    .replace(/\+/g, "-")
    .replace(/\//g, "_")
    .replace(/=+$/, "");
}

function generateCodeVerifier() {
  return base64URLEncode(crypto.randomBytes(32));
}

function generateCodeChallenge(verifier: string) {
  return base64URLEncode(crypto.createHash("sha256").update(verifier).digest());
}

const codeVerifier = generateCodeVerifier();
const codeChallenge = generateCodeChallenge(codeVerifier);

export default function handler(req: NextApiRequest, res: NextApiResponse) {
  const { redirect } = req.query;

  const twitterAuthURL = `https://twitter.com/i/oauth2/authorize?response_type=code&client_id=${
    process.env.TWITTER_CLIENT_ID
  }&redirect_uri=${encodeURIComponent(
    `${process.env.NEXTAUTH_URL}/api/auth/callback/twitter-write`
  )}&scope=${encodeURIComponent(
    "tweet.read users.read"
  )}&state=my-state&code_challenge=${codeChallenge}&code_challenge_method=S256`;

  res.setHeader("Set-Cookie", [
    `code_verifier=${codeVerifier}; Path=/; HttpOnly; SameSite=Lax; Max-Age=3600`,
    `redirect_url=${
      redirect || "/create"
    }; Path=/; HttpOnly; SameSite=Lax; Max-Age=3600`,
  ]);

  res.status(200).json({ authUrl: twitterAuthURL });
}
