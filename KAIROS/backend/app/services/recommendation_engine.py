from typing import Dict, Any
from app.services.knowledge_base import KnowledgeBaseService

class RecommendationEngine:
    @staticmethod
    def generate_recommendations(diagnosis: Dict[str, Any]) -> Dict[str, Any]:
        """
        Generates final recommendations based on the cross-validated diagnosis.
        Returns the formatted recommendation object.
        """
        primary_issue = diagnosis.get('primary_issue', 'None')
        
        # Pull from Knowledge Base for the primary issue
        kb_info = KnowledgeBaseService.get_disease_info(primary_issue, diagnosis.get('confidence', 0))
        
        actions = []
        if kb_info.get('Immediate Action') and kb_info['Immediate Action'] != 'N/A':
            actions.append(f"Immediate: {kb_info['Immediate Action']}")
            
        if kb_info.get('Treatment') and kb_info['Treatment'] != 'N/A':
            actions.append(f"Treatment: {kb_info['Treatment']}")
            
        if kb_info.get('Prevention') and kb_info['Prevention'] != 'N/A':
            actions.append(f"Prevention: {kb_info['Prevention']}")
            
        # Add stress factor mitigation
        for stress in diagnosis.get('stress_factors', []):
            if "Drought" in stress:
                actions.append("Mitigation: Increase irrigation schedule to counter drought stress.")
            if "Heat" in stress:
                actions.append("Mitigation: Consider shade netting or evaporative cooling if applicable.")
            if "Humidity" in stress:
                actions.append("Mitigation: Improve ventilation and reduce canopy density to lower humidity.")
                
        if not actions:
            actions = ["Maintain current optimal agronomic practices."]

        return {
            "overall_status": "Attention Required" if diagnosis['severity'] in ['High', 'Critical'] else "Good",
            "severity": diagnosis['severity'],
            "confidence": diagnosis['confidence'],
            "primary_issue": primary_issue,
            "secondary_issue": diagnosis.get('secondary_issue', 'None'),
            "diagnostic_summary": diagnosis.get('diagnostic_summary', 'All clear.'),
            "recommended_actions": actions,
            "supporting_evidence": diagnosis.get('stress_factors', []),
            "follow_up": f"Monitor recovery: {kb_info.get('Recovery', 'N/A')}",
            
            # Additional KB info specifically requested for the UI
            "Immediate_Action": kb_info.get('Immediate Action', 'N/A'),
            "Treatment": kb_info.get('Treatment', 'N/A'),
            "Prevention": kb_info.get('Prevention', 'N/A'),
            "Symptoms": kb_info.get('Symptoms', 'N/A'),
            "Cause": kb_info.get('Cause', 'N/A'),
            "Recovery": kb_info.get('Recovery', 'N/A'),
            "Scientific_Name": kb_info.get('Scientific Name', 'N/A'),
            "Confidence_Explanation": kb_info.get('Confidence Explanation', 'N/A')
        }
