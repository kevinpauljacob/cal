import React from "react";
import { Treemap, ResponsiveContainer, Tooltip } from "recharts";

interface Listing {
  twitterUsername: string;
  screenName: string;
  profileImageUrl: string;
  category: "ai" | "gaming" | "meme" | "political";
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
}

interface TreeMapComponentProps {
  listings: Listing[];
  timeFrame: "24h" | "7d";
  loading: boolean;
}

const TreeMapSkeleton = () => {
  return (
    <div className="w-full h-[400px] grid grid-cols-3 gap-0.5 bg-[#0C0D12]/50">
      {Array(6)
        .fill(0)
        .map((_, i) => (
          <div
            key={i}
            className={`bg-white/5 animate-pulse ${
              i === 0 ? "col-span-2 row-span-2" : ""
            }`}
          />
        ))}
    </div>
  );
};

const transformData = (listings: Listing[], timeFrame: "24h" | "7d") => {
  const validListings = listings
    .map((listing) => ({
      ...listing,
      score: listing.mindshare[timeFrame].score,
    }))
    .filter((listing) => listing.score > 0)
    .sort((a, b) => b.score - a.score)
    .slice(0, 10);

  return [
    {
      name: "Projects",
      children: validListings.map((listing) => ({
        name: listing.screenName,
        size: listing.score,
        category: listing.category,
        profileImage: listing.profileImageUrl,
        views: listing.viewsCount.toLocaleString(),
        engagement: `${listing.engagementRate.toFixed(2)}%`,
        tweets: listing.tweetCount,
        score: listing.score,
      })),
    },
  ];
};

const CustomCell = (props: any) => {
  const { x, y, width, height, name, score, profileImage } = props;
  const fillColor = "#00A071";
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
        stroke="#181924"
        strokeWidth={2}
      />

      <>
        <foreignObject x={x + padding} y={y + padding} width={16} height={16}>
          <img
            src={profileImage}
            alt={name}
            className="w-4 h-4 rounded-full object-cover"
          />
        </foreignObject>
        {/* Project name */}
        <text
          x={x + padding + 22}
          y={y + padding + 12}
          fill="#fff"
          fontSize={12}
          strokeWidth="0"
          className="font-medium text-white"
        >
          {name}
        </text>
        {/* Mindshare score */}
        <text
          x={x + padding}
          y={y + padding + 34}
          fill="#fff"
          fontSize={12}
          strokeWidth="0"
          className="font-medium text-white"
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
  loading,
}) => {
  const chartData = transformData(listings, timeFrame);

  if (loading) {
    return <TreeMapSkeleton />;
  }

  return (
    <div className="w-full h-[400px]">
      <ResponsiveContainer>
        <Treemap
          data={chartData}
          dataKey="size"
          aspectRatio={8 / 7}
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
