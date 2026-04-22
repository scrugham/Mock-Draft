import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "Scrugg’s Mock Draft-Off — Live Tracker",
  description: "Live Round 1 board and standings for the 2026 mock draft competition.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  );
}
