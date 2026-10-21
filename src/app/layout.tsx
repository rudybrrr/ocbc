import type { Metadata, Viewport } from "next";
import { Be_Vietnam_Pro } from "next/font/google";
import { StoreProvider } from "@/lib/store";
import "./globals.css";

const sans = Be_Vietnam_Pro({
  subsets: ["latin"],
  weight: ["400", "500", "600", "700"],
  display: "swap",
  variable: "--font-sans",
});

export const metadata: Metadata = {
  title: "OCBC Adaptive Assist",
  description:
    "Practice prototype of an adaptive banking experience. Fictional figures. Not financial advice.",
};

export const viewport: Viewport = {
  themeColor: "#e7ebf0",
  width: "device-width",
  initialScale: 1,
};

export default function RootLayout({ children }: LayoutProps<"/">) {
  return (
    <html lang="en" className={`${sans.variable} h-full`}>
      <body className={`${sans.className} min-h-full antialiased`}>
        <StoreProvider>{children}</StoreProvider>
      </body>
    </html>
  );
}
