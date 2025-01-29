"use client";

import { useState } from "react";
import { Search, X } from "lucide-react";

interface Project {
  id: string;
  profileImage: string;
  project: string;
  mindshareScore: number; // Current mindshare score
  mindshareChange: number; // 24h change in mindshare
  launchDate: string;
  twitter: string;
  category: string;
  followers: number;
}

interface TokenProjectTableProps {
  projects: Project[];
  filter: string;
  searchQuery: string;
}

const getCategoryStyle = (category: string) => {
  switch (category.toLowerCase()) {
    case "ai":
      return "bg-gradient-to-r from-purple-500/20 to-pink-500/20 text-pink-300";
    case "gaming":
      return "bg-emerald-500/20 text-emerald-300";
    case "meme":
      return "bg-orange-500/20 text-orange-300";
    case "political":
      return "bg-blue-500/20 text-blue-300";
    default:
      return "bg-white/5 text-white/50";
  }
};

const TokenProjectTable: React.FC<TokenProjectTableProps> = ({
  projects,
  filter,
  searchQuery,
}) => {
  // Sort projects by mindshare score
  const sortedProjects = [...projects].sort(
    (a, b) => b.mindshareScore - a.mindshareScore
  );

  const filteredProjects = sortedProjects.filter((project) => {
    const matchesFilter =
      filter === "All" ||
      project.category.toLowerCase() === filter.toLowerCase();
    const matchesSearch =
      project.project.toLowerCase().includes(searchQuery.toLowerCase()) ||
      project.twitter.toLowerCase().includes(searchQuery.toLowerCase());
    return matchesFilter && matchesSearch;
  });

  return (
    <div className="w-full overflow-x-auto">
      <table className="w-full">
        <thead>
          <tr className="text-[10px] text-white/30 font-medium">
            <th className="text-left py-4 px-6">Project</th>
            <th className="text-left py-4 px-6">Category</th>
            <th className="text-left py-4 px-6">Followers</th>
            <th className="text-left py-4 px-6">MindShare Score</th>
            <th className="text-left py-4 px-6">24h Change</th>
            <th className="text-left py-4 px-6">Launch Date</th>
            <th className="text-left py-4 px-6">Twitter</th>
          </tr>
        </thead>
        <tbody>
          {filteredProjects.map((project) => (
            <tr
              key={project.id}
              className="border-t border-white/5 text-[12px] font-medium"
            >
              <td className="py-4 px-6">
                <div className="flex items-center gap-3">
                  <img
                    src={project.profileImage}
                    alt={project.project}
                    className="w-8 h-8 rounded-full"
                  />
                  <span className="text-white/75">{project.project}</span>
                </div>
              </td>
              <td className="py-4 px-6">
                <span
                  className={`px-3 py-1 rounded-full text-[10px] ${getCategoryStyle(
                    project.category
                  )}`}
                >
                  {project.category}
                </span>
              </td>
              <td className="py-4 px-6 text-white/50">
                {project.followers.toLocaleString()}
              </td>
              <td className="py-4 px-6 text-white/75">
                {project.mindshareScore.toFixed(2)}
              </td>
              <td className="py-4 px-6">
                <span
                  className={
                    project.mindshareChange >= 0
                      ? "text-emerald-500"
                      : "text-red-500"
                  }
                >
                  {project.mindshareChange > 0 ? "+" : ""}
                  {project.mindshareChange.toFixed(2)}%
                </span>
              </td>
              <td className="py-4 px-6 text-white/50">{project.launchDate}</td>
              <td className="py-4 px-6 text-white/50">{project.twitter}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
};

const filterOptions = ["All", "AI", "Meme", "Gaming", "Political"];

interface UpcomingLaunchesProps {
  listings: Array<{
    _id: string;
    twitterUsername: string;
    screenName: string;
    category: string;
    launchDate: Date;
    followers: number;
    profileImageUrl: string;
    mindShareHistory: Array<{
      date: Date;
      mindShareScore: number;
    }>;
    latestMindShare?: {
      mindShareScore: number;
    };
  }>;
}

const UpcomingLaunches: React.FC<UpcomingLaunchesProps> = ({ listings }) => {
  const [activeFilter, setActiveFilter] = useState("All");
  const [searchQuery, setSearchQuery] = useState("");

  const formatDate = (date: Date) => {
    return new Date(date).toLocaleString("en-US", {
      hour: "numeric",
      minute: "2-digit",
      timeZone: "EST",
      timeZoneName: "short",
      month: "2-digit",
      day: "2-digit",
      year: "numeric",
    });
  };

  // Calculate 24h mindshare change
  const calculateMindshareChange = (
    mindShareHistory: Array<{ date: Date; mindShareScore: number }>
  ) => {
    if (!mindShareHistory || mindShareHistory.length < 2) return 0;

    // Sort history by date descending
    const sortedHistory = [...mindShareHistory].sort(
      (a, b) => new Date(b.date).getTime() - new Date(a.date).getTime()
    );

    const latestScore = sortedHistory[0].mindShareScore;
    const previousScore = sortedHistory[1].mindShareScore;

    // Calculate percentage change
    return previousScore > 0
      ? ((latestScore - previousScore) / previousScore) * 100
      : 0;
  };

  const projects: Project[] = listings.map((listing) => {
    const mindshareChange = calculateMindshareChange(listing.mindShareHistory);
    const currentMindshare = listing.latestMindShare?.mindShareScore || 0;

    return {
      id: listing._id,
      profileImage: listing.profileImageUrl,
      project: listing.screenName,
      mindshareScore: currentMindshare,
      mindshareChange: mindshareChange,
      launchDate: formatDate(new Date(listing.launchDate)),
      twitter: `@${listing.twitterUsername}`,
      category: listing.category[0].toUpperCase() + listing.category.slice(1),
      followers: listing.followers,
    };
  });

  return (
    <div className="w-full py-8 space-y-6">
      <h1 className="text-xl font-inter text-opacity-90 font-semibold blue_gradient">
        Upcoming Token Launches
      </h1>

      <div className="flex justify-between items-center w-full">
        <div className="flex gap-4">
          {filterOptions.map((filter) => (
            <button
              key={filter}
              onClick={() => setActiveFilter(filter)}
              className={`px-6 py-2 rounded-lg text-[13px] font-inter font-semibold transition-colors
        ${getCategoryStyle(filter)}
        ${
          activeFilter === filter
            ? "opacity-100"
            : "opacity-60 hover:opacity-80"
        }`}
            >
              {filter}
            </button>
          ))}
        </div>

        <div className="relative max-w-[312px] sm:max-w-80 w-full right-0">
          <div className="relative">
            <input
              className="w-full bg-[#94A3B8]/5 placeholder:text-[#94A3B8]/50 text-white backdrop-blur-xl rounded-full pl-6 pr-10 h-9 focus:outline-none font-inter text-[10px]"
              type="text"
              placeholder="Search"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
            />
            {searchQuery ? (
              <X
                className="absolute right-6 top-1/2 -translate-y-1/2 text-white/20 h-5 w-5 cursor-pointer hover:text-white/40"
                onClick={() => setSearchQuery("")}
              />
            ) : (
              <Search className="absolute right-6 top-1/2 -translate-y-1/2 text-white/20 h-[10px] w-[10px]" />
            )}
          </div>
        </div>
      </div>
      <TokenProjectTable
        projects={projects}
        filter={activeFilter}
        searchQuery={searchQuery}
      />
    </div>
  );
};

export default UpcomingLaunches;
