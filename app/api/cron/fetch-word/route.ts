import { NextResponse } from "next/server";
import { createServiceClient } from "@/lib/supabase/service";
import * as cheerio from "cheerio";

// ---------------------------------------------------------------------------
// POST /api/cron/fetch-word
// Called daily by Vercel cron. Scrapes Oxford Learner's Dictionaries for the
// word of the day, enriches with Thesaurus.com synonyms/antonyms (Datamuse fallback), and upserts into
// the daily_words table via the service-role Supabase client.
// ---------------------------------------------------------------------------

type DictEntry = {
  word: string;
  pos?: string;
  ipa?: string;
  definition?: string;
  oxfordSynonyms?: string[];
  examples?: string[];
  etymology?: string;
  cefr?: string;
  topic?: string;
};

// ---------- helpers ----------

/** Today in YYYY-MM-DD (UTC). */
function todayStr(): string {
  return new Date().toISOString().slice(0, 10);
}

// ---------- step 1: Oxford scraper ----------

const OXFORD_URL = "https://www.oxfordlearnersdictionaries.com/";

async function scrapeOxford(overrideWord?: string): Promise<DictEntry> {
  // --- Override mode: fetch a specific word's detail page directly ---
  if (overrideWord) {
    const detailUrl = `https://www.oxfordlearnersdictionaries.com/definition/english/${encodeURIComponent(overrideWord)}`;
    const detailRes = await fetch(detailUrl);
    if (!detailRes.ok)
      throw new Error(
        `Oxford detail page returned ${detailRes.status} for word "${overrideWord}"`
      );
    const detailHtml = await detailRes.text();
    const $$ = cheerio.load(detailHtml);

    const word = cleanText($$("h1.headword").first().text()) || overrideWord;
    const pos = cleanText($$("span.pos").first().text()) || "";
    const ipa =
      cleanText($$("div.phons_br span.phon").first().text()) ||
      cleanText($$("div.phons_n_am span.phon").first().text()) ||
      "";
    const definition = cleanText($$("span.def").first().text()) || "";
    const oxfordSynonyms: string[] = [];
    $$("span.xrefs a.Ref").each((_, el) => {
      const syn = cleanText($$(el).text());
      if (syn) oxfordSynonyms.push(syn);
    });
    const examples: string[] = [];
    $$("span.x").each((_, el) => {
      const ex = cleanText($$(el).text());
      if (ex) examples.push(ex);
    });
    let etymology = "";
    const originDiv = $$("#wordorigin").first();
    if (originDiv.length) {
      etymology = cleanText(originDiv.text()).replace(/^Word Origin\s*/i, "") || "";
    } else {
      $$("span.box_title").each((_, el) => {
        if (cleanText($$(el).text()).toLowerCase() === "word origin") {
          const bodyEl = $$(el).next("span.body");
          if (bodyEl.length) {
            etymology = cleanText(bodyEl.find("span.p").text()) || "";
          }
        }
      });
    }
    const cefr = cleanText($$("div.cefr").first().text()) || "";
    const topicEl = $$("a.origin").first();
    const topic = topicEl.length
      ? cleanText(topicEl.find("div").first().text()) || cleanText(topicEl.text()) || ""
      : "";

    if (!word)
      throw new Error(
        `Could not find word on Oxford detail page for "${overrideWord}"`
      );

    return {
      word,
      pos: pos || undefined,
      ipa: ipa || undefined,
      definition: definition || undefined,
      oxfordSynonyms: oxfordSynonyms.length > 0 ? oxfordSynonyms : undefined,
      examples: examples.length > 0 ? examples : undefined,
      etymology: etymology || undefined,
      cefr: cefr || undefined,
      topic: topic || undefined,
    };
  }

  // 1. Fetch homepage
  const res = await fetch(OXFORD_URL);
  if (!res.ok) throw new Error(`Oxford returned ${res.status}`);

  const html = await res.text();
  const $ = cheerio.load(html);

  // 2. Extract word from a.headword (either direct text or child div)
  const headwordEl = $("a.headword").first();
  const word =
    cleanText(headwordEl.find("div").first().text()) ||
    cleanText(headwordEl.text()) ||
    "";

  // 3. Extract PoS from .pos on homepage (it's a div)
  let pos = cleanText($(".pos").first().text()) || "";

  // 4. Extract detail page URL from the headword link
  const detailUrl = headwordEl.attr("href") || "";

  let ipa = "";
  let definition = "";
  const oxfordSynonyms: string[] = [];
  const examples: string[] = [];
  let etymology = "";
  let cefr = "";
  let topic = "";

  // 5. Fetch detail page for richer data
  if (detailUrl) {
    try {
      const detailRes = await fetch(detailUrl);
      if (detailRes.ok) {
        const detailHtml = await detailRes.text();
        const $$ = cheerio.load(detailHtml);

        // IPA — prefer UK (div.phons_br), fallback to US (div.phons_n_am)
        ipa =
          cleanText($$("div.phons_br span.phon").first().text()) ||
          cleanText($$("div.phons_n_am span.phon").first().text()) ||
          "";

        // Definition from span.def inside li.sense
        definition = cleanText($$("span.def").first().text()) || "";

        // Oxford synonyms from span.xrefs a.Ref
        $$("span.xrefs a.Ref").each((_, el) => {
          const syn = cleanText($$(el).text());
          if (syn) oxfordSynonyms.push(syn);
        });

        // Examples — collect all <span class="x"> elements
        $$("span.x").each((_, el) => {
          const ex = cleanText($$(el).text());
          if (ex) examples.push(ex);
        });

        // Etymology — inside div#wordorigin or span.box_title "Word Origin"
        const originDiv = $$("#wordorigin").first();
        if (originDiv.length) {
          etymology = cleanText(originDiv.text()).replace(/^Word Origin\s*/i, "") || "";
        } else {
          $$("span.box_title").each((_, el) => {
            if (cleanText($$(el).text()).toLowerCase() === "word origin") {
              const bodyEl = $$(el).next("span.body");
              if (bodyEl.length) {
                etymology = cleanText(bodyEl.find("span.p").text()) || "";
              }
            }
          });
        }

        // CEFR — <div class="cefr">C2</div>
        cefr = cleanText($$("div.cefr").first().text()) || "";

        // Topic — <a class="origin" href="/topic/..."><div>TopicName</div></a>
        const topicEl = $$("a.origin").first();
        if (topicEl.length) {
          topic = cleanText(topicEl.find("div").first().text()) || cleanText(topicEl.text()) || "";
        }

        // If PoS wasn't found on the homepage, try the detail page (.pos is a span there)
        if (!pos) {
          pos = cleanText($$("span.pos").first().text()) || "";
        }
      }
    } catch {
      // Detail page fetch failed — continue with homepage data only
    }
  }

  if (!word) throw new Error("Could not find word of the day on Oxford page");

  return {
    word,
    pos: pos || undefined,
    ipa: ipa || undefined,
    definition: definition || undefined,
    oxfordSynonyms: oxfordSynonyms.length > 0 ? oxfordSynonyms : undefined,
    examples: examples.length > 0 ? examples : undefined,
    etymology: etymology || undefined,
    cefr: cefr || undefined,
    topic: topic || undefined,
  };
}

