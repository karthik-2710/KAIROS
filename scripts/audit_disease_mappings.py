"""
Validation and Audit Script for KAIROS Disease Mappings.
Scans all production computer vision model classes across all crops
and verifies their canonical Knowledge Base Threat ID and canonical name mapping.
"""
import sys
import json
from pathlib import Path

# Ensure root in sys.path
root_dir = Path(__file__).resolve().parent.parent
if str(root_dir) not in sys.path:
    sys.path.insert(0, str(root_dir))

from recommendation_engine.adapters.class_mapping import map_disease_detection_class, is_healthy_class, UnmappedClassError
from recommendation_engine.knowledge_base.excel_repository import ExcelKnowledgeBaseRepository


def run_disease_mapping_audit():
    print("=" * 90)
    print("KAIROS — FULL DISEASE CLASS CANONICAL MAPPING AUDIT")
    print("=" * 90)

    repo = ExcelKnowledgeBaseRepository()
    all_threats = repo.get_all_threats()
    print(f"Total Knowledge Base Threats Loaded: {len(all_threats)}\n")

    prod_models_dir = root_dir / "AI-Training" / "models" / "production"
    
    total_classes = 0
    passed_classes = 0
    failed_classes = 0
    healthy_classes = 0

    print(f"{'Crop':<12} | {'Raw Model Class':<40} | {'Canonical Mapping':<32} | {'Threat ID':<10} | {'Status'}")
    print("-" * 110)

    for folder in sorted(prod_models_dir.iterdir()):
        if not folder.is_dir():
            continue
        classes_file = folder / "classes.json"
        if not classes_file.exists():
            continue
            
        crop_name = folder.name.split("_")[0].capitalize()
        with open(classes_file) as f:
            classes = json.load(f)

        for raw_class in classes:
            total_classes += 1
            try:
                mapping = map_disease_detection_class(crop_name, raw_class)
                if mapping is None:
                    # Healthy leaf
                    healthy_classes += 1
                    passed_classes += 1
                    print(f"{crop_name:<12} | {raw_class:<40} | {'[HEALTHY LEAF - NO THREAT]':<32} | {'N/A':<10} | OK (Healthy)")
                else:
                    threat_id, canonical_name = mapping
                    # Verify threat_id exists in Knowledge Base
                    if threat_id in all_threats:
                        passed_classes += 1
                        print(f"{crop_name:<12} | {raw_class:<40} | {canonical_name:<32} | {threat_id:<10} | OK")
                    else:
                        failed_classes += 1
                        print(f"{crop_name:<12} | {raw_class:<40} | {canonical_name:<32} | {threat_id:<10} | FAIL (Invalid ID)")
            except UnmappedClassError as ue:
                failed_classes += 1
                print(f"{crop_name:<12} | {raw_class:<40} | {'UNMAPPED':<32} | {'None':<10} | FAIL ({ue})")
            except Exception as e:
                failed_classes += 1
                print(f"{crop_name:<12} | {raw_class:<40} | {'ERROR':<32} | {'None':<10} | ERROR ({e})")

    print("\n" + "=" * 90)
    print(f"AUDIT RESULTS SUMMARY:")
    print(f"  Total Model Classes Audited: {total_classes}")
    print(f"  Valid Disease Mappings:      {passed_classes - healthy_classes}")
    print(f"  Valid Healthy Classes:       {healthy_classes}")
    print(f"  Total Passed:                {passed_classes} / {total_classes} ({passed_classes/total_classes*100:.1f}%)")
    print(f"  Failed / Unmapped:           {failed_classes}")
    print("=" * 90)

    return failed_classes == 0


if __name__ == "__main__":
    success = run_disease_mapping_audit()
    sys.exit(0 if success else 1)
