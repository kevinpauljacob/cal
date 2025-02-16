"use client";
import TreeMapComponent from "@/components/TreeMap";
import React, { useState, useEffect } from "react";
import UpcomingLaunches from "@/components/UpcomingLaunches";
import { useWallet } from "@solana/wallet-adapter-react";
// import { connection, fetchSolBalance } from "@/utils/helper";

interface Listing {
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
}

interface TrendingItem {
  name: string;
  percentage: number;
  avatar: string;
}

const MindSharePage: React.FC = () => {
  const [treeMapListings, setTreeMapListings] = useState<Listing[]>([]);
  const [tableListings, setTableListings] = useState<Listing[]>([]);
  const [totalListings, setTotalListings] = useState(0);
  const [showWalletModal, setShowWalletModal] = useState(false);
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [loading, setLoading] = useState(true);
  const [mindshareTimeframe, setMindshareTimeframe] = useState<"24h" | "7d">(
    "24h"
  );
  const [balance, setBalance] = useState("0");
  const [trendingListings, setTrendingListings] = useState<TrendingItem[]>([]);
  const [trendingTimeframe, setTrendingTimeframe] = useState<"24h" | "7d">(
    "24h"
  );
  const [trendingLoading, setTrendingLoading] = useState(false);
  const { publicKey, connected, disconnect } = useWallet();

  const fetchTrendingTokens = async (timeframe: "24h" | "7d") => {
    try {
      setTrendingLoading(true);
      const response = await fetch(`/api/trending?timeframe=${timeframe}`);
      const data = await response.json();

      if (data.success) {
        setTrendingListings(data.data);
      }
    } catch (error) {
      console.error("Error fetching trending tokens:", error);
    } finally {
      setTrendingLoading(false);
    }
  };

  const fetchInitialListings = async () => {
    try {
      setLoading(true);
      const response = await fetch("/api/listings?page=1");
      const data = await response.json();

      if (data.status === "success") {
        setTreeMapListings(data.data.listings);
        // console.log("listings", data.data.listings);
      }
    } catch (error) {
      console.error("Error fetching initial listings:", error);
    } finally {
      setLoading(false);
    }
  };

  const fetchTotalListings = async () => {
    try {
      const response = await fetch("/api/count");
      const data = await response.json();
      // console.log(data);
      if (data.success) {
        setTotalListings(data.count);
      }
    } catch (error) {
      console.error("Error fetching total listings:", error);
    }
  };

  // Initial data fetch
  useEffect(() => {
    fetchInitialListings();
    fetchTotalListings();
  }, []);

  useEffect(() => {
    fetchTrendingTokens(trendingTimeframe);
  }, [trendingTimeframe]);

  const handleSearchResults = (
    searchResults: Listing[],
    pagination: { currentPage: number; totalPages: number }
  ) => {
    setTableListings(searchResults);
    setCurrentPage(pagination.currentPage);
    setTotalPages(pagination.totalPages);
  };

  // Calculate totals for tags
  // const totalListed = listings.length;

  const tags = [
    // {
    //   title: "Total Listed",
    //   value: totalListed,
    //   className: "bg-[#EFA411] text-[#EFA411]",
    // },
    {
      title: "Categories",
      value: 4,
      className: "bg-[#4594FF] text-[#4594FF]",
    },
  ];

  // useEffect(() => {
  //   if (!publicKey) return;

  //   fetchSolBalance(connection, publicKey).then((b) =>
  //     setBalance(b.toFixed(2))
  //   );
  // }, [publicKey]);

  return (
    <div className="min-h-screen bg-[#0C0D12] p-6 py-0 ">
      <main className="font-lexend">
        <div className="max-w-7xl mx-auto flex flex-col ">
          <section className="flex items-center justify-between mt-12 mb-6 md:my-12">
            <div className="flex flex-col items-start justify-start font-lexend">
              <h1 className="text-[#EEEEEE]/80 text-[32px]   font-lilita">
                Mindshare of Upcoming Launches
              </h1>
              <p className="font-normal text-[#a1a1a5]/75 text-sm font-lexend">
                Discover hyped crypto projects on Twitter. Track trends early
                and stay ahead.
              </p>
            </div>
          </section>
          <section className="flex flex-col sm:flex-row justify-between items-stretch gap-4 sm:gap-2 w-full">
            <div className="bg-[#BEB6FF]/5 p-3 flex flex-col gap-3 w-full sm:w-[50%] md:w-[60%] lg:w-[75%]">
              <div className="flex items-center justify-between w-full">
                <div className="flex items-center space-x-4">
                  <h1 className="text-xl text-white/50 font-itim">MindShare</h1>
                  <div className="items-center gap-2 px-4 py-2 bg-[#EFA411]/10 text-[#EFA411] font-medium text-[10px] hidden min-[850px]:flex">
                    Total Listings
                    <span className="font-semibold">{totalListings}</span>
                  </div>
                  <div className="items-center hidden min-[850px]:flex">
                    {tags.map((tag, index) => (
                      <button
                        key={index}
                        className={`${tag.className} px-4 py-2 bg-opacity-10 text-opacity-75 font-medium text-[10px] space-x-2`}
                      >
                        <span>{tag.title}</span>
                        <span className="font-semibold">{tag.value}</span>
                      </button>
                    ))}
                  </div>
                </div>
                <div className="border-2 border-[#202329]  p-1">
                  <div className="flex  overflow-hidden">
                    {["24h", "7d"].map((option) => (
                      <button
                        key={option}
                        onClick={() =>
                          setMindshareTimeframe(option as "24h" | "7d")
                        }
                        className={`px-4 py-1 text-xs transition-colors duration-200 font-itim ${
                          mindshareTimeframe === option
                            ? "bg-[#202329] text-[#E2AB00]"
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
                listings={treeMapListings}
                timeFrame={mindshareTimeframe}
                loading={loading}
              />
            </div>
            <div className="mx-auto bg-[#BEB6FF]/5  p-3 w-full sm:w-[50%] md:w-[40%] lg:w-[25%]">
              <div className="flex items-center justify-between mb-2">
                <h2 className="text-xl font-semibold text-white/50">
                  Trending
                </h2>
                <div className="border-2 border-[#202329] p-1">
                  <div className="flex overflow-hidden">
                    {["24h", "7d"].map((option) => (
                      <button
                        key={option}
                        onClick={() => {
                          setTrendingTimeframe(option as "24h" | "7d");
                        }}
                        className={`px-4 py-1 text-xs transition-colors duration-200 font-itim ${
                          trendingTimeframe === option
                            ? "bg-[#202329] text-[#E2AB00]"
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
                {trendingLoading ? (
                  // Loading skeleton UI
                  Array(5)
                    .fill(0)
                    .map((_, index) => (
                      <div
                        key={index}
                        className="flex items-center justify-between p-3.5 border-b-[1px] border-white border-opacity-[2.5%]"
                      >
                        <div className="flex items-center gap-3">
                          <div className="w-[26px] h-[26px] rounded-full bg-white/5 animate-pulse" />
                          <div className="w-24 h-3 bg-white/5 rounded animate-pulse" />
                        </div>
                        <div className="w-12 h-3 bg-white/5 rounded animate-pulse" />
                      </div>
                    ))
                ) : (
                  <>
                    {trendingListings.slice(0, 5).map((item, index) => (
                      <div
                        key={index}
                        className="flex items-center justify-between px-3 py-4 transition-colors"
                      >
                        <div className="flex items-center gap-3 text-sm font-akshar">
                          <img
                            src={item.avatar}
                            alt={item.name}
                            className="w-[26px] h-[26px] rounded-full"
                          />
                          <span className="text-white/50 font-medium">
                            {item.name}
                          </span>
                        </div>
                        <span className="font-roboto font-bold text-sm text-[#00a071]/90">
                          +{item.percentage.toFixed(1)}%
                        </span>
                      </div>
                    ))}
                    {trendingListings.length === 0 && (
                      <div className="text-white/50 text-center py-4">
                        No trending projects yet
                      </div>
                    )}
                  </>
                )}
              </div>
            </div>
          </section>
          <UpcomingLaunches
            currentPage={currentPage}
            totalPages={totalPages}
            loading={loading}
            onSearchResults={handleSearchResults}
          />
        </div>
      </main>
    </div>
  );
};

export default MindSharePage;