function cleanText(text: string): string {
  return text.replace(/\s+/g, " ").trim();
}

// ---------- step 2: Free Dictionary API fallback ----------

async function fetchFreeDictDef(word: string): Promise<DictEntry> {
  const res = await fetch(
    `https://api.dictionaryapi.dev/api/v2/entries/en/${encodeURIComponent(word)}`
  );
  if (!res.ok) throw new Error(`Dictionary API returned ${res.status}`);

  const entries = (await res.json()) as Array<Record<string, unknown>>;

  // Grab first meaning from first entry
  const first = entries[0];
  const meaning = (first?.meanings as Array<Record<string, unknown>>)?.[0];
  const definition =
    (meaning?.definitions as Array<Record<string, unknown>>)?.[0]
      ?.definition as string | undefined;

  const phonetic =
    (first?.phonetic as string) ||
    ((first?.phonetics as Array<Record<string, unknown>>)?.[0]?.text as string) ||
    undefined;

  const pos = meaning?.partOfSpeech as string | undefined;

  return { word, pos, ipa: phonetic, definition };
}

// ---------- step 3: Thesaurus.com enrichment ----------
// Scrapes thesaurus.com which categorises synonyms into STRONGEST, STRONG, WEAK
// and provides antonyms. Falls back to Datamuse if scraping fails.

