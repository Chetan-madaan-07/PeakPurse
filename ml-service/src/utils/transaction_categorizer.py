"""
Transaction categorizer using rule-based logic + Gemini fallback.
Categories: Food & Dining, Transportation, Shopping, Entertainment,
            Healthcare, Utilities, Finance, Education, Travel, Other
"""

import re
import hashlib
from typing import List, Dict, Optional
from datetime import datetime
import structlog

logger = structlog.get_logger()

CATEGORIES = [
    'Food & Dining', 'Transportation', 'Shopping', 'Entertainment',
    'Healthcare', 'Utilities', 'Finance', 'Education', 'Travel',
    'Salary & Income', 'Transfer', 'Other'
]

# Rule-based keyword map — ordered by specificity
RULES: List[tuple] = [
    # Food & Dining
    ('Food & Dining', [
        'zomato', 'swiggy', 'dominos', 'pizza', 'burger', 'kfc', 'mcdonalds',
        'restaurant', 'cafe', 'coffee', 'starbucks', 'food', 'dining', 'eat',
        'blinkit', 'zepto', 'bigbasket', 'grocer', 'grocery', 'supermarket',
        'dmart', 'reliance fresh', 'more supermarket', 'instamart',
    ]),
    # Transportation
    ('Transportation', [
        'uber', 'ola', 'rapido', 'taxi', 'cab', 'auto', 'metro', 'irctc',
        'railway', 'train', 'bus', 'petrol', 'diesel', 'fuel', 'hp petrol',
        'indian oil', 'bharat petroleum', 'fastag', 'toll', 'parking',
        'redbus', 'makemytrip transport',
    ]),
    # Shopping
    ('Shopping', [
        'amazon', 'flipkart', 'myntra', 'ajio', 'nykaa', 'meesho',
        'snapdeal', 'shopify', 'mall', 'store', 'retail', 'fashion',
        'clothing', 'apparel', 'shoes', 'electronics', 'croma', 'reliance digital',
    ]),
    # Entertainment
    ('Entertainment', [
        'netflix', 'prime video', 'hotstar', 'disney', 'spotify', 'youtube',
        'gaana', 'jio cinema', 'zee5', 'sonyliv', 'movie', 'cinema', 'pvr',
        'inox', 'bookmyshow', 'gaming', 'steam', 'playstation',
    ]),
    # Healthcare
    ('Healthcare', [
        'hospital', 'clinic', 'doctor', 'medical', 'pharmacy', 'chemist',
        'apollo', 'fortis', 'max hospital', 'medplus', 'netmeds', 'pharmeasy',
        '1mg', 'health', 'diagnostic', 'lab test', 'pathology',
    ]),
    # Utilities
    ('Utilities', [
        'electricity', 'bescom', 'msedcl', 'tata power', 'adani electricity',
        'water bill', 'gas bill', 'mahanagar gas', 'indraprastha gas',
        'broadband', 'internet', 'airtel', 'jio', 'vi ', 'vodafone',
        'bsnl', 'mobile recharge', 'dth', 'tata sky', 'dish tv',
    ]),
    # Finance
    ('Finance', [
        'emi', 'loan', 'insurance', 'lic', 'hdfc life', 'icici prudential',
        'sbi life', 'bajaj allianz', 'mutual fund', 'sip', 'zerodha',
        'groww', 'upstox', 'nse', 'bse', 'demat', 'credit card payment',
        'atm withdrawal', 'atm cash', 'neft', 'rtgs', 'imps',
    ]),
    # Education
    ('Education', [
        'school', 'college', 'university', 'tuition', 'coaching',
        'udemy', 'coursera', 'byju', 'unacademy', 'vedantu', 'books',
        'stationery', 'exam fee', 'admission fee',
    ]),
    # Travel
    ('Travel', [
        'hotel', 'oyo', 'makemytrip', 'goibibo', 'yatra', 'cleartrip',
        'flight', 'indigo', 'air india', 'spicejet', 'vistara',
        'airbnb', 'resort', 'holiday', 'tour',
    ]),
    # Salary & Income
    ('Salary & Income', [
        'salary', 'payroll', 'wages', 'stipend', 'bonus', 'incentive',
        'dividend', 'interest credit', 'refund',
    ]),
    # Transfer
    ('Transfer', [
        'transfer to', 'transfer from', 'upi', 'gpay', 'phonepe', 'paytm',
        'bhim', 'neft transfer', 'rtgs transfer', 'self transfer',
    ]),
]


