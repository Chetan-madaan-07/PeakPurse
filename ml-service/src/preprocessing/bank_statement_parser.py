"""
Bank statement parser.
Strategy (fastest to slowest):
  1. pdfplumber table extraction  - handles 90% of digital bank PDFs in < 1s
  2. pdfplumber text line parsing - handles non-table PDFs
  3. Gemini                       - last resort for scanned/unusual PDFs
"""

import pdfplumber
import re
import json
import os
from typing import List, Dict, Optional, Tuple
from datetime import datetime
from io import BytesIO
import structlog

logger = structlog.get_logger()

DATE_FORMATS = [
    '%d/%m/%Y', '%d-%m-%Y', '%d.%m.%Y',
    '%d/%m/%y', '%d-%m-%y',
    '%d %b %Y', '%d %b %y',
    '%d %B %Y', '%d %B %y',
    '%Y-%m-%d',
    '%b %d',   # Mar 02 (no year — will default to current year)
    '%b %d, %Y',
]

DATE_HEADERS = {
    'date', 'txn date', 'transaction date', 'value date',
    'posting date', 'dt', 'trans date', 'tran date',
}
DESC_HEADERS = {
    'description', 'particulars', 'narration', 'details',
    'remarks', 'transaction details', 'transaction remarks',
    'transaction narration', 'chq/ref no.', 'ref no',
}
DEBIT_HEADERS = {
    'debit', 'withdrawal', 'dr', 'debit amount',
    'withdrawal amount', 'amount debited', 'debit(dr)',
}
CREDIT_HEADERS = {
    'credit', 'deposit', 'cr', 'credit amount',
    'deposit amount', 'amount credited', 'credit(cr)',
}
BALANCE_HEADERS = {
    'balance', 'closing balance', 'running balance',
    'available balance', 'bal', 'closing bal',
}
AMOUNT_HEADERS = {'amount', 'transaction amount', 'txn amount'}

# Matches dates like 01/04/2025 or 1 Apr 2025
DATE_RE = re.compile(
    r'\b(\d{1,2}[\/\-\.]\d{1,2}[\/\-\.]\d{2,4})\b'
    r'|\b(\d{1,2}\s+(?:Jan|Feb|Mar|Apr|May|Jun|Jul|Aug|Sep|Oct|Nov|Dec)[a-z]*\s+\d{2,4})\b',
    re.IGNORECASE,
)

# Strict amount: must have comma separators OR decimal — avoids phone numbers
STRICT_AMOUNT_RE = re.compile(
    r'\b(\d{1,3}(?:,\d{2,3})+(?:\.\d{2})?|\d+\.\d{2})\b'
)


