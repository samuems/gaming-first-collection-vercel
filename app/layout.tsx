import type { Metadata } from "next";
import { Outfit } from "next/font/google";
import { TooltipProvider } from "@/components/ui/tooltip";
import "./globals.css";

const outfit = Outfit({
  variable: "--font-outfit",
  subsets: ["latin"],
  weight: ["400", "500", "600", "700", "800", "900"],
});

export const metadata: Metadata = {
  title: "Gaming First Collection",
  description: "Gaming-First Collection — play, battle, win",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html
      lang="en"
      className={`${outfit.variable} dark h-full`}
    >
      <body className="h-full antialiased font-[family-name:var(--font-outfit)]">
        <TooltipProvider>{children}</TooltipProvider>
      </body>
    </html>
  );
}
