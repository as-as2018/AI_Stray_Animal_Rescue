from app.models.report import UrgencyTier


RULE_ENGINE = {
    # MONITOR (0-9) - Base 0
    "healthy": 0, "old_scar": 0, "minor_hair_loss": 0, 
    "minor_skin_discoloration": 0, "resting_animal": 0, "no_visible_injury": 0,
    
    # LOW (10-39) - Base 25
    "minor_skin_disease": 25, "mild_eye_irritation": 25, "small_wound": 25, 
    "minor_cut": 25, "small_abrasion": 25, "mild_limping": 25, 
    "minor_swelling": 25, "minor_ear_injury": 25,
    
    # MEDIUM (40-69) - Base 50
    "moderate_wound": 50, "moderate_bleeding": 50, "eye_infection": 50, 
    "skin_infection": 50, "infected_wound": 50, "moderate_burn": 50, 
    "moderate_swelling": 50, "unable_to_use_one_leg": 50, 
    "visible_pain": 50, "moderate_laceration": 50,
    
    # HIGH (70-89) - Base 75
    "deep_wound": 75, "severe_burn": 75, "major_eye_injury": 75, 
    "large_skin_infection": 75, "severe_laceration": 75, "severe_swelling": 75, 
    "unable_to_walk_properly": 75, "major_bleeding": 75, 
    "large_open_wound": 75, "advanced_infection": 75,
    
    # CRITICAL (90-100) - Base 100
    "fracture": 100, "exposed_bone": 100, "heavy_bleeding": 100, 
    "road_accident": 100, "hit_by_vehicle": 100, "unconscious": 100, 
    "unable_to_stand": 100, "severe_trauma": 100, 
    "life_threatening_burn": 100, "multiple_fractures": 100, 
    "severe_head_injury": 100, "critical_condition": 100
}

def get_injury_class(injury_type: str) -> int:
    base = RULE_ENGINE.get(injury_type.lower(), 50)
    if base >= 100: return 4
    if base >= 75: return 3
    if base >= 50: return 2
    if base >= 25: return 1
    return 0

def compute_urgency_score(
    injury_type: str,
    injury_confidence: float,
    detection_confidence: float,
    hours_since_report: float = 0.0,
    is_juvenile: bool = False,
) -> float:
    """
    Compute an urgency score (0–100) based on the Rule Engine mapped injury type and contextual factors.
    """
    base = RULE_ENGINE.get(injury_type.lower(), 50) # default to Medium

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
