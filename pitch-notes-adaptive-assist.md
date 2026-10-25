# OCBC Adaptive Assist: pitch and demo notes

Working format: a five-minute judging pitch, including a short live demo. This is an assumption, not a confirmed competition rule. Prepared against the local prototype on 25 October 2026. No app files or presentation copy were changed for this brief.

## The idea to land

**Let customers choose the support they need for the task they are doing now.**

One customer can be comfortable sending a payment and want help understanding an unfamiliar investing process. Their identity has not changed. Their task has. Explain the product through that one person, rather than through separate “young” and “old” personas.

Use this as the working problem framing: “How might a banking experience adapt to the customer without making assumptions about the customer?” The handoff identified it as problem statement four. I did not find the original challenge brief in the available project documents, so verify the exact official wording and numbering before putting either on a submitted slide. The README identifies this as a practice prototype for the OCBC IGNITE 2027 Adaptive Banking track.

## Five-minute speaking flow

These are seven presentation beats, not a new deck. The current desktop presentation already places talking points beside the phone and changes them automatically as you navigate. Use its existing screen titles. Give the opening and closing verbally; no separate problem or validation slide currently exists in that screen-driven structure. Do not read all the side-panel text.

### 1. Problem: the same person can need different support — 0:00–0:30

Show the opening login screen without interacting yet. If you later make a standalone pitch deck, this beat would use a simple visual of the same customer doing two different tasks.

Say: “Think of someone who sends money to family every week, but has never worked through an investment application. They may want speed for the payment and an explanation for the investment. Our starting point is that the amount of help someone wants can change with the task. A banking experience should let them express that.”

Transition: “So we built the experience around a choice the customer makes.”

### 2. Proposition: support stays in the customer's hands — 0:30–0:55

Press **Log in to OCBC Singapore** to open setup. Keep the setup side slide, **Set up banking your way**, visible. Point at Standard and Guided.

Say: “OCBC Adaptive Assist lets the customer choose how the app looks and how it helps. They can adjust readability, use everyday language to find a task, and request guidance for a specific journey. We do not need to label this person as a beginner or infer what they need from their age.”

Transition: “Here is the same customer moving through that experience.”

### 3. Start with their preferences — 0:55–1:35

After the first Login press, walk through setup: Standard → a chosen text size → optional tokens → weekly amount if tokens are on → help preferences → **Open my bank** → Home. Use saved selections when rehearsed. The weekly-amount question is omitted when tokens are off, so the flow can have four or five questions. The visible skip control is **Set up later**, which also continues to Home. The latest source implements login first on each load, with a per-load setup gate; verify that sequence in the settled runtime before exporting.

Say: “They start in Standard and choose a text size that feels comfortable. Spending tokens and offers of help are optional, and setup can be postponed. These are preferences they can revisit. After login, our Calm Home brings the balance, chosen everyday actions and the ‘I want to’ entry together. Offers are available through a separate entry.”

Transition: “For a familiar task, they can get straight to the details.”

### 4. Familiar task: prepare a payment, then let the customer check — 1:35–2:40

On Calm Home type **pay Mum 10** in **I want to…**, then press Go. Show the prefilled recipient and amount, Next, review, and the practice confirmation control. The side slides follow **Check before you send → One more look. Your choice → A clear finish to the task** if you complete the simulation. Return Home afterward.

Say: “They type ‘pay Mum 10’. The prototype finds a supported journey and prepares the details. Here are the recipient and amount. The request has not sent anything. The customer still checks the review and explicitly confirms. If they want support, Penny is available. An optional pause-based offer of help is also implemented, but a pause is only a prompt to offer help, not proof that somebody is confused.”

If completing it, add: “This receipt records a fictional practice payment. No bank is contacted and no real money moves.”

Transition: “Now the same person moves to a task they are less familiar with.”

### 5. New task: choose guidance for this journey — 2:40–3:40

