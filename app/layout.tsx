import type { Metadata } from "next";
import { Geist, Geist_Mono, Gentium_Plus } from "next/font/google";
import Link from "next/link";
import "./globals.css";
import { BellGif } from "@/components/bell-gif";
import { SpeedInsights } from "@vercel/speed-insights/next";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
  display: "swap",
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
  display: "swap",
});

const gentiumPlus = Gentium_Plus({
  variable: "--font-gentium",
  weight: ["400", "700"],
  subsets: ["latin"],
  display: "swap",
});

export const metadata: Metadata = {
  title: "Word of the Day",
  description:
    "Browse the Oxford Learner's Word of the Day collection with definitions, synonyms, antonyms, and Thai translations.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html
      lang="en"
      className={`${geistSans.variable} ${geistMono.variable} ${gentiumPlus.variable} h-full antialiased`}
    >
      <body className="min-h-full flex flex-col bg-background text-foreground antialiased"
            style={{paddingTop: "env(safe-area-inset-top, 0px)", paddingBottom: "env(safe-area-inset-bottom, 0px)"}}>
        <link rel="preconnect" href="https://yfohzxxvttdayuyefbdi.supabase.co" />
        <header className="border-b [...]
          <div className="mx-auto flex max-w-4xl items-center justify-between px-4 sm:px-6 py-4" style={{paddingLeft: "max(1rem, env(safe-area-inset-left, 1rem))", paddingRight: "max(1rem, env(safe-area-inset-right, 1rem))"}}>
            <Link href="/" className="text-lg font-semibold tracking-tight text-foreground hover:text-accent transition-colors">
              Word of the Day
            </Link>
            <div className="flex items-center gap-3">
              <span className="text-[11px] text-muted-foreground/50 tracking-wider">TH</span>
            </div>
          </div>
        </header>
        <main className="flex-1">{children}</main>

        <BellGif />
        <SpeedInsights />
      </body>
    </html>
  );
}
