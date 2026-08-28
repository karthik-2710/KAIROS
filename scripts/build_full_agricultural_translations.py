"""
Generate Full Agricultural Translation Dictionaries for KAIROS.
Extracts all 74 canonical threats and all 83 treatment actions from the audited KB,
and generates exhaustive presentation-layer translations for English, Marathi, and Hindi.
"""
import sys
from pathlib import Path

sys.path.insert(0, str(Path(__file__).resolve().parent.parent))
from recommendation_engine.knowledge_base.excel_repository import ExcelKnowledgeBaseRepository

kb = ExcelKnowledgeBaseRepository()
all_threats = {t.threat_id: t.threat_name for t in kb._threats_by_id.values()}
all_treatments = {t_id: t.action for t_id, t in kb._treatments_by_id.items()}

print(f"Loaded {len(all_threats)} threats and {len(all_treatments)} treatments from KB.")
