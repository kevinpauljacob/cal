import { NextResponse } from "next/server";
import connectToDatabase from "@/utils/database";
import { Listing } from "@/models/listing";

export async function PUT(request: Request) {
  try {
    await connectToDatabase();
    const { twitterUsername, newLaunchDate } = await request.json();

    // Validate inputs
    if (!twitterUsername || !newLaunchDate) {
      return NextResponse.json(
        { error: "Missing required fields" },
        { status: 400 }
      );
    }

    // Update launch date
    const updatedListing = await Listing.findOneAndUpdate(
      {
        twitterUsername,
      },
      {
        launchDate: new Date(newLaunchDate),
        updatedAt: new Date(),
      },
      { new: true }
    );

    if (!updatedListing) {
      return NextResponse.json(
        { error: "Listing not found or unauthorized" },
        { status: 404 }
      );
    }

    return NextResponse.json({
      success: true,
      data: updatedListing,
    });
  } catch (error) {
    console.error("Error updating launch date:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
