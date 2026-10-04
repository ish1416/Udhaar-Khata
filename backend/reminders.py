import urllib.parse
import requests
import json
import logging
from typing import Dict, Any, List

logger = logging.getLogger(__name__)

def generate_reminder_templates(customer_name: str, amount: float, shop_name: str = "पिताजी का खाता (Udhaar Khata)") -> List[Dict[str, Any]]:
    """Generate 3 distinct cultural tones of payment reminders in Hindi/Hinglish."""
    amt_str = f"₹{amount:,.0f}" if amount == int(amount) else f"₹{amount:,.2f}"
    
    # 1. Polite & Respectful (विनम्र)
    polite = (
        f"नमस्ते {customer_name} जी, आशा है आप सपरिवार सकुशल हैं।\n"
        f"आपकी दुकान के खाते में कुल {amt_str} का बकाया हिसाब बाकी है। "
        f"जब भी आपको समय व सुविधा मिले, कृपया हिसाब चुकता कर दीजिएगा।\n"
        f"सहयोग के लिए धन्यवाद!\n"
        f"— {shop_name}"
    )

    # 2. Friendly & Casual (मित्रतापूर्ण)
    friendly = (
        f"अरे {customer_name} भाई, राम-राम!\n"
        f"दुकान का {amt_str} का पुराना बाकी बैलेंस चल रहा था। "
        f"जब भी बाज़ार का चक्कर लगे या UPI/ऑनलाइन कर सको तो भेज देना भाई।\n"
        f"धन्यवाद!"
    )

    # 3. Formal & Business-like (व्यावसायिक)
    formal = (
        f"【उधार खाता सूचना】\n"
        f"आदरणीय {customer_name} जी,\n"
        f"आपके खाते का वर्तमान शेष बकाया: {amt_str} है।\n"
        f"कृपया सुविधा अनुसार शीघ्र भुगतान कर खाता अद्यतन कराएं। किसी भी प्रश्न या विवरण के लिए संपर्क करें।\n"
        f"— {shop_name}"
    )

    return [
        {
            "id": "polite",
            "title_hin": "विनम्र संदेश (Polite)",
            "title_eng": "Polite & Respectful",
            "badge_color": "emerald",
            "message": polite
        },
        {
            "id": "friendly",
            "title_hin": "मित्रतापूर्ण संदेश (Friendly)",
            "title_eng": "Friendly & Casual",
            "badge_color": "sky",
            "message": friendly
        },
        {
            "id": "formal",
            "title_hin": "व्यावसायिक संदेश (Formal)",
            "title_eng": "Formal Business Notice",
            "badge_color": "amber",
            "message": formal
        }
    ]

def generate_gemma_custom_reminder(customer_name: str, amount: float, instructions: str = "", model_name: str = "gemma2:2b") -> str:
    """Use open-weights Gemma 2 2B to draft a tailored bilingual reminder."""
    prompt = f"""You are a polite, respectful Indian shopkeeper assistant helping a father draft a reminder to his customer.
Customer Name: {customer_name}
Outstanding Balance: ₹{amount}
Extra Context: {instructions}

Draft a warm, polite reminder message in Hindi (in Devanagari script or clean Hinglish) asking them to settle the balance when convenient.
Keep it respectful, friendly, and under 50 words. Do NOT sound aggressive.

Message:"""

    try:
        response = requests.post(
            "http://localhost:11434/api/generate",
            json={
                "model": model_name,
                "prompt": prompt,
                "stream": False,
                "options": {
                    "temperature": 0.4,
                    "top_p": 0.9
                }
            },
            timeout=8
        )
        if response.status_code == 200:
            res_data = response.json()
            msg = res_data.get("response", "").strip()
            # Clean quotes if any
            if msg.startswith('"') and msg.endswith('"'):
                msg = msg[1:-1]
            return msg
    except Exception as e:
        logger.warning(f"Gemma reminder generation error: {e}")
    
    # Fallback to polite template
    templates = generate_reminder_templates(customer_name, amount)
    return templates[0]["message"]

def create_whatsapp_url(phone: str, message: str) -> str:
    """Creates a universal WhatsApp click-to-chat URL."""
    clean_phone = "".join(filter(str.isdigit, phone))
    # If standard 10 digit Indian number without country code, prepend 91
    if len(clean_phone) == 10:
        clean_phone = f"91{clean_phone}"
    encoded_text = urllib.parse.quote(message)
    if clean_phone:
        return f"https://api.whatsapp.com/send?phone={clean_phone}&text={encoded_text}"
    return f"https://api.whatsapp.com/send?text={encoded_text}"
