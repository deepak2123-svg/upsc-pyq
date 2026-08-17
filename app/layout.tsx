import type { Metadata } from "next";
import { Inter, Source_Serif_4 } from "next/font/google";
import "./globals.css";
import { PwaRegister } from "./pwa-register";

const inter = Inter({
  variable: "--font-interface",
  subsets: ["latin"],
});

const sourceSerif = Source_Serif_4({
  variable: "--font-reading",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  metadataBase: new URL(process.env.NEXT_PUBLIC_APP_URL ?? "https://upscpuraan.vercel.app"),
  title: {
    default: "UPSC.PYQ.Practise — Official PYQ Practice",
    template: "%s | UPSC.PYQ.Practise",
  },
  description:
    "Practise exact previous-year questions from UPSC CSE, CAPF, CDS and NDA papers.",
  applicationName: "UPSC.PYQ.Practise",
  manifest: "/manifest.webmanifest",
  openGraph: {
    type: "website",
    title: "UPSC.PYQ.Practise — Official PYQ Practice",
    description:
      "Browse and practise exact previous-year questions by exam, subject and topic.",
    images: [{ url: "/og-upsc-pyq-practise.png", width: 1536, height: 1024, alt: "UPSC.PYQ.Practise official PYQ archive" }],
  },
  twitter: {
    card: "summary_large_image",
    title: "UPSC.PYQ.Practise — Official PYQ Practice",
    description:
      "Browse and practise exact previous-year questions by exam, subject and topic.",
    images: ["/og-upsc-pyq-practise.png"],
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
        className={`${inter.variable} ${sourceSerif.variable}`}
      >
        {children}
        <PwaRegister />
      </body>
    </html>
  );
}
