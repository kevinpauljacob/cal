"use client";
import { useState, useEffect } from "react";
import Pagination from "./Pagination";
import { Search, X } from "lucide-react";
import useDebounce from "../utils/hooks";
import { useWallet } from "@solana/wallet-adapter-react";
import Image from "next/image";
import EditLaunchDateModal from "./EditLaunchDateModal";
import { toast } from "react-hot-toast";
import { set } from "mongoose";

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
interface Project {
  id?: string;
  profileImage: string;
  project: string;
  mindshareScore: number;
  mindshareChange: number;
  launchDate: string;
  twitter: string;
  category: string;
  followers: number;
  creatorPublicKey?: string;
  telegramUserName?: string;
}

interface UpcomingLaunchesProps {
  listings: Array<Listing>;
  currentPage: number;
  totalPages: number;
  loading: boolean;
  onPageChange: (page: number) => void;
  onSearchResults: (
    results: Listing[],
    pagination: { currentPage: number; totalPages: number }
  ) => void;
}

interface TokenProjectTableProps {
  projects: Project[];
  filter: string;
  currentPage: number;
  searchQuery: string;
  loading: boolean;
  onPageChange: (page: number) => void;
  sortField: string;
  sortOrder: string;
  setSortField: (field: string) => void;
  setSortOrder: (order: string) => void;
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
  loading,
  onPageChange,
  currentPage,
  sortField,
  sortOrder,
  setSortField,
  setSortOrder,
}) => {
  // Sort projects by mindshare score
  const sortedProjects = (projects ?? []).sort(
    (a, b) => (b?.mindshareScore ?? 0) - (a?.mindshareScore ?? 0)
  );
  const { publicKey, connected } = useWallet();
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [selectedProject, setSelectedProject] = useState<Project | null>(null);

  // Add this function inside the TokenProjectTable component
  const handleEditClick = (project: Project) => {
    setSelectedProject(project);
    setIsModalOpen(true);
  };
  const handleUpdateLaunchDate = async (newDate: string) => {
    if (!selectedProject) return;
    if (!connected) {
      toast.error("Please connect your wallet to update launch date");
    }
    try {
      const response = await fetch("/api/listings/update", {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          twitterUsername: selectedProject.twitter.replace("@", ""),
          creatorPublicKey: publicKey?.toBase58(),
          newLaunchDate: newDate,
        }),
      });

      toast.success("Launch date updated successfully");
      onPageChange(currentPage);
      setIsModalOpen(false);
    } catch (error) {
      console.error("Error updating launch date:", error);
      toast.error("Failed to update launch date");
    }
  };

  const filteredProjects = sortedProjects.filter((project) => {
    const matchesFilter =
      filter === "All" ||
      project.category.toLowerCase() === filter.toLowerCase();
    const matchesSearch =
      project.project.toLowerCase().includes(searchQuery.toLowerCase()) ||
      project.twitter.toLowerCase().includes(searchQuery.toLowerCase());
    return matchesFilter && matchesSearch;
  });
  const handleSort = (field: string) => {
    // Toggle sort order if the same field is clicked again
    if (sortField === field) {
      setSortOrder(sortOrder === "asc" ? "desc" : "asc");
    } else {
      setSortField(field);
      setSortOrder("asc"); // Default to ascending when switching fields
    }
  };

  console.log(filteredProjects, "H1");

  return (
    <div className="w-full overflow-x-auto">
      <table className="w-full min-w-full table-fixed">
        <thead>
          <tr className="text-[10px] text-white/30 font-medium">
            <th className="w-[25%] text-left py-4 px-6">Project</th>
            <th className="hidden sm:table-cell w-[12%] text-left py-4 px-6">
              Category
            </th>
            <th onClick={() => handleSort("followers")}>
              Followers{" "}
              {sortField === "followers" && (sortOrder === "asc" ? "▲" : "▼")}
            </th>
            <th onClick={() => handleSort("mindshareScore")}>
              MindShare{" "}
              {sortField === "mindshareScore" &&
                (sortOrder === "asc" ? "▲" : "▼")}
            </th>
            <th onClick={() => handleSort("mindshareChange")}>
              24h Change{" "}
              {sortField === "mindshareChange" &&
                (sortOrder === "asc" ? "▲" : "▼")}
            </th>
            <th className="hidden sm:table-cell w-[12%] text-left py-4 px-6">
              Launch Date
            </th>
            <th className="w-[12%] text-left py-4 px-6">Twitter</th>
          </tr>
        </thead>
        <tbody>
          {loading ? (
            <tr className="border-t border-white/5 text-[12px] font-medium">
              <td className="py-4 px-6">Loading..</td>
            </tr>
          ) : (
            filteredProjects.map((project, index: number) => (
              <tr
                key={index}
                className="border-t border-white/5 text-[12px] font-medium"
                onClick={() =>
                  window.open(`https://x.com/${project.twitter}`, "_blank")
                }
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
                <td className="hidden sm:table-cell py-4 px-6">
                  <span
                    className={`px-3 py-1 rounded-full text-[10px] ${getCategoryStyle(
                      project.category
                    )}`}
                  >
                    {project.category}
                  </span>
                </td>
                <td className="hidden sm:table-cell py-4 px-6 text-white/50">
                  {project.followers.toLocaleString()}
                </td>
                <td className="py-4 px-6 text-white/75">
                  {project.mindshareScore && project.mindshareScore.toFixed(2)}
                </td>
                <td className="hidden sm:table-cell py-4 px-6">
                  <span
                    className={
                      project.mindshareChange >= 0
                        ? "text-emerald-500"
                        : "text-red-500"
                    }
                  >
                    {project.mindshareChange > 0 ? "+" : ""}
                    {project.mindshareChange &&
                      project.mindshareChange.toFixed(2)}
                    %
                  </span>
                </td>
                <td className="hidden sm:flex flex-col py-4 px-6 text-white/50 items-start gap-1">
                  {project.launchDate}
                  {project.creatorPublicKey === publicKey?.toString() && (
                    <button
                      onClick={() => handleEditClick(project)}
                      className="bg-white bg-opacity-[2.5%] p-1 px-2 rounded-[10px] font-inter  flex items-center gap-1 font-semibold hover:bg-opacity-5 cursor-pointer"
                    >
                      <Image
                        src="/assets/edit.svg"
                        alt="Edit"
                        width={15}
                        height={15}
                      />
                      Edit
                    </button>
                  )}
                </td>
                <td className="py-4 px-6 text-white/50">{project.twitter}</td>
              </tr>
            ))
          )}
        </tbody>
      </table>
      <EditLaunchDateModal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        currentDate={selectedProject?.launchDate ?? ""}
        projectName={selectedProject?.project ?? ""}
        onUpdate={handleUpdateLaunchDate}
      />
    </div>
  );
};

