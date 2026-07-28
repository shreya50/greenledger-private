# GreenLedger Design System

The visual system is available as a self-contained, responsive reference at `greenledger-design-system.html`.

## Foundation

- **Voice:** Calm, evidence-first, and human. The interface helps people make decisions; it does not present automation as authority.
- **Color:** Forest green is the operational foundation. Status colors are intentionally limited to claim lifecycle and risk messages.
- **Typography:** Fraunces (headlines) delivers considered authority. DM Sans (interface and body) remains practical and readable. DM Mono is for facts that benefit from a technical reference treatment: hashes, IDs, evidence citations, volumes, and dates.
- **Spacing:** Use a four-pixel increment system. Default content spacing is 16–24px; section spacing is 48–72px.
- **Shape:** Cards have 16px corners. Controls use 7–8px corners. Status badges are pills.

## Status language

| State | Meaning | Primary treatment |
| --- | --- | --- |
| Eligible | No meaningful matching conflict | Green badge and affirmative next action |
| Needs review | Evidence requires a verifier decision | Gold badge with precise reason |
| Blocked | Duplicate or invalid conflict | Coral badge and a clear explanation |
| Verified | Verifier recorded the approved claim | Teal badge and on-chain reference |
| Retired | Beneficiary completed the lifecycle | Violet badge and certificate link |

Every state must include an icon, a text label, and contextual explanation—never color alone.

## Component rules

- Use a single filled primary button for the principal action on a screen.
- Put source URLs, hashes, page numbers, and IDs in monospace and retain their full value on detail screens.
- Keep irreversible actions, such as verification, rejection, or retirement, visually separated from navigation and require a meaningful confirmation step.
- Prefer persistent, contextual risk summaries to transient toasts for claim-related decisions.
- Use cards to group a single subject (claim, evidence set, decision). Avoid nesting cards more than one level.

## Product patterns included

The reference includes the key visual patterns needed for the first GreenLedger release:

1. Sidebar workspace navigation
2. Claim lifecycle badges and evidence tags
3. Verifier queue with focused case review
4. Structured evidence fields
5. Risk summary with deterministic signals
6. Alert treatment for duplicate serial-range conflicts

## Implementation starting point

Copy the variables in the **Handoff** section of the reference into a global stylesheet, then map them to Tailwind theme variables. Build status components from the semantic state names rather than using raw palette values in product code.
