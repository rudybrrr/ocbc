export type Mode = "standard" | "guided";
export type TextSize = "default" | "large" | "largest";
export type Screen = "home" | "move" | "invest" | "activity";
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
  | { label: string; type: "person" }
  | { label: string; type: "prefs" };

export type ChatMessage = {
  id: string;
  role: "user" | "assistant";
  text: string;
  actions?: ChatAction[];
};

export type BankerRequest = {
  id: string;
  when: "Morning" | "Afternoon" | "Evening";
  topic: string;
  at: string;
};

export type Preferences = {
  onboarded: boolean;
  mode: Mode;
  textSize: TextSize;
  plainLanguage: boolean;
  offerPerson: boolean;
  readAmounts: boolean;
};

export type InvestState = {
  step: number;
  monthly: 50 | 100 | 200 | null;
  done: boolean;
};

export type Snapshot = Preferences & {
  screen: Screen;
  helpOpen: boolean;
  invest: InvestState;
  transfers: Transfer[];
  messages: ChatMessage[];
  draft: Draft;
  lastIssue: string | null;
  bankerRequests: BankerRequest[];
};
