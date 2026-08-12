import type { Metadata, Viewport } from "next";
import { Orbitron, Exo_2, Share_Tech_Mono } from "next/font/google";
import "./globals.css";
import { ensureDb } from "@/db/seed";

const display = Orbitron({
  variable: "--font-display",
  subsets: ["latin"],
  weight: ["600", "700", "800"],
});

const body = Exo_2({
  variable: "--font-body",
  subsets: ["latin"],
  weight: ["400", "500", "600", "700", "800"],
});

const hud = Share_Tech_Mono({
  variable: "--font-hud",
  subsets: ["latin"],
  weight: "400",
});

export const metadata: Metadata = {
  title: "GENEI RYODAN · GENEx Manager",
  description: "PUBG Mobile team ops — roster, scrims, surveys, leaderboards",
  appleWebApp: {
    capable: true,
    title: "GENEx",
    statusBarStyle: "black-translucent",
  },
};

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  maximumScale: 1,
  themeColor: "#050506",
  viewportFit: "cover",
};

ensureDb();

export default function RootLayout({ children }: LayoutProps<"/">) {
  return (
    <html
      lang="en"
      className={`${display.variable} ${body.variable} ${hud.variable} h-full`}
    >
      <body className="scanlines flex min-h-full flex-col antialiased">{children}</body>
    </html>
  );
}
