# OCBC Adaptive Assist

Practice prototype for the OCBC IGNITE 2027 Adaptive Banking track. Figures are fictional. Nothing here moves real money or gives personal financial advice.

## Run

```bash
npm install
npm run dev
```

Open http://localhost:3000. The app runs inside a phone frame.

Voice uses Groq Whisper for transcription. Put your key in `.env` as `GROQ_API_KEY=...`, then restart `npm run dev`. The browser records the mic and stops on its own after a short silence. The clip goes to `/api/transcribe`, which calls Groq on the server, so the key never reaches the browser. Voice needs microphone permission and an internet connection. Typing works without either.

## Demo path: Penny, the proactive companion

1. Tap **Log in as existing customer**, then **Log in to OCBC Singapore**. On Home tap **PayNow**.
2. Wait about 8 seconds without tapping. Penny appears and offers help.
3. Tap **Speak** and say "Help me send ten dollars to Mum", or type `pay Mum 10`. Penny picks Mum, fills in the amount and highlights **Next**.
4. Tap **Next**. Penny highlights **Confirm practice payment**. Tap it and she confirms on the receipt.
5. Or tap **Yes, guide me** and Penny highlights each step instead: search, amount, Next, Confirm.
6. Try `99999` as the amount. The payment is blocked and Penny explains why right away.

The stuck delay is `STUCK_MS` in `src/lib/companion.ts`.
