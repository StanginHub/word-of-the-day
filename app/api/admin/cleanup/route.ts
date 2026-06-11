import { NextResponse } from "next/server";
import { createServiceClient } from "@/lib/supabase/service";

export async function POST(request: Request) {
  try {
    const supabase = createServiceClient();

    // Delete all records from daily_words
    const { error } = await supabase
      .from("daily_words")
      .delete()
      .neq("id", ""); // Delete all rows

    if (error) {
      console.error("Delete error:", error);
      return NextResponse.json(
        { error: "Failed to delete records: " + error.message },
        { status: 500 }
      );
    }

    return NextResponse.json({
      success: true,
      message: "All old data deleted successfully",
    });
  } catch (err) {
    console.error("Error:", err);
    return NextResponse.json(
      { error: String(err) },
      { status: 500 }
    );
  }
}
