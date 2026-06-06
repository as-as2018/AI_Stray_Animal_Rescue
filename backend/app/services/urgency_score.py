import logging
from app.models.report import UrgencyTier

logger = logging.getLogger(__name__)

def get_injury_class(injury_type: str) -> int:
    injury_upper = injury_type.upper()
    if injury_upper == "CRITICAL": return 4
    if injury_upper == "HIGH": return 3
    if injury_upper == "MEDIUM": return 2
    if injury_upper == "LOW": return 1
    return 0

def compute_urgency_score(
    injury_type: str,
    ai_confidence: float,
    detection_confidence: float,
    hours_since_report: float = 0.0,
    is_juvenile: bool = False,
) -> float:
    """
    Compute an urgency score (0–100) based on the Rule Engine mapped injury type and contextual factors.
    """
    injury_upper = injury_type.upper()
    if injury_upper == "CRITICAL": base = 100
    elif injury_upper == "HIGH": base = 75
    elif injury_upper == "MEDIUM": base = 50
    elif injury_upper == "LOW": base = 25
    else: base = 0

    # Weighted confidence factor: injury confidence matters more
    confidence_factor = (ai_confidence * 0.7) + (detection_confidence * 0.3)

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
