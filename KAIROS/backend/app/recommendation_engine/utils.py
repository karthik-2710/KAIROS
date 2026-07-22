def check_threshold(value, threshold, comparison="<"):
    if value is None:
        return False
    if comparison == "<":
        return value < threshold
    elif comparison == ">":
        return value > threshold
    elif comparison == "<=":
        return value <= threshold
    elif comparison == ">=":
        return value >= threshold
    return value == threshold
