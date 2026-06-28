// app/layout.tsx
// Root layout — sets up metadata, fonts, and global styles.

import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "Ritual Will Oracle — Decentralized AI Prediction Network",
  description:
    "Submit future scenarios. AI analyzes and stores predictions permanently on the Ritual blockchain as verifiable oracle records.",
  keywords: ["Ritual", "AI Oracle", "Blockchain", "Prediction", "Groq", "Web3"],
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en" className="dark">
      <head>
        <meta name="theme-color" content="#050508" />
        <link rel="icon" href="data:image/svg+xml,<svg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 100 100'><text y='.9em' font-size='90'>⬡</text></svg>" />
      </head>
      <body className="min-h-screen bg-[#050508] text-gray-100 antialiased">
        {children}
      </body>
    </html>
  );
}
