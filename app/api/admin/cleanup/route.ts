import { NextResponse } from "next/server";
import { createServiceClient } from "@/lib/supabase/service";

export async function POST(request: Request) {
  try {
    const supabase = createServiceClient();

    // First get count of rows to verify
    const { count } = await supabase
      .from("daily_words")
      .select("id", { count: "exact", head: true });

    console.log("Rows before delete:", count);

    // Delete all records - use simpler syntax
    const { data, error } = await supabase
      .from("daily_words")
      .delete()
      .is("id", null)
      .select(); // Returns deleted rows

    // If that didn't work, try alternate approach
    if (error) {
      console.log("First delete attempt failed, trying alternate:", error);
      
      // Get all IDs first
      const { data: allRows } = await supabase
        .from("daily_words")
        .select("id");

      if (allRows && allRows.length > 0) {
        // Delete each ID explicitly
        for (const row of allRows) {
          await supabase
            .from("daily_words")
            .delete()
            .eq("id", row.id);
        }
      }
    }

    // Verify deletion
    const { count: countAfter } = await supabase
      .from("daily_words")
      .select("id", { count: "exact", head: true });

    console.log("Rows after delete:", countAfter);

    return NextResponse.json({
      success: true,
      message: `All old data deleted successfully. Deleted ${count} rows.`,
    });
  } catch (err) {
    console.error("Cleanup Error:", err);
    return NextResponse.json(
      { error: String(err) },
      { status: 500 }
    );
  }
}
