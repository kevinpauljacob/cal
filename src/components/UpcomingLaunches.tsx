"use client";
import { useState, useEffect } from "react";
import Pagination from "./Pagination";
import { Search, X } from "lucide-react";
import useDebounce from "../utils/hooks";
import { useWallet } from "@solana/wallet-adapter-react";
import Image from "next/image";
import EditLaunchDateModal from "./EditLaunchDateModal";
import { toast } from "react-hot-toast";
import { ChevronUp, ChevronDown } from "lucide-react";
import { useSession } from "next-auth/react";

interface SortConfig {
  field: string;
  order: "asc" | "desc";
}
interface Listing {
  twitterUsername: string;
  telegramUsername?: string;
  screenName: string;
  profileImageUrl: string;
  bio: string;
  platform?: string;
  website?: string;
  followers: number;
  category: "ai" | "gaming" | "dog" | "cat";
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
  telegramUserName?: string;
}

interface UpcomingLaunchesProps {
  currentPage: number;
  totalPages: number;
  loading: boolean;
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
  currentSort: SortConfig;
  onPageChange: (page: number) => void;
  onSort: (field: string, order: "asc" | "desc") => void;
}

const getCategoryStyle = (category: string) => {
  switch (category.toLowerCase()) {
    case "ai":
      return "bg-gradient-to-r from-purple-500/20 to-pink-500/20 text-pink-300";
    case "gaming":
      return "bg-emerald-500/20 text-emerald-300";
    case "dog":
      return "bg-orange-500/20 text-orange-300";
    case "cat":
      return "bg-blue-500/20 text-blue-300";
    default:
      return "bg-white/5 text-white/50";
  }
};

const TableHeader: React.FC<{
  label: string;
  field: string;
  currentSort: SortConfig;
  onSort: (field: string, order: "asc" | "desc") => void;
  className?: string;
}> = ({ label, field, currentSort, onSort, className = "" }) => {
  const isActive = currentSort.field === field;

  const handleSort = () => {
    if (isActive) {
      // Toggle order if already sorting by this field
      onSort(field, currentSort.order === "asc" ? "desc" : "asc");
    } else {
      // Default to ascending on first click
      onSort(field, "asc");
    }
  };

  return (
    <th className={`${className} cursor-pointer group`} onClick={handleSort}>
      <div className="flex items-center gap-1">
        {label}
        <div className="flex flex-col">
          <ChevronUp
            size={14}
            className={`${
              isActive && currentSort.order === "asc"
                ? "text-emerald-500"
                : "text-gray-500 group-hover:text-gray-400 transition-all ease-in-out duration-300"
            }`}
          />
          <ChevronDown
            size={14}
            className={`${
              isActive && currentSort.order === "desc"
                ? "text-emerald-500"
                : "text-gray-500 group-hover:text-gray-400 transition-all ease-in-out duration-300"
            }`}
          />
        </div>
      </div>
    </th>
  );
};

