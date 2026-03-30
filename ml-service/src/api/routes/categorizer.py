"""
Categorizer API routes for PDF processing and transaction extraction
"""

from fastapi import APIRouter, UploadFile, File, HTTPException, Depends, Form
from fastapi import Request
from typing import List, Dict, Optional
import structlog
from io import BytesIO

from ...preprocessing.pdf_parser import PDFParser, PDFParseError
from ...models.layoutlm_processor import LayoutLMProcessor
from ...utils.transaction_formatter import TransactionFormatter
from ...core.config import settings

logger = structlog.get_logger()
router = APIRouter()

# Global instances (will be initialized on startup)
pdf_parser = None
layoutlm_processor = None
transaction_formatter = None


def get_services():
    """Get or initialize service instances"""
    global pdf_parser, layoutlm_processor, transaction_formatter
    
    if pdf_parser is None:
        pdf_parser = PDFParser(default_password=settings.PDF_PASSWORD)
    
    if layoutlm_processor is None:
        layoutlm_processor = LayoutLMProcessor(model_name=settings.LAYOUTLM_MODEL_NAME)
        layoutlm_processor.load_model()
    
    if transaction_formatter is None:
        transaction_formatter = TransactionFormatter()
    
    return pdf_parser, layoutlm_processor, transaction_formatter


@router.post("/categorize", summary="Categorize transactions from PDF bank statement")
async def categorize_pdf(
    request: Request,
    file: UploadFile = File(..., description="PDF bank statement file"),
    password: Optional[str] = Form(None, description="Password for encrypted PDF")
) -> Dict:
    """
    Process a PDF bank statement and extract structured transactions.
    
    This endpoint:
    1. Validates and parses the PDF using pdfplumber
    2. Processes the content with LayoutLM for intelligent entity recognition
    3. Formats the output into database-ready transaction objects
    4. Returns structured JSON with confidence scores and metadata
    
    Args:
        file: PDF bank statement file (max 10MB)
        password: Optional password for encrypted PDFs
        
    Returns:
        Structured response with extracted transactions and metadata
        
    Raises:
        HTTPException: For processing errors or invalid input
    """
    
    # Validate file
    if not file.filename.lower().endswith('.pdf'):
        raise HTTPException(
            status_code=400,
            detail="Only PDF files are supported"
        )
    
    if file.size > settings.MAX_FILE_SIZE:
        raise HTTPException(
            status_code=413,
            detail=f"File too large. Maximum size is {settings.MAX_FILE_SIZE // (1024*1024)}MB"
        )
    
    try:
        # Get service instances
        parser, processor, formatter = get_services()
        
        # Read file content
        pdf_bytes = await file.read()
        logger.info("Received PDF file", 
                   filename=file.filename, 
                   size=len(pdf_bytes))
        
        # Step 1: Validate PDF
        if not parser.validate_pdf(pdf_bytes):
            raise HTTPException(
                status_code=422,
                detail="Invalid or corrupted PDF file"
            )
        
        # Step 2: Extract text and coordinates
        logger.info("Starting PDF parsing")
        pdf_data = parser.extract_text_and_coordinates(pdf_bytes, password)
        
        if not pdf_data:
            raise HTTPException(
                status_code=422,
                detail="No content could be extracted from the PDF"
            )
        
        # Step 3: Process with LayoutLM
        logger.info("Starting LayoutLM processing")
        ml_output = processor.process_pdf_data(pdf_data)
        
        if not ml_output:
            raise HTTPException(
                status_code=422,
                detail="No transactions could be identified in the document"
            )
        
        # Step 4: Format transactions
        logger.info("Formatting transactions")
        transactions = formatter.format_transactions(ml_output)
        
        # Validate transactions
        valid_transactions, errors = formatter.validate_transactions(transactions)
        
        # Prepare response
        response = {
            "success": True,
            "metadata": {
                "filename": file.filename,
                "pages_processed": len(pdf_data),
                "raw_transactions_found": len(transactions),
                "valid_transactions": len(valid_transactions),
                "processing_time_ms": None,  # TODO: Add timing
                "model_version": settings.LAYOUTLM_MODEL_NAME
            },
            "transactions": valid_transactions,
            "errors": errors if errors else None,
            "raw_ml_output": ml_output if settings.DEBUG else None
        }
        
        logger.info("Successfully processed PDF", 
                   valid_transactions=len(valid_transactions),
                   total_pages=len(pdf_data),
                   errors=len(errors) if errors else 0)
        
        return response
        
    except PDFParseError as e:
        logger.error("PDF parsing failed", error=str(e))
        raise HTTPException(
            status_code=422,
            detail=f"PDF parsing failed: {str(e)}"
        )
        
    except Exception as e:
        logger.error("Unexpected error during categorization", 
                    error=str(e), 
                    filename=file.filename)
        raise HTTPException(
            status_code=500,
            detail="An unexpected error occurred during processing"
        )


@router.post("/categorize/batch", summary="Batch categorize multiple PDF files")
async def categorize_batch(
    request: Request,
    files: List[UploadFile] = File(..., description="Multiple PDF bank statement files"),
    password: Optional[str] = Form(None, description="Password for encrypted PDFs (applied to all)")
) -> Dict:
    """
    Process multiple PDF bank statements in batch.
    
    Args:
        files: List of PDF bank statement files
        password: Optional password for encrypted PDFs
        
    Returns:
        Batch processing results with per-file status
    """
    
    if len(files) > 10:  # Reasonable batch limit
        raise HTTPException(
            status_code=400,
            detail="Maximum 10 files allowed per batch"
        )
    
    results = []
    total_transactions = 0
    total_errors = 0
    
    for file in files:
        try:
            # Process individual file
            result = await categorize_pdf(request, file, password)
            results.append({
                "filename": file.filename,
                "status": "success",
                "transaction_count": len(result["transactions"]),
                "error_count": len(result["errors"]) if result["errors"] else 0
            })
            total_transactions += len(result["transactions"])
            
        except HTTPException as e:
            results.append({
                "filename": file.filename,
                "status": "error",
                "error": e.detail,
                "transaction_count": 0,
                "error_count": 1
            })
            total_errors += 1
            
        except Exception as e:
            results.append({
                "filename": file.filename,
                "status": "error",
                "error": str(e),
                "transaction_count": 0,
                "error_count": 1
            })
            total_errors += 1
    
    return {
        "success": True,
        "batch_metadata": {
            "total_files": len(files),
            "successful_files": len([r for r in results if r["status"] == "success"]),
            "failed_files": len([r for r in results if r["status"] == "error"]),
            "total_transactions": total_transactions,
            "total_errors": total_errors
        },
        "results": results
    }


@router.get("/categorize/health", summary="Health check for categorizer service")
async def categorizer_health() -> Dict:
    """
    Health check for the categorizer service.
    
    Returns:
        Service health status and model information
    """
    
    try:
        # Check if services are initialized
        parser, processor, formatter = get_services()
        
        return {
            "status": "healthy",
            "service": "categorizer",
            "model_loaded": processor.pipeline is not None,
            "model_name": settings.LAYOUTLM_MODEL_NAME,
            "device": str(processor.device),
            "features": {
                "pdf_parsing": True,
                "layoutlm_processing": True,
                "transaction_formatting": True,
                "batch_processing": True
            }
        }
        
    except Exception as e:
        logger.error("Health check failed", error=str(e))
        return {
            "status": "unhealthy",
            "service": "categorizer",
            "error": str(e)
        }
