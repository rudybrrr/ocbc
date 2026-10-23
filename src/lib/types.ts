export type Mode = "standard" | "guided";
export type TextSize = "default" | "large" | "largest";
export type Screen =
  | "welcome" | "login" | "onboarding"
  | "home" | "plan" | "move" | "amount" | "review" | "receipt"
  | "invest" | "activity" | "fixed-deposit" | "rewards" | "more"
  | "explore" | "scan-pay" | "foreign-exchange";

export const EVERYDAY_ACTIONS = [
  ["paynow", "PayNow"],
  ["scan-pay", "Scan & Pay"],
  ["transfer", "Transfer"],
  ["foreign-exchange", "Foreign Exchange"],
  ["fixed-deposit", "Fixed Deposit"],
  ["invest", "Invest"],
] as const;
export type EverydayAction = (typeof EVERYDAY_ACTIONS)[number][0];
export type AccountId = "everyday" | "savings";
export type DestinationId =
  | "everyday"
  | "savings"
  | "mum"
  | "fairprice"
  | "alicia"
  | "amanda"
  | "aqil"
  | "arc"
  | "aren"
  | "ashneel1"
  | "ashneel2"
  | "asther";

export type Draft = {
  from: AccountId;
  to: DestinationId;
  amount: string;
  note: string;
};

export type Transfer = {
  id: string;
  from: AccountId;
  to: DestinationId;
  amount: number;
  note: string;
  at: string;
};

export type ChatAction =
  | { label: string; type: "ask"; query: string }
  | { label: string; type: "screen"; screen: Screen }
  | { label: string; type: "navigate"; actionId: "fixed_deposit.start" }
  | { label: string; type: "person" }
  | { label: string; type: "prefs" };

export type ChatTopic = "fixed-deposit";

export type ChatMessage = {
  id: string;
  role: "user" | "assistant";
  text: string;
  actions?: ChatAction[];
  topic?: ChatTopic;
};

export type BankerRequest = {
  id: string;
  when: "Morning" | "Afternoon" | "Evening";
  topic: string;
  at: string;
};

export type Preferences = {
  homeLayout: "calm" | "classic";
  onboarded: boolean;
  mode: Mode;
  textSize: TextSize;
  plainLanguage: boolean;
  offerPerson: boolean;
  readAmounts: boolean;
  everydayActions: EverydayAction[];
  idleHelp: boolean;
};

export type InvestState = {
  step: number;
  monthly: 50 | 100 | 200 | null;
  done: boolean;
};

export type FixedDepositState = {
  step: number;
  amount: string;
  tenor: string;
  account: AccountId;
  reference: string;
};

export type Snapshot = Preferences & {
  screen: Screen;
  helpOpen: boolean;
  invest: InvestState;
  fixedDeposit: FixedDepositState;
  transfers: Transfer[];
  messages: ChatMessage[];
  draft: Draft;
  lastIssue: string | null;
  bankerRequests: BankerRequest[];
};