class BankStatementParser:

    def parse(self, pdf_bytes: bytes, password: str = "") -> List[Dict]:
        """Main entry. Returns list of transaction dicts."""

        # Strategy 1: table extraction
        txns = self._try_table_extraction(pdf_bytes, password)
        if txns:
            logger.info("Table extraction succeeded", count=len(txns))
            return txns

        # Strategy 2: text line parsing
        txns = self._try_text_extraction(pdf_bytes, password)
        if txns:
            logger.info("Text line extraction succeeded", count=len(txns))
            return txns

        # Strategy 3: Gemini (last resort)
        txns = self._try_gemini(pdf_bytes, password)
        if txns:
            logger.info("Gemini extraction succeeded", count=len(txns))
            return txns

        logger.warning("All extraction strategies failed")
        return []

    # ── Strategy 1: Table extraction ─────────────────────────────────────────

    def _try_table_extraction(self, pdf_bytes: bytes, password: str) -> List[Dict]:
        results = []
        try:
            kwargs = {"password": password} if password else {}
            with pdfplumber.open(BytesIO(pdf_bytes), **kwargs) as pdf:
                for page_num, page in enumerate(pdf.pages):
                    # Try line-based table detection first
                    tables = page.extract_tables({
                        "vertical_strategy": "lines",
                        "horizontal_strategy": "lines",
                    })
                    # Fall back to text-based detection
                    if not tables:
                        tables = page.extract_tables({
                            "vertical_strategy": "text",
                            "horizontal_strategy": "text",
                        })
                    for table in (tables or []):
                        txns = self._parse_table(table, page_num + 1)
                        results.extend(txns)
        except Exception as e:
            logger.warning("Table extraction error", error=str(e))
        return results

    def _parse_table(self, table: List, page_num: int) -> List[Dict]:
        if not table or len(table) < 1:
            return []
        header_idx, col_map = self._detect_columns(table)
        if col_map is None or "date" not in col_map:
            return []

        results = []
        for row_idx, row in enumerate(table):
            if row_idx <= header_idx:  # skip header (header_idx=-1 means skip nothing)
                continue
            if not row or all(not c for c in row):
                continue
            txn = self._row_to_txn(row, col_map, page_num, row_idx)
            if txn:
                results.append(txn)
        return results

    def _detect_columns(self, table: List) -> Tuple[int, Optional[Dict]]:
        # Extended headers including 'category' column (ignore it) and 'amount' with +/- signs
        for row_idx, row in enumerate(table[:6]):
            if not row:
                continue
            cells = [re.sub(r'[^a-z0-9 /]', '', str(c or "").strip().lower()) for c in row]
            col_map = {}
            for ci, cell in enumerate(cells):
                if cell in DATE_HEADERS and "date" not in col_map:
                    col_map["date"] = ci
                elif cell in DESC_HEADERS and "desc" not in col_map:
                    col_map["desc"] = ci
                elif cell in DEBIT_HEADERS and "debit" not in col_map:
                    col_map["debit"] = ci
                elif cell in CREDIT_HEADERS and "credit" not in col_map:
                    col_map["credit"] = ci
                elif cell in BALANCE_HEADERS and "balance" not in col_map:
                    col_map["balance"] = ci
                elif cell in AMOUNT_HEADERS and "amount" not in col_map:
                    col_map["amount"] = ci
                # 'category' column — just skip it, don't map

            has_amount = any(k in col_map for k in ("debit", "credit", "amount"))
            if "date" in col_map and has_amount:
                return row_idx, col_map

        # No header found — try to infer columns from first data row
        # Pattern: first col looks like a date, last two cols look like amounts
        if table:
            first_data = table[0]
            if first_data and self._parse_date(str(first_data[0] or "")):
                # Guess: col0=date, col1=desc, last=balance, second-to-last=amount
                n = len(first_data)
                col_map = {"date": 0}
                if n >= 2:
                    col_map["desc"] = 1
                if n >= 3:
                    col_map["amount"] = n - 2
                    col_map["balance"] = n - 1
                return -1, col_map  # -1 means no header row to skip

        return 0, None

    def _row_to_txn(self, row: List, col_map: Dict, page_num: int, row_idx: int) -> Optional[Dict]:
        def get(key) -> str:
            idx = col_map.get(key)
            if idx is not None and idx < len(row):
                val = row[idx]
                # Join multiline cell text
                return re.sub(r'\s+', ' ', str(val or "")).strip()
            return ""

        date_obj = self._parse_date(get("date"))
        if not date_obj:
            return None

        debit = self._parse_amount(get("debit"))
        credit = self._parse_amount(get("credit"))
        amt_raw = get("amount")
        amt_col = self._parse_amount(amt_raw)

        if debit and debit > 0:
            amount = -abs(debit)
        elif credit and credit > 0:
            amount = abs(credit)
        elif amt_col and amt_col > 0:
            # Check for explicit sign in the raw string: +/- prefix
            stripped = amt_raw.strip()
            if stripped.startswith('+'):
                amount = abs(amt_col)
            elif stripped.startswith('-'):
                amount = -abs(amt_col)
            else:
                # Fall back to description context
                desc_lower = get("desc").lower()
                if re.search(r'\bcr\b|\bcredit\b|\bdeposit\b|\bsalary\b|\brefund\b|\bincome\b', desc_lower):
                    amount = abs(amt_col)
                else:
                    amount = -abs(amt_col)
        else:
            return None

        return {
            "date": date_obj.strftime("%Y-%m-%d"),
            "description": get("desc"),
            "amount": amount,
            "balance": self._parse_amount(get("balance")),
            "page_number": page_num,
            "row_index": row_idx,
            "bbox": None,
        }

    # ── Strategy 2: Text line parsing ─────────────────────────────────────────

    def _try_text_extraction(self, pdf_bytes: bytes, password: str) -> List[Dict]:
        results = []
        try:
            kwargs = {"password": password} if password else {}
            with pdfplumber.open(BytesIO(pdf_bytes), **kwargs) as pdf:
                for page_num, page in enumerate(pdf.pages):
                    text = page.extract_text() or ""
                    txns = self._parse_text_lines(text, page_num + 1)
                    results.extend(txns)
        except Exception as e:
            logger.warning("Text extraction error", error=str(e))
        return results

    def _parse_text_lines(self, text: str, page_num: int) -> List[Dict]:
        results = []
        for line_idx, line in enumerate(text.split("\n")):
            line = line.strip()
            if len(line) < 15:
                continue

            date_match = DATE_RE.search(line)
            if not date_match:
                continue

            date_obj = self._parse_date(date_match.group(0))
            if not date_obj:
                continue

            # Use strict amount regex to avoid phone numbers
            amounts = []
            for m in STRICT_AMOUNT_RE.finditer(line):
                val = self._parse_amount(m.group(0))
                if val and 0.01 <= val <= 50_000_000:
                    amounts.append(val)

            if not amounts:
                continue

            # Second-to-last amount is transaction; last is usually balance
            txn_amount = amounts[-2] if len(amounts) >= 2 else amounts[0]

            line_lower = line.lower()
            if re.search(r'\bdr\b|\bdebit\b|\bwithdrawal\b', line_lower):
                txn_amount = -abs(txn_amount)
            elif re.search(r'\bcr\b|\bcredit\b|\bdeposit\b|\bsalary\b|\brefund\b', line_lower):
                txn_amount = abs(txn_amount)
            else:
                txn_amount = -abs(txn_amount)

            desc = DATE_RE.sub("", line)
            desc = STRICT_AMOUNT_RE.sub("", desc)
            desc = re.sub(r'\s+', ' ', desc).strip(" -|/\\")

            if not desc:
                continue

            results.append({
                "date": date_obj.strftime("%Y-%m-%d"),
                "description": desc[:100],
                "amount": txn_amount,
                "balance": amounts[-1] if len(amounts) >= 2 else None,
                "page_number": page_num,
                "row_index": line_idx,
                "bbox": None,
            })
        return results

    # ── Strategy 3: Gemini ────────────────────────────────────────────────────

    def _try_gemini(self, pdf_bytes: bytes, password: str) -> List[Dict]:
        try:
            from google.genai import Client
            key = os.getenv("GEMINI_API_KEY", "")
            if not key or key == "your_gemini_api_key_here":
                return []

            client = Client(api_key=key)

            kwargs = {"password": password} if password else {}
            with pdfplumber.open(BytesIO(pdf_bytes), **kwargs) as pdf:
                text = "\n".join(p.extract_text() or "" for p in pdf.pages)

            if len(text.strip()) < 50:
                return []

            prompt = (
                "Extract ALL bank transactions from this text. "
                "Return ONLY a JSON array. Each object must have: "
                '{"date":"YYYY-MM-DD","description":"string","amount":number} '
                "amount is NEGATIVE for debits/withdrawals, POSITIVE for credits/deposits/salary. "
                "Skip headers, balances, account info. Return [] if none found.\n\n"
                + text[:6000]
            )

            for model in ["gemini-2.0-flash-lite", "gemini-2.0-flash"]:
                try:
                    resp = client.models.generate_content(
                        model=model,
                        contents=prompt,
                        config={"temperature": 0.1, "max_output_tokens": 4096},
                    )
                    raw = resp.text.strip()
                    # Strip markdown fences
                    raw = re.sub(r'^```(?:json)?\s*', '', raw)
                    raw = re.sub(r'\s*```$', '', raw)

                    parsed = json.loads(raw)
                    if not isinstance(parsed, list):
                        continue

                    results = []
                    for item in parsed:
                        date_obj = self._parse_date(str(item.get("date", "")))
                        if not date_obj:
                            continue
                        try:
                            amount = float(item.get("amount", 0))
                        except (TypeError, ValueError):
                            continue
                        if amount == 0:
                            continue
                        results.append({
                            "date": date_obj.strftime("%Y-%m-%d"),
                            "description": str(item.get("description", ""))[:100],
                            "amount": amount,
                            "balance": None,
                            "page_number": 1,
                            "row_index": len(results),
                            "bbox": None,
                        })
                    return results
                except Exception:
                    continue
        except Exception as e:
            logger.warning("Gemini fallback failed", error=str(e))
        return []

    # ── Helpers ───────────────────────────────────────────────────────────────

    def _parse_date(self, s: str) -> Optional[datetime]:
        if not s:
            return None
        s = s.strip()
        # Normalize separators
        normalized = re.sub(r'[-\.]', '/', s)
        for fmt in DATE_FORMATS:
            for candidate in (s, normalized):
                try:
                    dt = datetime.strptime(candidate, fmt)
                    # If no year in format, use current year
                    if dt.year == 1900:
                        dt = dt.replace(year=datetime.now().year)
                    return dt
                except ValueError:
                    pass
        return None

    def _parse_amount(self, s: str) -> Optional[float]:
        if not s:
            return None
        # Remove currency symbols, spaces, plus sign (keep minus for sign detection upstream)
        cleaned = re.sub(r'[₹Rs\$€£\s+]', '', str(s))
        # Remove commas
        cleaned = cleaned.replace(',', '')
        # Remove trailing Dr/Cr
        cleaned = re.sub(r'(?i)(dr|cr)$', '', cleaned).strip()
        # Remove any non-numeric except decimal point and leading minus
        if cleaned.startswith('-'):
            cleaned = '-' + re.sub(r'[^\d.]', '', cleaned[1:])
        else:
            cleaned = re.sub(r'[^\d.]', '', cleaned)
        try:
            val = float(cleaned)
            return abs(val) if val != 0 else None
        except ValueError:
            return None
