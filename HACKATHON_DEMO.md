# GreenLedger 3–5 minute demo script

## 0:00–0:25 — The problem

“Carbon-credit data is fragmented across registries. That creates a double-counting risk and leaves verifiers without one evidence-first workflow. GreenLedger helps a verifier inspect public evidence, detect conflicts, and leave an auditable record of a human decision.”

Show the Integrity Dashboard. Point out the distinction between eligible, review, and blocked states.

## 0:25–1:15 — Evidence and provenance

Open Evidence Intake. Choose **Katingan duplicate**, then extract the public record.

“Every submission begins with a public source. GreenLedger records a source fingerprint, structured identity fields, and citations. In production, our PDF extractor downloads only HTTPS sources, hashes the actual bytes, and requires page citations for the project identity fields.”

Call out the fixture label: “For this hackathon, the project metadata is sourced from the public Verra record. The `GL-DEMO` serial fixture is synthetic and visibly labelled; we do not represent it as an issued registry unit.”

## 1:15–2:00 — Duplicate prevention

Screen the duplicate scenario.

“The canonical key is a hash of registry, project ID, serial start, and serial end. An exact match is blocked immediately. This is deterministic logic—not an AI guess—and it prevents a second GreenLedger attestation for the same claim.”

Switch to **Katingan review**.

“Here the real project metadata overlaps but the synthetic serial fixture differs. GreenLedger does not auto-approve; it routes the case to a verifier.”

## 2:00–2:45 — Human decision and lifecycle

Choose **Karnataka Community Solar Demonstration**, screen it, and open the Verifier Queue.

“The matching engine made this claim eligible. It did not approve it. Only the verifier role can record a decision. The beneficiary role can retire an active claim afterward.”

Verify the eligible fixture and show the certificate. Retire it.

“The current build writes this lifecycle to PostgreSQL. The endpoint boundary is ready for a later Polygon transaction, but we do not claim an on-chain transaction until one is actually submitted.”

## 2:45–3:30 — Integrity and integrations

Show `ARCHITECTURE.md`.

“The adapter runs from a labelled snapshot today and switches to CAD Trust’s API once credentials are configured. Our data provenance keeps real metadata separate from synthetic test fixtures. The backend also uses environment-only secrets, role checks, and a PostgreSQL audit trail.”

## 3:30–4:00 — Close

“GreenLedger does not mint, tokenize, or replace official registry credits. It adds an evidence-first integrity layer around registry-issued credits—so verifiers can prevent duplicate attestations and beneficiaries can show a clear retirement trail.”
