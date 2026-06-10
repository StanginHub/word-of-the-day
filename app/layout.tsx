import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import Link from "next/link";
import "./globals.css";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
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
      className={`${geistSans.variable} ${geistMono.variable} h-full antialiased`}
    >
      <body className="min-h-full flex flex-col bg-background text-foreground antialiased">
        <header className="border-b border-border bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60 sticky top-0 z-10">
          <div className="mx-auto flex max-w-4xl items-center justify-between px-6 py-4">
            <Link href="/" className="text-lg font-semibold tracking-tight text-foreground hover:text-accent transition-colors">
              Word of the Day
            </Link>
            <span className="text-xs font-mono text-muted-foreground tracking-wide uppercase">TH · EN</span>
          </div>
        </header>
        <main className="flex-1">{children}</main>
      </body>
    </html>
  );
}
