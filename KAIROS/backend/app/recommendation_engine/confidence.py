def calculate_confidence(flags, base_confidence=75):
    """
    Calculates overall confidence based on cross-verifying evidence sources.
    """
    if not flags:
        return 90  # Confident it's healthy if no flags

    # Increase confidence based on number of unique sources agreeing
    sources = set()
    for flag in flags:
        for source in flag.get('evidence', []):
            sources.add(source)
            
    num_sources = len(sources)
    
    # Add 5-10% per supporting source
    bonus = (num_sources - 1) * 8
    
    # Check for direct AI confidence in flags
    ai_conf = None
    for flag in flags:
        if 'ai_confidence' in flag:
            ai_conf = flag['ai_confidence']
            break
            
    if ai_conf:
        final_conf = ai_conf + (bonus if num_sources > 1 else 0)
    else:
        final_conf = base_confidence + bonus
        
    return min(99, int(final_conf))
