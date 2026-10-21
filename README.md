# OCBC Adaptive Assist

Practice prototype for the OCBC IGNITE 2027 Adaptive Banking track. Figures are fictional. Nothing here moves real money or gives personal financial advice.

## Run

```bash
npm install
npm run dev
```

Open http://localhost:3000. On a laptop the app sits in a centered iPhone frame, with presentation slides on either side. The slides automatically follow the feature or support dialog open in the phone. Narrow screens show the phone alone.

## Demo path

1. Log in, open **Customise**, and change text size or assistance mode. Close the panel to return to Home.
2. Open **Plan → Start investing** to explore Pool, Risk, Mix, and Plan, then save a practice monthly amount.
3. Open **Pay & Transfer**, select a contact, enter `20000`, and tap **Next** to demonstrate recovery. Reduce the amount, review, and confirm a practice payment.
4. Open **More** to try **Accessibility & preferences**, **Ask OCBC Adaptive Assist**, or **Speak to a person**.
5. Side slides explain each feature, its customer benefit, and what to demonstrate next. Closing a support dialog restores the underlying screen's slide; slide changes do not reload the app.

## Presentation architecture

Keep the entire interactive app demo inside a centered iPhone frame. Use the desktop viewport space to the left and right of the phone as presentation slides: supporting headlines, explanations, and visual highlights that make the demo clear and flashy while the phone remains the focal point.

Treat the surrounding presentation as a separate layer from the app inside the phone, so slide content can change alongside the demo without interrupting app interactions or resetting its state. On narrow screens, prioritize the phone demo and collapse or hide the surrounding slides.

The iframe publishes only its current feature identifier through same-origin window messages. The surrounding page accepts messages only from that iframe and uses local sample copy in `src/lib/demo-slides.ts`. Balances, payment details, and chat content are not sent to the presentation.
