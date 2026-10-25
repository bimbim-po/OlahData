import io
from typing import List, Dict, Any, Optional
from fastapi import FastAPI, Header, HTTPException, status, Response
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel, Field
import pandas as pd

from config import settings
from validation import scan_dataset_quality
from engine.pipeline import run_statistical_analysis
from engine.ingest import ingest_survey_dataset
from exporter.docx_export import generate_docx_report
from exporter.pdf_export import generate_pdf_report
from fastapi import UploadFile, File, Form

app = FastAPI(
    title="OlahData Statistical Engine",
    description="Deterministic statistical analysis service for quantitative questionnaires",
    version=settings.ENGINE_VERSION
)

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

import logging

logging.basicConfig(
    level=logging.INFO,
    format='{"timestamp": "%(asctime)s", "level": "%(levelname)s", "service": "stats-engine", "message": "%(message)s"}'
)
logger = logging.getLogger("stats-engine")

MAX_ROWS_LIMIT = 10000

def verify_service_key(x_service_key: Optional[str] = Header(None)):
    if settings.ENVIRONMENT == "production":
        if not settings.SERVICE_KEY or settings.SERVICE_KEY == "dev-stats-secret-key-12345":
            logger.error("Security alert: STATS_SERVICE_KEY has not been rotated from default dev key in production!")
            raise HTTPException(
                status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
                detail="Konfigurasi STATS_SERVICE_KEY wajib diatur dengan aman di lingkungan produksi."
            )
        if not x_service_key or x_service_key != settings.SERVICE_KEY:
            logger.warning("Unauthorized access attempt: invalid or missing X-Service-Key")
            raise HTTPException(
                status_code=status.HTTP_401_UNAUTHORIZED,
                detail="Kunci layanan (X-Service-Key) tidak valid atau hilang."
            )
    elif settings.SERVICE_KEY:
        if not x_service_key or x_service_key != settings.SERVICE_KEY:
            raise HTTPException(
                status_code=status.HTTP_401_UNAUTHORIZED,
                detail="Kunci layanan (X-Service-Key) tidak valid atau hilang."
            )

def check_payload_limits(rows: List[Dict[str, Any]]):
    if len(rows) > MAX_ROWS_LIMIT:
        logger.warning(f"Payload limit exceeded: {len(rows)} rows requested (max {MAX_ROWS_LIMIT})")
        raise HTTPException(
            status_code=status.HTTP_413_REQUEST_ENTITY_TOO_LARGE,
            detail=f"Jumlah baris responden ({len(rows)}) melebihi batas maksimum platform ({MAX_ROWS_LIMIT} baris)."
        )

# Pydantic Schemas
class ConstructModel(BaseModel):
    id: Optional[str] = None
    name: str
    items: List[str]
    role: str = "independent"

class ValidateRequest(BaseModel):
    rows: List[Dict[str, Any]]
    scale_min: int = 1
    scale_max: int = 5
    ignored_columns: Optional[List[str]] = None
    item_columns: Optional[List[str]] = None

class AnalyzeRequest(BaseModel):
    rows: List[Dict[str, Any]]
    constructs: List[ConstructModel]
    selectedTests: List[str]
    significanceLevel: float = 0.05
    tails: int = 2
    dropInvalidItems: bool = False
    alphaThreshold: float = 0.70
    scaleMin: int = 1
    scaleMax: int = 5
    negativeItems: Optional[List[str]] = None
    projectId: str = "project-1"
    dataVersionId: str = "dv-1"
    excludedRowsLog: Optional[List[Dict[str, Any]]] = None

class ExportRequest(BaseModel):
    format: str = "docx" # "docx" or "pdf"
    results: Dict[str, Any]
    projectTitle: str = "Pengaruh Kualitas Layanan dan Kepuasan terhadap Loyalitas Pelanggan"
    includeDeclaration: bool = True
    watermark: bool = False
    tableId: Optional[str] = None

@app.get("/health")
def health():
    return {"status": "ok", "version": settings.ENGINE_VERSION, "environment": settings.ENVIRONMENT}

@app.get("/version")
def version():
    return {"version": settings.ENGINE_VERSION}

