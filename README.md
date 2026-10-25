# OCBC Adaptive Assist

Practice prototype for the OCBC IGNITE 2027 Adaptive Banking track. Figures are fictional. Nothing here moves real money or gives personal financial advice.

## Run

```bash
npm install
npm run dev
```

Open http://localhost:3000. On a laptop the app sits in a centered iPhone frame, with presentation slides on either side. The slides automatically follow the feature or support dialog open in the phone. Narrow screens show the phone alone.

The project includes a Git-ignored `.env` ready for your keys. Add `GROQ_API_KEY` and `ELEVENLABS_API_KEY`, then restart `npm run dev` and refresh the browser. If `.env` is missing in a new checkout, copy `.env.example` to `.env`. Never use `NEXT_PUBLIC_` for provider credentials.

Groq handles banking intent inference and microphone transcription. `GROQ_MODEL` defaults to `openai/gpt-oss-20b`; `GROQ_TRANSCRIPTION_MODEL` defaults to `whisper-large-v3-turbo`. The existing `GROQ_INTENT_MODEL` override is still supported. All microphone controls use `/api/transcribe`, including BankBuddy; voice input needs microphone permission and an internet connection. The transcript is still reviewed before sending in BankBuddy.

ElevenLabs reads Penny's spoken guidance and the existing hear-amount controls through `/api/speech`. A default voice and model are configured, so only the key is required. Optional `ELEVENLABS_VOICE_ID` and `ELEVENLABS_MODEL_ID` let you choose a voice available to your account. Without an ElevenLabs key, or if generation/playback fails, the app uses browser speech where supported. Closing or muting Penny cancels pending audio and playback. Provider accounts need access and credits; adding a key does not bypass their permissions or browser audio policies.

Requests and recordings for inference/transcription go to Groq; text selected for cloud speech goes to ElevenLabs. Keys stay on the server. Without keys, typed requests still use local intent rules and the educational guide remains deterministic; no model response can execute a payment. API setup follows the [Groq documentation](https://console.groq.com/docs/models) and [ElevenLabs speech reference](https://elevenlabs.io/docs/api-reference/text-to-speech/convert).

## Demo path

Every page load starts at login. The first **Log in to OCBC Singapore** press opens setup: guidance mode, text size, optional weekly tokens and help preferences. **Open my bank** or **Set up later** continues to Home. Logging out and in again in the same page session goes straight to Home. Refreshing starts at login and offers setup again on the first login, retaining saved choices, payment drafts and practice records. This per-load gate is held only in memory. Reset demo clears saved demo data and returns to login.

1. Log in, open **Customise**, and change text size or assistance mode. Close the panel to return to Home.
2. Open **Plan → Start investing**, choose whether to receive guidance for this journey, then explore terms, fees, risks, review and explicit process completion. No product, investment amount or allocation is selected.
3. Open **Pay & Transfer**, select a contact, enter `20000`, and tap **Next** to demonstrate recovery. Reduce the amount, review, and confirm a practice payment.
4. Open **More** to try **Accessibility & preferences**, **Ask OCBC Adaptive Assist**, or **Speak to a person**.
5. Side slides explain each feature, its customer benefit, and what to demonstrate next. Closing a support dialog restores the underlying screen's slide; slide changes do not reload the app.

## Demo path: Penny, the proactive companion

1. Tap **Log in as existing customer**, then **Log in to OCBC Singapore**. On Home tap **PayNow**.
2. Wait about 8 seconds without tapping. Penny appears and offers help.
3. Tap **Ask**, then **Speak**, and say "Help me send ten dollars to Mum", or type `pay Mum 10`. Penny picks Mum, fills in the amount and highlights **Next**.
4. Tap **Next**. Penny highlights the **Slide to pay** bar. Drag it, or just tap it, and she confirms on the receipt.
5. Or tap **Yes, guide me** and Penny highlights each step instead: search, amount, Next, Confirm.
6. Try `99999` as the amount. The payment is blocked and Penny explains why right away.

The stuck delay is `STUCK_MS` in `src/lib/companion.ts`.

## Presentation architecture

Keep the entire interactive app demo inside a centered iPhone frame. Use the desktop viewport space to the left and right of the phone as presentation slides: supporting headlines, explanations, and visual highlights that make the demo clear and flashy while the phone remains the focal point.

Treat the surrounding presentation as a separate layer from the app inside the phone, so slide content can change alongside the demo without interrupting app interactions or resetting its state. On narrow screens, prioritize the phone demo and collapse or hide the surrounding slides.

The iframe publishes only its current feature identifier through same-origin window messages. The surrounding page accepts messages only from that iframe and uses local sample copy in `src/lib/demo-slides.ts`. Balances, payment details, and chat content are not sent to the presentation.

## Phase 2: calm home and intent routing

Home retains the saved layout, with Classic as the default for new demo data. **More → Accessibility & preferences → Home layout** switches between Calm and the original Classic home without clearing drafts, payments or plans. Choose Calm for the intent-entry demonstration. **Edit** under the everyday tiles opens the existing action picker.

The **I want to…** field and microphone route into a fixed journey catalogue. Routing only navigates and prefills; reviewing and confirming remain manual. Incomplete requests ask a clarification question with up to three choices. Unknown contacts stay in contact search. Explore offers lists the original promotional content; a journey may invite one dismissible related offer. Calm Home never displays offer cards.

Set `GROQ_API_KEY` on the server to enable live intent classification. The route uses JSON object output, validates the complete response, and falls back to local rules after four seconds or on any failure. Model settings and voice setup are described above.

```bash
npm run typecheck
npm run lint
npm test
npm run build
npm run eval:intent
```

The evaluation loads Next.js environment files and runs the same server router over 40 labelled utterances, printing overall/category accuracy and every miss. It runs independently of the build. A missing key uses rules; live errors also fall back. Its score measures journey classification, not model confidence calibration or slot accuracy.

Scan & Pay and Foreign Exchange retain their demo-only availability: routing opens a clearly labelled placeholder. Offers, transactions, contact data, investing and banker requests are simulated. Fixed-deposit amounts can prefill the existing application; transfer amounts and known recipients prefill the existing payment form. No routing action submits anything.

## Weekly tokens

For presentation, each page load starts the token guide full. Only practice payments made during that run reduce it; earlier transfers remain in account history and balances but do not use the new run's tokens. There is no seeded token spending. Reload to start a fresh token demonstration without clearing saved banking data. This is demo behavior, not a reconciled weekly account statement.

Tokens show a weekly spending budget as something you can see at a glance. 1 token = S$5, so the default S$60 a week is 12 tokens. The Home pill shows how many are left, and tapping it opens a sheet with the spend breakdown and a weekly amount stepper. After a payment the receipt shows how many tokens it used. Tokens are only a guide: they never block a payment or gate any accessibility feature. They can be turned off from Customise or from the sheet. Logic lives in `src/lib/tokens.ts`.
