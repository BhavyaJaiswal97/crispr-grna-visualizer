<!-- Paste this block into README.md, after the "Key Features / Goals" section. -->

## Software Design

The backend is organised in layers (`api → services → core`) around a framework-free domain core, so
PAM detection and scoring can be unit-tested without a server, database or container. The two most
volatile parts of the problem sit behind abstractions — `Nuclease` (SpCas9 today, Cas12a next) and
`ScoringStrategy` (MIT specificity, Doench efficiency) — which means new CRISPR systems and scoring
models are added, not edited in. Redis sits in front of PostgreSQL as a cache-aside layer keyed by
`sha256(sequence + nuclease)` so repeat analyses stay inside the sub-3-second target, and the whole
stack runs locally with a single `docker compose up --build`.

| Diagram | Description |
| --- | --- |
| ![Architecture](design/architecture.png) | **Container & layer architecture** — client, application, data/caching tier, and the Docker Compose / CI infrastructure. |
| ![Domain model](design/class_model.png) | **Domain model** — abstract `Nuclease` and `ScoringStrategy`, their implementations, repository interfaces, and `GuideDesignService`. |
| ![Analysis flow](design/analysis_flow.png) | **Runtime view** — a `POST /api/v1/analyze` request: validation → cache-aside lookup → pure-domain computation → render. |

**Design assets**

- Editable Draw.io source: [`design/crispr-architecture.drawio`](design/crispr-architecture.drawio)
  (page 1 = architecture, page 2 = domain model) — open at [diagrams.net](https://app.diagrams.net).
- PNG exports: [`design/architecture.png`](design/architecture.png),
  [`design/class_model.png`](design/class_model.png),
  [`design/analysis_flow.png`](design/analysis_flow.png)
- UI screens (6): [`design/ui/screen1.png`](design/ui/screen1.png) … [`screen6.png`](design/ui/screen6.png)
  — Figma prototype: _<add your Figma share link here>_
- Full Software Design Document (PDF): `design/Software-Design-Document.pdf`

**Key design decisions**

1. Abstract `Nuclease` + factory — new PAM systems are additive, no change to service, API or UI.
2. Strategy pattern for scoring — specificity and efficiency models evolve independently.
3. Cache-aside Redis keyed by a hash of the input — deterministic analysis is never recomputed.
4. Pydantic DTOs as the only frontend↔backend contract, published automatically via OpenAPI.
5. Canvas/SVG track renderer instead of DOM-per-base — keeps browser memory flat on 10 kb sequences.
