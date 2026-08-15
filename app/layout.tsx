import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";
import { PwaRegister } from "./pwa-register";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  metadataBase: new URL(process.env.NEXT_PUBLIC_APP_URL ?? "https://upscpuraan.vercel.app"),
  title: {
    default: "UPSCPuraan — Build better UPSC tests",
    template: "%s | UPSCPuraan",
  },
  description:
    "A focused test lab for UPSC CSE, CAPF, CDS and NDA aspirants.",
  applicationName: "UPSCPuraan",
  manifest: "/manifest.webmanifest",
  openGraph: {
    type: "website",
    title: "UPSCPuraan — Your syllabus. Your test.",
    description:
      "Build exam-aligned tests from verified PYQs and reviewed MCQs.",
    images: [{ url: "/og.png", width: 1536, height: 1024, alt: "UPSCPuraan — Your syllabus. Your test." }],
  },
  twitter: {
    card: "summary_large_image",
    title: "UPSCPuraan — Your syllabus. Your test.",
    description:
      "Build exam-aligned tests from verified PYQs and reviewed MCQs.",
    images: ["/og.png"],
  },
  icons: {
    icon: "/favicon.svg",
    shortcut: "/favicon.svg",
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body
        className={`${geistSans.variable} ${geistMono.variable} antialiased`}
      >
        {children}
        <PwaRegister />
      </body>
    </html>
  );
}
