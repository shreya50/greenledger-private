# Demo-data provenance

## What is real

The Katingan project metadata in `data/demo-projects.json` is curated from Verra's public registry page for **VCS Project 1477, Katingan Peatland Restoration and Conservation Project**. The record's registry, project ID, and project name are preserved in the source material.

- Registry source: <https://registry.verra.org/app/projectDetail/VCS/1477>
- Supporting public monitoring-report source: <https://www.kmp.catalyze.id/uploads/default/modular/MONIT_REP_1477_01NOV2015_TO_31DEC2016.pdf>
- Snapshot captured: 28 July 2026

The integration boundary is intentionally shaped for CAD Trust. CAD Trust provides harmonised metadata through its Service Layer/API, while a configured connection is not present in this prototype.

- CAD Trust Service Layer: <https://climateactiondata.org/service-layer/>
- CAD Trust Data Model 2.0 API announcement: <https://climateactiondata.org/cad-trust-launches-data-model-2-0-public-api-documentation/>

## What is synthetic—and why

Public project pages do not by themselves establish a unit serial range, ownership, or retirement state. The serial ranges prefixed `GL-DEMO-` are therefore **synthetic test fixtures**. They enable the exact-duplicate and review branches without falsely representing registry-issued units.

The `eligible-fixture` scenario is also explicitly synthetic. It demonstrates a complete GreenLedger lifecycle (eligible → verified → retired) without claiming that a real registry issued or retired those units.

## Runtime data

`data/initial-claims.json` is immutable seed data. When a verifier approves or a beneficiary retires a demo claim, the server creates `data/runtime-claims.json`. That file is local-only and is ignored by Git.

## Replace for production

Before presenting results as real claim integrity checks, replace the curated snapshot with a credentialed CAD Trust adapter and use registry-authoritative evidence and unit data. Keep the fixture labels and guardrails until then.
