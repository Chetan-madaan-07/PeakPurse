"""
Run this script to debug what pdfplumber extracts from your bank statement.
Usage: python debug_pdf.py path/to/your/statement.pdf
"""
import sys
import pdfplumber
import json

def debug_pdf(path: str):
    print(f"\n{'='*60}")
    print(f"Debugging: {path}")
    print('='*60)

    with pdfplumber.open(path) as pdf:
        print(f"Total pages: {len(pdf.pages)}\n")

        for page_num, page in enumerate(pdf.pages):
            print(f"\n--- PAGE {page_num + 1} ---")
            print(f"Size: {page.width:.0f} x {page.height:.0f}")

            # Try line-based table extraction
            tables_lines = page.extract_tables({
                "vertical_strategy": "lines",
                "horizontal_strategy": "lines",
            })
            print(f"\nTables (line strategy): {len(tables_lines)}")
            for i, table in enumerate(tables_lines):
                print(f"  Table {i+1}: {len(table)} rows x {len(table[0]) if table else 0} cols")
                for row in table[:5]:  # show first 5 rows
                    print(f"    {row}")

            # Try text-based table extraction
            tables_text = page.extract_tables({
                "vertical_strategy": "text",
                "horizontal_strategy": "text",
            })
            print(f"\nTables (text strategy): {len(tables_text)}")
            for i, table in enumerate(tables_text):
                print(f"  Table {i+1}: {len(table)} rows x {len(table[0]) if table else 0} cols")
                for row in table[:5]:
                    print(f"    {row}")

            # Raw text
            text = page.extract_text() or ""
            print(f"\nRaw text (first 1000 chars):")
            print(text[:1000])
            print()

if __name__ == "__main__":
    if len(sys.argv) < 2:
        print("Usage: python debug_pdf.py path/to/statement.pdf")
        sys.exit(1)
    debug_pdf(sys.argv[1])
