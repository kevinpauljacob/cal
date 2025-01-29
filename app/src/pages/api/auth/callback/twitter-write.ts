import { NextApiRequest, NextApiResponse } from "next";
import connectToDatabase from "../../../../../../server/src/utils/database";

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse
) {
  await connectToDatabase();

  if (req.method !== "GET") {
    return res.status(405).json({ message: "Method not allowed" });
  }

  const { code, state } = req.query;
  const codeVerifier = req.cookies.code_verifier;
  const redirectUrl = req.cookies.redirect_url || "/create";

  if (!code || !codeVerifier) {
    return res.status(400).json({ error: "Missing code or code_verifier" });
  }

  if (state !== "my-state") {
    return res.status(400).json({ error: "Invalid state parameter" });
  }

  try {
    // Exchange code for access token
    const tokenResponse = await fetch(
      "https://api.twitter.com/2/oauth2/token",
      {
        method: "POST",
        headers: {
          "Content-Type": "application/x-www-form-urlencoded",
          Authorization: `Basic ${Buffer.from(
            `${process.env.TWITTER_CLIENT_ID}:${process.env.TWITTER_CLIENT_SECRET}`
          ).toString("base64")}`,
        },
        body: new URLSearchParams({
          grant_type: "authorization_code",
          code: code as string,
          redirect_uri: `${process.env.NEXTAUTH_URL}/api/auth/callback/twitter-write`,
          code_verifier: codeVerifier,
        }),
      }
    );

    if (!tokenResponse.ok) {
      throw new Error("Failed to exchange Twitter token");
    }

    const { access_token } = await tokenResponse.json();

    // Fetch user data
    const userResponse = await fetch("https://api.twitter.com/2/users/me", {
      method: "GET",
      headers: {
        Authorization: `Bearer ${access_token}`,
      },
    });

    if (!userResponse.ok) {
      const errorData = await userResponse.json();
      // console.error("Failed to fetch user information:", errorData);
      return res.status(userResponse.status).json(errorData);
    }

    const { data: user } = await userResponse.json();
    console.log("user", user);

    // Set only the username in cookie for form submission
    res.setHeader("Set-Cookie", [
      `twitter_user=${user.username}; Path=/; Secure; SameSite=Strict; Max-Age=7200`,
    ]);

    res.redirect(redirectUrl);
  } catch (error) {
    console.error("Twitter verification error:", error);
    res.redirect(
      `/create?error=${encodeURIComponent("Failed to verify Twitter account")}`
    );
  }
}
