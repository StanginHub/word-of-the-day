import { NextResponse } from "next/server";

export async function GET(request: Request) {
  try {
    const feedUrl = "https://feeds.feedburner.com/OLD-WordOfTheDay";
    
    console.log("=== DEBUG RSS FEED ===");
    console.log("Fetching:", feedUrl);
    
    const res = await fetch(feedUrl, {
      headers: {
        "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36",
      },
    });

    console.log("Status:", res.status);
    console.log("Content-Type:", res.headers.get("content-type"));

    const xml = await res.text();
    
    console.log("XML Length:", xml.length);
    console.log("First 1000 chars:", xml.substring(0, 1000));

    // Count items
    const itemCount = (xml.match(/<item>/g) || []).length;
    const entryCount = (xml.match(/<entry>/g) || []).length;
    
    console.log("Item count:", itemCount);
    console.log("Entry count:", entryCount);

    // Extract first item
    let firstItemXml = "";
    const itemMatch = xml.match(/<item>[\s\S]*?<\/item>/);
    if (itemMatch) {
      firstItemXml = itemMatch[0];
    }

    return NextResponse.json({
      success: true,
      debug: {
        url: feedUrl,
        status: res.status,
        contentType: res.headers.get("content-type"),
        xmlLength: xml.length,
        itemCount,
        entryCount,
        firstItem: firstItemXml.substring(0, 500),
        fullXml: xml.substring(0, 2000),
      },
    });
  } catch (err) {
    console.error("Debug Error:", err);
    return NextResponse.json(
      { error: String(err) },
      { status: 500 }
    );
  }
}
