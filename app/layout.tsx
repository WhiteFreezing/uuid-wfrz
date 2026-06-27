import type { Metadata } from "next";
import "./globals.css";
export const metadata: Metadata = {
  title: "MC UUID lookup · uuid.wfrz.eu",
  description: "Convert Minecraft usernames ↔ UUIDs. Bulk mode for 100s at a time, skin preview, name history. Pure-browser.",
};
export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <head>
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="" />
        <link rel="stylesheet" href="https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700;800&family=JetBrains+Mono:wght@400;500;600&display=swap" />
      </head>
      <body>{children}</body>
    </html>
  );
}
