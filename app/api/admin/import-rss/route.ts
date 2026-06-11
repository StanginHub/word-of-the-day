import { NextResponse } from "next/server";
import { createServiceClient } from "@/lib/supabase/service";
import * as cheerio from "cheerio";

export async function POST(request: Request) {
  try {
    // Fetch RSS feed
    const feedUrl = "https://feeds.feedburner.com/OLD-WordOfTheDay";
    
    console.log("Fetching RSS from:", feedUrl);
    
    const res = await fetch(feedUrl, {
      headers: {
        "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36",
      },
    });

    if (!res.ok) {
      return NextResponse.json(
        { error: `Failed to fetch RSS feed: ${res.status}` },
        { status: 502 }
      );
    }

    const xml = await res.text();
    console.log("RSS Feed fetched, length:", xml.length);
    console.log("First 500 chars:", xml.substring(0, 500));

    const $ = cheerio.load(xml, { xmlMode: true });

    const supabase = createServiceClient();
    const items: Array<{
      word: string;
      definition: string | null;
      fetched_date: string;
    }> = [];

    // Parse RSS items
    const entries = $("item");
    console.log("Found item elements:", entries.length);

    entries.each((idx, el) => {
      try {
        const $item = $(el);

        // Get title (the word)
        const title = $item.find("title").first().text().trim();

        // Get description
        let description = $item.find("description").first().text().trim();

        // Get pubDate
        let pubDateStr = $item.find("pubDate").first().text().trim();

        console.log(`Item ${idx}:`, {
          title: title.substring(0, 20),
          description: description.substring(0, 50),
          pubDate: pubDateStr,
        });

        if (!title) {
          console.warn(`Item ${idx}: No title found`);
          return;
        }

        // Parse the date
        let dateStr = "";
        try {
          if (pubDateStr) {
            const pubDate = new Date(pubDateStr);
            if (!isNaN(pubDate.getTime())) {
              dateStr = pubDate.toISOString().split("T")[0];
            } else {
              // Fallback: use today's date
              dateStr = new Date().toISOString().split("T")[0];
            }
          } else {
            dateStr = new Date().toISOString().split("T")[0];
          }
        } catch (e) {
          console.warn(`Item ${idx}: Could not parse date`, e);
          dateStr = new Date().toISOString().split("T")[0];
        }

        // Clean description: remove HTML, decode entities
        const cleanDesc = description
          .replace(/<!\[CDATA\[([\s\S]*?)\]\]>/g, "$1") // Remove CDATA wrapper
          .replace(/<[^>]*>/g, "") // Remove HTML tags
          .replace(/&amp;/g, "&")
          .replace(/&lt;/g, "<")
          .replace(/&gt;/g, ">")
          .replace(/&quot;/g, '"')
          .replace(/&apos;/g, "'")
          .trim()
          .substring(0, 1000); // Limit length

        items.push({
          word: title,
          definition: cleanDesc || null,
          fetched_date: dateStr,
        });

        console.log(`Item ${idx}: Successfully parsed`);
      } catch (e) {
        console.warn(`Error parsing item ${idx}:`, e);
      }
    });

    console.log("Total items parsed:", items.length);

    if (items.length === 0) {
      return NextResponse.json(
        {
          error: "No items found in RSS feed or could not parse items",
          debug: {
            feedLength: xml.length,
            itemCount: entries.length,
          },
        },
        { status: 400 }
      );
    }

    // Upsert into database
    const { error, count } = await supabase
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
