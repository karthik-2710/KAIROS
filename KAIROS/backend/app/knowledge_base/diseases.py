import logging

DISEASE_KNOWLEDGE_BASE = {
    'healthy': {
        'scientific_name': 'N/A',
        'symptoms': ['Uniform green color', 'Upright leaves', 'No lesions or discoloration'],
        'cause': 'Optimal growing conditions',
        'spread': 'N/A',
        'severity': 'None',
        'treatment': 'Maintain current care regimen.',
        'organic_treatment': 'Continue standard compost/manure application.',
        'chemical_treatment': 'None required.',
        'prevention': 'Ensure proper watering, spacing, and crop rotation.',
        'recovery_time': 'N/A',
        'reference': 'KAIROS Agronomy Standard'
    },
    'bacterial spot': {
        'scientific_name': 'Xanthomonas campestris pv. vesicatoria',
        'symptoms': ['Small, water-soaked, greasy spots on leaves', 'Spots become dark, necrotic, and angular', 'Yellow halos often form around the spots'],
        'cause': 'Bacterium',
        'spread': 'Seed-borne, splashing rain, contaminated equipment',
        'severity': 'Moderate',
        'treatment': 'Apply copper-containing bactericides early in the infection.',
        'organic_treatment': 'Copper sprays mixed with Mancozeb.',
        'chemical_treatment': 'Streptomycin (where permitted) or fixed copper.',
        'prevention': 'Use certified disease-free seeds, avoid overhead watering, sanitize tools.',
        'recovery_time': '2 weeks (new growth)',
        'reference': 'PlantVillage Pathology'
    },
    'early blight': {
        'scientific_name': 'Alternaria solani',
        'symptoms': ['Dark brown to black spots on older leaves', 'Concentric rings within spots (target board appearance)', 'Yellowing of surrounding leaf tissue'],
        'cause': 'Fungal pathogen',
        'spread': 'Wind, splashing rain, or overhead irrigation',
        'severity': 'Moderate',
        'treatment': 'Remove affected leaves. Apply fungicide.',
        'organic_treatment': 'Copper-based fungicides, Neem oil.',
        'chemical_treatment': 'Chlorothalonil or Mancozeb based fungicides.',
        'prevention': 'Provide adequate spacing, use drip irrigation instead of overhead sprinklers, rotate crops.',
        'recovery_time': '1-2 weeks after treatment',
        'reference': 'PlantVillage Pathology'
    },
    'late blight': {
        'scientific_name': 'Phytophthora infestans',
        'symptoms': ['Water-soaked spots on leaves', 'Rapidly turning into brown/black lesions', 'White fungal growth on undersides in humid conditions'],
        'cause': 'Oomycete (water mold)',
        'spread': 'Airborne spores, rapidly spreads in cool, wet weather',
        'severity': 'Critical',
        'treatment': 'Destroy heavily infected plants immediately. Apply systemic fungicide.',
        'organic_treatment': 'Copper sprays (preventative only).',
        'chemical_treatment': 'Mefenoxam or Metalaxyl.',
        'prevention': 'Plant resistant varieties, eliminate volunteer plants and cull piles.',
        'recovery_time': 'May not recover if infection is systemic.',
        'reference': 'PlantVillage Pathology'
    },
    'leaf mold': {
        'scientific_name': 'Passalora fulva',
        'symptoms': ['Pale green or yellowish spots on upper leaf surface', 'Olive-green to brown mold on leaf underside'],
        'cause': 'Fungus',
        'spread': 'Wind, rain, contaminated tools in high humidity',
        'severity': 'Moderate',
        'treatment': 'Improve ventilation and reduce humidity. Apply fungicides.',
        'organic_treatment': 'Sulfur-based fungicides or biofungicides.',
        'chemical_treatment': 'Chlorothalonil or Mancozeb.',
        'prevention': 'Maintain lower humidity, ensure good spacing, avoid overhead watering.',
        'recovery_time': '1-2 weeks',
        'reference': 'PlantVillage Pathology'
    },
    'septoria leaf spot': {
        'scientific_name': 'Septoria lycopersici',
        'symptoms': ['Numerous small, circular spots with dark borders and lighter centers', 'Leaves turn yellow and drop off'],
        'cause': 'Fungus',
        'spread': 'Splashing rain, overhead irrigation',
        'severity': 'Moderate',
        'treatment': 'Remove infected leaves. Apply fungicide.',
        'organic_treatment': 'Copper-based fungicides.',
        'chemical_treatment': 'Chlorothalonil or Mancozeb.',
        'prevention': 'Crop rotation, remove plant debris, stake plants, mulch.',
        'recovery_time': '1-2 weeks',
        'reference': 'PlantVillage Pathology'
    },
    'spider mites two spotted spider mite': {
        'scientific_name': 'Tetranychus urticae',
        'symptoms': ['Stippled, yellowing leaves', 'Fine webbing on the undersides of leaves', 'Plant decline'],
        'cause': 'Mites',
        'spread': 'Wind, human movement, thrives in hot, dry conditions',
        'severity': 'High',
        'treatment': 'Apply miticides or horticultural oils. Introduce predatory mites.',
        'organic_treatment': 'Neem oil, insecticidal soap, Phytoseiulus persimilis.',
        'chemical_treatment': 'Abamectin or spiromesifen.',
        'prevention': 'Keep plants well-watered, control dust, remove weeds.',
        'recovery_time': '1-2 weeks',
        'reference': 'PlantVillage Pathology'
    },
    'target spot': {
        'scientific_name': 'Corynespora cassiicola',
        'symptoms': ['Small brown spots with concentric rings', 'Yellow halos around spots', 'Lesions can merge'],
        'cause': 'Fungus',
        'spread': 'Wind, rain, contaminated tools',
        'severity': 'Moderate',
        'treatment': 'Remove infected foliage. Apply appropriate fungicides.',
        'organic_treatment': 'Copper-based fungicides.',
        'chemical_treatment': 'Chlorothalonil or targeted systemic fungicides.',
        'prevention': 'Improve airflow, avoid overhead irrigation.',
        'recovery_time': '2 weeks',
        'reference': 'PlantVillage Pathology'
    },
    'tomato mosaic virus': {
        'scientific_name': 'Tomato mosaic virus (ToMV)',
        'symptoms': ['Mottled light and dark green areas on leaves', 'Stunted growth', 'Reduced fruit yield'],
        'cause': 'Virus',
        'spread': 'Mechanical transmission (hands, tools), occasionally seed-borne',
        'severity': 'High',
        'treatment': 'No cure. Remove and destroy infected plants immediately.',
        'organic_treatment': 'None.',
        'chemical_treatment': 'None.',
        'prevention': 'Use resistant varieties, sanitize tools, wash hands with soap.',
        'recovery_time': 'Cannot recover.',
        'reference': 'PlantVillage Pathology'
    },
    'tomato yellowleaf curl virus': {
        'scientific_name': 'Tomato yellow leaf curl virus (TYLCV)',
        'symptoms': ['Upward curling of leaf margins', 'Yellowing of leaf edges', 'Stunted plant growth'],
        'cause': 'Virus',
        'spread': 'Whiteflies (Bemisia tabaci)',
        'severity': 'Critical',
        'treatment': 'No cure for the virus. Control the whitefly vector.',
        'organic_treatment': 'Neem oil or insecticidal soaps for whiteflies.',
        'chemical_treatment': 'Imidacloprid or dinotefuran for whiteflies.',
        'prevention': 'Use resistant varieties, reflective mulches, control weeds, use insect netting.',
        'recovery_time': 'Cannot recover.',
        'reference': 'PlantVillage Pathology'
    }
}