async function fetchThesaurusCom(
  word: string
): Promise<{
  synonyms: string[];
  synonyms_strongest: string[];
  synonyms_strong: string[];
  synonyms_weak: string[];
  antonyms: string[];
  antonyms_strongest: string[];
  antonyms_strong: string[];
  antonyms_weak: string[];
}> {
  try {
    const res = await fetch(
      `https://www.thesaurus.com/browse/${encodeURIComponent(word)}`,
      { headers: { "User-Agent": "Mozilla/5.0" } }
    );
    if (!res.ok) throw new Error(`Thesaurus.com returned ${res.status}`);

    const html = await res.text();
    const $ = cheerio.load(html);

    const synonyms: string[] = [];
    const synonyms_strongest: string[] = [];
    const synonyms_strong: string[] = [];
    const synonyms_weak: string[] = [];
    const antonyms: string[] = [];
    const antonyms_strongest: string[] = [];
    const antonyms_strong: string[] = [];
    const antonyms_weak: string[] = [];

    // Thesaurus.com has multiple <section class="synonym-antonym-panel"> blocks,
    // each representing a different meaning/usage. We only want the FIRST meaning
    // (the primary definition), so we take only the first two panels:
    // first panel = Synonyms for meaning #1, second panel = Antonyms for meaning #1.
    const panels = $("section.synonym-antonym-panel");
    
    if (panels.length === 0) {
      throw new Error("No synonym-antonym-panel sections found");
    }

    // Process first panel (should be synonyms for primary meaning)
    const firstPanel = panels.eq(0);
    const firstLabel = firstPanel.find(".synonym-antonym-panel-label").first().text().trim();
    
    if (firstLabel === "Synonyms" || firstLabel === "") {
      let currentStrength: string | null = null;
      
      // Walk through children to track strength labels and their words
      firstPanel.find("*").each((__, el) => {
        const $el = $(el);
        const classes = $el.attr("class") || "";
        
        // Check for strength label
        if (classes.includes("similarity-level-label") || classes.includes("level-label")) {
          const labelText = $el.text().trim().toUpperCase();
          if (["STRONGEST", "STRONG", "WEAK"].includes(labelText)) {
            currentStrength = labelText;
          }
        }
        
        // Check for word chip
        if ($el.is("a") && classes.includes("word-chip") && classes.includes("synonym-antonym-word-chip")) {
          const text = $el.text().trim();
          if (text) {
            synonyms.push(text);
            if (currentStrength === "STRONGEST") {
              synonyms_strongest.push(text);
            } else if (currentStrength === "STRONG") {
              synonyms_strong.push(text);
            } else if (currentStrength === "WEAK") {
              synonyms_weak.push(text);
            }
          }
        }
      });
    }

    // Process second panel (should be antonyms for primary meaning)
    if (panels.length > 1) {
      const secondPanel = panels.eq(1);
      const secondLabel = secondPanel.find(".synonym-antonym-panel-label").first().text().trim();
      
      if (secondLabel === "Antonyms" || secondLabel === "") {
        let antStrength: string | null = null;
        secondPanel.find("*").each((__, el) => {
          const $el = $(el);
          const classes = $el.attr("class") || "";
          
          if (classes.includes("similarity-level-label") || classes.includes("level-label")) {
            const labelText = $el.text().trim().toUpperCase();
            if (["STRONGEST", "STRONG", "WEAK"].includes(labelText)) {
              antStrength = labelText;
            }
          }
          
          if ($el.is("a") && classes.includes("word-chip") && classes.includes("synonym-antonym-word-chip")) {
            const text = $el.text().trim();
            if (text) {
              antonyms.push(text);
              if (antStrength === "STRONGEST") {
                antonyms_strongest.push(text);
              } else if (antStrength === "STRONG") {
                antonyms_strong.push(text);
              } else if (antStrength === "WEAK") {
                antonyms_weak.push(text);
              }
            }
          }
        });
      }
    }

    return {
      synonyms: [...new Set(synonyms)],
      synonyms_strongest: [...new Set(synonyms_strongest)],
      synonyms_strong: [...new Set(synonyms_strong)],
      synonyms_weak: [...new Set(synonyms_weak)],
      antonyms: [...new Set(antonyms)],
      antonyms_strongest: [...new Set(antonyms_strongest)],
      antonyms_strong: [...new Set(antonyms_strong)],
      antonyms_weak: [...new Set(antonyms_weak)],
    };
  } catch (err) {
    console.warn(
      "Thesaurus.com scrape failed, falling back to Datamuse",
      err
    );
    return fetchDatamuse(word);
  }
}