@app.post("/validate")
def validate_dataset(
    req: ValidateRequest,
    x_service_key: Optional[str] = Header(None)
):
    verify_service_key(x_service_key)
    if not req.rows:
        return {"issues": []}

    check_payload_limits(req.rows)
    logger.info(f"Validate request: {len(req.rows)} rows, scale {req.scale_min}-{req.scale_max}")

    df = pd.DataFrame(req.rows)
    issues = scan_dataset_quality(
        df,
        scale_min=req.scale_min,
        scale_max=req.scale_max,
        ignored_columns=req.ignored_columns,
        item_columns=req.item_columns
    )
    return {"issues": issues}

@app.post("/analyze")
def analyze(
    req: AnalyzeRequest,
    x_service_key: Optional[str] = Header(None)
):
    verify_service_key(x_service_key)
    if not req.rows:
        raise HTTPException(status_code=400, detail="Data baris responden tidak boleh kosong.")

    check_payload_limits(req.rows)
    logger.info(f"Analyze request: project={req.projectId}, version={req.dataVersionId}, rows={len(req.rows)}, constructs={len(req.constructs)}, tests={req.selectedTests}")

    df = pd.DataFrame(req.rows)
    constructs_data = [c.dict() for c in req.constructs]

    try:
        results = run_statistical_analysis(
            df=df,
            constructs=constructs_data,
            selected_tests=req.selectedTests,
            significance_level=req.significanceLevel,
            tails=req.tails,
            negative_items=req.negativeItems,
            drop_invalid_items=req.dropInvalidItems,
            alpha_threshold=req.alphaThreshold,
            scale_min=req.scaleMin,
            scale_max=req.scaleMax,
            project_id=req.projectId,
            data_version_id=req.dataVersionId,
            excluded_rows_log=req.excludedRowsLog
        )
        return results
    except Exception as e:
        logger.error(f"Computation error: {str(e)}")
        raise HTTPException(status_code=500, detail=f"Gagal melakukan komputasi statistik: {str(e)}")

@app.post("/ingest")
async def ingest_file(
    file: UploadFile = File(...),
    sheet_name: Optional[str] = Form(None),
    x_service_key: Optional[str] = Header(None)
):
    verify_service_key(x_service_key)
    file_bytes = await file.read()
    if len(file_bytes) > 10 * 1024 * 1024:
        raise HTTPException(status_code=413, detail="Ukuran berkas melebihi batas 10 MB.")
    try:
        parsed = ingest_survey_dataset(file_bytes, file.filename or "dataset.csv", sheet_name=sheet_name)
        # Convert DataFrame to serializable dict of records
        parsed["cleanedRows"] = parsed["cleanedDf"].to_dict(orient="records")
        del parsed["cleanedDf"]
        return parsed
    except Exception as e:
        logger.error(f"Ingest error on {file.filename}: {str(e)}")
        raise HTTPException(status_code=400, detail=f"Gagal memproses berkas kuesioner: {str(e)}")

@app.post("/export")
def export(
    req: ExportRequest,
    x_service_key: Optional[str] = Header(None)
):
    verify_service_key(x_service_key)
    fmt = req.format.lower()
    import datetime
    safe_title = "".join(c if c.isalnum() else "_" for c in req.projectTitle[:30]).strip("_") or "Hasil"
    today_str = datetime.date.today().strftime("%Y%m%d")

    if fmt in ["docx", "word"]:
        binary_data = generate_docx_report(
            results=req.results,
            project_title=req.projectTitle,
            include_declaration=req.includeDeclaration,
            watermark=req.watermark,
            selected_table_ids=[req.tableId] if req.tableId else None
        )
        media_type = "application/vnd.openxmlformats-officedocument.wordprocessingml.document"
        filename = f"OlahData_Bab4_{safe_title}_{today_str}.docx"
    elif fmt == "pdf":
        binary_data = generate_pdf_report(
            results=req.results,
            project_title=req.projectTitle,
            include_declaration=req.includeDeclaration,
            watermark=req.watermark
        )
        media_type = "application/pdf"
        filename = f"OlahData_Bab4_{safe_title}_{today_str}.pdf"
    else:
        raise HTTPException(status_code=400, detail=f"Format ekspor tidak didukung: {req.format}")

    return Response(
        content=binary_data,
        media_type=media_type,
        headers={"Content-Disposition": f'attachment; filename="{filename}"'}
    )

if __name__ == "__main__":
    import uvicorn
    uvicorn.run("main:app", host=settings.HOST, port=settings.PORT, reload=True)
