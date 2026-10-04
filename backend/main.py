import os
import io
import csv
import json
import logging
from typing import Optional, Dict, Any, List
from fastapi import FastAPI, UploadFile, File, Form, HTTPException, Response
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
import requests

from database import (
    init_db,
    seed_sample_data,
    get_all_customers,
    get_customer_by_id,
    find_or_create_customer,
    add_transaction,
    get_customer_transactions,
    settle_customer_account,
    delete_transaction
)
from parser import parse_khata_statement
from reminders import generate_reminder_templates, generate_gemma_custom_reminder, create_whatsapp_url
from stt import transcribe_audio_bytes

logging.basicConfig(level=logging.INFO)
logger = logging.getLogger("udhaar_khata")

app = FastAPI(
    title="उधार खाता (Udhaar Khata) API",
    description="100% Local Open-Weights AI Digital Ledger for Indian Shopkeepers & Loved Ones",
    version="1.0.0"
)

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

@app.on_event("startup")
def startup_event():
    init_db()
    seed_sample_data()
    logger.info("Udhaar Khata backend started and database ready.")

# --- Models ---
class ParseRequest(BaseModel):
    text: str
    source: Optional[str] = "text" # "voice" or "text"

class TransactionCreate(BaseModel):
    customer_name: str
    amount: float
    type: str # 'udhaar' or 'jama'
    note: Optional[str] = ""
    raw_transcript: Optional[str] = ""
    phone: Optional[str] = ""
    model_used: Optional[str] = "gemma2:2b (Open Weights)"

class ReminderRequest(BaseModel):
    customer_name: str
    amount: float
    phone: Optional[str] = ""
    instructions: Optional[str] = ""
    custom_tone: Optional[str] = None

class CustomerCreate(BaseModel):
    name: str
    phone: Optional[str] = ""
    note: Optional[str] = ""

# --- Endpoints ---

@app.get("/api/health")
def health_check():
    # Check Ollama connection & available models
    ollama_ok = False
    models = []
    try:
        r = requests.get("http://localhost:11434/api/tags", timeout=2)
        if r.status_code == 200:
            ollama_ok = True
            models = [m.get("name") for m in r.json().get("models", [])]
    except Exception:
        pass

    has_gemma = any("gemma" in m.lower() for m in models)

    return {
        "status": "online",
        "open_weights_stack": {
            "llm": "Gemma 2 (Google Open Weights via Ollama)" if has_gemma else "Indic-Shopkeeper NLP Local Engine",
            "gemma_available": has_gemma,
            "ollama_active": ollama_ok,
            "available_models": models,
            "stt": "OpenAI Whisper (Open Weights via faster-whisper)",
            "privacy": "100% Local Inference • Zero External Cloud APIs • No Data Leaves This Device"
        }
    }

@app.get("/api/customers")
def list_customers():
    return {"customers": get_all_customers()}

@app.get("/api/customers/{customer_id}")
def get_customer(customer_id: str):
    cust = get_customer_by_id(customer_id)
    if not cust:
        raise HTTPException(status_code=404, detail="Customer not found")
    transactions = get_customer_transactions(customer_id)
    return {"customer": cust, "transactions": transactions}

@app.post("/api/customers")
def create_customer(data: CustomerCreate):
    cust = find_or_create_customer(data.name, phone=data.phone or "")
    return {"customer": cust}

@app.get("/api/customers/{customer_id}/transactions")
def list_customer_transactions(customer_id: str):
    cust = get_customer_by_id(customer_id)
    if not cust:
        raise HTTPException(status_code=404, detail="Customer not found")
    txs = get_customer_transactions(customer_id)
    return {"customer": cust, "transactions": txs}

@app.post("/api/transactions")
def create_transaction(data: TransactionCreate):
    if data.amount <= 0:
        raise HTTPException(status_code=400, detail="Amount must be greater than zero")
    if not data.customer_name.strip():
        raise HTTPException(status_code=400, detail="Customer name is required")
    
    tx = add_transaction(
        customer_name=data.customer_name,
        amount=data.amount,
        tx_type=data.type,
        note=data.note or "",
        raw_transcript=data.raw_transcript or "",
        model_used=data.model_used or "gemma2:2b (Open Weights)",
        phone=data.phone or ""
    )
    return {"transaction": tx}