/** Datamuse fallback (kept for when Thesaurus.com is unavailable). */
async function fetchDatamuse(
  word: string
): Promise<{
  synonyms: string[];
  synonyms_strongest: string[];
  synonyms_strong: string[];
  synonyms_weak: string[];
  antonyms: string[];
  antonyms_strongest: string[];
  antonyms_strong: string[];
  antonyms_weak: string[];
}> {
  const [synRes, antRes] = await Promise.all([
    fetch(`https://api.datamuse.com/words?rel_syn=${encodeURIComponent(word)}&max=10`),
    fetch(`https://api.datamuse.com/words?rel_ant=${encodeURIComponent(word)}&max=10`),
  ]);

  const parse = (r: Response): Promise<string[]> =>
    r.ok
      ? r.json().then((list: Array<{ word: string }>) => list.map((w) => w.word))
      : Promise.resolve([]);

  const [synonyms, antonyms] = await Promise.all([parse(synRes), parse(antRes)]);

  // Datamuse doesn't provide strength categorization
  return {
    synonyms,
    synonyms_strongest: [],
    synonyms_strong: [],
    synonyms_weak: [],
    antonyms,
    antonyms_strongest: [],
    antonyms_strong: [],
    antonyms_weak: [],
  };
}

// ---------- step 3.5: Thai translation via Google Translate ----------
// Tries Cloud Translation API first (if GOOGLE_TRANSLATE_API_KEY is set),
// then falls back to the unofficial free endpoint.