const TokenProjectTable: React.FC<TokenProjectTableProps> = ({
  projects,
  filter,
  searchQuery,
  loading,
  currentSort,
  currentPage,
  onPageChange,
  onSort,
}) => {
  const { publicKey, connected } = useWallet();
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [selectedProject, setSelectedProject] = useState<Project | null>(null);

  const handleSort = (field: string, order: "asc" | "desc") => {
    onSort(field, order);
  };
  const { data: session, status } = useSession();

  // Add this function inside the TokenProjectTable component
  const handleEditClick = (e: React.MouseEvent, project: Project) => {
    e.stopPropagation();
    setSelectedProject(project);
    setIsModalOpen(true);
  };

  const handleUpdateLaunchDate = async (newDate: string) => {
    if (!selectedProject) return;
    if (!connected) {
      toast.error("Please connect your wallet to update launch date");
    }
    try {
      const response = await fetch("/api/update", {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          twitterUsername: selectedProject.twitter.replace("@", ""),
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

  const formatDate = (date: string) => {
    return new Date(date).toLocaleString(undefined, {
      hour: "numeric",
      minute: "2-digit",
      month: "2-digit",
      day: "2-digit",
      year: "numeric",
    });
  };

  const filteredProjects = projects.filter((project) => {
    const matchesFilter =
      filter === "All" ||
      project.category.toLowerCase() === filter.toLowerCase();
    const matchesSearch =
      project.project.toLowerCase().includes(searchQuery.toLowerCase()) ||
      project.twitter.toLowerCase().includes(searchQuery.toLowerCase());
    return matchesFilter && matchesSearch;
  });

  return (
    <div className="w-full relative">
      <div className="overflow-x-auto scroller">
        <div className="min-w-[800px]">
          <table className="w-full min-w-full table-fixed">
            <thead>
              <tr className="text-[10px] text-white/30 font-medium">
                <th className="sticky left-0 bg-[#0C0D12] w-[20%] text-left py-4 px-6 z-10">
                  Project
                </th>
                <th className="table-cell w-[10%] text-left py-4 px-6">
                  Category
                </th>
                <TableHeader
                  label="Followers"
                  field="followers"
                  currentSort={currentSort}
                  onSort={handleSort}
                  className="table-cell w-[10%] text-left py-4 px-6"
                />
                <TableHeader
                  label="MindShare"
                  field="mindshare"
                  currentSort={currentSort}
                  onSort={handleSort}
                  className="w-[15%] text-left py-4 px-6"
                />
                <TableHeader
                  label="24h Change"
                  field="change"
                  currentSort={currentSort}
                  onSort={handleSort}
                  className="table-cell w-[12%] text-left py-4 px-6"
                />
                <TableHeader
                  label="Launch Date"
                  field="launchDate"
                  currentSort={currentSort}
                  onSort={handleSort}
                  className="table-cell w-[12%] text-left py-4 px-6"
                />
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
                    <td className="sticky left-0 bg-[#0C0D12] py-4 px-6 z-10">
                      <div className="flex items-center gap-3">
                        <img
                          src={project.profileImage}
                          alt={project.project}
                          className="w-8 h-8 rounded-full"
                        />
                        <span className="text-white/75">{project.project}</span>
                      </div>
                    </td>
                    <td className="table-cell py-4 px-6">
                      <span
                        className={`px-3 py-1 rounded-full text-[10px] ${getCategoryStyle(
                          project.category
                        )}`}
                      >
                        {project.category}
                      </span>
                    </td>
                    <td className="table-cell py-4 px-6 text-white/50">
                      {project.followers.toLocaleString()}
                    </td>
                    <td className="py-4 px-6 text-white/75">
                      {project.mindshareScore &&
                        project.mindshareScore.toFixed(2)}
                    </td>
                    <td className="table-cell py-4 px-6">
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
                    <td className="flex flex-col py-4 px-6 text-white/50 items-start gap-1">
                      {formatDate(project.launchDate)}
                      {project.twitter === `@` + session?.user?.username && (
                        <button
                          onClick={(e) => handleEditClick(e, project)}
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
                    <td className="py-4 px-6 text-white/50">
                      {project.twitter}
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
        <EditLaunchDateModal
          isOpen={isModalOpen}
          onClose={() => setIsModalOpen(false)}
          currentDate={selectedProject?.launchDate ?? ""}
          projectName={selectedProject?.project ?? ""}
          onUpdate={handleUpdateLaunchDate}
        />
      </div>
    </div>
  );
};

const filterOptions = ["All", "AI", "Dog", "Gaming", "Cat"];

const UpcomingLaunches: React.FC<UpcomingLaunchesProps> = ({
  currentPage,
  totalPages,
  loading,
  onSearchResults,
}) => {
  const [listings, setListings] = useState<Listing[]>([]);
  const [activeFilter, setActiveFilter] = useState("All");
  const [searchQuery, setSearchQuery] = useState("");
  const [isSearching, setIsSearching] = useState(false);
  const [currentSort, setCurrentSort] = useState<SortConfig>({
    field: "launchDate",
    order: "asc",
  });

  const debouncedSearchQuery = useDebounce(searchQuery, 300);

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
  }));

  const fetchListings = async (
    page: number,
    sort?: string,
    order?: "asc" | "desc"
  ) => {
    try {
      const sortField = sort || currentSort.field;
      const sortOrder = order || currentSort.order;

      let url = `/api/listings?page=${page}&sort=${sortField}&order=${sortOrder}`;
      const response = await fetch(url);
      const data = await response.json();

      if (data.status === "success") {
        setListings(data.data.listings);
        onSearchResults(data.data.listings, {
          currentPage: page,
          totalPages: data.data.pagination.pages,
        });
      }
    } catch (error) {
      console.error("Error fetching listings:", error);
    }
  };

  const handleSort = (field: string, order: "asc" | "desc") => {
    const fieldMap: Record<string, string> = {
      project: "screenName",
      followers: "followers",
      mindshare: "mindshare",
      change: "change",
      launchDate: "launchDate",
      category: "category",
    };

    const apiField = fieldMap[field];
    if (apiField) {
      setCurrentSort({ field: apiField, order });
      if (debouncedSearchQuery) {
        fetchSearchResults(debouncedSearchQuery, 1, apiField, order);
      } else {
        fetchListings(1, apiField, order);
      }
    }
  };

  const handlePageChange = (page: number) => {
    if (debouncedSearchQuery) {
      fetchSearchResults(debouncedSearchQuery, page);
    } else {
      fetchListings(page);
    }
  };

  useEffect(() => {
    if (debouncedSearchQuery) {
      setIsSearching(true);
      fetchSearchResults(debouncedSearchQuery, 1);
    } else {
      setIsSearching(false);
      fetchListings(1);
    }
  }, [debouncedSearchQuery]);

  const fetchSearchResults = async (
    query: string,
    page: number,
    sort?: string,
    order?: "asc" | "desc"
  ) => {
    try {
      const sortField = sort || currentSort.field;
      const sortOrder = order || currentSort.order;

      let url = `/api/search?q=${query}&page=${page}`;
      if (sort) {
        url += `&sort=${sortField}&order=${sortOrder}`;
      }

      const response = await fetch(url);
      const data = await response.json();

      if (data.status === "success") {
        setListings(data.data.results);
        onSearchResults(data.data.results, {
          currentPage: page,
          totalPages: data.data.pagination.pages,
        });
      }
    } catch (error) {
      console.error("Error searching listings:", error);
    } finally {
      setIsSearching(false);
    }
  };

  return (
    <div className="w-full py-8 space-y-6">
      <h1 className="text-xl font-lilita text-opacity-90  text-white/80">
        Upcoming Token Launches
      </h1>

      <div className="flex flex-col-reverse min-[900px]:flex-row gap-2 min-[900px]:gap-4 justify-between items-center w-full">
        <div className="flex flex-wrap gap-2 min-[900px]:gap-4 w-full">
          {filterOptions.map((filter) => (
            <button
              key={filter}
              onClick={() => setActiveFilter(filter)}
              className={`flex-1 min-[900px]:w-max w-full px-2 py-2 sm:px-6 text-[13px] font-itim  transition-colors
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

        <div className="relative min-[900px]:max-w-[500px] w-full right-0">
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
        loading={loading || isSearching}
        currentPage={currentPage}
        currentSort={currentSort}
        onPageChange={handlePageChange}
        onSort={handleSort}
      />

      <Pagination
        currentPage={currentPage}
        totalPages={totalPages}
        onPageChange={handlePageChange}
      />
    </div>
  );
};

export default UpcomingLaunches;
