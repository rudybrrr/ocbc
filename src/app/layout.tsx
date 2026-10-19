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

const direction = `<!--
THESIS: The bank changes shape with the person. Guided mode is one next step and large controls. Standard mode is the same money as a ledger. Refuses a card grid that looks the same for every customer.
OWN-WORLD: Daylight kitchen-table phone. Cool paper, harbour ink, crimson only on money actions. Be Vietnam Pro. Guidance is a full-bleed harbour band.
STORY: Aisha chooses how the bank behaves, asks in plain language, saves a practice investment, and switches mode without losing the plan.
FIRST VIEWPORT: Home opens on the usable balance as a sentence, a harbour band for the investing walk, and full-width actions. Primary action: Start the walk.
FORM: Operate. Mobile column; on a wide screen the assistant sits beside the bank. seed: harbour-ledger-2026
FINISH: unreviewed and undocumented is unfinished; this build ends with the finish review, the verdict, DESIGN.md, and every shipping raster carrying its provenance
-->`;

export default function RootLayout({ children }: LayoutProps<"/">) {
  return (
    <html lang="en" className={`${sans.variable} h-full`}>
      <body className={`${sans.className} min-h-full antialiased`}>
        <template dangerouslySetInnerHTML={{ __html: direction }} />
        <StoreProvider>{children}</StoreProvider>
      </body>
    </html>
  );
}
