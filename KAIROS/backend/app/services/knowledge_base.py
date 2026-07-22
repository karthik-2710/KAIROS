import logging
from typing import Dict, Any

DISEASE_KNOWLEDGE_BASE = {
    'healthy': {
        'Scientific Name': 'N/A',
        'Symptoms': 'Uniform green color, upright leaves, no lesions or discoloration',
        'Cause': 'Optimal growing conditions',
        'Severity': 'None',
        'Immediate Action': 'Continue regular monitoring and care.',
        'Treatment': 'Maintain current care regimen.',
        'Prevention': 'Ensure proper watering, spacing, and crop rotation.',
        'Recovery': 'N/A',
        'Confidence Explanation': 'Model detected healthy leaf structures with high confidence.'
    },
    'bacterial spot': {
        'Scientific Name': 'Xanthomonas campestris pv. vesicatoria',
        'Symptoms': 'Small, water-soaked, greasy spots on leaves. Spots become dark, necrotic, and angular. Yellow halos often form around the spots.',
        'Cause': 'Bacterium (Seed-borne, splashing rain, contaminated equipment)',
        'Severity': 'Moderate',
        'Immediate Action': 'Isolate affected plants if possible. Avoid overhead watering to reduce splash spread.',
        'Treatment': 'Apply copper-containing bactericides early in the infection (e.g., Copper sprays mixed with Mancozeb).',
        'Prevention': 'Use certified disease-free seeds, avoid overhead watering, sanitize tools.',
        'Recovery': '2 weeks for new growth to appear healthy after treatment.',
        'Confidence Explanation': 'Identified by characteristic water-soaked spots with yellow halos.'
    },
    'early blight': {
        'Scientific Name': 'Alternaria solani',
        'Symptoms': 'Dark brown to black spots on older leaves. Concentric rings within spots (target board appearance). Yellowing of surrounding leaf tissue.',
        'Cause': 'Fungal pathogen (Spread by wind, splashing rain, or overhead irrigation)',
        'Severity': 'Moderate',
        'Immediate Action': 'Remove affected leaves immediately and dispose of them away from the field.',
        'Treatment': 'Apply fungicides such as Chlorothalonil or Mancozeb. Organic options include copper-based fungicides and Neem oil.',
        'Prevention': 'Provide adequate spacing, use drip irrigation instead of overhead sprinklers, rotate crops.',
        'Recovery': '1-2 weeks after treatment.',
        'Confidence Explanation': 'Identified by concentric rings (target board pattern) on older leaves.'
    },
    'late blight': {
        'Scientific Name': 'Phytophthora infestans',
        'Symptoms': 'Water-soaked spots on leaves rapidly turning into brown/black lesions. White fungal growth on undersides in humid conditions.',
        'Cause': 'Oomycete/Water mold (Airborne spores, rapidly spreads in cool, wet weather)',
        'Severity': 'Critical',
        'Immediate Action': 'Destroy heavily infected plants immediately to prevent rapid field-wide spread.',
        'Treatment': 'Apply systemic fungicide such as Mefenoxam or Metalaxyl. (Copper sprays are preventative only).',
        'Prevention': 'Plant resistant varieties, eliminate volunteer plants and cull piles.',
        'Recovery': 'May not recover if infection is systemic.',
        'Confidence Explanation': 'Identified by rapid necrosis and white fungal growth on undersides.'
    },
    'leaf mold': {
        'Scientific Name': 'Passalora fulva',
        'Symptoms': 'Pale green or yellowish spots on upper leaf surface. Olive-green to brown mold on leaf underside.',
        'Cause': 'Fungus (Spread by wind, rain, contaminated tools in high humidity)',
        'Severity': 'Moderate',
        'Immediate Action': 'Improve ventilation and reduce humidity immediately.',
        'Treatment': 'Apply fungicides like Chlorothalonil or Mancozeb. Organic options include sulfur-based fungicides.',
        'Prevention': 'Maintain lower humidity, ensure good spacing, avoid overhead watering.',
        'Recovery': '1-2 weeks after reducing humidity and treatment.',
        'Confidence Explanation': 'Identified by olive-green mold on the leaf underside.'
    },
    'septoria leaf spot': {
        'Scientific Name': 'Septoria lycopersici',
        'Symptoms': 'Numerous small, circular spots with dark borders and lighter centers. Leaves turn yellow and drop off.',
        'Cause': 'Fungus (Spread by splashing rain, overhead irrigation)',
        'Severity': 'Moderate',
        'Immediate Action': 'Remove infected leaves from the bottom of the plant.',
        'Treatment': 'Apply fungicide such as Chlorothalonil or Mancozeb. Copper-based fungicides for organic treatment.',
        'Prevention': 'Crop rotation, remove plant debris, stake plants, mulch to prevent soil splash.',
        'Recovery': '1-2 weeks.',
        'Confidence Explanation': 'Identified by numerous small spots with lighter centers on lower leaves.'
    },
    'spider mites two spotted spider mite': {
        'Scientific Name': 'Tetranychus urticae',
        'Symptoms': 'Stippled, yellowing leaves. Fine webbing on the undersides of leaves. Plant decline.',
        'Cause': 'Mites (Spread by wind, human movement, thrives in hot, dry conditions)',
        'Severity': 'High',
        'Immediate Action': 'Spray plants with a strong stream of water to dislodge mites.',
        'Treatment': 'Apply miticides, horticultural oils, or Neem oil. Introduce predatory mites.',
        'Prevention': 'Keep plants well-watered, control dust, remove weeds.',
        'Recovery': '1-2 weeks with consistent mite control.',
        'Confidence Explanation': 'Identified by stippling pattern and fine webbing.'
    },
    'target spot': {
        'Scientific Name': 'Corynespora cassiicola',
        'Symptoms': 'Small brown spots with concentric rings. Yellow halos around spots. Lesions can merge.',
        'Cause': 'Fungus (Spread by wind, rain, contaminated tools)',
        'Severity': 'Moderate',
        'Immediate Action': 'Remove infected foliage and improve airflow.',
        'Treatment': 'Apply appropriate fungicides like Chlorothalonil or targeted systemic fungicides.',
        'Prevention': 'Improve airflow, avoid overhead irrigation.',
        'Recovery': '2 weeks.',
        'Confidence Explanation': 'Identified by lesions with concentric rings differing slightly from Early Blight.'
    },
    'tomato mosaic virus': {
        'Scientific Name': 'Tomato mosaic virus (ToMV)',
        'Symptoms': 'Mottled light and dark green areas on leaves. Stunted growth. Reduced fruit yield.',
        'Cause': 'Virus (Mechanical transmission via hands, tools, occasionally seed-borne)',
        'Severity': 'High',
        'Immediate Action': 'Remove and destroy infected plants immediately to prevent spread. Do not compost.',
        'Treatment': 'No cure available.',
        'Prevention': 'Use resistant varieties, sanitize tools, wash hands with soap.',
        'Recovery': 'Cannot recover.',
        'Confidence Explanation': 'Identified by characteristic mosaic mottling pattern.'
    },
    'tomato yellowleaf curl virus': {
        'Scientific Name': 'Tomato yellow leaf curl virus (TYLCV)',
        'Symptoms': 'Upward curling of leaf margins. Yellowing of leaf edges. Stunted plant growth.',
        'Cause': 'Virus (Spread by Whiteflies - Bemisia tabaci)',
        'Severity': 'Critical',
        'Immediate Action': 'Remove infected plants and immediately deploy whitefly traps/controls.',
        'Treatment': 'No cure for the virus. Control the whitefly vector using Imidacloprid, dinotefuran, or Neem oil.',
        'Prevention': 'Use resistant varieties, reflective mulches, control weeds, use insect netting.',
        'Recovery': 'Cannot recover.',
        'Confidence Explanation': 'Identified by severe upward curling and yellowing.'
    }
}

