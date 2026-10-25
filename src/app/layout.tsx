import type { Metadata, Viewport } from "next";
import { Inter } from "next/font/google";
import { StoreProvider } from "@/lib/store";
import "./globals.css";
import "./ocbc.css";
import "./motion.css";

// Apple devices render SF Pro through the system stack in globals.css; Inter is the closest fallback elsewhere.
const fallback = Inter({
  subsets: ["latin"],
  display: "swap",
  variable: "--font-inter",
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
    <html lang="en" className={`${fallback.variable} h-full`}>
      <body className={`min-h-full antialiased`}>
        <StoreProvider>{children}</StoreProvider>
      </body>
    </html>
  );
}
