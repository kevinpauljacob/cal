"use client";
import TreeMapComponent from "@/components/TreeMap";
import React, { useState, useEffect } from "react";
import UpcomingLaunches from "@/components/UpcomingLaunches";
import Link from "next/link";
import { WalletConnectButton } from "@solana/wallet-adapter-react-ui";
import { useWallet } from "@solana/wallet-adapter-react";
import {
  connection,
  copyToClipboard,
  fetchSolBalance,
  truncateAddress,
} from "@/utils/helper";
import { Copy } from "lucide-react";
import Image from "next/image";
import { SiSolana } from "react-icons/si";

interface Listing {
  twitterUsername: string;
  screenName: string;
  profileImageUrl: string;
  bio: string;
  followers: number;
  category: "ai" | "gaming" | "meme" | "political";
  launchDate: string;
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
  creatorPublicKey?: string;
  telegramUserName?: string;
}

interface TrendingItem {
  name: string;
  percentage: number;
  iconBg: string;
  avatar: string;
}

const MindSharePage: React.FC = () => {
  const [treeMapListings, setTreeMapListings] = useState<Listing[]>([]);
  const [tableListings, setTableListings] = useState<Listing[]>([]);
  const [showWalletModal, setShowWalletModal] = useState(false);
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [loading, setLoading] = useState(true);
  const [mindshareTimeframe, setMindshareTimeframe] = useState<"24h" | "7d">(
    "24h"
  );
  console.log(tableListings, "H2");
  const [balance, setBalance] = useState("0");

  const [trendingTimeframe, setTrendingTimeframe] = useState<"24h" | "7d">(
    "24h"
  );
  const [trendingListings, setTrendingListings] = useState<TrendingItem[]>([]);
  const { publicKey, connected, disconnect } = useWallet();

  // only positive
  const calculateTrendingListings = (
    listings: Listing[],
    timeframe: "24h" | "7d"
  ) => {
    return listings
      .map((listing) => {
        const change = listing.mindshare[timeframe].change;
        return {
          name: listing.screenName,
          percentage: change,
          iconBg: "#00A071",
          avatar: listing.profileImageUrl,
        };
      })
      .filter((item): item is TrendingItem => item.percentage > 0)
      .sort((a, b) => b.percentage - a.percentage)
      .slice(0, 10);
  };

  // both positive and negative
  // const calculateTrendingListings = ( listings: Listing[],
  //  timeframe: "24h" | "7d") => {
  //   return listings
  //     .map((listing) => {
  //       const change = listing.mindshare[timeframe].change;
  //       return {
  //         name: listing.screenName,
  //         percentage: change,
  //         iconBg: "#00A071",
  //         avatar: listing.profileImageUrl,
  //       };
  //     })
  //     .sort((a, b) => Math.abs(b.percentage) - Math.abs(a.percentage)) // Sort by absolute value
  //     .slice(0, 10);
  // };

  // Fetch data for TreeMap and Trending (first page only)
  const fetchInitialListings = async () => {
    try {
      setLoading(true);
      const response = await fetch("/api/listings?page=1");
      const data = await response.json();
      console.log(data);
      if (data.status === "success") {
        setTreeMapListings(data.data.listings);
        const trendingItems = calculateTrendingListings(
          data.data.listings,
          trendingTimeframe
        );
        setTrendingListings(trendingItems);
      }
    } catch (error) {
      console.error("Error fetching initial listings:", error);
    }
  };

  // Fetch paginated data for the table
  const fetchTableListings = async (page: number) => {
    try {
      const response = await fetch(`/api/listings?page=${page}`);
      const data = await response.json();

      if (data.status === "success") {
        setTableListings(data.data.listings);
        setTotalPages(data.data.pagination.pages);
        setCurrentPage(page);
      }
    } catch (error) {
      console.error("Error fetching table listings:", error);
    } finally {
      setLoading(false);
    }
  };

  // Initial data fetch
  useEffect(() => {
    fetchInitialListings();
    fetchTableListings(1);
  }, []);

  useEffect(() => {
    if (treeMapListings.length > 0) {
      const trendingItems = calculateTrendingListings(
        treeMapListings,
        trendingTimeframe
      );
      setTrendingListings(trendingItems);
    }
  }, [treeMapListings, trendingTimeframe]);

  const handlePageChange = (newPage: number) => {
    fetchTableListings(newPage);
  };

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

  useEffect(() => {
    if (!publicKey) return;

    fetchSolBalance(connection, publicKey).then((b) =>
      setBalance(b.toFixed(2))
    );
  }, [publicKey]);

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
            <div className="flex items-center space-x-4">
              <Link
                href={"/create"}
                className="bg-[#323546] font-bold text-white/75 text-center px-6 leading-3 rounded-[10px] text-[10px] py-2"
              >
                Get Listed
              </Link>
              {connected ? (
                <div
                  className="relative bg-[#192634] text-white flex items-center text-sm rounded-[10px] cursor-pointer font-chakra"
                  onClick={() => setShowWalletModal(!showWalletModal)}
                  // onMouseEnter={() => setShowWalletModal(true)}
                >
                  <div className="bg-white/5 px-3 py-2 rounded-l-[10px]">
                    <Image
                      width={15}
                      height={15}
                      src="/assets/wallet.png"
                      alt="wallet"
                    />
                  </div>
                  <div className="flex items-center justify-center gap-1.5 px-2">
                    <SiSolana
                      width={14}
                      height={11}
                      className="text-[#cccccc]"
                    />
                    <span className="font-medium font-chakra">{balance}</span>
                  </div>
                  {showWalletModal && (
                    <div className="absolute top-14 right-0 bg-[#16171C] flex flex-col items-center gap-2 rounded-[10px] w-[140px] p-1.5">
                      <div className="flex items-center gap-2 bg-[#2A2B2F] rounded-md w-full p-2">
                        <div>
                          <div className="text-white/50 text-[10px]">
                            Wallet Address
                          </div>
                          <div>
                            {truncateAddress(publicKey?.toBase58() ?? "")}
                          </div>
                        </div>
                        <div
                          className="rounded-md hover:bg-white/15 transition-all duration-300 ease-in-out p-1"
                          onClick={() =>
                            copyToClipboard(publicKey?.toBase58() ?? "")
                          }
                        >
                          <Copy size={16} />
                        </div>
                      </div>
                      <button
                        className="text-white/50 hover:text-white/75 hover:bg-white/15 font-medium bg-[#2A2B2F]  rounded-md transition-all duration-300 ease-in-out w-full p-2"
                        onClick={disconnect}
                      >
                        Disconnect
                      </button>
                    </div>
                  )}
                </div>
              ) : (
                <WalletConnectButton />
              )}
            </div>
          </section>
          <section className="flex items-center justify-between mt-12 mb-6 md:my-12">
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
          <section className="flex flex-col sm:flex-row justify-between items-stretch gap-4 sm:gap-2 w-full">
            <div className="bg-[#BEB6FF]/5 rounded-[10px] p-3 flex flex-col gap-3 w-full sm:w-[50%] md:w-[60%] lg:w-[75%]">
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
                listings={treeMapListings}
                timeFrame={mindshareTimeframe}
                loading={loading}
              />
            </div>
            <div className="mx-auto bg-[#BEB6FF]/5 rounded-[10px] p-3 w-full sm:w-[50%] md:w-[40%] lg:w-[25%]">
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
                            calculateTrendingListings(treeMapListings, option);
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
                {loading ? (
                  // Loading skeleton UI
                  Array(7)
                    .fill(0)
                    .map((_, index) => (
                      <div
                        key={index}
                        className="flex items-center justify-between px-3 py-4 border-b-[1px] border-white border-opacity-[2.5%]"
                      >
                        <div className="flex items-center gap-3">
                          <div className="w-[26px] h-[26px] rounded-full bg-white/5 animate-pulse" />
                          <div className="w-24 h-4 bg-white/5 rounded animate-pulse" />
                        </div>
                        <div className="w-12 h-4 bg-white/5 rounded animate-pulse" />
                      </div>
                    ))
                ) : (
                  <>
                    {trendingListings.slice(0, 7).map((item, index) => (
                      <div
                        key={index}
                        className="flex items-center justify-between px-3 py-4 transition-colors "
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
                  </>
                )}
              </div>
            </div>
          </section>
          <UpcomingLaunches
            listings={tableListings}
            currentPage={currentPage}
            totalPages={totalPages}
            loading={loading}
            onPageChange={handlePageChange}
            onSearchResults={handleSearchResults}
          />
        </div>
      </main>
    </div>
  );
};

export default MindSharePage;