class KnowledgeBaseService:
    @staticmethod
    def get_disease_info(condition_name: str, confidence: float = 0.0) -> Dict[str, Any]:
        """Retrieve structured disease information matching the full UI requirements."""
        if not condition_name:
            return KnowledgeBaseService._get_unknown_disease()

        condition_clean = condition_name.replace('_', ' ').lower()
        
        # Check if healthy
        if condition_clean == 'healthy':
            return DISEASE_KNOWLEDGE_BASE['healthy']
            
        # Match disease
        base_data = None
        for key, data in DISEASE_KNOWLEDGE_BASE.items():
            if key in condition_clean or condition_clean in key:
                base_data = data
                break
                
        if not base_data:
            logging.warning(f"Lookup failed for disease key: {condition_name}")
            return KnowledgeBaseService._get_unknown_disease()
            
        result = dict(base_data)
        
        # Append confidence explanation
        if confidence > 0:
            if confidence > 90:
                result['Confidence Explanation'] = f"High confidence ({confidence:.1f}%): " + result['Confidence Explanation']
            elif confidence > 60:
                result['Confidence Explanation'] = f"Moderate confidence ({confidence:.1f}%): " + result['Confidence Explanation']
            else:
                result['Confidence Explanation'] = f"Low confidence ({confidence:.1f}%): Pattern matches somewhat, but cross-validate with other factors."
                
        return result

    @staticmethod
    def _get_unknown_disease() -> Dict[str, Any]:
        return {
            'Scientific Name': 'Unknown',
            'Symptoms': 'Symptoms not formally recognized in the current AI knowledge base.',
            'Cause': 'Multiple possible factors.',
            'Severity': 'Moderate',
            'Immediate Action': 'Isolate affected plants if possible and monitor spread.',
            'Treatment': 'Consult a local agronomist for specific diagnosis and treatment plan.',
            'Prevention': 'Maintain optimal crop health parameters and monitor regularly.',
            'Recovery': 'Variable',
            'Confidence Explanation': 'Low confidence prediction. Cross-reference with physical inspection.'
        }
