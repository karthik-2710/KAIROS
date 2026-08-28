"""
KAIROS Model Registry — Single Source of Truth for Crop AI Models.
Authoritative registry of supported crops, normalization, and model discovery.
"""
import os
import json
import logging
from pathlib import Path
from typing import Dict, Any, Optional, List, Tuple

logger = logging.getLogger(__name__)

# Exactly the 10 supported crops in KAIROS
SUPPORTED_CROPS = [
    "Bajra",
    "Banana",
    "Cotton",
    "Jowar",
    "Onion",
    "Orange",
    "Rice",
    "Soybean",
    "Sugarcane",
    "Wheat"
]

# Canonical crop metadata mapping
CROP_METADATA = {
    "bajra": {
        "display_name": "Bajra",
        "scientific_name": "Pennisetum glaucum",
        "folder_name": "bajra_v1.0.0",
        "version": "v1.0.0"
    },
    "banana": {
        "display_name": "Banana",
        "scientific_name": "Musa acuminata",
        "folder_name": "banana_v1.0.0",
        "version": "v1.0.0"
    },
    "cotton": {
        "display_name": "Cotton",
        "scientific_name": "Gossypium hirsutum",
        "folder_name": "cotton_v1.0.0",
        "version": "v1.0.0"
    },
    "jowar": {
        "display_name": "Jowar",
        "scientific_name": "Sorghum bicolor",
        "folder_name": "jowar_v1.0.0",
        "version": "v1.0.0"
    },
    "onion": {
        "display_name": "Onion",
        "scientific_name": "Allium cepa",
        "folder_name": "onion_v1.0.0",
        "version": "v1.0.0"
    },
    "orange": {
        "display_name": "Orange",
        "scientific_name": "Citrus sinensis",
        "folder_name": "orange_v1.0.0",
        "version": "v1.0.0"
    },
    "rice": {
        "display_name": "Rice",
        "scientific_name": "Oryza sativa",
        "folder_name": "rice_v1.0.0",
        "version": "v1.0.0"
    },
    "soybean": {
        "display_name": "Soybean",
        "scientific_name": "Glycine max",
        "folder_name": "soybean_v1.0.0",
        "version": "v1.0.0"
    },
    "sugarcane": {
        "display_name": "Sugarcane",
        "scientific_name": "Saccharum officinarum",
        "folder_name": "sugarcane_v1.0.0",
        "version": "v1.0.0"
    },
    "wheat": {
        "display_name": "Wheat",
        "scientific_name": "Triticum aestivum",
        "folder_name": "wheat_v1.0.0",
        "version": "v1.0.0"
    }
}

# Aliases for robust normalization
CROP_ALIASES = {
    "sorghum": "jowar",
    "pearl millet": "bajra",
    "paddy": "rice",
    "citrus": "orange",
    "soya": "soybean",
    "soy": "soybean",
    "sugar cane": "sugarcane"
}


def normalize_crop_name(crop: Optional[str]) -> str:
    """
    Normalizes any crop string input (case, whitespace, aliases) to a canonical key.
    Examples:
        'Rice' -> 'rice'
        '  RICE ' -> 'rice'
        'Sorghum' -> 'jowar'
        'Pearl Millet' -> 'bajra'
    """
    if not crop:
        return ""
    clean = crop.lower().strip().replace('_', ' ')
    # Check aliases
    if clean in CROP_ALIASES:
        return CROP_ALIASES[clean]
    # Match against supported keys
    for k in CROP_METADATA.keys():
        if clean == k:
            return k
    # Fallback to single word key
    first_word = clean.split()[0]
    if first_word in CROP_METADATA:
        return first_word
    return clean


