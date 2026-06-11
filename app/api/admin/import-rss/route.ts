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
    const $ = cheerio.load(xml, { xmlMode: true });

    const supabase = createServiceClient();
    const items: Array<{
      word: string;
      definition: string | null;
      fetched_date: string;
    }> = [];

    // Parse RSS items
    $("item").each((_, el) => {
      const $item = $(el);
      const title = $item.find("title").text().trim();
      const description = $item.find("description").text().trim();
      const pubDateStr = $item.find("pubDate").text().trim();

      if (title) {
        // Parse date from pubDate
        const pubDate = new Date(pubDateStr);
        const dateStr = pubDate.toISOString().split("T")[0];

        items.push({
          word: title,
          definition: description || null,
          fetched_date: dateStr,
        });
      }
    });

    if (items.length === 0) {
      return NextResponse.json(
        { error: "No items found in RSS feed" },
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
