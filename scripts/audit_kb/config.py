"""Configuration for KAIROS Knowledge Base Scientific Evidence Audit."""
from pathlib import Path

WORKSPACE_ROOT = Path(__file__).resolve().parent.parent.parent
DATASET_DIR = WORKSPACE_ROOT / "dataset"
REC_DATASET_DIR = DATASET_DIR / "recommendation engine datasets"

V2_WORKBOOK_PATH = REC_DATASET_DIR / "KAIROS_Recommendation_Knowledge_Base_v2.xlsx"
if not V2_WORKBOOK_PATH.exists():
    V2_WORKBOOK_PATH = DATASET_DIR / "KAIROS_Recommendation_Knowledge_Base_v2.xlsx"

V2_1_AUDITED_PATH = REC_DATASET_DIR / "KAIROS_Recommendation_Knowledge_Base_v2.1_Audited.xlsx"
V2_1_AUDITED_MIRROR_PATH = DATASET_DIR / "KAIROS_Recommendation_Knowledge_Base_v2.1_Audited.xlsx"

AUDIT_REPORT_PATH = WORKSPACE_ROOT / "KAIROS_Recommendation_Knowledge_Base_v2.1_Audit_Report.md"
AUDIT_REPORT_MIRROR_PATH = DATASET_DIR / "KAIROS_Recommendation_Knowledge_Base_v2.1_Audit_Report.md"
