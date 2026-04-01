"""
Categorizer API — extracts real transactions from bank statement PDFs.
Uses pdfplumber table extraction + rule-based categorization.
No dummy data. If extraction fails, returns empty list with error detail.
"""

from fastapi import APIRouter, UploadFile, File, HTTPException, Form, Request
from typing import Optional, Dict
import structlog
import time

from ...preprocessing.bank_statement_parser import BankStatementParser
from ...utils.transaction_categorizer import build_transaction_output
from ...core.config import settings

logger = structlog.get_logger()
router = APIRouter()

_parser = None

def get_parser() -> BankStatementParser:
    global _parser
    if _parser is None:
        _parser = BankStatementParser()
    return _parser


@router.post("/categorize", summary="Extract transactions from a bank statement PDF")
async def categorize_pdf(
    request: Request,
    file: UploadFile = File(...),
    password: Optional[str] = Form(None),
) -> Dict:
    start = time.time()

    # ── Validation ────────────────────────────────────────────────────────────
    if not file.filename.lower().endswith('.pdf'):
        raise HTTPException(status_code=400, detail="Only PDF files are supported.")

    pdf_bytes = await file.read()

    if len(pdf_bytes) > settings.MAX_FILE_SIZE:
        raise HTTPException(status_code=413, detail=f"File exceeds {settings.MAX_FILE_SIZE // (1024*1024)}MB limit.")

    if not pdf_bytes.startswith(b'%PDF'):
        raise HTTPException(status_code=422, detail="Invalid PDF file.")

    # ── Extraction ────────────────────────────────────────────────────────────
    try:
        parser = get_parser()
        raw_transactions = parser.parse(pdf_bytes, password=password or "")
        logger.info("Extraction complete", filename=file.filename, raw_count=len(raw_transactions))
    except Exception as e:
        logger.error("PDF extraction failed", error=str(e))
        raise HTTPException(status_code=422, detail=f"Could not extract data from PDF: {str(e)}")

    if not raw_transactions:
        # Return empty success — don't crash, let frontend show "no transactions found"
        return {
            "success": True,
            "data": {
                "transactions": [],
                "metadata": {
                    "total_pages": 0,
                    "total_transactions": 0,
                    "processing_time": round((time.time() - start) * 1000),
                    "model_version": "2.0.0",
                    "note": "No transactions could be extracted. The PDF may not be a standard bank statement.",
                },
            },
        }

    # ── Categorization & formatting ───────────────────────────────────────────
    result = build_transaction_output(raw_transactions)
    result["data"]["metadata"]["processing_time"] = round((time.time() - start) * 1000)

    logger.info(
        "Categorization complete",
        filename=file.filename,
        transactions=result["data"]["metadata"]["total_transactions"],
        time_ms=result["data"]["metadata"]["processing_time"],
    )
    return result


@router.get("/categorize/health")
async def categorizer_health() -> Dict:
    return {
        "status": "healthy",
        "service": "categorizer",
        "engine": "pdfplumber + rule-based",
        "version": "2.0.0",
    }
