import type { Metadata } from "next";
import { Geist, Geist_Mono, Gentium_Plus } from "next/font/google";
import Link from "next/link";
import { Analytics } from "@vercel/analytics/next";
import "./globals.css";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

const gentiumPlus = Gentium_Plus({
  variable: "--font-gentium",
  weight: ["400", "700"],
  subsets: ["latin"],
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
        <header className="border-b border-border bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60 sticky top-0 z-10">
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

        {/* Fixed bottom-right GIF */}
        <img
          src="/stang-bell.gif"
          alt=""
          className="fixed bottom-4 right-4 z-40 w-20 h-20 sm:w-24 sm:h-24 pointer-events-none select-none"
          style={{ imageRendering: "auto" }}
        />
      </body>
    </html>
  );
}
