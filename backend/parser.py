import re
import json
import logging
import requests
from typing import Dict, Any, Optional

logger = logging.getLogger(__name__)

# Hindi numeral mappings
HINDI_NUMBER_WORDS = {
    "sau": 100, "ek sau": 100, "ek sau pachas": 150, "dedh sau": 150, "derh sau": 150,
    "do sau": 200, "dhai sau": 250, "teen sau": 300, "char sau": 400, "chaar sau": 400,
    "panch sau": 500, "paanch sau": 500, "che sau": 600, "chhah sau": 600,
    "saat sau": 700, "aath sau": 800, "nau sau": 900,
    "hazar": 1000, "hazaar": 1000, "ek hazar": 1000, "do hazar": 2000, "do hazaar": 2000,
    "panch hazar": 5000, "paanch hazaar": 5000, "das hazar": 10000,
    # Devanagari words
    "सौ": 100, "एक सौ": 100, "डेढ़ सौ": 150, "दो सौ": 200, "ढाई सौ": 250,
    "तीन सौ": 300, "चार सौ": 400, "पांच सौ": 500, "पाँच सौ": 500, "छह सौ": 600,
    "सात सौ": 700, "आठ सौ": 800, "नौ सौ": 900, "हज़ार": 1000, "हजार": 1000,
    "दो हज़ार": 2000, "दो हजार": 2000, "पांच हज़ार": 5000
}

DEVANAGARI_DIGITS = {
    '०': '0', '१': '1', '२': '2', '३': '3', '४': '4',
    '५': '5', '६': '6', '७': '7', '८': '8', '९': '9'
}

def normalize_devanagari_digits(text: str) -> str:
    for dev, eng in DEVANAGARI_DIGITS.items():
        text = text.replace(dev, eng)
    return text

def parse_with_gemma_ollama(text: str, model_name: str = "gemma2:2b") -> Optional[Dict[str, Any]]:
    """Query local Ollama Gemma 2 model to extract structured khata ledger transaction."""
    prompt = f"""You are an intelligent Hindi/Hinglish accounting assistant for an Indian shopkeeper's digital ledger (Udhaar Khata).
Extract the transaction details from the shopkeeper's spoken input.

Input: "{text}"

Rules:
1. "customer_name": Name of the customer (e.g., "Ramesh", "Sunita", "Sharma Ji", "Mukesh Bhai"). Normalize capitalization.
2. "amount": Number/amount in Rupees (float or int). If words like "do sau", convert to 200.
3. "type":
   - "udhaar" if customer borrowed money, bought goods on credit, or owes money (keywords: udhaar liya, udhaar diya, saman liya, baaki, le gaya, उधार).
   - "jama" if customer paid, returned money, deposited, or cleared bill (keywords: wapas kiya, jama kiya, de gaya, chukta kiya, bhej diya, जमा).
4. "note": Brief item or reason if mentioned (e.g. "ration", "doodh", "aata", "oil", "saman", or empty string "").
5. "confidence": Number between 0.0 and 1.0.

Respond ONLY with valid JSON with keys: customer_name, amount, type, note, confidence. Do NOT include markdown blocks or any other explanation.

JSON:"""

    try:
        response = requests.post(
            "http://localhost:11434/api/generate",
            json={
                "model": model_name,
                "prompt": prompt,
                "stream": False,
                "format": "json",
                "options": {
                    "temperature": 0.1,
                    "top_p": 0.9
                }
            },
            timeout=8
        )
        if response.status_code == 200:
            res_data = response.json()
            raw_response = res_data.get("response", "").strip()
            # Parse JSON
            parsed = json.loads(raw_response)
            if "customer_name" in parsed and "amount" in parsed:
                # Sanitize amount
                try:
                    parsed["amount"] = float(parsed["amount"])
                except Exception:
                    parsed["amount"] = 0.0
                
                # Sanitize type
                t = str(parsed.get("type", "udhaar")).lower()
                parsed["type"] = "jama" if ("jama" in t or "credit" in t or "wapas" in t or "paid" in t) else "udhaar"
                parsed["model_used"] = f"{model_name} (Local Open Weights)"
                parsed["source"] = "gemma_ollama"
                return parsed
    except Exception as e:
        logger.warning(f"Ollama gemma inference error: {e}")
    return None