Open **Plan → Start investing**. Show **How would you like to continue?**, then select **Guide me through this**. Show the opening process screen and **Key terms**. Point out the current-step explanation and **Talk to a person**. The side slide is **Understand it. Then decide.** Do not spend the minute clicking through all six steps.

Say: “This time they choose ‘Guide me through this’. The screen explicitly says that the choice applies to this journey only. Their overall preference stays Standard. The prototype explains the process, key terms, fees and risks, and keeps a person within reach. It does not select an investment, amount or allocation. The customer can understand the process before making any real financial decision.”

Transition: “That task-level choice is the central distinction in our concept.”

### 6. Why it matters, and what must be validated — 3:40–4:25

Leave the guidance-choice or process screen visible. For a future standalone slide, show “Customer chooses → Task gets support → Customer reviews” with an explicit “To validate” note. Do not claim novelty across the banking market without a competitor review.

Say: “The contribution is the way these controls work together: a calmer starting point, a request in everyday language, and support chosen for the task. Our hypothesis is that this can make unfamiliar tasks easier to understand while keeping familiar tasks efficient. We have built the interaction prototype. We have not yet demonstrated improved customer outcomes. Next, we would compare task completion, errors, understanding and perceived control against a fixed interface, with customers who want different levels of support.”

Transition: “The result we want to test is simple.”

### 7. Close with the customer's control — 4:25–5:00

Stay on the moment that says the journey choice leaves preferences unchanged. If convenient, open the human-support route, but do not start another full flow.

Say: “Our goal is banking where the customer can say, ‘I know this task’, or ‘Help me through this one’, and the experience responds. We are proposing a focused next step: test this payment-to-learning journey and find out whether it improves understanding without adding unnecessary friction. OCBC Adaptive Assist adapts the support to the task, while leaving the decision with the customer.”

## Rehearsal and demo handling

Use a wide desktop window at the local demo URL so the phone and surrounding talking points are visible. Narrow screens hide the presentation layer. The panels follow app state automatically; they are not a manually advancing slide deck. Opening preferences or a support dialog changes the panel, and closing it returns to the underlying story.

Check Home layout before presenting. Saved preferences can open **Classic**, even though the new default is Calm. Use **More → Accessibility & preferences → Home layout → Calm** if necessary. Standard is the clearest starting mode for demonstrating the later per-journey choice. Check that **Plan → Start investing** opens an unfinished journey and its choice gate. An already completed investing process can show its completion screen instead; **Read the process again** restarts that process. Avoid resetting the entire demo unless its existing practice records are disposable.

The latest source resets the per-load setup gate on refresh: login appears first, and the first Login press opens setup with saved choices. Refresh retains practice state and is not a clean data reset. Do not promise a particular balance, token count or empty transaction list. Those depend on saved activity. Practice confirmations change local demo records. Prefer one rehearsed small payment and check the balance before presenting.

## Explicit slide-to-screen export map

This is the capture order for the separate export workstream. Use actual rendered pages at **http://localhost:3000/** for the phone plus existing side panels. **/mobile** is the phone content only. App screens use in-app state, not separate URLs. Capture with consistent viewport dimensions, framing and readable scale. The seven speaking beats above remain the main pitch; lettered captures below are additional states within a beat, not extra speaking sections.