class ModelRegistry:
    """
    Discovers, validates, and registers crop-specific AI models across the system.
    """
    def __init__(self, search_roots: Optional[List[Path]] = None):
        self.workspace_root = self._resolve_workspace_root()
        backend_dir = Path(__file__).resolve().parent.parent.parent
        if search_roots:
            self.search_roots = search_roots
        else:
            self.search_roots = [
                self.workspace_root / "AI-Training" / "models" / "production",
                backend_dir / "models",
                self.workspace_root / "KAIROS" / "KAIROS" / "backend" / "models",
                self.workspace_root / "data for KAIROS" / "diseases" / "diseases dl models" / "actually needed",
                self.workspace_root / "models"
            ]
        self._registry_cache: Dict[str, Dict[str, Any]] = {}
        self.discover_models()

    def _resolve_workspace_root(self) -> Path:
        """Finds the root directory containing AI-Training and data for KAIROS."""
        current = Path(__file__).resolve()
        for p in [current] + list(current.parents):
            if (p / "AI-Training").exists() or (p / "data for KAIROS").exists():
                return p
        return Path.cwd()

    def discover_models(self) -> Dict[str, Dict[str, Any]]:
        """
        Discovers model directories, weights, and classes for all supported crops.
        """
        self._registry_cache.clear()

        for crop_key, meta in CROP_METADATA.items():
            folder_name = meta["folder_name"]
            discovered_folder: Optional[Path] = None
            discovered_weight: Optional[Path] = None
            discovered_classes: Optional[List[str]] = None

            # 1. Search across configured roots
            for root in self.search_roots:
                if not root.exists():
                    continue

                # Candidate folders (exact name, versioned prefix, or direct match)
                candidate_dirs = [
                    root / folder_name,
                    root / f"{crop_key}_v1.0.0",
                    root / f"{crop_key}_v1",
                    root / crop_key
                ]

                for cdir in candidate_dirs:
                    if cdir.is_dir():
                        discovered_folder = cdir
                        # Find weight file inside directory
                        weight_candidates = [
                            cdir / "model.pt",
                            cdir / f"{crop_key}_v1.pt",
                            cdir / f"{crop_key}_V1.pt",
                            cdir / f"{crop_key}.pt",
                            cdir / "best_model.pth",
                            cdir / "best.pth",
                            cdir / "best.pt"
                        ]
                        for w in weight_candidates:
                            if w.is_file():
                                discovered_weight = w
                                break
                        
                        # If no standard named weight, look for any .pt/.pth file
                        if not discovered_weight:
                            pt_files = list(cdir.glob("*.pt")) + list(cdir.glob("*.pth"))
                            if pt_files:
                                discovered_weight = pt_files[0]

                        # Check for classes.json
                        classes_json = cdir / "classes.json"
                        if classes_json.is_file():
                            try:
                                with open(classes_json, "r", encoding="utf-8") as f:
                                    discovered_classes = json.load(f)
                            except Exception as e:
                                logger.warning(f"Error reading {classes_json}: {e}")

                        if discovered_weight:
                            break

                if discovered_weight:
                    break

                # Also check direct file in root (e.g. models/rice_v1.pt)
                direct_file_candidates = [
                    root / f"{crop_key}_v1.pt",
                    root / f"{crop_key}_V1.pt",
                    root / f"{crop_key}.pt"
                ]
                for df in direct_file_candidates:
                    if df.is_file():
                        discovered_weight = df
                        discovered_folder = root
                        break
                if discovered_weight:
                    break

            # 2. Build registration record
            is_ready = bool(discovered_weight and discovered_weight.is_file())
            self._registry_cache[crop_key] = {
                "crop_key": crop_key,
                "display_name": meta["display_name"],
                "scientific_name": meta["scientific_name"],
                "version": meta["version"],
                "status": "READY" if is_ready else "UNAVAILABLE",
                "folder_path": str(discovered_folder) if discovered_folder else None,
                "weight_path": str(discovered_weight) if discovered_weight else None,
                "classes": discovered_classes,
                "has_classes_json": bool(discovered_classes),
                "error_reason": None if is_ready else f"No trained model weights found for crop '{meta['display_name']}'"
            }

            if is_ready:
                logger.info(f"[MODEL REGISTRY] Registered {meta['display_name']} -> {discovered_weight}")
            else:
                logger.warning(f"[MODEL REGISTRY] {meta['display_name']} model is UNAVAILABLE.")

        return self._registry_cache

    def get_crop_model_info(self, crop: str) -> Dict[str, Any]:
        """Returns model registration record for a given crop."""
        key = normalize_crop_name(crop)
        if key not in self._registry_cache:
            self.discover_models()
        return self._registry_cache.get(key, {
            "crop_key": key,
            "display_name": crop,
            "status": "UNSUPPORTED_CROP",
            "error_reason": f"Crop '{crop}' is not in the 10 supported KAIROS crops."
        })

    def get_all_models_status(self) -> List[Dict[str, Any]]:
        """Returns list of all 10 supported crops with their real backend status."""
        if not self._registry_cache:
            self.discover_models()
        return [self._registry_cache[normalize_crop_name(c)] for c in SUPPORTED_CROPS if normalize_crop_name(c) in self._registry_cache]


# Singleton instance
model_registry = ModelRegistry()