const filterOptions = ["All", "AI", "Meme", "Gaming", "Political"];

const UpcomingLaunches: React.FC<UpcomingLaunchesProps> = ({
  listings,
  currentPage,
  totalPages,
  loading,
  onPageChange,
  onSearchResults,
}) => {
  const [activeFilter, setActiveFilter] = useState("All");
  const [searchQuery, setSearchQuery] = useState("");
  const debouncedSearchQuery = useDebounce(searchQuery, 500);
  const [sortField, setSortField] = useState("");
  const [sortOrder, setSortOrder] = useState("asc");

  const formatDate = (date: string) => {
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

  const projects: Project[] = listings?.map((listing) => ({
    profileImage: listing.profileImageUrl,
    project: listing.screenName,
    mindshareScore: listing.mindshare["24h"].score,
    mindshareChange: listing.mindshare["24h"].change,
    launchDate: formatDate(listing.launchDate),
    twitter: `@${listing.twitterUsername}`,
    category: listing.category[0].toUpperCase() + listing.category.slice(1),
    followers: listing.followers,
    creatorPublicKey: listing.creatorPublicKey || "",
  }));

  useEffect(() => {
    fetchSearchResults(debouncedSearchQuery, 1);
  }, [debouncedSearchQuery, sortField, sortOrder]);

  const fetchSearchResults = async (query: string, page: number) => {
    try {
      let url = `/api/search?q=${query}&page=${page}`;
      if (sortField) {
        url += `&sortField=${sortField}&sortOrder=${sortOrder}`;
      }
      const response = await fetch(url);
      const data = await response.json();
      if (data.status === "success") {
        onSearchResults(data.data.results, {
          currentPage: page,
          totalPages: data.data.pagination.pages,
        });
      }
    } catch (error) {
      console.error("Error searching listings:", error);
    }
  };

  return (
    <div className="w-full py-8 space-y-6">
      <h1 className="text-xl font-lilita text-opacity-90  text-white/80">
        Upcoming Token Launches
      </h1>

      <div className="flex flex-col-reverse sm:flex-row gap-4 justify-between items-center w-full">
        <div className="flex flex-wrap gap-2 sm:gap-4">
          {filterOptions.map((filter) => (
            <button
              key={filter}
              onClick={() => setActiveFilter(filter)}
              className={`px-2 py-1 sm:px-6 sm:py-2  text-[13px] font-itim  transition-colors
     bg-[#FFFFFF] bg-opacity-[2.5%] ${
       activeFilter === filter
         ? "text-[#E2AB00]"
         : "text-white/50 hover:bg-opacity-5"
     } `}
            >
              {filter}
            </button>
          ))}
        </div>

        <div className="relative max-w-[312px] sm:max-w-80 w-full right-0">
          <div className="relative">
            <input
              className="w-full bg-[#94A3B8]/5 placeholder:text-[#94A3B8]/50 font-lilita text-white backdrop-blur-xl  pl-6 pr-10 h-9 focus:outline-none "
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
              <Search className="absolute right-6 top-1/2 -translate-y-1/2 text-white/20 h-3 w-3" />
            )}
          </div>
        </div>
      </div>

      <TokenProjectTable
        projects={projects}
        filter={activeFilter}
        searchQuery={searchQuery}
        loading={loading}
        currentPage={currentPage}
        onPageChange={onPageChange}
        sortField={sortField}
        sortOrder={sortOrder}
        setSortField={setSortField}
        setSortOrder={setSortOrder}
      />

      <Pagination
        currentPage={currentPage}
        totalPages={totalPages}
        onPageChange={onPageChange}
      />
    </div>
  );
};

export default UpcomingLaunches;