| Export filename | Pitch beat | Actual page state / how to reach it | Presentation panel key | Purpose |
| --- | --- | --- | --- | --- |
| 01-problem-login.png | 1 · Problem | Fresh load at login; do not press Login yet | welcome | Familiar banking starting point while explaining different needs across tasks. |
| 02-customer-choice.png | 2 · Proposition | First Login press → setup, guidance question; show Standard and Guided | setup | Customer chooses support. |
| 03a-readability.png | 3 · Preferences | Setup → text size question; choose a readable sample size | setup | Readability choice. |
| 03b-calm-home.png | 3 · Starting experience | Finish or skip setup → Home; ensure Calm layout and Standard global mode | home | Balance, everyday actions and intent entry. |
| 04a-payment-request.png | 4 · Familiar task | Calm Home with **pay Mum 10** typed, before Go | home | Everyday-language intent. |
| 04b-payment-details.png | 4 · Familiar task | Go → resolved Mum recipient and S$10 amount | amount | Routing prepares a draft, not a payment. |
| 04c-payment-review.png | 4 · Customer checks | Next → Review payment; stop before confirmation | review | Explicit review and final decision. |
| 04d-payment-receipt.png | 4 · Optional completion | Confirm the fictional practice payment, if demo records are available for this purpose | receipt | Clear result. Optional; omit if preserving practice records. |
| 05a-journey-choice.png | 5 · Unfamiliar task | Home → Plan → Start investing; capture guidance choice before selecting | invest | The key claim: journey-only choice leaves overall preferences unchanged. |
| 05b-guided-terms.png | 5 · Help for this task | Choose **Guide me through this** → opening process → Continue → Key terms | invest | Plain-language process explanation and current-step highlight. |
| 06-validation-context.png | 6 · Contribution / validation | Reuse the captured journey-choice screen or guided-terms screen | invest | This is visual context only. Validation claims must come from the spoken notes or separately authored presentation text; no validation page exists in the app. |
| 07-customer-control.png | 7 · Closing | Reuse **05a-journey-choice.png** | invest | Close on the customer choosing help. No separate closing page exists. |

Capture the guidance-choice state before entering the process: an unfinished journey asks again on re-entry, but a completed journey may open its completion screen. Use **Read the process again** if needed and authorized for that practice state. Capture completed/review states through real navigation rather than fabricated overlays. If a screen is blocked or a service unavailable, report that rather than presenting a generated replacement as an actual page. The opening login/setup sequence above is source-checked after the latest correction; the export chat should verify it live.

**Optional future-feature appendix, outside the seven-slide implemented-demo flow:** “See what changes” remains a proposed feature. The latest approved visual direction has three focal points: recipient and payment amount, the after-payment account balance, and confirmation. Weekly spending details are collapsed. The refined image is at **C:\Users\kandy\.codex\generated_images\01a171f8-7f16-7b83-ba17-9b5a51206ae5\exec-bb692e72-e8ae-4bb2-abf5-b2e168680d35.png**. Label it **Concept — not implemented** if included. It is a generated mockup, not a captured page, and must not replace **04c-payment-review.png**. It needs no slot in the main pitch until implementation or a deliberate concept discussion is requested.

Type the request for the main pitch. Voice is an optional extension requiring microphone permission, transcription configuration and internet access. If intent routing fails, open PayNow directly and select the sample contact. This still demonstrates the central control and review flow. If the live site fails, use captured screens of setup, Calm Home, payment review and journey guidance. Do not describe a fallback screenshot as live behavior.

An excessive-payment recovery is a useful Q&A demonstration, but omitting it keeps the main pitch coherent. Enter an amount above the displayed available balance or demo limit, read the actual error, then correct it. Never describe this as fraud detection or a bank-grade risk system.

Tokens are optional supporting detail. If asked, explain that one token represents S$5 of the customer's chosen weekly guide. They are not rewards, cryptocurrency, a separate balance, or a permission system. They do not block payments or unlock accessibility. Do not frame them as proven to improve budgeting. The current weekly breakdown includes seeded sample spending as well as practice payments, so it is not evidence of comprehensive account reconciliation.

## What to know for questions

**“What actually adapts?”** Readability, Home layout and available help preferences are customer-controlled. Supported investing and fixed-deposit journeys separately ask whether guidance is wanted for that visit. Payment support can respond to the current screen or a validation problem. Do not say the system learns a permanent ability score.

**“Isn't this just accessibility settings or a chatbot?”** The pitch contribution is the combination: preferences shape presentation, everyday-language entry prepares a supported task, and journey-specific guidance leaves the customer's overall settings unchanged. Penny is one access point to help. Avoid claiming no bank has comparable features.

