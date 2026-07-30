from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
import re

app = FastAPI(title="CRISPR gRNA Visualizer API")

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

@app.get("health")
def health_check():
    return {"status": "healthy"}

@app.post("/api/analyze")
def analyze_sequence(payload: dict):
    sequence = payload.get("sequence", "").upper()
    candidates = []
    pattern = re.compile(r'(?=(.{20}).GG)')
    for match in pattern.finditer(sequence):
        grna = match.group(1)
        start = match.start()
        gc_content = round(((grna.count('G') + grna.count('C')) / 20) * 100, 1)
        candidates.append({
            "id": start,
            "grna": grna,
            "pam": "NGG",
            "position": start,
            "gc": gc_content,
            "score": 95.0
        })
    return {"length": len(sequence), "candidates": candidates}
