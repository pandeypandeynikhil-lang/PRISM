from datetime import datetime
import re


def format_inr(amount: float) -> str:
    if amount >= 1_00_00_000:
        return f"₹{amount/1_00_00_000:.1f} Cr"
    if amount >= 1_00_000:
        return f"₹{amount/1_00_000:.1f} L"
    if amount >= 1_000:
        return f"₹{amount/1_000:.1f} K"
    return f"₹{amount:.0f}"


def risk_tier_color(tier: str) -> str:
    return {
        "low": "#22c55e",
        "medium": "#f59e0b",
        "high": "#ef4444",
        "critical": "#7c3aed",
    }.get(tier, "#6b7280")


def sanitize_customer_id(cid: str) -> str:
    return re.sub(r"[^A-Za-z0-9\-_]", "", cid)[:32]


def months_to_human(months: int) -> str:
    if months < 12:
        return f"{months}m"
    y, m = divmod(months, 12)
    return f"{y}y {m}m" if m else f"{y}y"