async function fetchThaiTranslations(
  word: string,
  _synonyms?: string[],
  _definition?: string
): Promise<string[]> {
  const translations = new Set<string>();

  // Translate the word directly via DeepL (most accurate)
  const deeplKey = process.env.DEEPL_API_KEY;
  if (deeplKey) {
    try {
      const res = await fetch("https://api-free.deepl.com/v2/translate", {
        method: "POST",
        headers: { "Authorization": "DeepL-Auth-Key " + deeplKey },
        body: new URLSearchParams({ text: word, target_lang: "TH" }),
        signal: AbortSignal.timeout(5000),
      });
      if (res.ok) {
        const data = await res.json();
        if (data?.translations) {
          for (const t of data.translations) {
            if (t.text) translations.add(t.text.trim());
          }
        }
      }
    } catch { /* fall through */ }
  }

  // Gemini validation: try models in priority order
  const geminiKey = process.env.GEMINI_API_KEY;
  const geminiModels = ["gemini-3.5-flash", "gemini-2.5-flash"];
  const dsKey = process.env.DEEPSEEK_API_KEY;
  const dsUrl = "https://opencode.ai/zen/go/v1/chat/completions";
  let geminiDone = false;
  if (geminiKey && _definition && translations.size > 0) {
    const first = [...translations][0];
    geminiDone = false;
    for (const model of geminiModels) {
      if (geminiDone) break;
      try {
        const prompt = "Word: " + word + "\\nDefinition: " + _definition + "\\nThai: " + first + "\\n\\nDoes the Thai match the definition? Reply YES or NO. If NO, what is the correct Thai translation?";
        const res = await fetch(
          "https://generativelanguage.googleapis.com/v1/models/" + model + ":generateContent?key=" + geminiKey,
          {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
              contents: [{ parts: [{ text: prompt }] }],
              generationConfig: { maxOutputTokens: 50, temperature: 0 },
            }),
            signal: AbortSignal.timeout(5000),
          }
        );
        if (res.ok) {
          const data = await res.json();
          const text = data?.candidates?.[0]?.content?.parts?.[0]?.text || "";
          geminiDone = true;
          if (text.startsWith("NO")) {
            translations.clear();
            const lines = text.split("\n").filter((l: string) => l.trim());
            for (const line of lines) {
              if (/[\u0E00-\u0E7F]/.test(line) && !line.startsWith("NO")) {
                translations.add(line.replace(/^[-*\d. ]+/, "").trim());
              }
            }
            if (translations.size === 0) {
              try {
                const gRes = await fetch(
                  "https://translate.googleapis.com/translate_a/single?client=gtx&sl=en&tl=th&dt=t&q=" + encodeURIComponent(word)
                );
                if (gRes.ok) {
                  const gData = await gRes.json();
                  if (Array.isArray(gData?.[0])) {
                    for (const item of gData[0]) {
                      if (Array.isArray(item) && item[0] && typeof item[0] === "string") {
                        translations.add(item[0].trim());
                      }
                    }
                  }
                }
              } catch { /* silent */ }
            }
          }
        } else if (res.status === 429 || res.status === 503) {
          continue;
        }
      } catch { /* try next model */ }
    }
  }

  // DeepSeek fallback: if Gemini all failed and DeepL result looks wrong
  if (dsKey && _definition && !geminiDone && translations.size > 0) {
    const first = [...translations][0];
    try {
      const prompt = "Word: " + word + "\\nDefinition: " + _definition + "\\nThai: " + first + "\\n\\nDoes the Thai match the definition? Answer YES or NO only.";
      const res = await fetch(dsUrl, {
        method: "POST",
        headers: { "Authorization": "Bearer " + dsKey, "Content-Type": "application/json" },
        body: JSON.stringify({
          model: "deepseek-v4-flash",
          messages: [{ role: "user", content: prompt }],
          max_tokens: 100,
          temperature: 0,
        }),
        signal: AbortSignal.timeout(5000),
      });
      if (res.ok) {
        const data = await res.json();
        const text = data?.choices?.[0]?.message?.content?.trim() || "";
        if (text.startsWith("NO")) {
          translations.clear();
          // Try to extract DeepSeek's suggested translation
          for (const line of text.split("\n").filter((l: string) => l.trim())) {
            if (/[\u0E00-\u0E7F]/.test(line) && !line.startsWith("NO")) {
              translations.add(line.replace(/^[-*\d. ]+/, "").trim());
            }
          }
          // If no suggestion, try Google as fallback
          if (translations.size === 0) {
            const gRes = await fetch(
              "https://translate.googleapis.com/translate_a/single?client=gtx&sl=en&tl=th&dt=t&q=" + encodeURIComponent(word)
            );
            if (gRes.ok) {
              const gData = await gRes.json();
              if (Array.isArray(gData?.[0])) {
                for (const item of gData[0]) {
                  if (Array.isArray(item) && item[0] && typeof item[0] === "string") {
                    translations.add(item[0].trim());
                  }
                }
              }
            }
          }
        }
      }
    } catch { /* fall through */ }
  }

  // Fallback: Google Translate free endpoint
  if (translations.size === 0) {
    try {
      const res = await fetch(
        `https://translate.googleapis.com/translate_a/single?client=gtx&sl=en&tl=th&dt=t&q=${encodeURIComponent(word)}`
      );
      if (res.ok) {
        const data = await res.json();
        if (Array.isArray(data?.[0])) {
          for (const item of data[0]) {
            if (Array.isArray(item) && item[0] && typeof item[0] === "string") {
              translations.add(item[0].trim());
            }
          }
        }
      }
    } catch { /* silent */ }
  }

  // Also get dictionary mode alternatives for extra options
  try {
    const res = await fetch(
      `https://translate.googleapis.com/translate_a/single?client=gtx&sl=en&tl=th&dt=t&dt=md&q=${encodeURIComponent(word)}`
    );
    if (res.ok) {
      const data = await res.json();
      const extractThai = (obj: unknown) => {
        if (typeof obj === "string" && /[\u0E00-\u0E7F]/.test(obj)) {
          translations.add(obj);
        } else if (Array.isArray(obj)) {
          obj.forEach(extractThai);
        }
      };
      extractThai(data);
    }
  } catch { /* silent */ }

  return [...translations];
}

// ---------- route handler ----------

