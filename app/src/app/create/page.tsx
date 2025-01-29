"use client";
import { useRouter } from "next/navigation";
import React, { useState, useEffect } from "react";
import { useForm } from "react-hook-form";
import { RiDeleteBin6Fill } from "react-icons/ri";
import { FaTwitter, FaCheckCircle } from "react-icons/fa";
import Cookies from "js-cookie";
import { toast } from "react-hot-toast";
import { Loader } from "@/components/Loader";

export type FormValues = {
  twitter: string;
  category: string;
  launchDate: string;
};

const categories = [
  { label: "AI", value: "ai" },
  { label: "Meme", value: "meme" },
  { label: "Gaming", value: "gaming" },
  { label: "Political", value: "political" },
];

const CreateMindSharePage: React.FC = () => {
  const router = useRouter();
  const [username, setUserName] = useState<string>("");
  const [isLoading, setIsLoading] = useState(false);
  const {
    register,
    handleSubmit,
    formState: { errors },
    reset,
  } = useForm<FormValues>({
    mode: "onChange",
    defaultValues: {
      twitter: "",
      category: "",
      launchDate: "",
    },
  });

  const handleTwitterLogin = async () => {
    const response = await fetch("/api/auth/twitter?redirect=/create");
    const { authUrl } = await response.json();
    window.location.href = authUrl; // Redirect user to Twitter login
  };

  const handleSignOut = async () => {
    try {
      const response = await fetch("/api/auth/signOut", {
        credentials: "include",
        method: "POST",
      });
      if (response.ok) {
        // Handle successful signout (e.g., redirect to home page)
        window.location.href = "/create";
      }
    } catch (error) {
      console.error("Error signing out:", error);
    }
  };

  const getMinDateTime = () => {
    const now = new Date();
    now.setMinutes(now.getMinutes() - now.getTimezoneOffset());
    const minTime = now.toISOString().slice(0, 16);
    return minTime;
  };

  const onSubmit = async (data: FormValues) => {
    if (!username) {
      toast.error("Please connect your Twitter account");
      return;
    }

    setIsLoading(true);
    try {
      const response = await fetch("/api/create", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          twitterUsername: username,
          category: data.category,
          launchDate: new Date(data.launchDate).toISOString(),
        }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || "Failed to create listing");
      }

      const result = await response.json();
      console.log(result);
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

  useEffect(() => {
    const user = Cookies.get("twitter_user");
    if (user) {
      setUserName(user);
    }
    console.log("twitter_user", JSON.stringify(user));
  }, []);

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
                  Connect Twitter
                </label>
                <div className="border border-dashed border-white/20 rounded-[10px] p-6 flex-col items-center justify-center">
                  {!username ? (
                    <button
                      type="button"
                      onClick={handleTwitterLogin}
                      className="flex items-center justify-center w-full py-3 bg-gradient-to-r from-[#1D9Bf0] to-[#0c8cf3] rounded-lg font-semibold text-lg text-white transition-transform transform"
                    >
                      <FaTwitter className="mr-2" /> Connect Twitter
                    </button>
                  ) : (
                    <div className="flex flex-col gap-4">
                      <div className="flex items-center rounded-lg mb-4 gap-2">
                        <span className="font-medium text-sm text-[#94A3B8]">
                          Twitter Connected
                        </span>
                        <FaCheckCircle className="text-[#0EC97F]" />
                      </div>

                      <div className="flex items-center justify-between w-full gap-2 mb-6">
                        <p className="bg-[#12141A] p-3 py-3.5 w-full rounded-[10px] font-chakra text-sm text-[#94A3B8]">
                          @{username}
                        </p>
                        <button
                          type="button"
                          onClick={() => handleSignOut()}
                          className="bg-[#14151E] px-4 py-3.5 rounded-[10px] transition text-[#94A3B8] hover:bg-[#14151e]/70"
                        >
                          <RiDeleteBin6Fill className="w-[22px] h-[22px]" />
                        </button>
                      </div>
                    </div>
                  )}
                </div>
              </div>
              <div>
                <label className="text-[13px] font-lexend font-medium mb-2 block">
                  Category
                </label>
                <div className="">
                  <select
                    {...register("category", { required: true })}
                    className="w-full bg-[#94A3B8]/5 text-white  py-4 px-3 rounded-[10px]  focus:outline-none focus:ring-transparent focus:ring-none"
                  >
                    <option value="" className="bg-[#13141A]">
                      Select a category
                    </option>
                    {categories.map((option) => (
                      <option
                        key={option.value}
                        value={option.value}
                        className="bg-[#13141A]"
                      >
                        {option.label}
                      </option>
                    ))}
                  </select>
                  {errors.category && (
                    <p className="text-red-500 text-sm mt-2">
                      Category is required.
                    </p>
                  )}
                </div>
              </div>
              <div className="flex flex-col w-full">
                <p className="text-[13px] font-lexend font-medium mb-2 block">
                  Launch Date
                </p>
                <input
                  type="datetime-local"
                  min={getMinDateTime()}
                  className="w-1/2 sm:w-full px-4 py-2 border border-gray-800 rounded-lg text-gray-300 bg-[#94A3B8]/5 focus:outline-none [&::-webkit-calendar-picker-indicator]:invert"
                  {...register("launchDate", {
                    required: "Sale Start Time is required",
                    validate: (value) => {
                      if (
                        value &&
                        new Date(value) < new Date(getMinDateTime())
                      ) {
                        return "Date/time must be in the future.";
                      }
                      return true;
                    },
                  })}
                />
                {errors.launchDate && (
                  <p className="text-sm text-red-500 mt-2">
                    {errors.launchDate.message}
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
