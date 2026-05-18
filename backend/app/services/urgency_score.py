from app.models.report import UrgencyTier


def compute_urgency_score(
    injury_class: int,
    injury_confidence: float,
    detection_confidence: float,
    hours_since_report: float = 0.0,
    is_juvenile: bool = False,
) -> float:
    """
    Compute an urgency score (0–100) based on AI output and contextual factors.

    Injury weights:
        0 (Healthy)          →  0
        1 (Mild Distress)    → 25
        2 (Moderate Injury)  → 50
        3 (Severe Injury)    → 75
        4 (Critical)         → 100
    """
    INJURY_WEIGHTS = {0: 0, 1: 25, 2: 50, 3: 75, 4: 100}
    base = INJURY_WEIGHTS.get(injury_class, 0)

    # Weighted confidence factor: injury confidence matters more
    confidence_factor = (injury_confidence * 0.7) + (detection_confidence * 0.3)

    # Time escalation: older unattended reports rank higher (max +20)
    time_bonus = min(hours_since_report * 2.0, 20.0)

    # Juvenile animals are more vulnerable
    vulnerability_bonus = 10.0 if is_juvenile else 0.0

    score = (base * confidence_factor) + time_bonus + vulnerability_bonus
    return min(round(score, 1), 100.0)


def get_urgency_tier(score: float) -> UrgencyTier:
    if score >= 90:
        return UrgencyTier.critical
    elif score >= 70:
        return UrgencyTier.high
    elif score >= 40:
        return UrgencyTier.medium
    elif score >= 10:
        return UrgencyTier.low
    else:
        return UrgencyTier.monitor
