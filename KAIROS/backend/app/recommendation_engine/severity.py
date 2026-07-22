def calculate_severity(flags):
    """
    Given a list of rule trigger flags, determines the overall severity.
    Returns: 'Critical', 'High', 'Moderate', 'Low', 'None'
    """
    if not flags:
        return 'None'
    
    severities = [f.get('severity', 'Low') for f in flags]
    if 'Critical' in severities:
        return 'Critical'
    if 'High' in severities:
        return 'High'
    if 'Moderate' in severities:
        return 'Moderate'
    if 'Low' in severities:
        return 'Low'
    return 'None'

def get_status_from_severity(severity):
    return severity