export async function POST(request: Request) {
  // ---- auth guard ----
  const auth = request.headers.get("Authorization") || "";
  const token = auth.startsWith("Bearer ") ? auth.slice(7) : auth;

  if (!process.env.CRON_SECRET || token !== process.env.CRON_SECRET) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  // ---- parse optional override params ----
  let overrideWord: string | null = null;
  let overrideDate: string | null = null;
  try {
    const body = await request.clone().json();
    if (typeof body.word === "string") overrideWord = body.word;
    if (typeof body.date === "string") overrideDate = body.date;
  } catch {
    // body not JSON or missing — no overrides
  }

  // ---- scrape / fetch entry ----
  let entry: DictEntry;
  try {
    entry = await scrapeOxford(overrideWord ?? undefined);
    // If the scraping returned a word but empty definition, try to enrich
    if (!entry.definition) {
      try {
        const enriched = await fetchFreeDictDef(entry.word);
        entry = { ...entry, ...enriched };
      } catch {
        // keep the scraped data, just without a definition
      }
    }
  } catch (oxErr) {
    console.warn("Oxford scrape failed, falling back to Free Dictionary API", oxErr);
    // Try Free Dictionary API with a random word-of-the-day-ish fallback word
    // In a real scenario you'd have a list or previous words; here we use a
    // rotating list of common words so the cron never fully fails.
    const fallbackWords = [
      "serendipity", "ephemeral", "resilience", "eloquent", "meticulous",
      "benevolent", "ubiquitous", "tenacious", "pragmatic", "luminous",
    ];
    const today = new Date();
    const fallbackWord = fallbackWords[today.getDate() % fallbackWords.length];

    try {
      entry = await fetchFreeDictDef(fallbackWord);
    } catch (dictErr) {
      console.error("Dictionary API also failed", dictErr);
      return NextResponse.json(
        { error: "Both Oxford and Dictionary API failed" },
        { status: 502 }
      );
    }
  }

  // ---- Thesaurus enrichment ----
  let synonyms: string[] = [];
  let synonyms_strongest: string[] = [];
  let synonyms_strong: string[] = [];
  let synonyms_weak: string[] = [];
  let antonyms: string[] = [];
  let antonyms_strongest: string[] = [];
  let antonyms_strong: string[] = [];
  let antonyms_weak: string[] = [];
  try {
    ({ synonyms, synonyms_strongest, synonyms_strong, synonyms_weak, antonyms, antonyms_strongest, antonyms_strong, antonyms_weak } = await fetchThesaurusCom(entry.word));
  } catch (thErr) {
    console.warn("Thesaurus enrichment failed, continuing without it", thErr);
  }

  // Merge Oxford synonyms (from the detail page) with Thesaurus synonyms
  if (entry.oxfordSynonyms && entry.oxfordSynonyms.length > 0) {
    synonyms = [...new Set([...entry.oxfordSynonyms, ...synonyms])];
  }

  // ---- Thai translation via Google Translate ----
  let thai_translations: string[] = [];
  try {
    thai_translations = await fetchThaiTranslations(entry.word, synonyms, entry.definition);
  } catch (thaiErr) {
    console.warn("Thai translation fetch failed, continuing without it", thaiErr);
  }

  // ---- upsert into Supabase ----
  try {
    const supabase = createServiceClient();
    const date = overrideDate ?? todayStr();
    const payload = {
      word: entry.word,
      pos: entry.pos || null,
      ipa: entry.ipa || null,
      definition: entry.definition || null,
      synonyms,
      synonyms_strongest,
      synonyms_strong,
      synonyms_weak,
      antonyms,
      antonyms_strongest,
      antonyms_strong,
      antonyms_weak,
      thai_translations,
      examples: entry.examples || null,
      etymology: entry.etymology || null,
      cefr: entry.cefr || null,
      topic: entry.topic || null,
      fetched_date: date,
    };

    const { error } = await supabase
      .from("daily_words")
      .upsert(payload, { onConflict: "fetched_date" });

    if (error) {
      console.error("Supabase upsert error:", error);
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    return NextResponse.json({
      success: true,
      word: entry.word,
      date,
      thai_translations,
      definition: entry.definition,
    });
  } catch (dbErr) {
    console.error("Supabase connection error:", dbErr);
    return NextResponse.json(
      { error: "Database operation failed" },
      { status: 500 }
    );
  }
}