**“Where is the AI?”** The server intent router can use a configured language model to select from a fixed journey catalogue and extract explicitly stated details. It validates the response and falls back to local rules on failure or timeout. Voice transcription is a separate configured service. The general assistance replies and much of Penny's behavior are scripted or rule-based. The live rehearsal does not establish which routing path answered a particular request. Do not call the whole prototype a live autonomous banking agent.

**“What if it misunderstands?”** The implementation includes clarification paths and unknown-contact handling, and it only navigates or prefills. The customer still reviews and confirms. These are prototype safeguards, not a completed safety or security assurance. Further evaluation should include incorrect recipients, ambiguous amounts, unsupported requests, accents and language variation.

**“Who is this for?”** Customers with different task familiarity, reading preferences and desired support. Recruit based on those needs and include relevant accessibility needs. Do not equate age with ability. The current prototype is not proof that the design works for every customer.

**“Does pausing mean the customer needs help?”** No. The demo uses an approximately eight-second pause on supported payment screens to offer help when that preference is enabled. Customers can decline. The trigger and wording need testing for annoyance, timing and perceived judgement.

**“How will you measure success?”** Propose a comparison where participants perform a familiar payment and an unfamiliar process, with task order varied. Measure correct completion, errors and recovery, time, comprehension of key consequences, perceived control, and unwanted help prompts. Include people who decline guidance. Do not quote a percentage improvement or claim statistically supported results before testing.

**“What would OCBC need to implement it?”** The proposed pilot would begin with one bounded journey and bank-approved content, then evaluate it with customers. Production would require real authentication and authorization, transaction APIs, recipient verification, accessibility testing, security review, consent and data-governance decisions, and a genuine human-support workflow. None of those integrations is demonstrated here.

**“What is saved, and is it private?”** Practice preferences and progress are stored on the current device/browser. This is not a production customer-data architecture. Configured voice and intent services can receive submitted audio or request text. Do not claim all processing stays on-device or that no data leaves the browser. Human-support requests are local simulations and do not cause a callback.

## Two-minute cut

Spend 20 seconds on the familiar-task/unfamiliar-task problem and proposition, 15 seconds showing customer preferences and Calm Home, 35 seconds on **pay Mum 10 → review**, 30 seconds on **Start investing → Guide me through this**, and 20 seconds on the untested hypothesis and closing. Skip voice, tokens, recovery, practice-payment completion and the full learning sequence. Keep the line: “The same customer chooses different support for a different task.”

## Evidence and limits of this briefing

Sources inspected: README.md; src/lib/demo-slides.ts; src/components/onboarding.tsx; src/components/journey-guidance.tsx; src/components/invest.tsx; relevant portions of src/components/ocbc-app.tsx and src/lib/store.tsx; src/lib/companion.ts; src/lib/intent-server.ts; src/lib/tokens.ts; and docs/superpowers/plans/2026-10-23-phase-three.md. The current README still contains an older investing walkthrough mentioning Pool/Risk/Mix and a monthly amount. The present implementation is a process-only flow with no product, amount or allocation selection, which is what these notes describe. Some peripheral promotional copy also retains older wording and should not be repeated as a capability claim.

Live inspection in this briefing observed setup, login, Classic-to-Calm switching, customer preference controls, typed payment intent producing Mum and S$10, and the payment review screen. Concurrent animation edits briefly caused a missing-module development overlay during review. The preview subsequently recovered, and browser inspection verified Plan → Start investing → the per-journey guidance choice → the opening process screen → plain-language Key terms with a highlighted Continue control. This was a representative walkthrough, not a fresh end-to-end test of every journey or payment completion. Rehearse against the settled build before presenting. No original challenge brief, confirmed pitch duration, customer-research evidence, production integration proof or validated impact metrics was available in the inspected material.
