from fastapi import FastAPI, Request, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel, Field
from typing import List, Optional, Dict, Any
import re
import time
import logging

# Non-functional Observability: Structured Logging
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger("crispr_engine")

app = FastAPI(
    title="CRISPR Off-Target Specificity & gRNA Visualizer API",
    version="2.0.0",
    description="Bioinformatics engine for multi-nuclease gRNA design, MIT off-target scoring, and efficiency profiling."
)

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

@app.middleware("http")
async def log_requests(request: Request, call_next):
    start_time = time.time()
    response = await call_next(request)
    process_time = round((time.time() - start_time) * 1000, 2)
    logger.info(f"path={request.url.path} method={request.method} status={response.status_code} duration={process_time}ms")
    return response

# ==========================================
# DOMAIN MODELS (Pydantic & OOP)
# ==========================================

class AnalyzeRequest(BaseModel):
    sequence: str = Field(..., example="ATGCGATCGATCGATCGATCGATCGGATCGATCGATCGATCGATCGG")
    nuclease: str = Field("SpCas9", description="Options: SpCas9, SaCas9, Cas12a")
    off_target_background: Optional[str] = Field(None, description="Optional host/background sequence to scan for off-targets")
    max_mismatches: int = Field(3, ge=0, le=4, description="Maximum mismatches allowed for off-target flagging")

class OffTargetSite(BaseModel):
    sequence: str
    pam: str
    position: int
    mismatches: int
    specificity_score: float
    risk_level: str  # "HIGH", "MEDIUM", "LOW"

class GRNACandidate(BaseModel):
    id: str
    grna: str
    pam: str
    position: int
    strand: str
    gc_content: float
    efficiency_score: float
    off_target_count: int
    off_targets: List[OffTargetSite]
    warnings: List[str]

class AnalysisReport(BaseModel):
    sequence_length: int
    nuclease_used: str
    total_candidates: int
    candidates: List[GRNACandidate]
    status: str

# ==========================================
# BIOINFORMATICS ALGORITHMS & SCORING
# ==========================================

class CRISPRScoringEngine:
    """
    Implements Hsu et al. (MIT) off-target specificity weights and
    lightweight Doench-style efficiency rules for gRNA evaluation.
    """
    # MIT penalty weights by position (1 = 5' end, 20 = 3' end next to PAM)
    # Mismatches in the seed region (positions 12-20) drop specificity scores drastically.
    MIT_POSITION_WEIGHTS = [
        0.0, 0.0, 0.014, 0.0, 0.0, 0.395, 0.317, 0.0, 0.389, 0.079,
        0.445, 0.508, 0.613, 0.851, 0.732, 0.828, 0.615, 0.804, 0.685, 0.583
    ]

    @classmethod
    def calculate_mit_specificity(cls, target_grna: str, off_target_seq: str) -> float:
        """
        Calculates MIT specificity score between 0.0 (high off-target risk) and 100.0 (no risk).
        """
        if len(target_grna) != len(off_target_seq):
            return 0.0
        
        penalty_product = 1.0
        mismatches = 0
        
        for i in range(min(len(target_grna), 20)):
            if target_grna[i] != off_target_seq[i]:
                mismatches += 1
                penalty_product *= (1.0 - cls.MIT_POSITION_WEIGHTS[i])
        
        if mismatches == 0:
            return 0.0  # Exact unintended match = 100% off-target hazard
        
        # Aggregate distance penalty formula
        score = round(penalty_product * (1.0 / (mismatches ** 2)) * 100, 2)
        return max(0.0, min(100.0, score))

    @classmethod
    def calculate_efficiency(cls, grna: str, gc: float) -> tuple[float, List[str]]:
        """
        Calculates rule-based on-target cutting efficiency score (0-100) and flags biological warnings.
        """
        score = 50.0
        warnings = []

        # 1. GC Content Penalties (Optimal is 40% - 60%)
        if 40.0 <= gc <= 60.0:
            score += 20.0
        elif gc < 30.0 or gc > 70.0:
            score -= 25.0
            warnings.append("Extreme GC content (<30% or >70%) reduces binding stability.")
        else:
            score += 5.0

        # 2. Poly-T Tract Warning (4 or more T's act as RNA Pol III terminator)
        if "TTTT" in grna:
            score -= 35.0
            warnings.append("Contains poly-T tract (TTTT); may terminate sgRNA transcription.")

        # 3. Position 20 Preference (Guanine at position 20 adjacent to PAM improves cleavage)
        if grna[-1] == "G":
            score += 15.0
        elif grna[-1] == "C":
            score += 5.0
        elif grna[-1] == "T":
            score -= 10.0

        # 4. Self-Complementarity / Hairpin Risk
        if grna[:4] == grna[-4:][::-1]:
            score -= 15.0
            warnings.append("Potential hairpin formation detected.")

        return max(0.0, min(100.0, round(score, 1))), warnings


