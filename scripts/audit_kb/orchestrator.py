"""Master Evidence Audit Orchestrator for KAIROS Knowledge Base.
Executes source audit, claim-level evidence verification, rule calibration assessment, Excel workbook generation, and report publishing.
"""
from pathlib import Path
from .source_auditor import audit_all_sources
from .claim_auditor import audit_all_claims
from .rule_auditor import audit_all_rules
from .audited_excel_builder import build_audited_workbook
from .generate_audit_report import generate_markdown_audit_report
from ..test_engine import run_decision_engine_tests

def run_full_evidence_audit():
    print("=================================================================")
    print("   KAIROS KNOWLEDGE BASE — SCIENTIFIC EVIDENCE AUDIT (v2.1)      ")
    print("=================================================================")

    # 1. Audit Sources
    print("\n[Step 1] Auditing all 30 Sources across Authority Tiers...")
    source_audits = audit_all_sources()
    print(f"  - Total Sources Audited: {len(source_audits)}")
    tier1_cnt = sum(1 for s in source_audits if "Tier 1" in s["authority_tier"])
    tier2_cnt = sum(1 for s in source_audits if "Tier 2" in s["authority_tier"])
    tier3_cnt = sum(1 for s in source_audits if "Tier 3" in s["authority_tier"])
    print(f"  - Tier 1 (ICAR / SAUs / CIBRC): {tier1_cnt} ({tier1_cnt/len(source_audits)*100:.1f}%)")
    print(f"  - Tier 2 (FAO / CABI / IRRI):   {tier2_cnt} ({tier2_cnt/len(source_audits)*100:.1f}%)")
    print(f"  - Tier 3 (IMD Agromet):         {tier3_cnt} ({tier3_cnt/len(source_audits)*100:.1f}%)")

    # 2. Audit Claims
    print("\n[Step 2] Auditing 300+ Factual Claims across Knowledge Base...")
    claim_audits = audit_all_claims()
    print(f"  - Total Claims Audited: {len(claim_audits)}")
    ver_cnt = sum(1 for c in claim_audits if c["evidence_status"] == "VERIFIED")
    part_cnt = sum(1 for c in claim_audits if c["evidence_status"] == "PARTIALLY_SUPPORTED")
    exp_cnt = sum(1 for c in claim_audits if c["evidence_status"] == "REQUIRES_EXPERT_VALIDATION")
    print(f"  - Verified Claims:            {ver_cnt} ({ver_cnt/len(claim_audits)*100:.1f}%)")
    print(f"  - Partially Supported Claims: {part_cnt} ({part_cnt/len(claim_audits)*100:.1f}%)")
    print(f"  - Requires Expert Review:     {exp_cnt} ({exp_cnt/len(claim_audits)*100:.1f}%)")

    # 3. Audit Recommendation Rules
    print("\n[Step 3] Auditing 25 Decision Rules across Calibration & Evidence...")
    rule_audits = audit_all_rules()
    print(f"  - Total Decision Rules Audited: {len(rule_audits)}")
    ver_rules = sum(1 for r in rule_audits if r["agricultural_evidence_status"] == "VERIFIED")
    print(f"  - Agriculturally Justified Rules: {ver_rules}/{len(rule_audits)}")

    # 4. Generate Audited Excel Workbook
    print("\n[Step 4] Generating KAIROS_Recommendation_Knowledge_Base_v2.1_Audited.xlsx...")
    build_audited_workbook(
        source_audits=source_audits,
        evidence_audits=claim_audits,
        rule_audits=rule_audits
    )

    # 5. Generate Audit Report Markdown
    print("\n[Step 5] Publishing KAIROS_Recommendation_Knowledge_Base_v2.1_Audit_Report.md...")
    generate_markdown_audit_report(
        source_audits=source_audits,
        evidence_audits=claim_audits,
        rule_audits=rule_audits
    )

    # 6. Re-run Decision Engine Tests
    print("\n[Step 6] Verifying Decision Engine Test Suite...")
    run_decision_engine_tests()

    print("\n=================================================================")
    print("   EVIDENCE AUDIT & DELIVERABLES GENERATION COMPLETED!           ")
    print("=================================================================")

if __name__ == "__main__":
    run_full_evidence_audit()