def get_disease_info(condition_name: str, is_healthy: bool = False):
    """Retrieve structured disease information matching the new API requirements."""
    if is_healthy:
        base_data = DISEASE_KNOWLEDGE_BASE['healthy']
        return {
            'Scientific_Name': base_data['scientific_name'],
            'Severity': base_data['severity'],
            'Treatment': base_data['treatment'],
            'Prevention': base_data['prevention'],
            'Immediate_Action': 'Continue regular monitoring and care.'
        }
        
    condition_clean = condition_name.replace('_', ' ').lower()
    
    base_data = None
    for key, data in DISEASE_KNOWLEDGE_BASE.items():
        if key in condition_clean or condition_clean in key:
            base_data = data
            break
            
    if not base_data:
        logging.warning(f"Lookup failed for disease key: {condition_name}")
        return {
            'Scientific_Name': 'Unknown',
            'Severity': 'Moderate',
            'Treatment': 'Consult a local agronomist for specific diagnosis and treatment plan.',
            'Prevention': 'Maintain optimal crop health parameters and monitor regularly.',
            'Immediate_Action': 'Isolate affected plants if possible and monitor spread.'
        }
        
    return {
        'Scientific_Name': base_data.get('scientific_name', 'Unknown'),
        'Severity': base_data.get('severity', 'Unknown'),
        'Treatment': base_data.get('treatment', 'Consult a specialist.'),
        'Prevention': base_data.get('prevention', 'Monitor crop health parameters.'),
        'Immediate_Action': base_data.get('chemical_treatment', 'Consult a specialist.')
    }
