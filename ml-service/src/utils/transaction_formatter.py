"""
Transaction formatter for structuring ML output into database-ready JSON
"""

from typing import List, Dict, Optional, Tuple
import re
import hashlib
from datetime import datetime
import structlog

logger = structlog.get_logger()


class TransactionFormatter:
    """Formatter for converting ML predictions to database-ready transaction objects"""
    
    # Indian bank transaction patterns
    DATE_PATTERNS = [
        r'\b\d{2}/\d{2}/\d{4}\b',      # DD/MM/YYYY
        r'\b\d{2}-\d{2}-\d{4}\b',      # DD-MM-YYYY
        r'\b\d{2}\.\d{2}\.\d{4}\b',    # DD.MM.YYYY
        r'\b\d{2}/\d{2}/\d{2}\b',      # DD/MM/YY
        r'\b\d{1,2}\s+\w+\s+\d{4}\b',  # DD Month YYYY
    ]
    
    AMOUNT_PATTERNS = [
        r'\b\d{1,3}(?:,\d{3})*(?:\.\d{2})?\b',  # 1,234.56
        r'\b\d{1,3}(?:\s\d{3})*(?:\.\d{2})?\b',  # 1 234.56
        r'\b\d+\.\d{2}\b',                      # 1234.56
        r'\b\d+\b',                            # 1234
    ]
    
    def __init__(self):
        """Initialize the transaction formatter"""
        self.date_regex = re.compile('|'.join(self.DATE_PATTERNS))
        self.amount_regex = re.compile('|'.join(self.AMOUNT_PATTERNS))
        
    def format_transactions(self, ml_output: List[Dict]) -> List[Dict]:
        """
        Format ML output into database-ready transaction objects
        
        Args:
            ml_output: List of processed pages with transactions from LayoutLM
            
        Returns:
            List of transaction dictionaries matching database schema
        """
        formatted_transactions = []
        
        for page in ml_output:
            page_number = page.get('page_number', 1)
            transactions = page.get('transactions', [])
            
            logger.info("Formatting transactions from page", 
                        page_number=page_number, 
                        raw_transactions=len(transactions))
            
            for idx, transaction in enumerate(transactions):
                formatted_tx = self._format_single_transaction(transaction, page_number, idx)
                if formatted_tx:
                    formatted_transactions.append(formatted_tx)
        
        logger.info("Formatted transactions", total=len(formatted_transactions))
        return formatted_transactions
    
    def _format_single_transaction(self, transaction: Dict, page_number: int, index: int) -> Optional[Dict]:
        """
        Format a single transaction object
        
        Args:
            transaction: Raw transaction from ML output
            page_number: Page number where transaction was found
            index: Transaction index on the page
            
        Returns:
            Formatted transaction dictionary or None if invalid
        """
        try:
            # Extract and validate date
            date_obj = self._parse_date(transaction.get('date'))
            if not date_obj:
                logger.warning("Invalid date, skipping transaction", 
                            date=transaction.get('date'))
                return None
            
            # Extract and validate amount
            amount = self._parse_amount(transaction.get('amount'))
            if amount is None:
                logger.warning("Invalid amount, skipping transaction", 
                            amount=transaction.get('amount'))
                return None
            
            # Extract merchant name
            merchant_name = self._clean_merchant_name(transaction.get('merchant_name'))
            
            # Create description
            description = self._create_description(transaction)
            
            # Generate unique hash for deduplication
            transaction_hash = self._generate_hash(date_obj, amount, merchant_name)
            
            # Determine category (rule-based for now, will be enhanced later)
            category = self._categorize_transaction(merchant_name, description)
            
            # Create formatted transaction
            formatted_tx = {
                # Database schema fields
                "transaction_hash": transaction_hash,
                "date": date_obj.isoformat(),
                "amount": float(amount),
                "merchant_name": merchant_name,
                "description": description,
                "category": category,
                "category_source": "ml",  # Will be 'rule', 'ml', or 'user_override'
                "is_recurring": self._detect_recurring(merchant_name, description),
                "tax_relevant": self._is_tax_relevant(merchant_name, description),
                
                # Metadata
                "confidence": float(transaction.get('confidence', 0.0)),
                "page_number": page_number,
                "transaction_index": index,
                "raw_tokens": transaction.get('tokens', []),
                
                # Processing metadata
                "processed_at": datetime.utcnow().isoformat(),
                "processor_version": "1.0.0"
            }
            
            return formatted_tx
            
        except Exception as e:
            logger.error("Failed to format transaction", 
                        error=str(e), 
                        transaction=transaction)
            return None
    
    def _parse_date(self, date_str: str) -> Optional[datetime]:
        """
        Parse date string into datetime object
        
        Args:
            date_str: Raw date string
            
        Returns:
            datetime object or None if parsing fails
        """
        if not date_str:
            return None
        
        date_str = date_str.strip()
        
        # Try different date formats
        date_formats = [
            '%d/%m/%Y', '%d-%m-%Y', '%d.%m.%Y',
            '%d/%m/%y', '%d %b %Y', '%d %B %Y'
        ]
        
        for fmt in date_formats:
            try:
                return datetime.strptime(date_str, fmt)
            except ValueError:
                continue
        
        # Try regex-based parsing
        match = self.date_regex.search(date_str)
        if match:
            matched_date = match.group()
            # Try parsing the matched date
            for fmt in date_formats:
                try:
                    return datetime.strptime(matched_date, fmt)
                except ValueError:
                    continue
        
        return None
    
    def _parse_amount(self, amount_str: str) -> Optional[float]:
        """
        Parse amount string into float
        
        Args:
            amount_str: Raw amount string
            
        Returns:
            Float amount or None if parsing fails
        """
        if not amount_str:
            return None
        
        amount_str = amount_str.strip()
        
        # Remove common currency symbols and text
        amount_str = re.sub(r'[Rs₹$,\s]', '', amount_str)
        amount_str = re.sub(r'(?i)cr|crore|lakh|lac|thousand|k', '', amount_str)
        
        # Find amount using regex
        match = self.amount_regex.search(amount_str)
        if match:
            matched_amount = match.group()
            try:
                return float(matched_amount.replace(',', ''))
            except ValueError:
                pass
        
        # Try direct conversion
        try:
            return float(amount_str)
        except ValueError:
            return None
    
    def _clean_merchant_name(self, merchant_name: str) -> str:
        """
        Clean and normalize merchant name
        
        Args:
            merchant_name: Raw merchant name
            
        Returns:
            Cleaned merchant name
        """
        if not merchant_name:
            return "Unknown Merchant"
        
        # Remove extra whitespace and special characters
        cleaned = re.sub(r'\s+', ' ', merchant_name.strip())
        cleaned = re.sub(r'[^\w\s\-&.,]', '', cleaned)
        
        # Capitalize properly
        cleaned = cleaned.title()
        
        return cleaned[:100]  # Limit length
    
    def _create_description(self, transaction: Dict) -> str:
        """
        Create transaction description from available fields
        
        Args:
            transaction: Raw transaction data
            
        Returns:
            Description string
        """
        description_parts = []
        
        # Add merchant name if available
        if transaction.get('merchant_name'):
            description_parts.append(transaction['merchant_name'])
        
        # Add description if available and different from merchant
        raw_description = transaction.get('description', '')
        if raw_description and raw_description != transaction.get('merchant_name'):
            description_parts.append(raw_description)
        
        # Combine parts
        description = ' - '.join(description_parts)
        
        # Limit length
        return description[:255] if description else "Transaction"
    
    def _generate_hash(self, date_obj: datetime, amount: float, merchant_name: str) -> str:
        """
        Generate unique hash for transaction deduplication
        
        Args:
            date_obj: Transaction date
            amount: Transaction amount
            merchant_name: Merchant name
            
        Returns:
            SHA-256 hash
        """
        # Create normalized string for hashing
        hash_string = f"{date_obj.date().isoformat()}|{amount:.2f}|{merchant_name.lower().strip()}"
        
        # Generate SHA-256 hash
        return hashlib.sha256(hash_string.encode()).hexdigest()
    
    def _categorize_transaction(self, merchant_name: str, description: str) -> str:
        """
        Categorize transaction using rule-based logic
        
        Args:
            merchant_name: Cleaned merchant name
            description: Transaction description
            
        Returns:
            Category string
        """
        text = f"{merchant_name} {description}".lower()
        
        # Food categories
        if any(keyword in text for keyword in ['restaurant', 'cafe', 'food', 'pizza', 'burger', 'swiggy', 'zomato']):
            return 'Food & Dining'
        
        # Transport
        if any(keyword in text for keyword in ['uber', 'ola', 'taxi', 'metro', 'bus', 'petrol', 'diesel']):
            return 'Transportation'
        
        # Shopping
        if any(keyword in text for keyword in ['amazon', 'flipkart', 'mall', 'store', 'shopping']):
            return 'Shopping'
        
        # Utilities
        if any(keyword in text for keyword in ['electricity', 'water', 'gas', 'phone', 'internet']):
            return 'Utilities'
        
        # Entertainment
        if any(keyword in text for keyword in ['netflix', 'prime', 'spotify', 'movie', 'entertainment']):
            return 'Entertainment'
        
        # Health
        if any(keyword in text for keyword in ['hospital', 'medical', 'pharmacy', 'doctor']):
            return 'Healthcare'
        
        # Finance
        if any(keyword in text for keyword in ['bank', 'atm', 'loan', 'emi', 'insurance']):
            return 'Finance'
        
        # Default category
        return 'Other'
    
    def _detect_recurring(self, merchant_name: str, description: str) -> bool:
        """
        Detect if transaction is recurring
        
        Args:
            merchant_name: Merchant name
            description: Transaction description
            
        Returns:
            True if likely recurring, False otherwise
        """
        text = f"{merchant_name} {description}".lower()
        
        # Common recurring patterns
        recurring_keywords = [
            'subscription', 'monthly', 'annual', 'emi', 'rent', 'salary',
            'netflix', 'prime', 'spotify', 'electric bill', 'phone bill'
        ]
        
        return any(keyword in text for keyword in recurring_keywords)
    
    def _is_tax_relevant(self, merchant_name: str, description: str) -> bool:
        """
        Determine if transaction is tax-relevant
        
        Args:
            merchant_name: Merchant name
            description: Transaction description
            
        Returns:
            True if tax-relevant, False otherwise
        """
        text = f"{merchant_name} {description}".lower()
        
        # Tax-relevant categories
        tax_keywords = [
            'insurance', 'medical', 'hospital', 'education', 'tuition',
            'donation', 'charity', 'investment', 'mutual fund', 'elss'
        ]
        
        return any(keyword in text for keyword in tax_keywords)
    
    def validate_transactions(self, transactions: List[Dict]) -> Tuple[List[Dict], List[str]]:
        """
        Validate formatted transactions
        
        Args:
            transactions: List of formatted transactions
            
        Returns:
            Tuple of (valid_transactions, error_messages)
        """
        valid_transactions = []
        errors = []
        
        for i, tx in enumerate(transactions):
            tx_errors = []
            
            # Required fields
            if not tx.get('transaction_hash'):
                tx_errors.append("Missing transaction hash")
            
            if not tx.get('date'):
                tx_errors.append("Missing or invalid date")
            
            if tx.get('amount') is None:
                tx_errors.append("Missing or invalid amount")
            
            if not tx.get('merchant_name'):
                tx_errors.append("Missing merchant name")
            
            # Confidence threshold
            if tx.get('confidence', 0) < 0.7:
                tx_errors.append(f"Low confidence: {tx.get('confidence', 0):.2f}")
            
            if tx_errors:
                errors.append(f"Transaction {i}: {'; '.join(tx_errors)}")
            else:
                valid_transactions.append(tx)
        
        return valid_transactions, errors
