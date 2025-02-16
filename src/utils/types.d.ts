export type Tweet = {
  type: "tweet";
  id: string;
  url: string;
  text: string;
  source: string;
  retweetCount: number;
  replyCount: number;
  likeCount: number;
  quoteCount: number;
  viewCount: number;
  createdAt: string;
  lang: string;
  bookmarkCount: number;
  isReply: boolean;
  inReplyToId: string | null;
  conversationId: string;
  inReplyToUserId: string | null;
  inReplyToUsername: string | null;
  author: {
    type: "user";
    userName: string;
    url: string;
    id: string;
    name: string;
    isBlueVerified: boolean;
    profilePicture: string;
    coverPicture: string;
    description: string;
    location: string;
    followers: number;
    following: number;
    canDm: boolean;
    createdAt: string;
    fastFollowersCount: number;
    favouritesCount: number;
    hasCustomTimelines: boolean;
    isTranslator: boolean;
    mediaCount: number;
    statusesCount: number;
    withheldInCountries: string[];
    affiliatesHighlightedLabel: Record<string, unknown>;
    possiblySensitive: boolean;
    pinnedTweetIds: string[];
    isAutomated: boolean;
    automatedBy: string | null;
    unavailable: boolean;
    message: string | null;
    unavailableReason: string | null;
    profile_bio: {
      description: string;
      entities: {
        description: {
          urls: {
            display_url: string;
            expanded_url: string;
            indices: number[];
            url: string;
          }[];
        };
        url: {
          urls: {
            display_url: string;
            expanded_url: string;
            indices: number[];
            url: string;
          }[];
        };
      };
    };
  };
  entities: {
    hashtags: {
      indices: number[];
      text: string;
    }[];
    urls: {
      display_url: string;
      expanded_url: string;
      indices: number[];
      url: string;
    }[];
    user_mentions: {
      id_str: string;
      name: string;
      screen_name: string;
    }[];
  };
  quoted_tweet?: Record<string, unknown>;
  retweeted_tweet?: Record<string, unknown>;
};

export type TwitterData = {
  pin_tweet: null | Tweet;
  tweets: Tweet[];
};

export type TweetResponse = {
  status: "success" | "error";
  code: number;
  msg: string;
  data: TwitterData;
  has_next_page: boolean;
  next_cursor: string;
};

export type ListingResponse = {
  twitterUsername: string;
  telegramUsername?: string;
  screenName: string;
  profileImageUrl: string;
  bio: string;
  platform?: string;
  website?: string;
  followers: number;
  category: "meme" | "utility";
  launchDate?: string;
  engagementRate: number;
  viewsCount: number;
  tweetCount: number;
  mindshare: {
    "24h": {
      score: number;
      change: number;
    };
    "7d": {
      score: number;
      change: number;
    };
  };
};
