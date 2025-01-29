"use client";
import TreeMapComponent from "@/components/TreeMap";
import React, { useState, useEffect } from "react";
import UpcomingLaunches from "@/components/UpcomingLaunches";
import Link from "next/link";

interface Listing {
  _id: string;
  twitterUsername: string;
  screenName: string;
  profileImageUrl: string;
  bio: string;
  followers: number;
  category: "ai" | "gaming" | "meme" | "political";
  launchDate: Date;
  mindShareHistory: MindShare[];
  latestMindShare: MindShare;
}

interface MindShare {
  twitterUsername: string;
  date: Date;
  engagementRate: number;
  viewsCount: number;
  mindShareScore: number;
  tweetCount: number;
}

interface TrendingItem {
  name: string;
  percentage: number;
  iconBg: string;
  avatar: string;
}

const MindSharePage: React.FC = () => {
  const [listings, setListings] = useState<Listing[]>([]);
  const [loading, setLoading] = useState(true);
  const [mindshareTimeframe, setMindshareTimeframe] = useState<"24h" | "7d">(
    "24h"
  );
  const [trendingTimeframe, setTrendingTimeframe] = useState<"24h" | "7d">(
    "24h"
  );
  const [trendingListings, setTrendingListings] = useState<TrendingItem[]>([]);

  const calculateTrendingListings = (
    listings: Listing[],
    timeframe: "24h" | "7d"
  ) => {
    const now = new Date();
    const timeframeInMs =
      timeframe === "24h" ? 24 * 60 * 60 * 1000 : 7 * 24 * 60 * 60 * 1000;
    const cutoffDate = new Date(now.getTime() - timeframeInMs);

    return listings
      .map((listing) => {
        // Get the history entries within the timeframe
        const relevantHistory = listing.mindShareHistory
          .filter((entry) => new Date(entry.date) >= cutoffDate)
          .sort(
            (a, b) => new Date(b.date).getTime() - new Date(a.date).getTime()
          );

        if (relevantHistory.length < 2) return null;

        // Get the most recent score
        const latestScore = relevantHistory[0].mindShareScore;

        // Get the oldest score within the timeframe
        const previousScore =
          relevantHistory[relevantHistory.length - 1].mindShareScore;

        const percentageIncrease =
          previousScore > 0
            ? ((latestScore - previousScore) / previousScore) * 100
            : 0;

        return {
          name: listing.screenName,
          percentage: percentageIncrease,
          iconBg: getBgColorForCategory(listing.category),
          avatar: listing.profileImageUrl,
        };
      })
      .filter(
        (item): item is TrendingItem => item !== null && item.percentage > 0
      )
      .sort((a, b) => b.percentage - a.percentage)
      .slice(0, 10); // Limit to top 10 trending items
  };

  const getBgColorForCategory = (category: string) => {
    switch (category) {
      case "ai":
        return "bg-gradient-to-r from-purple-500 to-pink-500";
      case "gaming":
        return "bg-emerald-500";
      case "meme":
        return "bg-orange-500";
      case "political":
        return "bg-blue-500";
      default:
        return "bg-gray-500";
    }
  };

  useEffect(() => {
    const fetchListings = async () => {
      try {
        setLoading(true);
        const response = await fetch("/api/listings");
        const data = await response.json();

        if (data.status === "success") {
          setListings(data.data.listings);
        }
      } catch (error) {
        console.error("Error fetching listings:", error);
      } finally {
        setLoading(false);
      }
    };

    fetchListings();
  }, []);

  useEffect(() => {
    if (listings.length > 0) {
      const trendingItems = calculateTrendingListings(
        listings,
        trendingTimeframe
      );
      setTrendingListings(trendingItems);
    }
  }, [listings, trendingTimeframe]);

  // Calculate totals for tags
  const totalListed = listings.length;
  const categories = new Set(listings.map((l) => l.category)).size;

  const tags = [
    {
      title: "Total Listed",
      value: totalListed,
      className: "bg-[#EFA411] text-[#EFA411]",
    },
    {
      title: "Categories",
      value: categories,
      className: "bg-[#4594FF] text-[#4594FF]",
    },
  ];

  if (loading) {
    return (
      <div className="min-h-screen bg-[#0C0D12] p-6 flex items-center justify-center">
        <div className="text-white/50">Loading...</div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#0C0D12] p-6 ">
      <main className="font-lexend">
        <div className="max-w-7xl mx-auto flex flex-col ">
          <section className="flex items-center justify-between font-inter leading-3 relative">
            <div className="flex items-center space-x-4">
              {tags.map((tag, index) => (
                <button
                  key={index}
                  className={`${tag.className} px-4 py-2 rounded-[10px] bg-opacity-10 text-opacity-75 font-medium text-[10px]`}
                >
                  {tag.title} <span className="font-semibold">{tag.value}</span>
                </button>
              ))}
            </div>
            <Link
              href={"/create"}
              className="bg-[#323546] font-bold text-white/75 text-center px-6 leading-3 rounded-[10px] text-[10px] py-2"
            >
              Get Listed
            </Link>
          </section>
          <section className="flex items-center justify-between my-12">
            <div className="flex flex-col items-start justify-start font-lexend">
              <h1 className="text-white/80 text-2xl font-semibold">
                Mindshare of Upcoming Launches
              </h1>
              <p className="font-normal text-[#a1a1a5]/75 text-sm">
                Explore all the AI agents you&apos;ve created and participated
                in.
              </p>
            </div>
          </section>
          <section className="flex justify-between items-stretch gap-2 w-full">
            <div className="bg-[#BEB6FF]/5 rounded-[10px] p-3 flex flex-col gap-3 w-[75%]">
              <div className="flex items-center justify-between w-full">
                <h1 className="text-xl text-white/50">MindShare</h1>
                <div className="border-2 border-[#202329] rounded-[10px] p-1">
                  <div className="flex rounded-[10px] overflow-hidden">
                    {["24h", "7d"].map((option) => (
                      <button
                        key={option}
                        onClick={() =>
                          setMindshareTimeframe(option as "24h" | "7d")
                        }
                        className={`px-4 py-1 text-xs transition-colors duration-200 rounded-[10px] ${
                          mindshareTimeframe === option
                            ? "bg-[#202329] text-white"
                            : "text-gray-400 hover:text-gray-300"
                        }`}
                      >
                        {option}
                      </button>
                    ))}
                  </div>
                </div>
              </div>
              <TreeMapComponent
                listings={listings}
                timeFrame={mindshareTimeframe}
              />
            </div>
            <div className="mx-auto bg-[#BEB6FF]/5 rounded-[10px] p-3 w-[25%]">
              <div className="flex items-center justify-between mb-2">
                <h2 className="text-xl font-semibold text-white/50">
                  Trending
                </h2>
                <div className="border-2 border-[#202329] rounded-[10px] p-1">
                  <div className="flex rounded-[10px] overflow-hidden">
                    {["24h", "7d"].map((option) => (
                      <button
                        key={option}
                        onClick={() => {
                          if (option === "24h" || option === "7d") {
                            setTrendingTimeframe(option);
                            calculateTrendingListings(listings, option);
                          }
                        }}
                        className={`px-4 py-1 text-xs transition-colors duration-200 rounded-[10px] ${
                          trendingTimeframe === option
                            ? "bg-[#202329] text-white"
                            : "text-gray-400 hover:text-gray-300"
                        }`}
                      >
                        {option}
                      </button>
                    ))}
                  </div>
                </div>
              </div>

              <div className="">
                {trendingListings.map((item, index) => (
                  <div
                    key={index}
                    className="flex items-center justify-between px-3 py-4 transition-colors border-b-[1px] border-white border-opacity-[2.5%]"
                  >
                    <div className="flex items-center gap-3 text-sm font-akshar">
                      <img
                        src={item.avatar}
                        alt={item.name}
                        className={`w-[26px] h-[26px] rounded-full ${item.iconBg}`}
                      />
                      <span className="text-white/50 font-medium">
                        {item.name}
                      </span>
                    </div>
                    <span
                      className={`font-roboto font-bold text-sm ${
                        item.percentage > 0
                          ? "text-[#00a071]/90"
                          : "text-red-500/90"
                      }`}
                    >
                      {item.percentage > 0 ? "+" : ""}
                      {item.percentage.toFixed(1)}%
                    </span>
                  </div>
                ))}
                {trendingListings.length === 0 && (
                  <div className="text-white/50 text-center py-4">
                    No trending projects yet
                  </div>
                )}
              </div>
            </div>
          </section>
          <UpcomingLaunches listings={listings} />
        </div>
      </main>
    </div>
  );
};

export default MindSharePage;
