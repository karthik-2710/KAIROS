"""Configuration settings for KAIROS Recommendation Knowledge Base Population Pipeline."""
import os
from pathlib import Path

# Base Paths
WORKSPACE_ROOT = Path(__file__).resolve().parent.parent.parent
DATASET_DIR = WORKSPACE_ROOT / "dataset"
REC_DATASET_DIR = DATASET_DIR / "recommendation engine datasets"
RESEARCH_CACHE_DIR = WORKSPACE_ROOT / "research_cache"

# File Paths
V1_WORKBOOK_PATH = REC_DATASET_DIR / "KAIROS_Recommendation_Knowledge_Base_v1.xlsx"
V2_WORKBOOK_PATH = REC_DATASET_DIR / "KAIROS_Recommendation_Knowledge_Base_v2.xlsx"
V2_WORKBOOK_MIRROR_PATH = DATASET_DIR / "KAIROS_Recommendation_Knowledge_Base_v2.xlsx"
RESEARCH_REPORT_PATH = DATASET_DIR / "KAIROS_Recommendation_Knowledge_Base_Research_Report.md"

# LM Studio Configuration
LM_STUDIO_API_BASE = "http://localhost:1234/v1"
LM_STUDIO_MODELS = ["qwen/qwen3.5-9b", "qwen/qwen3.5-9b:2", "qwen3.5-9b"]
REQUEST_TIMEOUT_SEC = 60
TEMPERATURE = 0.1
MAX_RETRIES = 3

# Cache Subdirectories
SOURCES_CACHE_DIR = RESEARCH_CACHE_DIR / "sources"
EXTRACTIONS_CACHE_DIR = RESEARCH_CACHE_DIR / "extractions"
VERIFICATIONS_CACHE_DIR = RESEARCH_CACHE_DIR / "verifications"
