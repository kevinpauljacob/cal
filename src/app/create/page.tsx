"use client";
import { useRouter } from "next/navigation";
import React, { useState } from "react";
import { useForm } from "react-hook-form";
import { RiDeleteBin6Fill } from "react-icons/ri";
import { FaTwitter, FaCheckCircle } from "react-icons/fa";
import { toast } from "react-hot-toast";
import { Loader } from "@/components/Loader";
import { signIn, signOut, useSession } from "next-auth/react";

export type FormValues = {
  twitter: string;
  telegram: string;
  website?: string;
  category: string;
  description: string;
  platform?: string;
  launchDate?: string;
};

const categories = [
  { label: "Meme", value: "meme" },
  { label: "Utility", value: "utility" },
];

const CreateMindSharePage: React.FC = () => {
  const { data: session } = useSession();
  const router = useRouter();
  const [isLoading, setIsLoading] = useState(false);
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);
  const {
    register,
    handleSubmit,
    formState: { errors },
    reset,
    setValue,
    watch,
  } = useForm<FormValues>({
    mode: "onChange",
    defaultValues: {
      twitter: "",
      telegram: "",
      website: "",
      category: "",
      description: "",
      platform: "",
      launchDate: "",
    },
  });

  const handleAuth = async () => {
    if (!session) {
      try {
        await signIn("twitter", { callbackUrl: "/create" });
      } catch (error) {
        // console.log("Failed to sign in with Twitter");
      }
    }
  };

  const handleSignOut = async () => {
    try {
      await signOut();
    } catch (error) {
      console.error("Error signing out:", error);
    }
  };

  const getMinDateTime = () => {
    const now = new Date();
    return now.toISOString().slice(0, 16);
  };

  // Convert local datetime to UTC for API submission
  const localToUTC = (localDateTimeStr: string) => {
    const date = new Date(localDateTimeStr);
    return date.toISOString();
  };

  const onSubmit = async (data: FormValues) => {
    if (!session) {
      toast.error("Please connect your Twitter account");
      return;
    }

    setIsLoading(true);
    try {
      const utcLaunchDate =
        data.launchDate && data.launchDate.trim() !== ""
          ? localToUTC(data.launchDate)
          : null;

      const response = await fetch("/api/create", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          twitterUsername: session?.user?.username,
          telegramUserName: data.telegram,
          website: data.website,
          category: data.category,
          description: data.description,
          platform: data.platform,
          launchDate: utcLaunchDate,
        }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || "Failed to create listing");
      }

      const result = await response.json();
      // console.log(result);
      toast.success("Listing created successfully!");
      reset();
      router.push("/");
    } catch (error) {
      console.error("Error creating listing:", error);
      toast.error(
        error instanceof Error ? error.message : "Failed to create listing"
      );
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#0C0D12] px-6">
      <main className=" font-lexend">
        <div className="max-w-7xl mx-auto">
          <div className="w-full max-w-2xl mx-auto py-10 text-gray-300">
            <div className="text-center mb-12 space-y-3">
              <h1 className="text-2xl font-lexend text-white/80 font-semibold gray_gradient">
                Create Listing
              </h1>
              <p className="text-[#A1A1A5]/75 text-sm text-center font-lexend">
                Explore all the AI agents you&apos;ve created and participated
                in.
              </p>
            </div>
            <form
              autoComplete="new-password"
              className="space-y-8 font-lexend"
              onSubmit={handleSubmit(onSubmit)}
            >
              <div>
                <label className="text-[13px] font-lexend font-medium mb-2 block">
                  Connect Twitter <span className="text-red-400">*</span>
                </label>
                <div className="border border-dashed border-white/20 rounded-[10px] p-4 flex-col items-center justify-center">
                  {!session ? (
                    <button
                      type="button"
                      onClick={handleAuth}
                      className="flex items-center justify-center w-full py-3 bg-gradient-to-r from-[#1D9Bf0] to-[#0c8cf3] rounded-lg font-semibold text-lg text-white transition-transform transform"
                    >
                      <FaTwitter className="mr-2" /> Connect Twitter
                    </button>
                  ) : (
                    <div className="flex flex-col gap-2">
                      <div className="flex items-center rounded-lg gap-2">
                        <span className="font-medium text-sm text-[#94A3B8]">
                          Twitter Connected
                        </span>
                        <FaCheckCircle className="text-[#0EC97F]" />
                      </div>

                      <div className="flex items-center justify-between w-full gap-2">
                        <p className="bg-[#12141A] p-3 py-3.5 w-full rounded-[10px] font-chakra text-sm text-[#94A3B8]">
                          @{session.user.username}
                        </p>
                        <button
                          type="button"
                          onClick={() => handleSignOut()}
                          className="bg-[#14151E] px-4 py-3.5 rounded-[10px] transition text-[#94A3B8] hover:bg-red-400/40"
                        >
                          <RiDeleteBin6Fill className="w-[22px] h-[22px]" />
                        </button>
                      </div>
                    </div>
                  )}
                </div>
              </div>
              <div className="flex flex-col w-full">
                <p className="text-[13px] font-lexend font-medium mb-2 block">
                  Tell us about your exciting new project! 🚀{" "}
                  <span className="text-red-400">*</span>
                </p>
                <textarea
                  autoComplete="new-password"
                  autoCorrect="off"
                  autoCapitalize="off"
                  placeholder="What makes your project special? Tell the community about it..."
                  className={`w-full bg-[#94A3B8]/5  ${
                    errors.description
                      ? "border border-red-500"
                      : " border border-gray-800"
                  } rounded-lg p-4 h-14 text-gray-300 placeholder-[#94A3B8]/20 font-medium font-roboto focus:outline-none min-h-[120px] resize-none`}
                  {...register("description", {
                    required: "Description is required",
                    minLength: {
                      value: 15,
                      message: "At least 15 characters are required",
                    },
                  })}
                />
                {errors.description && (
                  <p className="text-sm text-red-500 mt-2">
                    {errors.description.message}
                  </p>
                )}
              </div>
              <div>
                <label className="text-[13px] font-lexend font-medium mb-2 block">
                  Select a category <span className="text-red-400">*</span>
                </label>
                <div className="relative">
                  <button
                    type="button"
                    onClick={() => setIsDropdownOpen(!isDropdownOpen)}
                    className="w-full bg-[#94A3B8]/5 py-2.5 px-3 border border-gray-800 rounded-lg flex justify-between items-center text-gray-300"
                  >
                    <span>
                      {categories.find((cat) => cat.value === watch("category"))
                        ?.label || "Select a category"}
                    </span>
                    <svg
                      className={`w-4 h-4 transition-transform ${
                        isDropdownOpen ? "rotate-180" : ""
                      }`}
                      fill="none"
                      stroke="currentColor"
                      viewBox="0 0 24 24"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M19 9l-7 7-7-7"
                      />
                    </svg>
                  </button>

                  {isDropdownOpen && (
                    <div className="absolute z-10 w-full mt-1 bg-[#13141A] border border-gray-800 rounded-[10px] py-1 shadow-lg">
                      {categories.map((option) => (
                        <button
                          key={option.value}
                          type="button"
                          className="w-full px-3 py-2 text-left text-gray-300 hover:bg-[#94A3B8]/10 transition-colors"
                          onClick={() => {
                            setValue("category", option.value);
                            setIsDropdownOpen(false);
                          }}
                        >
                          {option.label}
                        </button>
                      ))}
                    </div>
                  )}
                  {errors.category && (
                    <p className="text-red-500 text-sm mt-2">
                      Category is required.
                    </p>
                  )}
                </div>
              </div>
              <div className="flex flex-col w-full">
                <p className="text-[13px] font-lexend font-medium mb-2 block">
                  Where are you launching? 🎯
                </p>
                <input
                  type="text"
                  placeholder="xcombinator.ai"
                  className="w-full px-4 py-2 border border-gray-800 rounded-lg text-gray-300 placeholder-[#94A3B8]/20 bg-[#94A3B8]/5 focus:outline-none [&::-webkit-calendar-picker-indicator]:invert"
                  {...register("platform")}
                />
              </div>
              <div className="flex flex-col w-full">
                <p className="text-[13px] font-lexend font-medium mb-2 block">
                  When are you launching your token ? ⏱️
                </p>
                <input
                  type="datetime-local"
                  min={getMinDateTime()}
                  className="w-full px-4 py-2 border border-gray-800 rounded-lg text-gray-300 placeholder-[#94A3B8]/20 bg-[#94A3B8]/5 focus:outline-none [&::-webkit-calendar-picker-indicator]:invert"
                  {...register("launchDate", {
                    required: false, // Changed from required message to false
                    validate: (value) => {
                      if (
                        value &&
                        new Date(value) < new Date(getMinDateTime())
                      ) {
                        return "If provided, date/time must be in the future.";
                      }
                      return true;
                    },
                  })}
                />
                <p className="text-xs text-[#94A3B8]/50 mt-3">
                  All times are in your local timezone (
                  {Intl.DateTimeFormat().resolvedOptions().timeZone})
                </p>
                {errors.launchDate && (
                  <p className="text-sm text-red-500 mt-2">
                    {errors.launchDate.message}
                  </p>
                )}
              </div>
              <div className="flex flex-col w-full">
                <p className="text-[13px] font-lexend font-medium mb-2 block">
                  Project Website 🌐
                </p>
                <input
                  type="text"
                  placeholder="https://your-awesome-project.com"
                  className="w-full px-4 py-2 border border-gray-800 rounded-lg text-gray-300 placeholder-[#94A3B8]/20 bg-[#94A3B8]/5 focus:outline-none [&::-webkit-calendar-picker-indicator]:invert"
                  {...register("website")}
                />
              </div>

              <div className="flex flex-col w-full">
                <p className="text-[13px] font-lexend font-medium mb-2 block">
                  Personal Telegram Username for Direct Contact 💬{" "}
                  <span className="text-red-400">*</span>
                </p>
                <input
                  type="text"
                  placeholder="@username (without the @)"
                  className="w-full px-4 py-2 border border-gray-800 rounded-lg text-gray-300 placeholder-[#94A3B8]/20 bg-[#94A3B8]/5 focus:outline-none [&::-webkit-calendar-picker-indicator]:invert"
                  {...register("telegram", {
                    required: "We need your Telegram to keep you updated!",
                    pattern: {
                      value: /^[A-Za-z0-9_]{5,32}$/,
                      message:
                        "Please enter a valid Telegram username without @",
                    },
                  })}
                />
                {errors.telegram && (
                  <p className="text-sm text-red-500 mt-2">
                    {errors.telegram.message}
                  </p>
                )}
              </div>
              <button className="w-full bg-[#192634] hover:bg-[#192634]/80 text-white h-14 text-xl rounded-[10px] font-medium transition-colors">
                {isLoading ? <Loader className="h-6 w-6" /> : "Create Listing"}
              </button>
            </form>
          </div>
        </div>
      </main>
    </div>
  );
};

export default CreateMindSharePage;
