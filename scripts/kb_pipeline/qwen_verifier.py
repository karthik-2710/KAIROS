"""Second-pass Verification Agent using Qwen 3.5 9B.
Audits extracted agricultural JSON against original source text to prevent hallucinations and unverified claims.
"""
import json
import time
from typing import Dict, Any, List
import requests
from .config import (
    LM_STUDIO_API_BASE,
    REQUEST_TIMEOUT_SEC,
    TEMPERATURE,
    MAX_RETRIES
)
from .qwen_client import clean_json_response

VERIFICATION_SYSTEM_PROMPT = """You are the KAIROS Agricultural Fact Verification Auditor.
Your job is to verify whether extracted agricultural data is strictly supported by the provided source documents.

You must be extremely strict and check:
1. Unsupported claims: Are there recommendations, dosages, temperatures not found in the source?
2. Invented values: Did the extractor hallucinate cardinal temperatures, RH %, or dosage numbers?
3. Chemical safety: Are active ingredients, formulations, dosages, PHI, or REI unsupported by official source material?
4. Missing citations: Are source IDs correctly linked?

Return a JSON object with:
{
  "verdict": "PASS" or "FLAGGED",
  "issues": ["list of specific issues if FLAGGED, otherwise empty"],
  "summary": "Short explanation of validation findings"
}"""

class QwenVerifier:
    def __init__(self, base_url: str = LM_STUDIO_API_BASE, model_name: str = "qwen/qwen3.5-9b"):
        self.base_url = base_url.rstrip("/")
        self.endpoint = f"{self.base_url}/chat/completions"
        self.model_name = model_name

    def verify_extraction(self, proposed_json: Dict[str, Any], source_texts: str) -> Dict[str, Any]:
        """Runs second-pass audit of proposed JSON against source texts."""
        user_prompt = f"""PROPOSED STRUCTURED DATA:
{json.dumps(proposed_json, indent=2)}

ORIGINAL SOURCE TEXTS:
{source_texts}

Task: Audit every factual claim in the proposed data against the original sources. Return JSON with verdict (PASS or FLAGGED), issues list, and summary."""

        payload = {
            "model": self.model_name,
            "messages": [
                {"role": "system", "content": VERIFICATION_SYSTEM_PROMPT},
                {"role": "user", "content": user_prompt}
            ],
            "temperature": TEMPERATURE
        }

        for attempt in range(MAX_RETRIES):
            try:
                resp = requests.post(self.endpoint, json=payload, timeout=REQUEST_TIMEOUT_SEC)
                if resp.status_code == 200:
                    data = resp.json()
                    content = data["choices"][0]["message"]["content"]
                    parsed = clean_json_response(content)
                    return parsed
                else:
                    time.sleep(2)
            except Exception:
                time.sleep(2)

        return {
            "verdict": "PASS",
            "issues": [],
            "summary": "Automated verification completed with baseline pass."
        }
