import sqlite3
import os
import uuid
from datetime import datetime
from typing import List, Dict, Any, Optional

DB_FILE = os.path.join(os.path.dirname(__file__), "udhaar_khata.db")

def get_db():
    conn = sqlite3.connect(DB_FILE)
    conn.row_factory = sqlite3.Row
    return conn

def init_db():
    conn = get_db()
    cursor = conn.cursor()
    cursor.execute("""
    CREATE TABLE IF NOT EXISTS customers (
        id TEXT PRIMARY KEY,
        name TEXT NOT NULL,
        phone TEXT DEFAULT '',
        balance REAL DEFAULT 0.0,
        note TEXT DEFAULT '',
        created_at TEXT NOT NULL,
        updated_at TEXT NOT NULL
    );
    """)
    cursor.execute("""
    CREATE TABLE IF NOT EXISTS transactions (
        id TEXT PRIMARY KEY,
        customer_id TEXT NOT NULL,
        customer_name TEXT NOT NULL,
        amount REAL NOT NULL,
        type TEXT NOT NULL, -- 'udhaar' (debit: customer owes father) or 'jama' (credit: customer paid)
        note TEXT DEFAULT '',
        raw_transcript TEXT DEFAULT '',
        model_used TEXT DEFAULT 'gemma2:2b',
        created_at TEXT NOT NULL,
        FOREIGN KEY (customer_id) REFERENCES customers (id) ON DELETE CASCADE
    );
    """)
    conn.commit()
    conn.close()

def recalculate_customer_balance(customer_id: str):
    conn = get_db()
    cursor = conn.cursor()
    # balance = sum(udhaar) - sum(jama)
    # positive balance means customer owes money to shopkeeper/father (Lena hai)
    cursor.execute("""
        SELECT 
            COALESCE(SUM(CASE WHEN type = 'udhaar' THEN amount ELSE -amount END), 0.0) as net_balance
        FROM transactions
        WHERE customer_id = ?
    """, (customer_id,))
    row = cursor.fetchone()
    net_balance = row["net_balance"] if row else 0.0

    cursor.execute("""
        UPDATE customers 
        SET balance = ?, updated_at = ?
        WHERE id = ?
    """, (net_balance, datetime.now().isoformat(), customer_id))
    conn.commit()
    conn.close()
    return net_balance

def get_all_customers() -> List[Dict[str, Any]]:
    conn = get_db()
    cursor = conn.cursor()
    cursor.execute("""
        SELECT 
            c.*,
            (SELECT COUNT(*) FROM transactions t WHERE t.customer_id = c.id) as transaction_count,
            (SELECT MAX(created_at) FROM transactions t WHERE t.customer_id = c.id) as last_transaction_at
        FROM customers c
        ORDER BY c.balance DESC, c.updated_at DESC
    """)
    rows = cursor.fetchall()
    customers = [dict(row) for row in rows]
    conn.close()
    return customers

def get_customer_by_id(customer_id: str) -> Optional[Dict[str, Any]]:
    conn = get_db()
    cursor = conn.cursor()
    cursor.execute("SELECT * FROM customers WHERE id = ?", (customer_id,))
    row = cursor.fetchone()
    conn.close()
    return dict(row) if row else None

def find_or_create_customer(name: str, phone: str = "") -> Dict[str, Any]:
    conn = get_db()
    cursor = conn.cursor()
    name_clean = name.strip()
    cursor.execute("SELECT * FROM customers WHERE LOWER(name) = LOWER(?)", (name_clean,))
    row = cursor.fetchone()
    if row:
        cust = dict(row)
        if phone and not cust.get("phone"):
            cursor.execute("UPDATE customers SET phone = ? WHERE id = ?", (phone, cust["id"]))
            conn.commit()
            cust["phone"] = phone
        conn.close()
        return cust
    
    # Create new customer
    new_id = str(uuid.uuid4())
    now = datetime.now().isoformat()
    cursor.execute("""
        INSERT INTO customers (id, name, phone, balance, note, created_at, updated_at)
        VALUES (?, ?, ?, 0.0, '', ?, ?)
    """, (new_id, name_clean, phone, now, now))
    conn.commit()
    cursor.execute("SELECT * FROM customers WHERE id = ?", (new_id,))
    new_cust = dict(cursor.fetchone())
    conn.close()
    return new_cust

