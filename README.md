# CRISPR Off-Target Specificity & Guide RNA (gRNA) Visualizer

## 1. Project Name & Overview
 **CRISPR Off-Target Specificity & Guide RNA (gRNA) Visualizer** is a web-based bioinformatics tool designed to streamline gRNA candidate selection for CRISPR-Cas9 genome editing experiments. The application automatically scans user-provided target DNA sequences for Protospacer Adjacent Motif (PAM) sites, designs optimal 20-bp gRNA candidates, scores potential off-target matches, and renders an interactive visual sequence map highlighting target and off-target loci.

---

## 2. Problem it Solves
Designing guide RNAs (gRNAs) requires identifying target sequences that bind specifically to a target gene without editing unintentional "off-target" genomic sites. Manually searching sequence data for PAM sites (e.g., `NGG` for SpCas9), calculating alignment mismatch scores, and mapping genomic coordinates is tedious, time-consuming, and prone to human error. This app automates candidate extraction, calculates off-target mismatch scores, and visually renders genomic regions for rapid interpretation.

---

## 3. Target Users (Personas)

### Persona 1: Dr. Aris Thorne – Senior Molecular Biologist
* **Goal:** Quickly identify high-specificity gRNAs targeting specific exons with minimal off-target risks.
* **Pain Points:** Dislikes running slow command-line scripts or using outdated desktop viewers; needs clean, publication-ready visual outputs.

### Persona 2: Elena Rostova – Computational Biology PhD Student
* **Goal:** Evaluate multiple gRNA candidates and analyze position-specific mismatch scores across target loci.
* **Pain Points:** Wants clear visibility into mismatch scoring metrics without dealing with overly complex command-line software.

---

## 4. Vision Statement
To provide researchers and bioinformaticians with a fast, intuitive, and visually interactive web application that automates gRNA design, minimizes off-target editing risks, and simplifies genomic visualization.

---

## 5. Key Features / Goals**
* **Automated PAM Detection:** Instant identification of Cas9 PAM motifs (`5-NGG-3'`) across both forward and reverse DNA strands.
* **gRNA Candidate Generation:** Automated extraction of 20-bp protospacer candidates adjacent to identified PAMs.
* **Off-Target Mismatch Scoring:** Mismatch alignment and position-based penalty scoring to rank candidate specificity.
* **Interactive Sequence Visualizer:** Canvas/SVG-based interactive map displaying DNA strands, gRNAs, PAM locations, and mismatch regions.
* **Project Storage & Export:** Database caching for target genes and export capabilities for CSV/FASTA candidate lists.

---

## 6. Branching Strategy (GitHub Flow)
We follow standard GitHub Flow:
* `main`: Contains production-ready code.
* `feature/<feature-name>`: Isolated development branches created from `main`.

---

## 7. Quick Start – Local Development

### Prerequisites
* [Docker Desktop](https://www.docker.com/products/docker-desktop/) installed and running.
* [Git](https://git-scm.com/) installed.

### Running the Application
1. Clone the repository:
   bash
   git clone https://github.com/your-username/crispr-grna-visualizer.git
   cd crispr-grna-visualizer
   
2. Start containers via Docker Compose:
   bash
   docker-compose up --build
   
3. Access the application:
   * Frontend UI: http://localhost:3000
   * Backend API Docs: http://localhost0�000/docs

<-bash: ./zap.sh: No such file or Pull Request Demonstration -->