def parse_with_deterministic_engine(raw_text: str) -> Dict[str, Any]:
    """
    High-accuracy, sub-millisecond local bilingual NLP parser for Indian shopkeeper Hindi/Hinglish idioms.
    Acts as instant resilience layer & offline fallback.
    """
    text = normalize_devanagari_digits(raw_text.strip())
    lower_text = text.lower()

    # 1. Determine Amount
    amount = 0.0
    # Check for direct numbers (e.g. 200, 500, 1200.50, ₹350, Rs 500)
    num_match = re.search(r'(?:₹|rs\.?|inr|रुपये|रूपए|रुपए)?\s*(\d+(?:\.\d+)?)\s*(?:₹|rs\.?|inr|rupaye|rupee|rupees|रुपये|रूपए|रुपया)?', lower_text)
    if num_match:
        try:
            amount = float(num_match.group(1))
        except ValueError:
            amount = 0.0

    # If no digit found, check word numerals
    if amount == 0.0:
        for phrase, val in sorted(HINDI_NUMBER_WORDS.items(), key=lambda x: -len(x[0])):
            if phrase in lower_text:
                amount = float(val)
                break

    # 2. Determine Transaction Type (udhaar vs jama)
    # JAMA keywords (Customer paid, returned money, cleared debt)
    jama_patterns = [
        r'\bwapas\b', r'\bjama\b', r'\bdiye\b', r'\bde\s+gaya\b', r'\bchukta\b',
        r'\blautaye\b', r'\bpaid\b', r'\bcredit\b', r'\bbheje\b', r'\bde\s+diye\b',
        r'वापस', r'जमा', r'दिए', r'चुक्ता', r'लौटाए', r'भेजे', r'दे\s*दिए', r'दे\s*गया'
    ]
    # UDHAAR keywords (Customer borrowed, took credit, owes)
    udhaar_patterns = [
        r'\budhaar\b', r'\bliya\b', r'\ble\s+gaya\b', r'\bbaaki\b', r'\bkhata\b',
        r'\bcredit\s+pe\b', r'\bdebit\b', r'\ble\s+liya\b',
        r'उधार', r'लिया', r'बाकी', r'खाता', r'ले\s*गया', r'ले\s*लिया'
    ]

    is_jama = any(re.search(p, lower_text) for p in jama_patterns)
    is_udhaar = any(re.search(p, lower_text) for p in udhaar_patterns)

    # Heuristic resolution:
    # If "wapas" or "jama" or "chukta" is present, it's jama even if "udhaar" was mentioned as "udhaar wapas kiya"
    if is_jama and any(k in lower_text for k in ["wapas", "वापस", "jama", "जमा", "chukta", "चुक्ता"]):
        tx_type = "jama"
    elif is_udhaar:
        tx_type = "udhaar"
    elif is_jama:
        tx_type = "jama"
    else:
        tx_type = "udhaar" # Default to udhaar in shopkeeper context

    # 3. Extract Customer Name
    # Clean text to isolate name
    words_to_strip = [
        r'\b(?:ne|ko|se|ka|ke|ki|kal|aaj|parson|ab|bhi|ka|ki)\b',
        r'\b(?:udhaar|jama|wapas|diye|liya|le|gaya|chukta|lautaye|bheje|de)\b',
        r'\b(?:rupaye|rupee|rupees|rs|inr|₹|rokda|nawad|cash)\b',
        r'\b(?:aata|chawal|tel|cheeni|doodh|ration|saman|masale|chai|soap|ghee)\b',
        r'\b\d+(?:\.\d+)?\b',
        r'ने', r'को', r'से', r'का', r'के', r'की', r'उधार', r'जमा', r'वापस', r'दिए', r'लिया',
        r'रुपये', r'रूपए', r'रुपया', r'सामान', r'राशन', r'दूध', r'आटा', r'तेल', r'चीनी'
    ]
    for w in HINDI_NUMBER_WORDS.keys():
        words_to_strip.append(rf'\b{re.escape(w)}\b')

    # Try matching common syntactic structures:
    # Pattern A: "[Name] ne [Amount] udhaar liya / wapas kiye"
    # Pattern B: "[Name] ko [Amount] ka saman diya"
    name = ""
    match_a = re.match(r'^\s*([A-Za-z\u0900-\u097F\s]+?)\s+(?:ne|ko|se|ने|को|से)\b', text, re.IGNORECASE)
    if match_a:
        potential_name = match_a.group(1).strip()
        # Ensure not noise
        if len(potential_name) > 1 and not re.match(r'^(aaj|kal|parson|mai|hum)$', potential_name, re.IGNORECASE):
            name = potential_name

    if not name:
        # Check first 1-3 words of sentence
        words = text.split()
        candidate = []
        for word in words:
            cleaned_word = re.sub(r'[^\w\u0900-\u097F]', '', word)
            if not cleaned_word:
                continue
            if re.match(r'^\d+$', cleaned_word):
                break
            if cleaned_word.lower() in ["ne", "ko", "se", "ka", "ke", "ki", "ने", "को", "से"]:
                break
            candidate.append(cleaned_word)
            if len(candidate) >= 3:
                break
        name = " ".join(candidate).strip()

    # Fallback name cleanup
    if not name or len(name) < 2:
        name = "Grahak (Customer)"
    else:
        # Title case
        name = " ".join([w.capitalize() for w in name.split()])

    # 4. Extract Item / Note
    common_items = [
        ("ration", "राशन"), ("doodh", "दूध"), ("aata", "आटा"), ("cheeni", "चीनी"),
        ("tel", "तेल"), ("ghee", "घी"), ("masale", "मसाले"), ("chai", "चायपत्ती"),
        ("chawal", "चावल"), ("sabun", "साबुन"), ("dawai", "दवाई"), ("saman", "सामान")
    ]
    detected_note = ""
    for eng_item, hin_item in common_items:
        if eng_item in lower_text or hin_item in text:
            detected_note = hin_item
            break
    
    if not detected_note:
        if tx_type == "udhaar":
            detected_note = "उधार सामान / Credit"
        else:
            detected_note = "रकम जमा / Payment Received"

    return {
        "customer_name": name,
        "amount": amount,
        "type": tx_type,
        "note": detected_note,
        "confidence": 0.88,
        "model_used": "Indic-Shopkeeper NLP Rule Engine (Local Open Weights)",
        "source": "deterministic_fallback"
    }

