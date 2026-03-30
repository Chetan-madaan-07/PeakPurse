"""
LayoutLM integration for intelligent document understanding
"""

from transformers import LayoutLMTokenizer, LayoutLMForTokenClassification, pipeline
from typing import List, Dict, Tuple, Optional
import torch
import structlog
from ..preprocessing.pdf_parser import PDFParser

logger = structlog.get_logger()


class LayoutLMProcessor:
    """LayoutLM processor for token classification in financial documents"""
    
    # Token labels for financial document entities
    LABEL_MAPPING = {
        0: "O",           # Outside (not an entity)
        1: "DATE",        # Date entity
        2: "AMOUNT",      # Amount/money entity
        3: "MERCHANT",    # Merchant/vendor name
        4: "DESCRIPTION", # Transaction description
        5: "CATEGORY"     # Transaction category
    }
    
    def __init__(self, model_name: str = "microsoft/layoutlm-base-uncased"):
        """
        Initialize LayoutLM processor
        
        Args:
            model_name: Hugging Face model name for LayoutLM
        """
        self.model_name = model_name
        self.tokenizer = None
        self.model = None
        self.pipeline = None
        self.device = torch.device("cuda" if torch.cuda.is_available() else "cpu")
        
        logger.info("Initializing LayoutLM processor", model=model_name, device=str(self.device))
        
    def load_model(self):
        """Load the LayoutLM model and tokenizer"""
        try:
            logger.info("Loading LayoutLM tokenizer and model")
            
            # Load tokenizer
            self.tokenizer = LayoutLMTokenizer.from_pretrained(self.model_name)
            
            # Load model for token classification
            self.model = LayoutLMForTokenClassification.from_pretrained(self.model_name)
            
            # Move model to appropriate device
            self.model.to(self.device)
            self.model.eval()
            
            # Create pipeline for easier inference
            self.pipeline = pipeline(
                "token-classification",
                model=self.model,
                tokenizer=self.tokenizer,
                device=0 if self.device.type == "cuda" else -1
            )
            
            logger.info("LayoutLM model loaded successfully")
            
        except Exception as e:
            logger.error("Failed to load LayoutLM model", error=str(e))
            raise
    
    def process_pdf_data(self, pdf_data: List[Dict]) -> List[Dict]:
        """
        Process PDF data with LayoutLM to identify financial entities
        
        Args:
            pdf_data: List of page data from PDF parser
            
        Returns:
            List of processed pages with token predictions
        """
        if not self.pipeline:
            raise RuntimeError("Model not loaded. Call load_model() first.")
        
        processed_pages = []
        
        for page in pdf_data:
            logger.info("Processing page with LayoutLM", page_number=page['page_number'])
            
            # Extract words and their bounding boxes
            words = []
            boxes = []
            
            for line in page['lines']:
                for word in line['words']:
                    words.append(word['text'])
                    # Normalize bounding boxes to 0-1000 range as expected by LayoutLM
                    box = self._normalize_bbox(word['x0'], word['y0'], word['x1'], word['y1'], 
                                            page['width'], page['height'])
                    boxes.append(box)
            
            if not words:
                logger.warning("No words found in page", page_number=page['page_number'])
                continue
            
            # Tokenize and get predictions
            try:
                # Create input for LayoutLM
                encoding = self.tokenizer(
                    words,
                    boxes=boxes,
                    padding=True,
                    truncation=True,
                    return_tensors="pt"
                )
                
                # Get predictions
                with torch.no_grad():
                    outputs = self.model(**encoding)
                    predictions = torch.argmax(outputs.logits, dim=2)
                
                # Process predictions
                tokens_with_predictions = self._process_predictions(
                    words, boxes, predictions[0].tolist(), encoding
                )
                
                # Group tokens into transactions
                transactions = self._group_tokens_to_transactions(tokens_with_predictions)
                
                processed_page = {
                    "page_number": page['page_number'],
                    "transactions": transactions,
                    "raw_tokens": tokens_with_predictions
                }
                
                processed_pages.append(processed_page)
                
                logger.info("Successfully processed page", 
                          page_number=page['page_number'], 
                          transactions_found=len(transactions))
                
            except Exception as e:
                logger.error("Failed to process page with LayoutLM", 
                           page_number=page['page_number'], 
                           error=str(e))
                # Continue with next page
                continue
        
        return processed_pages
    
    def _normalize_bbox(self, x0: float, y0: float, x1: float, y1: float, 
                       page_width: float, page_height: float) -> List[int]:
        """
        Normalize bounding box coordinates to 0-1000 range for LayoutLM
        
        Args:
            x0, y0, x1, y1: Original bounding box coordinates
            page_width, page_height: Page dimensions
            
        Returns:
            Normalized bounding box as list of 4 integers
        """
        # Scale to 0-1000 range
        x0_norm = int(1000 * x0 / page_width)
        y0_norm = int(1000 * y0 / page_height)
        x1_norm = int(1000 * x1 / page_width)
        y1_norm = int(1000 * y1 / page_height)
        
        # Clamp to valid range
        x0_norm = max(0, min(1000, x0_norm))
        y0_norm = max(0, min(1000, y0_norm))
        x1_norm = max(0, min(1000, x1_norm))
        y1_norm = max(0, min(1000, y1_norm))
        
        return [x0_norm, y0_norm, x1_norm, y1_norm]
    
    def _process_predictions(self, words: List[str], boxes: List[List[int]], 
                            predictions: List[int], encoding) -> List[Dict]:
        """
        Process model predictions and align with original words
        
        Args:
            words: Original words from PDF
            boxes: Normalized bounding boxes
            predictions: Model predictions for each token
            encoding: Tokenizer encoding
            
        Returns:
            List of tokens with predictions
        """
        tokens_with_predictions = []
        
        # Get word_ids to map tokens back to words
        word_ids = encoding.word_ids()
        
        # Group predictions by word
        word_predictions = {}
        for i, word_id in enumerate(word_ids):
            if word_id is not None:
                if word_id not in word_predictions:
                    word_predictions[word_id] = []
                word_predictions[word_id].append(predictions[i])
        
        # Process each word
        for word_idx, word in enumerate(words):
            if word_idx in word_predictions:
                # Get majority vote for word prediction
                token_predictions = word_predictions[word_idx]
                prediction = max(set(token_predictions), key=token_predictions.count)
                
                # Get confidence score
                confidence = token_predictions.count(prediction) / len(token_predictions)
                
                token_data = {
                    "text": word,
                    "bbox": boxes[word_idx],
                    "label": self.LABEL_MAPPING.get(prediction, "O"),
                    "label_id": prediction,
                    "confidence": confidence,
                    "word_index": word_idx
                }
                
                tokens_with_predictions.append(token_data)
        
        return tokens_with_predictions
    
    def _group_tokens_to_transactions(self, tokens: List[Dict]) -> List[Dict]:
        """
        Group tokens into logical transactions based on spatial proximity and labels
        
        Args:
            tokens: List of tokens with predictions
            
        Returns:
            List of transaction dictionaries
        """
        transactions = []
        
        # Filter tokens with meaningful labels and high confidence
        meaningful_tokens = [
            token for token in tokens 
            if token['label'] != 'O' and token['confidence'] >= 0.8
        ]
        
        # Group tokens by spatial proximity (simple heuristic)
        if not meaningful_tokens:
            return transactions
        
        # Sort tokens by y-coordinate (top to bottom)
        sorted_tokens = sorted(meaningful_tokens, key=lambda t: t['bbox'][1])
        
        current_transaction_tokens = []
        
        for token in sorted_tokens:
            if not current_transaction_tokens:
                current_transaction_tokens = [token]
            else:
                # Check if this token is part of the current transaction
                last_token = current_transaction_tokens[-1]
                y_distance = token['bbox'][1] - last_token['bbox'][3]  # Distance from last token's bottom
                
                # If tokens are close vertically, group them
                if y_distance <= 50:  # 50 pixels threshold
                    current_transaction_tokens.append(token)
                else:
                    # Finish current transaction and start new one
                    if self._is_valid_transaction(current_transaction_tokens):
                        transaction = self._create_transaction_from_tokens(current_transaction_tokens)
                        transactions.append(transaction)
                    current_transaction_tokens = [token]
        
        # Add the last transaction
        if current_transaction_tokens and self._is_valid_transaction(current_transaction_tokens):
            transaction = self._create_transaction_from_tokens(current_transaction_tokens)
            transactions.append(transaction)
        
        return transactions
    
    def _is_valid_transaction(self, tokens: List[Dict]) -> bool:
        """
        Check if a group of tokens forms a valid transaction
        
        Args:
            tokens: List of tokens in the transaction
            
        Returns:
            True if valid transaction, False otherwise
        """
        # Must have at least a date and amount
        labels = [token['label'] for token in tokens]
        return 'DATE' in labels and 'AMOUNT' in labels
    
    def _create_transaction_from_tokens(self, tokens: List[Dict]) -> Dict:
        """
        Create a transaction dictionary from tokens
        
        Args:
            tokens: List of tokens in the transaction
            
        Returns:
            Transaction dictionary
        """
        transaction = {
            "date": None,
            "amount": None,
            "merchant_name": None,
            "description": None,
            "confidence": 0.0,
            "tokens": tokens
        }
        
        # Extract values by label
        for token in tokens:
            label = token['label']
            text = token['text'].strip()
            
            if label == 'DATE' and not transaction['date']:
                transaction['date'] = text
            elif label == 'AMOUNT' and not transaction['amount']:
                transaction['amount'] = text
            elif label == 'MERCHANT' and not transaction['merchant_name']:
                transaction['merchant_name'] = text
            elif label == 'DESCRIPTION' and not transaction['description']:
                transaction['description'] = text
            
            # Update overall confidence (average of all tokens)
            transaction['confidence'] += token['confidence']
        
        if tokens:
            transaction['confidence'] /= len(tokens)
        
        return transaction
