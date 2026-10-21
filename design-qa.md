# OCBC clone visual QA

Source: seven supplied screenshots, preserved in `.artifacts/ui-checkpoints/ocbc-clone/references/`.
Implementation: `/mobile`, branch `design/ocbc-reference-clone`; final captures in `.artifacts/ui-checkpoints/ocbc-clone/after-*.png` and `placeholder-contacts/after-*.png`.

Viewport: 390 × 800 CSS pixels. Source screenshots are approximately 920 × 2000; normalization scales to 390 wide and removes 44 pixels of native iOS status chrome. T3 saves a 1280 × 800 host bitmap; comparison boards crop its left 390 × 800 mobile viewport. The phone frame owns device chrome.

Comparison evidence: `home-plan-comparison.png`, `paynow-comparison.png`, and placeholder contact captures. Both full-screen and readable contact/header/card regions were inspected. Boards prior to the final pass retain earlier typography findings; final captures are authoritative.

- Typography: neutral Arial family matches the reference's sans-serif hierarchy; corrected the inherited standard-mode heading rule that enlarged the PayNow title. Native platform font rendering remains a minor difference.
- Layout: Home banner, horizontal categories, account card, Plan cards and five-item bottom navigation follow the source. PayNow's type picker was shortened by 44px, oversized icons corrected, and search input minimum height reset; assertions confirm a 14px title and search under 40px.
- Colors: source red, blue links, white surfaces, warm account panel and dark slate login actions are reproduced.
- Imagery: supplied campaign art, illustrations, logo and icon crops are used. Small raster icons retain source compression; no generated replacement artwork.
- Content: fictional contact names and masked numbers intentionally replace screenshot contacts at the user's request. Balances start at S$256.05; payments remain local practice records. Existing investing and assistance tools remain available.

History: first pass found oversized PayNow raster icons, excessive picker/search spacing, and global heading-style interference. Fixed these and recaptured; placeholder names were subsequently verified on Contacts and the recipient amount screen.

Interaction checks: login, Home/Plan/PayNow navigation, search, empty amount disabled, overdraw rejected, successful S$10 practice payment, receipt and updated Home balance. Browser assertions passed; no broken assets or horizontal overflow. ESLint and production build/TypeScript passed. Console history contains development HMR disconnects from server restarts; final preview runs the production server.

Remaining P3 polish: native font metrics and raster icon sharpness. Real-device and real-bank integrations were not tested. Unavailable external services are identified in the checkpoint README.

final result: passed
