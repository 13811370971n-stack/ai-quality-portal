"""
Quality Case State Machine.
Defines valid states, transitions, and conditions.
"""
from typing import Optional, List

# Ordered states
CASE_STATES = [
    "draft",
    "intake",
    "investigation",
    "rca",
    "rca_verification",
    "action_planning",
    "effectiveness_verification",
    "closing",
    "closed",
]

# Valid transitions: from_state -> [allowed_next_states]
TRANSITIONS = {
    "draft": ["intake"],
    "intake": ["investigation"],
    "investigation": ["rca"],
    "rca": ["rca_verification", "investigation"],  # can go back
    "rca_verification": ["action_planning", "rca"],  # can go back if not confirmed
    "action_planning": ["effectiveness_verification"],
    "effectiveness_verification": ["closing", "action_planning"],
    "closing": ["closed"],
    "closed": ["investigation"],  # reopen
}

# Steps map to states (for AI prompt routing)
STATE_TO_STEP = {
    "draft": "describe",
    "intake": "describe",
    "investigation": "define",
    "rca": "rca",
    "rca_verification": "rca",
    "action_planning": "measures",
    "effectiveness_verification": "verify",
    "closing": "8d",
    "closed": "8d",
}

# Confirmation required before transitioning
CONFIRMATION_REQUIRED = {
    "investigation": "problem_statement",  # must confirm problem definition
    "rca_verification": "root_cause",  # must confirm root cause
    "closing": "actions_verified",  # must verify actions
}


def can_transition(current_state: str, target_state: str) -> bool:
    """Check if a state transition is valid."""
    allowed = TRANSITIONS.get(current_state, [])
    return target_state in allowed


def get_next_states(current_state: str) -> List[str]:
    """Get valid next states from current."""
    return TRANSITIONS.get(current_state, [])


def get_step_for_state(state: str) -> str:
    """Map state to AI prompt step."""
    return STATE_TO_STEP.get(state, "describe")


def advance_state(current_state: str, confirmations: dict) -> Optional[str]:
    """
    Automatically determine next state based on confirmations.
    Returns new state or None if cannot advance.
    """
    next_states = get_next_states(current_state)
    if not next_states:
        return None

    # Check if confirmation is needed for next state
    primary_next = next_states[0]
    required = CONFIRMATION_REQUIRED.get(primary_next)

    if required and not confirmations.get(required):
        return None  # Cannot advance without confirmation

    return primary_next
