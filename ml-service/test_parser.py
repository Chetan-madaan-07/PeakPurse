from src.preprocessing.bank_statement_parser import BankStatementParser
from src.utils.transaction_categorizer import build_transaction_output

parser = BankStatementParser()
with open('Mock Bank Statement Generation.pdf', 'rb') as f:
    pdf_bytes = f.read()

raw = parser.parse(pdf_bytes)
print(f'Raw transactions extracted: {len(raw)}')
for t in raw:
    print(f'  {t["date"]} | {t["description"][:40]:40} | {t["amount"]:>10.2f}')

result = build_transaction_output(raw)
print(f'\nFinal transactions: {result["data"]["metadata"]["total_transactions"]}')
for t in result["data"]["transactions"]:
    print(f'  {t["date"]} | {t["description"][:35]:35} | {t["amount"]:>10.2f} | {t["category"]}')
