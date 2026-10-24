# OCBC Adaptive Assist

Practice prototype for the OCBC IGNITE 2027 Adaptive Banking track. Figures are fictional. Nothing here moves real money or gives personal financial advice.

## Run

```bash
npm install
npm run dev
```

Open http://localhost:3000. On a laptop the app sits in a centered iPhone frame, with presentation slides on either side. The slides automatically follow the feature or support dialog open in the phone. Narrow screens show the phone alone.

Voice uses Groq Whisper for transcription. Put your key in `.env` as `GROQ_API_KEY=...`, then restart `npm run dev`. The browser records the mic and stops on its own after a short silence. The clip goes to `/api/transcribe`, which calls Groq on the server, so the key never reaches the browser. Voice needs microphone permission and an internet connection. Typing works without either.

## Demo path

1. Log in, open **Customise**, and change text size or assistance mode. Close the panel to return to Home.
2. Open **Plan → Start investing** to explore Pool, Risk, Mix, and Plan, then save a practice monthly amount.
3. Open **Pay & Transfer**, select a contact, enter `20000`, and tap **Next** to demonstrate recovery. Reduce the amount, review, and confirm a practice payment.
4. Open **More** to try **Accessibility & preferences**, **Ask OCBC Adaptive Assist**, or **Speak to a person**.
5. Side slides explain each feature, its customer benefit, and what to demonstrate next. Closing a support dialog restores the underlying screen's slide; slide changes do not reload the app.

## Demo path: Penny, the proactive companion

1. Tap **Log in as existing customer**, then **Log in to OCBC Singapore**. On Home tap **PayNow**.
2. Wait about 8 seconds without tapping. Penny appears and offers help.
3. Tap **Ask**, then **Speak**, and say "Help me send ten dollars to Mum", or type `pay Mum 10`. Penny picks Mum, fills in the amount and highlights **Next**.
4. Tap **Next**. Penny highlights **Confirm practice payment**. Tap it and she confirms on the receipt.
5. Or tap **Yes, guide me** and Penny highlights each step instead: search, amount, Next, Confirm.
6. Try `99999` as the amount. The payment is blocked and Penny explains why right away.

The stuck delay is `STUCK_MS` in `src/lib/companion.ts`.

## Presentation architecture

Keep the entire interactive app demo inside a centered iPhone frame. Use the desktop viewport space to the left and right of the phone as presentation slides: supporting headlines, explanations, and visual highlights that make the demo clear and flashy while the phone remains the focal point.

Treat the surrounding presentation as a separate layer from the app inside the phone, so slide content can change alongside the demo without interrupting app interactions or resetting its state. On narrow screens, prioritize the phone demo and collapse or hide the surrounding slides.

The iframe publishes only its current feature identifier through same-origin window messages. The surrounding page accepts messages only from that iframe and uses local sample copy in `src/lib/demo-slides.ts`. Balances, payment details, and chat content are not sent to the presentation.

## Phase 2: calm home and intent routing

After setup, Home defaults to **Calm**. Legacy saved preferences migrate to Calm without clearing drafts, payments, or plans. **More → Accessibility & preferences → Home layout** switches between Calm and the original Classic home. **Edit** under the everyday tiles opens the existing action picker.

The **I want to…** field and microphone route into a fixed journey catalogue. Routing only navigates and prefills; reviewing and confirming remain manual. Incomplete requests ask a clarification question with up to three choices. Unknown contacts stay in contact search. Explore offers lists the original promotional content; a journey may invite one dismissible related offer. Calm Home never displays offer cards.

Set `GROQ_API_KEY` on the server to enable live intent classification. Optional `GROQ_INTENT_MODEL` overrides the default `llama-3.3-70b-versatile` (listed in [Groq's supported production models](https://console.groq.com/docs/models)). The route uses JSON object output, validates the complete response, and falls back to local rules after four seconds or on any failure. Typing works without a key; microphone transcription still needs the existing Groq Whisper setup. Do not use a `NEXT_PUBLIC_` key.

```bash
npm run typecheck
npm run lint
npm test
npm run build
npm run eval:intent
```

The evaluation loads Next.js environment files and runs the same server router over 40 labelled utterances, printing overall/category accuracy and every miss. It runs independently of the build. A missing key uses rules; live errors also fall back. Its score measures journey classification, not model confidence calibration or slot accuracy.

Scan & Pay and Foreign Exchange retain their demo-only availability: routing opens a clearly labelled placeholder. Offers, transactions, contact data, investing and banker requests are simulated. Fixed-deposit amounts can prefill the existing application; transfer amounts and known recipients prefill the existing payment form. No routing action submits anything.
