import type { Metadata } from "next";
import { TRIED_FONTS } from "@/lib/triedFonts";
import Scrollbar from "@/components/Scrollbar";
import "overlayscrollbars/overlayscrollbars.css";
import "@/components/Scrollbar/index.scss";
import "@/styles/globals.scss";

export const metadata: Metadata = {
  title: "Normalize font metrics for web | Oles Gergun",
  description:
    "The text within a button is not always centered. This tool only changes how the word sits in the box.",
  icons: {
    icon: [
      {
        url: "/favicon.svg",
        type: "image/svg+xml",
        media: "(prefers-color-scheme: light)",
      },
      {
        url: "/favicon-dark.svg",
        type: "image/svg+xml",
        media: "(prefers-color-scheme: dark)",
      },
    ],
  },
};

export default function RootLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="en" data-overlayscrollbars-initialize="">
      <head>
        {TRIED_FONTS.flatMap((font) => [
          <link
            key={font.originalUrl}
            rel="preload"
            href={font.originalUrl}
            as="font"
            type="font/otf"
            crossOrigin="anonymous"
          />,
          <link
            key={font.normalizedUrl}
            rel="preload"
            href={font.normalizedUrl}
            as="font"
            type="font/otf"
            crossOrigin="anonymous"
          />,
        ])}
      </head>
      <body data-overlayscrollbars-initialize="">
        {children}
        <Scrollbar />
      </body>
    </html>
  );
}
