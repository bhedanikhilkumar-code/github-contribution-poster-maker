import type { Metadata } from "next";
import "../styles/globals.css";

export const metadata: Metadata = {
  title: "GitHub Contribution Style Poster Maker",
  description:
    "Create contribution graph inspired posters from custom text with theme, sizing, and PNG export controls."
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body>{children}</body>
    </html>
  );
}
