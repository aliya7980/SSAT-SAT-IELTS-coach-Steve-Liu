# Authentic SAT Practice Suites

The four Reading and Writing sets share the test selector, navigation, two 32-minute modules, per-test saved responses, results layout, teacher tools, and temporary teacher red pen. The suite heading stays the same; each test's individual name remains in the selector and results.

## Public data

Each `data/<test-id>/` contains metadata, 54 questions, and any source/visual manifests. `python3 tools/build-sat-data.py` generates **question-only** browser bundles. It rejects private answer-bearing fields. Real answer keys must never be added to public JSON, JavaScript, test fixtures, source metadata, or documentation.

All grading and teacher answer access now require the authenticated backend. Student result responses contain raw total/module counts and per-question statuses only. No official scaled score is calculated. Student results do not display correct answer letters or answer-revealing explanations.

See [backend setup](../../sat-backend/SETUP.md) for required private hosting, secrets, the preserved private key seed, API URL configuration, Pages publishing settings, migration behavior, and security limitations. Until deployment is configured, client grading fails closed and student responses remain saved.

## Visual assets and source records

Existing question text and source-image folders remain unchanged. Visuals are attached by test/module/question in each test's data. November includes three direct high-resolution crops: Module 1 Q10 (coral-depth table), Module 1 Q12 (grapevine chart), and Module 2 Q11 (honey-bee table). No visual data were reconstructed. Original source PDFs are not published here.

## Temporary teacher ink

Sign in through Teacher on the same mock-test page and select Return to test. Mark enables red freehand strokes; Undo and Clear appear inline only while enabled. Off restores normal test interactions. Drawings are keyed to test/module/question in memory only. Page exit, refresh, close, teacher logout, and authentication expiry clear them. Drawings never enter saved progress, attempts, storage, or server requests. Layers scroll with their content; normalized coordinates scale by region on responsive reflow rather than tracking individual words.

## Validation

Run the Node check scripts listed in the backend setup document. They cover public data/assets, all test flows, security boundaries, legacy storage cleanup, and temporary ink. Tests never contain real answer keys. Use `tools/build-sat-public.py` and the supplied Pages workflow to publish static content only. Browser visual QA and live TLS/CORS verification require the configured deployment and remain outstanding.
