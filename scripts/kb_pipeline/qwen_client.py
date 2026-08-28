"""LM Studio Qwen 3.5 9B API Client for KAIROS Agricultural Fact Extraction.
Enforces zero-hallucination mandate, temperature=0.1, strict JSON extraction, and auto-retry.
"""
import json
import re
import time
from typing import Dict, Any, Optional
import requests
from .config import (
    LM_STUDIO_API_BASE,
    LM_STUDIO_MODELS,
    REQUEST_TIMEOUT_SEC,
    TEMPERATURE,
    MAX_RETRIES
)

SYSTEM_PROMPT = """You are the KAIROS agricultural knowledge extraction agent.

Your task is to extract agricultural facts from provided authoritative source material and return structured JSON.

You must not invent information.

You must not use unsupported prior knowledge when the supplied sources do not establish a fact.

If a value is not present or cannot be reliably established from the sources, return null.

Do not fabricate:
- temperature thresholds
- humidity thresholds
- rainfall thresholds
- pesticide doses
- application rates
- pre-harvest intervals
- re-entry intervals
- treatment recommendations
- crop restrictions

Every factual field must contain one or more source IDs corresponding to the supplied source material.

Preserve the exact KAIROS crop and threat names.

Distinguish:
- forecast/preventive recommendations
- current detection/treatment recommendations

Prefer IPM, monitoring, cultural, biological, and physical approaches where supported.

Chemical recommendations must only be extracted when explicitly supported by authoritative sources.

Return valid JSON only."""

def clean_json_response(content: str) -> Dict[str, Any]:
    """Cleans code blocks, trailing commas, or markdown formatting and parses JSON."""
    text = content.strip()
    # Strip markdown backticks
    if text.startswith("```"):
        lines = text.splitlines()
        if lines[0].startswith("```"):
            lines = lines[1:]
        if lines and lines[-1].startswith("```"):
            lines = lines[:-1]
        text = "\n".join(lines).strip()
        
    # Find JSON start and end
    start_idx = text.find("{")
    end_idx = text.rfind("}")
    if start_idx != -1 and end_idx != -1 and end_idx >= start_idx:
        text = text[start_idx:end_idx+1]
        
    # Remove single line comments if any
    text = re.sub(r'//.*?\n', '\n', text)
    # Remove trailing commas before } or ]
    text = re.sub(r',\s*([\}\]])', r'\1', text)
    
    return json.loads(text)

class QwenClient:
    def __init__(self, base_url: str = LM_STUDIO_API_BASE, model_name: Optional[str] = None):
        self.base_url = base_url.rstrip("/")
        self.endpoint = f"{self.base_url}/chat/completions"
        self.model_name = model_name or self._detect_model()
        
    def _detect_model(self) -> str:
        """Detects available model on LM Studio server."""
        try:
            r = requests.get(f"{self.base_url}/models", timeout=5)
            if r.status_code == 200:
                data = r.json()
                model_ids = [m["id"] for m in data.get("data", [])]
                for preferred in LM_STUDIO_MODELS:
                    if preferred in model_ids:
                        return preferred
                if model_ids:
                    return model_ids[0]
        except Exception:
            pass
        return "qwen/qwen3.5-9b"

    def extract_agricultural_knowledge(self, crop: str, threat: str, source_texts: str, source_ids: list) -> Dict[str, Any]:
        """Sends structured extraction request to Qwen with source evidence."""
        user_prompt = f"""Target Crop: {crop}
Target Threat: {threat}
Supplied Source IDs: {', '.join(source_ids)}

Authoritative Source Evidence:
{source_texts}

Task: Extract structured agricultural facts strictly supported by the supplied source evidence into the following JSON schema:
{{
  "crop": "{crop}",
  "threat": "{threat}",
  "growth_stage_susceptibility": "Stage names or null",
  "environmental_conditions": {{
    "temperature_min_c": float or null,
    "temperature_max_c": float or null,
    "humidity_min_pct": float or null,
    "humidity_max_pct": float or null,
    "rainfall_condition": "description or null",
    "other_environmental_conditions": "description of moisture/canopy factors",
    "source_id": "Primary source ID"
  }},
  "preventive_actions": [
    {{
      "growth_stage": "Stage name",
      "trigger_condition": "Forecast / environmental trigger",
      "action_type": "Trap Monitoring / Cultural Sanitation / Prophylactic Bioagent / etc.",
      "action": "Detailed IPM preventive action instructions",
      "priority": "High / Medium / Low",
      "monitoring_interval": "e.g. 2-3 days / 5-7 days",
      "source_id": "Source ID"
    }}
  ],
  "treatment_actions": [
    {{
      "growth_stage": "Stage name",
      "trigger_condition": "Visual detection / ETL trigger",
      "action_type": "Field Confirmation / Biological Control / Chemical Fungicide / etc.",
      "action": "Detailed curative treatment instructions",
      "priority": "High / Medium / Low",
      "reassessment_interval": "e.g. 5-7 days",
      "source_id": "Source ID"
    }}
  ],
  "safety_info": [
    {{
      "active_ingredient": "Active chemical name or null",
      "product_or_formulation": "e.g. Propiconazole 25% EC",
      "dosage": float or null,
      "dosage_unit": "e.g. ml/L (200 ml/acre)",
      "application_method": "Foliar spray / Seed treatment / etc.",
      "pre_harvest_interval_days": int or null,
      "re_entry_interval": "e.g. 24 hours",
      "restrictions": "Safety restrictions / maximum sprays",
      "safety_notes": "PPE, aquatic warnings, pollinator protection",
      "source_id": "Source ID"
    }}
  ],
  "requires_expert_validation": false,
  "uncertainties": []
}}
"""
        payload = {
            "model": self.model_name,
            "messages": [
                {"role": "system", "content": SYSTEM_PROMPT},
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
            except Exception as e:
                time.sleep(2)
                
        # If extraction failed after retries, return empty fallback
        return {
            "crop": crop,
            "threat": threat,
            "growth_stage_susceptibility": None,
            "environmental_conditions": {
                "temperature_min_c": None,
                "temperature_max_c": None,
                "humidity_min_pct": None,
                "humidity_max_pct": None,
                "rainfall_condition": None,
                "other_environmental_conditions": "Requires field verification.",
                "source_id": source_ids[0] if source_ids else "S001"
            },
            "preventive_actions": [],
            "treatment_actions": [],
            "safety_info": [],
            "requires_expert_validation": True,
            "uncertainties": ["Extraction timed out or JSON parsing failed."]
        }
