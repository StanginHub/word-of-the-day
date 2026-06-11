import { NextResponse } from "next/server";
import { createServiceClient } from "@/lib/supabase/service";
import * as cheerio from "cheerio";

export async function POST(request: Request) {
  try {
    // Fetch RSS feed
    const feedUrl = "https://feeds.feedburner.com/OLD-WordOfTheDay";
    const res = await fetch(feedUrl);
    if (!res.ok) {
      return NextResponse.json(
        { error: `Failed to fetch RSS feed: ${res.status}` },
        { status: 502 }
      );
    }

    const xml = await res.text();
    console.log("RSS Feed fetched, length:", xml.length);
    
    const $ = cheerio.load(xml, { xmlMode: true });

    const supabase = createServiceClient();
    const items: Array<{
      word: string;
      definition: string | null;
      fetched_date: string;
    }> = [];

    // Parse RSS items - try both item and entry tags
    const entries = $("item, entry");
    console.log("Found entries:", entries.length);

    entries.each((_, el) => {
      const $item = $(el);
      
      // Try both title and summary/description
      let title = $item.find("title").first().text().trim();
      let description = $item.find("description").first().text().trim() || 
                       $item.find("summary").first().text().trim() || "";

      // Try pubDate or published
      let pubDateStr = $item.find("pubDate").first().text().trim() ||
                       $item.find("published").first().text().trim() || "";

      console.log("Entry:", { title, description: description.substring(0, 30), pubDateStr });

      if (title) {
        try {
          // Parse date - handle various formats
          const pubDate = new Date(pubDateStr);
          const dateStr = pubDate.toISOString().split("T")[0];

          // Clean HTML from description if present
          const cleanDesc = description
            .replace(/<[^>]*>/g, "") // Remove HTML tags
            .replace(/&amp;/g, "&")
            .replace(/&lt;/g, "<")
            .replace(/&gt;/g, ">")
            .replace(/&quot;/g, '"')
            .trim()
            .substring(0, 500); // Limit length

          items.push({
            word: title,
            definition: cleanDesc || null,
            fetched_date: dateStr,
          });
        } catch (e) {
          console.warn("Failed to parse entry:", e);
        }
      }
    });

    console.log("Items to insert:", items.length);

    if (items.length === 0) {
      return NextResponse.json(
        { error: "No items found in RSS feed or could not parse items" },
        { status: 400 }
      );
    }

    // Upsert into database
    const { error } = await supabase
      .from("daily_words")
      .upsert(items, { onConflict: "fetched_date" });

    if (error) {
      console.error("Upsert error:", error);
      return NextResponse.json(
        { error: "Database error: " + error.message },
        { status: 500 }
      );
    }

    return NextResponse.json({
      success: true,
      imported: items.length,
      items: items.slice(0, 5), // Show first 5 as sample
    });
  } catch (err) {
    console.error("Error:", err);
    return NextResponse.json(
      { error: String(err) },
      { status: 500 }
    );
  }
}
