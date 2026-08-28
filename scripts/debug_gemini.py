import os
import sys
import json
import traceback
from pathlib import Path
from dotenv import load_dotenv

ROOT_DIR = Path(__file__).resolve().parent.parent
load_dotenv(ROOT_DIR / "KAIROS" / "KAIROS" / "backend" / ".env")
sys.path.insert(0, str(ROOT_DIR / "KAIROS" / "KAIROS" / "backend"))

from app.routes.ai import build_farm_ai_context

key = os.getenv("GEMINI_API_KEY")
print("GEMINI_API_KEY present:", bool(key), "Length:", len(key) if key else 0)

from google import genai
from google.genai import types

client = genai.Client(api_key=key)
context = build_farm_ai_context(1)

system_instruction = f"""
You are the KAIROS AI Agricultural Assistant, an authoritative, precision agriculture expert.
ACTIVE FARM CONTEXT:
{json.dumps(context, indent=2)}
"""

if hasattr(sys.stdout, 'reconfigure'):
    sys.stdout.reconfigure(encoding='utf-8')

contents = [types.Content(role="user", parts=[types.Part.from_text(text="How is my farm doing today?")])]

try:
    response = client.models.generate_content(
        model="gemini-2.5-flash",
        contents=contents,
        config=types.GenerateContentConfig(
            system_instruction=system_instruction,
            temperature=0.4
        )
    )
    print("\n--- GEMINI SUCCESS ---")
    print(response.text)
except Exception as e:
    print("\n--- GEMINI ERROR ---")
    traceback.print_exc()
