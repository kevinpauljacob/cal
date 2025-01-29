import React from "react";
import { Treemap, ResponsiveContainer, Tooltip } from "recharts";

interface MindShare {
  twitterUsername: string;
  date: Date;
  engagementRate: number;
  viewsCount: number;
  mindShareScore: number;
  tweetCount: number;
}

interface Listing {
  _id: string;
  twitterUsername: string;
  screenName: string;
  profileImageUrl: string;
  category: "ai" | "gaming" | "meme" | "political";
  mindShareHistory: MindShare[];
  latestMindShare: MindShare | null;
}

interface TreeMapComponentProps {
  listings: Listing[];
  timeFrame: "24h" | "7d";
}

const getCategoryColor = (category: string) => {
  switch (category) {
    case "ai":
      return "#BF5AF2";
    case "gaming":
      return "#32D74B";
    case "meme":
      return "#FF9F0A";
    case "political":
      return "#0A84FF";
    default:
      return "#15151F";
  }
};

const transformData = (listings: Listing[], timeFrame: "24h" | "7d") => {
  const now = new Date();
  const timeLimit = new Date(now);

  if (timeFrame === "24h") {
    timeLimit.setHours(now.getHours() - 24);
  } else {
    timeLimit.setDate(now.getDate() - 7);
  }

  const validListings = listings
    .map((listing) => {
      const relevantHistory = listing.mindShareHistory.filter(
        (history) => new Date(history.date) >= timeLimit
      );

      if (relevantHistory.length === 0) return null;

      const avgMindShareScore =
        relevantHistory.reduce(
          (sum, history) => sum + history.mindShareScore,
          0
        ) / relevantHistory.length;

      return {
        ...listing,
        averageScore: avgMindShareScore,
        latestStats: relevantHistory[0] || null,
      };
    })
    .filter(
      (listing): listing is NonNullable<typeof listing> =>
        listing !== null && listing.averageScore > 0
    )
    .sort((a, b) => b.averageScore - a.averageScore)
    .slice(0, 10);

  return [
    {
      name: "Projects",
      children: validListings.map((listing) => ({
        name: listing.screenName,
        size: listing.averageScore,
        category: listing.category,
        profileImage: listing.profileImageUrl,
        views: listing.latestStats?.viewsCount.toLocaleString() || "0",
        engagement: `${(listing.latestStats?.engagementRate || 0).toFixed(2)}%`,
        tweets: listing.latestStats?.tweetCount || 0,
        score: listing.averageScore,
      })),
    },
  ];
};

const CustomCell = (props: any) => {
  const { x, y, width, height, name, category, score, profileImage } = props;
  const fillColor = getCategoryColor(category);
  const padding = 8;

  return (
    <g>
      <rect
        x={x}
        y={y}
        width={width}
        height={height}
        fill={fillColor}
        fillOpacity={0.8}
        stroke="#0C0D12"
        strokeWidth={2}
      />

      <>
        {/* Background circle for image */}
        <circle
          cx={x + padding + 8}
          cy={y + padding + 8}
          r={8}
          fill="#0C0D12"
        />
        {/* Project image as a foreign object */}
        <foreignObject x={x + padding} y={y + padding} width={16} height={16}>
          <img
            src={profileImage}
            alt={name}
            className="w-4 h-4 rounded-full object-cover"
          />
        </foreignObject>
        {/* Project name */}
        <text
          x={x + padding + 24}
          y={y + padding + 10}
          fill="#000"
          fontSize={12}
          className="font-light"
        >
          {name}
        </text>
        {/* Mindshare score */}
        <text
          x={x + padding}
          y={y + padding + 30}
          fill="#000"
          fontSize={12}
          className="font-light"
        >
          {score && score.toFixed(1)}%
        </text>
      </>
    </g>
  );
};

const CustomTooltip = ({ active, payload }: any) => {
  if (!active || !payload || !payload.length) {
    return null;
  }

  const data = payload[0].payload;

  return (
    <div className="bg-[#1C1D21] border border-[#323546] p-3 rounded-lg shadow-lg">
      <div className="flex items-center gap-2 mb-2">
        <img
          src={data.profileImage}
          alt={data.name}
          className="w-5 h-5 rounded-full"
        />
        <p className="text-white font-medium">{data.name}</p>
      </div>
      <div className="space-y-1 text-sm">
        <p className="text-white/75">MindShare: {data.score.toFixed(1)}%</p>
        <p className="text-white/75">Views: {data.views}</p>
        <p className="text-white/75">Engagement: {data.engagement}</p>
        <p className="text-white/75">Tweets: {data.tweets}</p>
      </div>
    </div>
  );
};

const TreeMapComponent: React.FC<TreeMapComponentProps> = ({
  listings,
  timeFrame,
}) => {
  const chartData = transformData(listings, timeFrame);

  return (
    <div className="w-full h-[400px]">
      <ResponsiveContainer>
        <Treemap
          data={chartData}
          dataKey="size"
          aspectRatio={4 / 3}
          stroke="#0C0D12"
          content={<CustomCell />}
          isAnimationActive={false}
        >
          <Tooltip content={<CustomTooltip />} />
        </Treemap>
      </ResponsiveContainer>
    </div>
  );
};

export default TreeMapComponent;