class SequenceTarget:
    def __init__(self, raw_seq: str):
        self.seq = re.sub(r'[^ACGT]', '', raw_seq.upper())


class GRNAEngine:
    NUCLEASES = {
        "SpCas9": {"pam": r'(?=(.{20})([ACGT]GG))', "length": 20, "pam_pos": "3prime"},
        "SaCas9": {"pam": r'(?=(.{21})([ACGT]{2}G[ACGT]{2}T))', "length": 21, "pam_pos": "3prime"},
        "Cas12a": {"pam": r'(?=(TTT[ACG])(.{20}))', "length": 20, "pam_pos": "5prime"}
    }

    def __init__(self, nuclease: str = "SpCas9"):
        config = self.NUCLEASES.get(nuclease, self.NUCLEASES["SpCas9"])
        self.pam_pattern = re.compile(config["pam"])
        self.length = config["length"]
        self.pam_pos = config["pam_pos"]
        self.nuclease = nuclease

    def scan_off_targets(self, grna: str, background_seq: str, max_mismatches: int) -> List[OffTargetSite]:
        off_targets = []
        if not background_seq or len(background_seq) < self.length:
            return off_targets

        # Scan background sequence using a sliding window
        for i in range(len(background_seq) - self.length + 1):
            window = background_seq[i:i + self.length]
            mismatches = sum(1 for a, b in zip(grna, window) if a != b)
            
            if 0 < mismatches <= max_mismatches:
                score = CRISPRScoringEngine.calculate_mit_specificity(grna, window)
                risk = "HIGH" if mismatches <= 1 or score < 20 else ("MEDIUM" if mismatches == 2 else "LOW")
                
                off_targets.append(OffTargetSite(
                    sequence=window,
                    pam="NGG" if self.nuclease == "SpCas9" else "PAM",
                    position=i,
                    mismatches=mismatches,
                    specificity_score=score,
                    risk_level=risk
                ))
        return sorted(off_targets, key=lambda x: x.mismatches)[:10]  # Return top 10 highest risk

    def extract_candidates(self, target: SequenceTarget, background_seq: Optional[str] = None, max_mm: int = 3) -> List[GRNACandidate]:
        candidates = []
        for match in self.pam_pattern.finditer(target.seq):
            start = match.start()
            if self.pam_pos == "3prime":
                grna = match.group(1)
                pam = match.group(2)
            else:
                pam = match.group(1)
                grna = match.group(2)

            gc_content = round(((grna.count('G') + grna.count('C')) / len(grna)) * 100, 1)
            efficiency, warnings = CRISPRScoringEngine.calculate_efficiency(grna, gc_content)
            
            # Off-target background screening
            bg_to_scan = background_seq if background_seq else target.seq
            off_targets = self.scan_off_targets(grna, bg_to_scan, max_mm)

            candidates.append(GRNACandidate(
                id=f"gRNA_{start}_{pam}",
                grna=grna,
                pam=pam,
                position=start,
                strand="+",
                gc_content=gc_content,
                efficiency_score=efficiency,
                off_target_count=len(off_targets),
                off_targets=off_targets,
                warnings=warnings
            ))
            
        # Rank by efficiency descending, then off-target count ascending
        return sorted(candidates, key=lambda c: (-c.efficiency_score, c.off_target_count))

# ==========================================
# API ENDPOINTS
# ==========================================

@app.get("/health")
def health_check():
    return {
        "status": "healthy",
        "engine_version": "2.0.0",
        "supported_nucleases": list(GRNAEngine.NUCLEASES.keys()),
        "methodology": "MIT Specificity Matrix + Rule-Based Efficiency Scoring"
    }

@app.post("/api/analyze", response_model=AnalysisReport)
def analyze_sequence(payload: AnalyzeRequest):
    target = SequenceTarget(payload.sequence)
    if len(target.seq) < 23:
        raise HTTPException(status_code=400, detail="DNA sequence must be at least 23 base pairs long.")

    engine = GRNAEngine(nuclease=payload.nuclease)
    bg_sequence = SequenceTarget(payload.off_target_background).seq if payload.off_target_background else None
    
    candidates = engine.extract_candidates(
        target=target,
        background_seq=bg_sequence,
        max_mm=payload.max_mismatches
    )

    return AnalysisReport(
        sequence_length=len(target.seq),
        nuclease_used=payload.nuclease,
        total_candidates=len(candidates),
        candidates=candidates,
        status="success"
    )
