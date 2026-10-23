import type { Journey } from "@/lib/journeys";
import type { Screen } from "@/lib/types";

export type Offer = {
  id: string;
  label: string;
  title: string;
  action: string;
  accessibleAction: string;
  journeys: Journey[];
  screen?: Screen;
  image?: string;
  imageAlt?: string;
};

export const OFFERS: Offer[] = [
  { id: "coverage", label: "Welcome", title: "Enhance your cancer coverage, and enjoy up to S$2,250 in rewards.", action: "Important information", accessibleAction: "Important information", journeys: ["talk_to_person"], image: "/ignite/home/family-banner-photo.webp", imageAlt: "A family walking together outdoors" },
  { id: "savings-goal", label: "SAVINGS GOAL", title: "Stay on track and make your dreams a reality", action: "View/manage goals", accessibleAction: "View savings goals", journeys: ["transfer", "paynow", "fixed_deposit"], screen: "plan" },
  { id: "money-insights", label: "MONEY INSIGHTS", title: "Set budgets and see your spending breakdown", action: "Take control", accessibleAction: "Open money insights", journeys: ["view_transactions", "scan_and_pay", "foreign_exchange"], screen: "plan" },
  { id: "invest", label: "INVEST", title: "Check out our products and insights", action: "Start investing", accessibleAction: "Start investing", journeys: ["start_investing"], screen: "invest", image: "/ocbc/invest-art.webp" },
  { id: "goals", label: "GOALS", title: "Save regularly for your needs and wants", action: "Create new goal", accessibleAction: "Create new goal", journeys: ["fixed_deposit"], image: "/ocbc/goal-art.webp" },
  { id: "insure", label: "INSURE", title: "Find policies to fill the gaps in your insurance", action: "Calculate your needs", accessibleAction: "Calculate your needs", journeys: ["talk_to_person"], image: "/ocbc/insure-art.webp" },
];