def categorize_rule_based(description: str) -> str:
    """Fast rule-based categorization."""
    text = description.lower()
    for category, keywords in RULES:
        if any(kw in text for kw in keywords):
            return category
    return 'Other'


def build_transaction_output(
    raw_txns: List[Dict],
    page_width: float = 595.0,
    page_height: float = 842.0,
) -> Dict:
    """
    Convert raw parsed transactions into the final API response format.
    Adds category, hash, metadata. Returns the full response dict.
    """
    transactions = []
    seen_hashes = set()

    for idx, txn in enumerate(raw_txns):
        description = (txn.get('description') or '').strip()
        date_str = txn.get('date', '')
        amount = txn.get('amount')

        if not date_str or amount is None:
            continue

        # Categorize
        category = categorize_rule_based(description)

        # Merchant name = first meaningful part of description
        merchant_name = _extract_merchant(description)

        # Deduplication hash
        tx_hash = _make_hash(date_str, amount, merchant_name)
        if tx_hash in seen_hashes:
            continue
        seen_hashes.add(tx_hash)

        # Bounding box — use row_index to create approximate bbox for overlay
        page_num = txn.get('page_number', 1)
        row_idx = txn.get('row_index', idx)
        bbox = txn.get('bbox') or _estimate_bbox(row_idx, page_width, page_height)

        transactions.append({
            'transaction_hash': tx_hash,
            'date': date_str,
            'amount': float(amount),
            'merchant_name': merchant_name,
            'description': description or merchant_name,
            'category': category,
            'category_source': 'rule',
            'is_recurring': _is_recurring(description),
            'tax_relevant': _is_tax_relevant(description, category),
            'confidence': 0.85,
            'page_number': page_num,
            'transaction_index': idx,
            'raw_tokens': [],
            'processed_at': datetime.utcnow().isoformat(),
            'processor_version': '2.0.0',
            'boundingBox': bbox,
        })

    return {
        'success': True,
        'data': {
            'transactions': transactions,
            'metadata': {
                'total_pages': max((t.get('page_number', 1) for t in raw_txns), default=1),
                'total_transactions': len(transactions),
                'processing_time': 0,
                'model_version': '2.0.0',
            },
        },
    }


def _extract_merchant(description: str) -> str:
    if not description:
        return 'Unknown'
    # Take first 40 chars, clean up
    parts = re.split(r'[/\-|]', description)
    merchant = parts[0].strip()
    merchant = re.sub(r'\s+', ' ', merchant)
    return merchant[:60] if merchant else 'Unknown'


def _make_hash(date_str: str, amount: float, merchant: str) -> str:
    raw = f"{date_str}|{amount:.2f}|{merchant.lower().strip()}"
    return hashlib.sha256(raw.encode()).hexdigest()


def _is_recurring(description: str) -> bool:
    text = description.lower()
    return any(k in text for k in [
        'emi', 'subscription', 'monthly', 'annual', 'rent', 'salary',
        'netflix', 'spotify', 'prime', 'insurance', 'sip',
    ])


def _is_tax_relevant(description: str, category: str) -> bool:
    if category in ('Healthcare', 'Education', 'Finance'):
        return True
    text = description.lower()
    return any(k in text for k in ['insurance', 'medical', 'hospital', 'donation', 'elss', 'nps', 'ppf'])


def _estimate_bbox(row_idx: int, page_width: float, page_height: float) -> Dict:
    """
    Estimate a bounding box for the PDF overlay based on row position.
    Returns percentage-based coordinates for the frontend overlay.
    """
    # Assume transactions start at ~20% from top, each row ~4% height
    y_start = 20 + (row_idx * 4.5)
    return {
        'x': 5,
        'y': min(y_start, 90),
        'width': 90,
        'height': 4,
    }
