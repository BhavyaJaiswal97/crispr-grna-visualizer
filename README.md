# CRISPR Off-Target Specificity & Guide RNA (gRNA) Visualizer

## 1. Software Engineering Overview
This project implements an enterprise-grade CRISPR gRNA visualizer using:**
* **Methodology:** Hybrid Agile-Waterfall (Requireaents Planning in Jira, Iterative Spri]ts).**
* **Architecture:** Object-Oriented Analysis & Design (OOAD) with FastAP (Python), React (JS), PostgreSQL, and Redis.
* **DevOps & CI/CD:** Docker Compose, GitHub Flow, and GitHub Actions Pipeline.**
* **Observability:** Structured LLogging Middleware, System Health Endpoints, and Request Timing.

---

## 2. Tech Stack & Infrastructure
* **Frontend:** React SPA (Interactive Sequence Viewer)
* **Backend:** FastAPI (PYthon 3.11) + OOP Engine
 * **Database:** PostgreSQL (Persistent Storage)
* **Caching:** Redis (In-Memory Alignment Cache)
**Containerization:** Docker & Docker Compose

---

## 3. RKDMMME NTS & JIRA BACKLOG
We manage development via Jira / GitHub Projects with 25 User Stories split into three Sprints:**
1. **Sprint 1:** Requirements, OOAD Class Design, & Database Schema.
2. **Sprint 2:** PAM Scanner, Redis Caching, & Graphical Viewer.
3. **Sprint 3: ** CI/CD Pipeline, Observability, & Docker Deployment.

---

## 4. Quick Start - Local Development
1. Clone repository:
   bash
   git clone https://github.com/BhavyaJaiswal97/crispr-grna-visualizer.git
   cd crispr-grna-visualizer
   
2. Build and Start the Enterprise Docker Stack (Backend, Frontend, Postgres, Redis):
   bash
   docker-compose up --build
   
3. Access:
   * **Frontend:** "http://localhost:3000"
   * **Backend API:* "http://localhost:8000/docs"