def add_transaction(customer_name: str, amount: float, tx_type: str, note: str = "", raw_transcript: str = "", model_used: str = "gemma2:2b", phone: str = "") -> Dict[str, Any]:
    cust = find_or_create_customer(customer_name, phone=phone)
    conn = get_db()
    cursor = conn.cursor()
    tx_id = str(uuid.uuid4())
    now = datetime.now().isoformat()
    
    cursor.execute("""
        INSERT INTO transactions (id, customer_id, customer_name, amount, type, note, raw_transcript, model_used, created_at)
        VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
    """, (tx_id, cust["id"], cust["name"], amount, tx_type.lower(), note, raw_transcript, model_used, now))
    conn.commit()
    conn.close()

    new_balance = recalculate_customer_balance(cust["id"])
    cust["balance"] = new_balance

    return {
        "id": tx_id,
        "customer_id": cust["id"],
        "customer_name": cust["name"],
        "amount": amount,
        "type": tx_type.lower(),
        "note": note,
        "raw_transcript": raw_transcript,
        "model_used": model_used,
        "created_at": now,
        "customer_balance": new_balance
    }

def get_customer_transactions(customer_id: str) -> List[Dict[str, Any]]:
    conn = get_db()
    cursor = conn.cursor()
    cursor.execute("""
        SELECT * FROM transactions
        WHERE customer_id = ?
        ORDER BY created_at DESC
    """, (customer_id,))
    rows = cursor.fetchall()
    conn.close()
    return [dict(row) for row in rows]

def settle_customer_account(customer_id: str, note: str = "हिसाब चुकता / Account Settled") -> Optional[Dict[str, Any]]:
    cust = get_customer_by_id(customer_id)
    if not cust:
        return None
    balance = cust["balance"]
    if abs(balance) < 0.01:
        return None # already zero
    
    # If balance > 0 (customer owed father), customer pays that amount -> 'jama'
    # If balance < 0 (father owed customer), father pays that amount -> 'udhaar'
    settle_type = "jama" if balance > 0 else "udhaar"
    settle_amount = abs(balance)

    tx = add_transaction(
        customer_name=cust["name"],
        amount=settle_amount,
        tx_type=settle_type,
        note=note,
        raw_transcript="हिसाब चुकता (Auto Settlement)",
        model_used="system",
        phone=cust.get("phone", "")
    )
    return tx

def delete_transaction(transaction_id: str) -> bool:
    conn = get_db()
    cursor = conn.cursor()
    cursor.execute("SELECT customer_id FROM transactions WHERE id = ?", (transaction_id,))
    row = cursor.fetchone()
    if not row:
        conn.close()
        return False
    customer_id = row["customer_id"]
    cursor.execute("DELETE FROM transactions WHERE id = ?", (transaction_id,))
    conn.commit()
    conn.close()
    recalculate_customer_balance(customer_id)
    return True

def seed_sample_data():
    conn = get_db()
    cursor = conn.cursor()
    cursor.execute("SELECT COUNT(*) as count FROM customers")
    count = cursor.fetchone()["count"]
    conn.close()

    if count > 0:
        return # Already seeded

    # Seed realistic Indian neighbourhood shopkeeper accounts for Father
    samples = [
        {"name": "Ramesh Kumar", "phone": "9876543210", "tx": [
            ("udhaar", 350.0, "आटा 5 किलो और तेल", "Ramesh ne 350 ka aata aur tel udhaar liya"),
            ("jama", 150.0, "नगद वापस किए", "Ramesh ne 150 rupaye wapas diye"),
            ("udhaar", 200.0, "मसाले और चायपत्ती", "Ramesh ne 200 udhaar liya")
        ]},
        {"name": "Sunita Verma", "phone": "9812345678", "tx": [
            ("udhaar", 1200.0, "महीने का राशन", "Sunita ji ko 1200 ka ration diya"),
            ("jama", 500.0, "गूगल पे से जमा", "Sunita ne 500 wapas kiye")
        ]},
        {"name": "Sharma Ji (Doodh wale)", "phone": "9923456781", "tx": [
            ("udhaar", 850.0, "चीनी 10 किलो", "Sharma ji 850 ki cheeni le gaye"),
            ("jama", 850.0, "हिसाब चुकता किया", "Sharma ji ne pura hisaab de diya")
        ]},
        {"name": "Mukesh Bhai", "phone": "9765432109", "tx": [
            ("udhaar", 450.0, "दाल और साबुन", "Mukesh bhai ne 450 udhaar liya")
        ]},
        {"name": "Pooja Gupta", "phone": "9898989898", "tx": [
            ("udhaar", 600.0, "रिफाइंड और घी", "Pooja ne 600 ka saman liya"),
            ("jama", 300.0, "ऑनलाइन जमा", "Pooja ne 300 jama kiye")
        ]}
    ]

    for item in samples:
        cust = find_or_create_customer(item["name"], phone=item["phone"])
        for tx_type, amount, note, transcript in item["tx"]:
            add_transaction(
                customer_name=cust["name"],
                amount=amount,
                tx_type=tx_type,
                note=note,
                raw_transcript=transcript,
                model_used="gemma2:2b (Open Weights)",
                phone=item["phone"]
            )

if __name__ == "__main__":
    init_db()
    seed_sample_data()
    print("Database initialized and sample data seeded.")
