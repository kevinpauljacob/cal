import { NextResponse } from "next/server";
import connectToDatabase from "@/utils/database";
import { Listing } from "@/models/listing";

export async function GET() {
  try {
    await connectToDatabase();

    const count = await Listing.countDocuments({ active: true });

    return NextResponse.json({
      success: true,
      count: count,
    });
  } catch (error) {
    console.error("Error fetching listing count:", error);
    return NextResponse.json(
      {
        success: false,
        error: "Failed to fetch listing count",
      },
      { status: 500 }
    );
  }
}
