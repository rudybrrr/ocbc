<!-- BEGIN:nextjs-agent-rules -->

## This is NOT the Next.js you know

This version has breaking changes — APIs, conventions, and file structure may all differ from your training data. Read the relevant guide in `node_modules/next/dist/docs/` (resolved from this file's directory; in monorepos the `next` package may not be visible from the repo root) before writing any code. Heed deprecation notices.

This block is written and re-added by `next dev` — verify at `node_modules/next/dist/server/lib/generate-agent-files.js`. Removing it from a diff only re-creates the uncommitted change; committing it with your work keeps the tree clean.

<!-- END:nextjs-agent-rules -->

## UI design: less is more

Use minimal, plain-language copy and generous whitespace. Aim for a senior customer to understand each setup screen and its next action in roughly 5–10 seconds; this is a design target to validate with people, never a timeout or automatic advance.

Give each screen one clear purpose and one prominent next action. Ask only for choices that matter at that point; reveal extra options when needed. Prefer a short heading and brief labels over paragraphs, repeated explanations, jargon, or promotional copy. Keep essential information about money, consent, and consequences clear.

Make text comfortably large, controls easy to tap, and selections obvious. Preserve keyboard focus, accessible labels, contrast, text enlargement, and reduced-motion support. Never infer support needs from age or other personal characteristics.

Use Apple's Human Interface Guidelines as a reference for clarity, hierarchy, and breathing room. Use meaningful illustrations or visual previews to explain a choice when they reduce reading. Image generation is authorized for useful assets; use code-native SVG/CSS for simple interface previews. Avoid decorative clutter, text embedded in images, or imagery that replaces necessary labels.