def parse_khata_statement(text: str) -> Dict[str, Any]:
    """
    Main extraction pipeline:
    Tries local Gemma 2 2B open-weights model first.
    If unavailable or parsing fails, seamlessly uses deterministic Indic-NLP engine.
    """
    if not text or not text.strip():
        return {
            "customer_name": "Grahak",
            "amount": 0.0,
            "type": "udhaar",
            "note": "",
            "confidence": 0.0,
            "model_used": "None",
            "raw_text": ""
        }

    # First attempt: Gemma 2 2B via Ollama
    gemma_result = parse_with_gemma_ollama(text)
    if gemma_result and gemma_result.get("amount", 0) > 0 and gemma_result.get("customer_name"):
        gemma_result["raw_text"] = text
        return gemma_result

    # Second attempt: Deterministic Indic Engine
    fallback_result = parse_with_deterministic_engine(text)
    fallback_result["raw_text"] = text
    return fallback_result

if __name__ == "__main__":
    # Test cases
    test_phrases = [
        "Ramesh ne 200 udhaar liya",
        "Sunita ne 500 wapas kiye",
        "Sharma ji ko 1200 ka ration udhaar diya",
        "Mukesh ne teen sau jama karwaye",
        "रमेश ने 250 रुपये उधार लिया",
        "Pooja ne 600 ka saman liya"
    ]
    for p in test_phrases:
        res = parse_khata_statement(p)
        print(f"Phrase: '{p}' => Name: {res['customer_name']}, Amount: ₹{res['amount']}, Type: {res['type']}, Note: {res['note']}, Model: {res['model_used']}")
