"""
PDF parsing utilities for extracting text and coordinates from bank statements
"""

import pdfplumber
from typing import List, Dict, Tuple, Optional
import structlog
from io import BytesIO

logger = structlog.get_logger()


class PDFParseError(Exception):
    """Custom exception for PDF parsing errors"""
    pass


class PDFParser:
    """PDF parser for extracting text with coordinates using pdfplumber"""
    
    def __init__(self, default_password: str = ""):
        """
        Initialize PDF parser
        
        Args:
            default_password: Default password for encrypted PDFs
        """
        self.default_password = default_password
        
    def extract_text_and_coordinates(self, pdf_bytes: bytes, password: str = None) -> List[Dict]:
        """
        Extract text and coordinates from PDF
        
        Args:
            pdf_bytes: PDF file content as bytes
            password: Optional password for encrypted PDFs
            
        Returns:
            List of dictionaries containing text and coordinate information
            
        Raises:
            PDFParseError: If PDF cannot be parsed
        """
        try:
            # Use provided password or default
            pdf_password = password or self.default_password
            
            # Open PDF with pdfplumber
            with pdfplumber.open(BytesIO(pdf_bytes), password=pdf_password) as pdf:
                all_text_data = []
                
                # Process each page
                for page_num, page in enumerate(pdf.pages):
                    logger.info("Processing PDF page", page_number=page_num + 1, total_pages=len(pdf.pages))
                    
                    # Extract characters with coordinates
                    chars = page.chars
                    
                    # Extract words by grouping characters
                    words = self._group_chars_to_words(chars)
                    
                    # Extract lines by grouping words
                    lines = self._group_words_to_lines(words)
                    
                    # Add page information
                    page_data = {
                        "page_number": page_num + 1,
                        "width": page.width,
                        "height": page.height,
                        "lines": lines
                    }
                    
                    all_text_data.append(page_data)
                
                logger.info("Successfully extracted PDF data", total_pages=len(all_text_data))
                return all_text_data
                
        except Exception as e:
            logger.error("Failed to parse PDF", error=str(e))
            raise PDFParseError(f"Failed to parse PDF: {str(e)}")
    
    def _group_chars_to_words(self, chars: List[Dict]) -> List[Dict]:
        """
        Group characters into words based on proximity
        
        Args:
            chars: List of character dictionaries from pdfplumber
            
        Returns:
            List of word dictionaries with coordinates
        """
        if not chars:
            return []
        
        # Sort characters by position (top to bottom, left to right)
        sorted_chars = sorted(chars, key=lambda c: (c['top'], c['left']))
        
        words = []
        current_word_chars = []
        
        for i, char in enumerate(sorted_chars):
            if not current_word_chars:
                current_word_chars = [char]
            else:
                # Check if this character is part of the current word
                last_char = current_word_chars[-1]
                
                # Simple heuristic: if x-coordinate is close and y-coordinate is similar
                x_distance = char['left'] - (last_char['left'] + last_char['width'])
                y_distance = abs(char['top'] - last_char['top'])
                
                # If characters are close horizontally and vertically similar, group them
                if x_distance <= char['width'] * 0.5 and y_distance <= char['size'] * 0.5:
                    current_word_chars.append(char)
                else:
                    # Finish current word and start new one
                    if current_word_chars:
                        word = self._create_word_from_chars(current_word_chars)
                        words.append(word)
                    current_word_chars = [char]
        
        # Add the last word
        if current_word_chars:
            word = self._create_word_from_chars(current_word_chars)
            words.append(word)
        
        return words
    
    def _create_word_from_chars(self, chars: List[Dict]) -> Dict:
        """
        Create a word dictionary from a list of characters
        
        Args:
            chars: List of character dictionaries
            
        Returns:
            Word dictionary with combined text and bounding box
        """
        if not chars:
            return {}
        
        # Combine character text
        text = "".join(char['text'] for char in chars)
        
        # Calculate bounding box
        left = min(char['left'] for char in chars)
        top = min(char['top'] for char in chars)
        right = max(char['left'] + char['width'] for char in chars)
        bottom = max(char['top'] + char['height'] for char in chars)
        
        # Calculate average font size
        avg_size = sum(char['size'] for char in chars) / len(chars)
        
        return {
            "text": text,
            "x0": left,
            "y0": top,
            "x1": right,
            "y1": bottom,
            "width": right - left,
            "height": bottom - top,
            "size": avg_size,
            "font": chars[0].get('fontname', 'unknown')
        }
    
    def _group_words_to_lines(self, words: List[Dict]) -> List[Dict]:
        """
        Group words into lines based on y-coordinate proximity
        
        Args:
            words: List of word dictionaries
            
        Returns:
            List of line dictionaries
        """
        if not words:
            return []
        
        # Sort words by y-coordinate (top to bottom)
        sorted_words = sorted(words, key=lambda w: w['y0'])
        
        lines = []
        current_line_words = []
        
        for word in sorted_words:
            if not current_line_words:
                current_line_words = [word]
            else:
                # Check if this word is on the same line
                last_word = current_line_words[-1]
                y_distance = abs(word['y0'] - last_word['y0'])
                
                # If y-coordinates are similar, group on same line
                if y_distance <= word['size'] * 0.5:
                    current_line_words.append(word)
                else:
                    # Finish current line and start new one
                    if current_line_words:
                        line = self._create_line_from_words(current_line_words)
                        lines.append(line)
                    current_line_words = [word]
        
        # Add the last line
        if current_line_words:
            line = self._create_line_from_words(current_line_words)
            lines.append(line)
        
        # Sort lines by y-coordinate
        lines.sort(key=lambda l: l['y0'])
        
        return lines
    
    def _create_line_from_words(self, words: List[Dict]) -> Dict:
        """
        Create a line dictionary from a list of words
        
        Args:
            words: List of word dictionaries
            
        Returns:
            Line dictionary
        """
        if not words:
            return {}
        
        # Combine word text
        text = " ".join(word['text'] for word in words)
        
        # Calculate bounding box for the line
        left = min(word['x0'] for word in words)
        top = min(word['y0'] for word in words)
        right = max(word['x1'] for word in words)
        bottom = max(word['y1'] for word in words)
        
        return {
            "text": text,
            "x0": left,
            "y0": top,
            "x1": right,
            "y1": bottom,
            "width": right - left,
            "height": bottom - top,
            "words": words
        }
    
    def validate_pdf(self, pdf_bytes: bytes) -> bool:
        """
        Validate if the file is a valid PDF
        
        Args:
            pdf_bytes: PDF file content as bytes
            
        Returns:
            True if valid PDF, False otherwise
        """
        try:
            # Check PDF header
            if not pdf_bytes.startswith(b'%PDF'):
                return False
            
            # Try to open with pdfplumber
            with pdfplumber.open(BytesIO(pdf_bytes)) as pdf:
                return len(pdf.pages) > 0
                
        except Exception:
            return False
