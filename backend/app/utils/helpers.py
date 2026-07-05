"""
PRISM v2 — Utility Helpers
"""
import re


def format_inr(amount: float) -> str:
    """Format a number as Indian Rupee string."""
    if amount is None:
        return "₹0"
    if amount >= 1_00_00_000:
        return f"₹{amount / 1_00_00_000:.1f} Cr"
    if amount >= 1_00_000:
        return f"₹{amount / 1_00_000:.1f} L"
    if amount >= 1_000:
        return f"₹{amount / 1_000:.1f} K"
    return f"₹{amount:.0f}"


def zone_to_tier(zone_number: int) -> str:
    """Map zone number to legacy risk tier string."""
    return {
        1: "low",
        2: "medium",
        3: "moderate",
        4: "high",
        5: "critical",
    }.get(zone_number, "low")


def tier_to_zone(tier: str) -> int:
    """Map risk tier string to zone number."""
    return {
        "low":      1,
        "medium":   2,
        "moderate": 3,
        "high":     4,
        "critical": 5,
    }.get(tier.lower(), 1)


def zone_color(zone_number: int) -> str:
    """Return hex color for a zone number."""
    return {
        1: "#22d3a0",
        2: "#60a5fa",
        3: "#f59e0b",
        4: "#f26c6c",
        5: "#c084fc",
    }.get(zone_number, "#6b7280")


def zone_label(zone_number: int) -> str:
    """Return human-readable label for a zone."""
    return {
        1: "Very Low",
        2: "Low",
        3: "Moderate",
        4: "High",
        5: "Critical",
    }.get(zone_number, "Unknown")


def zone_action(zone_number: int) -> str:
    """Return recommended action for a zone."""
    return {
        1: "Passive Communication",
        2: "Loyalty Programs",
        3: "Re-engagement Campaigns",
        4: "Targeted Outreach",
        5: "RM Intervention",
    }.get(zone_number, "Standard Outreach")


def sanitize_customer_id(cid: str) -> str:
    """Strip unsafe characters from a customer ID."""
    return re.sub(r"[^A-Za-z0-9\-_]", "", cid)[:32]


def months_to_human(months: int) -> str:
    """Convert tenure in months to readable string."""
    if months < 12:
        return f"{months}m"
    y, m = divmod(months, 12)
    return f"{y}y {m}m" if m else f"{y}y"


def clamp(value: float, lo: float = 0.0, hi: float = 1.0) -> float:
    """Clamp a float between lo and hi."""
    return max(lo, min(hi, value))


def pct(value: float) -> str:
    """Format a 0–1 float as a percentage string."""
    return f"{round(value * 100, 1)}%"


def cpi_label(cpi: float) -> str:
    """Human-readable urgency label from CPI score."""
    if cpi >= 0.70: return "Immediate Action"
    if cpi >= 0.50: return "High Priority"
    if cpi >= 0.35: return "Monitor Closely"
    return "Routine Engagement"