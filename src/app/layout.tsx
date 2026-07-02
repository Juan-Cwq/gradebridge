import type { Metadata } from "next";
import { Inter, DM_Serif_Display } from "next/font/google";
import "./globals.css";

const inter = Inter({
  subsets: ["latin"],
  variable: "--font-inter",
  display: "swap",
});

const dmSerifDisplay = DM_Serif_Display({
  weight: "400",
  subsets: ["latin"],
  variable: "--font-display",
  display: "swap",
});

export const metadata: Metadata = {
  title: "GradeBridge - Sync MagicSchool AI to GradeLink in One Click",
  description:
    "Stop copying and pasting. GradeBridge automatically syncs your MagicSchool AI assignments, rubrics, and grades to GradeLink. Reclaim 5+ hours every week.",
  keywords: [
    "MagicSchool AI",
    "GradeLink",
    "teacher tools",
    "gradebook sync",
    "education technology",
    "K-12",
    "classroom management",
  ],
  authors: [{ name: "GradeBridge" }],
  openGraph: {
    title: "GradeBridge - Sync MagicSchool AI to GradeLink in One Click",
    description:
      "Stop copying and pasting. Automatically sync assignments, rubrics, and grades. Reclaim 5+ hours every week.",
    type: "website",
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html
      lang="en"
      data-theme="light"
      className={`${inter.variable} ${dmSerifDisplay.variable}`}
    >
      <body className="min-h-screen font-sans">{children}</body>
    </html>
  );
}
