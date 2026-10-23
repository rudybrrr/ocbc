# Phase Three Implementation Plan

**Goal:** Process-only investing and fixed-deposit journeys with temporary, customer-selected guidance.

**Architecture:** Store guidance outside the persisted snapshot. Persist process progress in the existing store. Gate both journey screens with one choice component, so tiles, intent, Explore and assistant routes share the same behavior. Reuse existing buttons, person dialog and guide highlighting.

**Constraints:** No dependencies; preserve transfer behavior and existing data-guide values; never choose or recommend products, amounts, allocations or tenors; retain explicit confirmation; preserve existing workspace edits.

## Files
- Modify `src/lib/types.ts`, `src/lib/store.tsx`: FD progress, temporary guidance, exit confirmation, completion and migration.
- Create `src/components/journey-guidance.tsx`: per-task choice and shared person/exit controls.
- Modify `src/components/invest.tsx`: six saved process steps, no mix or amount selection, review disclaimer and explicit confirmation.
- Create `src/lib/fixed-deposit-data.ts`; modify `src/components/fixed-deposit.tsx`: typed illustrative terms, five guided steps, no default tenor, saved draft and validation.
- Modify `src/components/ocbc-app.tsx`: gate entry points, supply companion journey state, preserve intent amount.
- Modify `src/lib/companion.ts`, `src/lib/use-companion.ts`, `src/app/globals.css`: current-step targets restricted to guided journeys.
- Modify `src/lib/assistant.ts`, `src/lib/demo-slides.ts`: remove stale mix/amount suggestions.
- Create `tests/phase-three.test.mjs`; extract existing harness into `tests/helpers/harness.mjs` and update `tests/phase-one.test.mjs` if needed.

## Execution
1. Save before screenshots at /mobile, 390×844. Record starting commit and dirty workspace.
2. Add failing lifecycle, selection, displayed-value, confirmation and target tests using the existing dependency-free harness.
3. Implement state, flows and companion integration. Run focused tests.
4. Verify browser entry, exit/cancel/resume, person dialog and completion. Save matching after screenshots.
5. Run npm run typecheck, npm run lint, npm test and npm run build. Review only this task's changes against the pre-existing patch.

## Review focus
- Declining guidance must override a global guided preference without changing it.
- Cancelled exits retain both guidance and progress; confirmed exits reset only guidance.
- Re-entering/reloading asks again and retains entered values and current step.
- Missing/invalid tenor and out-of-range amounts cannot reach completion.
- Existing saved investing amounts remain in storage but must never become a recommendation in the new process.

User explicitly requested plan then implementation in this session; implement inline without approval pause or delegation. No commits requested.

## Completed
- Per-journey choice and saved process state implemented inline.
- Eight new regression tests cover lifecycle, confirmation, FD data, empty selections, all targets, shared entry gate and transfer-guide isolation; total suite 28/28.
- Browser verified person dialog, exit cancellation/confirmation, resume, both explicit completions and guidance reset with global mode unchanged.
- Matching screenshots and reconstruction notes: `.artifacts/ui-checkpoints/phase-three/`.
- Typecheck, lint, tests, production build and diff whitespace check passed. No dependencies or commits added.