@app.delete("/api/transactions/{transaction_id}")
def remove_transaction(transaction_id: str):
    success = delete_transaction(transaction_id)
    if not success:
        raise HTTPException(status_code=404, detail="Transaction not found")
    return {"success": True}

@app.post("/api/customers/{customer_id}/settle")
def settle_account(customer_id: str):
    tx = settle_customer_account(customer_id)
    if not tx:
        return {"settled": False, "message": "खाता पहले से चुकता है या ग्राहक नहीं मिला (Account already settled)"}
    return {"settled": True, "transaction": tx}

@app.post("/api/ai/parse")
def parse_voice_or_text(req: ParseRequest):
    """
    Parses Hindi/Hinglish speech or text input using local Gemma 2 / Indic NLP engine.
    Example: 'Ramesh ne 200 udhaar liya' -> { customer_name: 'Ramesh', amount: 200, type: 'udhaar' }
    """
    result = parse_khata_statement(req.text)
    return result

@app.post("/api/ai/remind")
def generate_reminders(req: ReminderRequest):
    """
    Drafts 3 polite, culturally appropriate payment reminders in Hindi/Hinglish
    plus a custom Gemma-generated draft, with instant WhatsApp links.
    """
    templates = generate_reminder_templates(req.customer_name, req.amount)
    
    # Add WhatsApp URLs
    for t in templates:
        t["whatsapp_url"] = create_whatsapp_url(req.phone or "", t["message"])

    # If extra instructions provided or requested, query Gemma 2 2B
    gemma_custom = None
    if req.instructions or req.custom_tone:
        gemma_msg = generate_gemma_custom_reminder(req.customer_name, req.amount, instructions=req.instructions or "")
        gemma_custom = {
            "id": "gemma_custom",
            "title_hin": "Gemma 2 AI संदेश (Custom Draft)",
            "title_eng": "Gemma 2 AI Custom Draft",
            "badge_color": "purple",
            "message": gemma_msg,
            "whatsapp_url": create_whatsapp_url(req.phone or "", gemma_msg)
        }

    return {
        "customer_name": req.customer_name,
        "amount": req.amount,
        "phone": req.phone or "",
        "templates": templates,
        "custom": gemma_custom
    }

@app.post("/api/ai/transcribe")
async def transcribe_audio(
    file: UploadFile = File(...),
    language: Optional[str] = Form(None)
):
    """
    Accepts an audio recording from frontend and transcribes it locally
    using open-weight Whisper model (faster-whisper).
    """
    contents = await file.read()
    ext = os.path.splitext(file.filename)[1] if file.filename else ".webm"
    if not ext:
        ext = ".webm"
    
    transcript = transcribe_audio_bytes(contents, file_ext=ext, language=language)
    if not transcript:
        # Fallback message
        raise HTTPException(status_code=500, detail="Could not transcribe audio. Please try again or use text input.")

    # Automatically parse the transcribed text
    parsed = parse_khata_statement(transcript)

    return {
        "transcript": transcript,
        "parsed": parsed
    }

@app.post("/api/seed")
def reset_seed():
    seed_sample_data()
    return {"success": True, "message": "Sample data seeded."}

@app.get("/api/export")
def export_khata(format: str = "json"):
    customers = get_all_customers()
    if format == "csv":
        output = io.StringIO()
        writer = csv.writer(output)
        writer.writerow(["Customer Name", "Phone", "Net Balance (₹)", "Status", "Total Transactions", "Last Transaction"])
        for c in customers:
            bal = c["balance"]
            status = "लेना है (Owes you)" if bal > 0 else ("देना है (You owe)" if bal < 0 else "चुकता (Settled)")
            writer.writerow([c["name"], c.get("phone", ""), f"{bal:.2f}", status, c["transaction_count"], c.get("last_transaction_at", "")])
        
        return Response(
            content=output.getvalue(),
            media_type="text/csv",
            headers={"Content-Disposition": "attachment; filename=udhaar_khata_export.csv"}
        )
    return {"customers": customers}

if __name__ == "__main__":
    import uvicorn
    uvicorn.run("main:app", host="0.0.0.0", port=8000, reload=True)
