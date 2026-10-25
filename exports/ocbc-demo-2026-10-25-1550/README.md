# OCBC demo screen export

Captured 25 October 2026 from the running local app at http://localhost:3000/. All pages use the existing presentation layout, at 1600 x 900 (16:9), with no browser chrome.

Open [PowerPoint](deliverables/ocbc-demo.pptx) for 11 slides with brief speaker notes, or [PDF](ocbc-demo.pdf) for the same 11 static pages. The png folder contains the ordered image source of truth. [PNG ZIP](ocbc-demo-pngs.zip) contains those images plus this index and the manifest.

| Slide | Pitch beat | PNG | Actual state |
| --- | --- | --- | --- |
| 1 | 1 - Problem | [01-problem-login.png](png/01-problem-login.png) | Fresh login |
| 2 | 2 - Customer control | [02-customer-choice.png](png/02-customer-choice.png) | Setup: Standard selected |
| 3 | 3 - Preferences | [03a-readability.png](png/03a-readability.png) | Setup: text size |
| 4 | 3 - Calm Home | [03b-calm-home.png](png/03b-calm-home.png) | Home after Set up later |
| 5 | 4 - Familiar task | [04a-payment-request.png](png/04a-payment-request.png) | Home: pay Mum 10 typed |
| 6 | 4 - Payment draft | [04b-payment-details.png](png/04b-payment-details.png) | Mum and S$10 resolved |
| 7 | 4 - Customer review | [04c-payment-review.png](png/04c-payment-review.png) | Review payment before confirmation |
| 8 | 5 - Unfamiliar task | [05a-journey-choice.png](png/05a-journey-choice.png) | Invest: guidance choice |
| 9 | 5 - Help for this task | [05b-guided-terms.png](png/05b-guided-terms.png) | Invest: Key terms, step 2 of 6 |
| 10 | 6 - Contribution and validation | [06-validation-context.png](png/06-validation-context.png) | Reused journey-choice capture |
| 11 | 7 - Closing | [07-customer-control.png](png/07-customer-control.png) | Reused journey-choice capture |

The seven speaking beats expand into 11 screen captures. Beats 6 and 7 intentionally reuse the journey-choice capture: the app has no standalone validation or closing page. Use the notes in the PowerPoint or the project pitch brief for the spoken argument.

Login was observed first on the fresh load. Its first Login press opened setup. Set up later opened Calm Home. Saved preferences and banking records were not cleared. The export preserves the saved Default text size and Standard global assistance mode. The walkthrough selected journey guidance and advanced local learning progress to Key terms; no payment confirmation or banking transaction was performed.

The screenshot-based PowerPoint is editable as slide images and notes, not as individual UI elements. PDF and PNG are static; animations, voice, and interactions do not play. The optional receipt is omitted to preserve practice transactions. The generated See what changes concept is excluded because it is not implemented.

Capture QA: the optional helper bubble was dismissed and slide 6 recaptured so Next is visible. The existing closed Penny control slightly overlaps the practice disclaimer on slide 7; this is present in the actual app and has been preserved rather than retouched. Amount, recipient, account and confirmation control remain readable. Home is shown in two real scroll positions: essentials first, then the typed intent entry.

Validation: all 11 image dimensions and PDF pages checked; every rendered presentation slide visually inspected; PPTX package, geometry and first-party re-import checks pass with 11 slides. PowerPoint desktop was not used to inspect the file.

Source flow: ../../pitch-notes-adaptive-assist.md. Main captures follow its explicit slide-to-screen map.
