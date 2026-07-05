"""
PRISM ML Service v2
- Predicts churn using Random Forest
- Computes CPI = α·CRS + β·OS + γ·IS
- SHAP-based feature importance (with fallback to RF importances)
- 5-Zone seismic risk classification
"""
import numpy as np
import pandas as pd
import logging

from app.ml.train_model import (
    load_model, FEATURE_NAMES,
    classify_zone, compute_opportunity_score,
    compute_inclusion_score, compute_cpi,
    get_feature_importances,
)

logger = logging.getLogger(__name__)

_model  = None
_scaler = None
_explainer = None


def _ensure_loaded():
    global _model, _scaler, _explainer
    if _model is None:
        _model, _scaler = load_model()
        # Try to load SHAP TreeExplainer
        try:
            import shap
            _explainer = shap.TreeExplainer(_model)
            logger.info("SHAP TreeExplainer loaded")
        except ImportError:
            logger.warning("SHAP not installed — using RF feature importances")
            _explainer = None


def predict_churn(features: list) -> dict:
    _ensure_loaded()

    X        = pd.DataFrame([features], columns=FEATURE_NAMES)
    X_scaled = pd.DataFrame(_scaler.transform(X), columns=FEATURE_NAMES)
    prob     = float(_model.predict_proba(X_scaled)[0][1])

    zone_info = classify_zone(prob)
    feat_dict = dict(zip(FEATURE_NAMES, features))

    # SHAP or fallback importances
    shap_values = _get_shap_or_importance(X_scaled, feat_dict)

    # CPI computation
    os_score  = compute_opportunity_score(X.iloc[0])
    is_score  = compute_inclusion_score(X.iloc[0])
    cpi_score = compute_cpi(prob, os_score, is_score)

    return {
        "churn_probability":   round(prob, 4),
        "churn_risk_score":    round(prob, 4),
        "risk_tier":           _zone_to_tier(zone_info["zone_number"]),
        "zone":                zone_info,
        "confidence_score":    round(abs(prob - 0.5) * 2, 4),
        "opportunity_score":   os_score,
        "inclusion_score":     is_score,
        "cpi_score":           cpi_score,
        "top_risk_factors":    shap_values,
        "feature_values":      feat_dict,
    }


def _zone_to_tier(zone_num: int) -> str:
    return {1: "low", 2: "medium", 3: "moderate", 4: "high", 5: "critical"}.get(zone_num, "low")


def _get_shap_or_importance(X_scaled: pd.DataFrame, feat_dict: dict) -> list[dict]:
    """Return top-5 risk drivers using SHAP if available, else RF importances."""
    if _explainer is not None:
        try:
            import shap
            sv = _explainer.shap_values(X_scaled)
            # For binary classification sv is list[2]; take class-1 values
            if isinstance(sv, list):
                vals = sv[1][0]
            else:
                vals = sv[0]
            pairs = sorted(
                zip(FEATURE_NAMES, [abs(v) for v in vals]),
                key=lambda x: x[1], reverse=True
            )[:5]
            return [{"factor": k, "importance": round(v, 4),
                     "value": feat_dict[k], "method": "shap"} for k, v in pairs]
        except Exception as e:
            logger.warning(f"SHAP failed: {e}, using RF importances")

    # Fallback: RF feature importances weighted by value
    importances = get_feature_importances()
    weighted = {
        k: importances.get(k, 0) * abs(v) / (abs(v) + 1)
        for k, v in feat_dict.items()
    }
    top = sorted(weighted.items(), key=lambda x: x[1], reverse=True)[:5]
    return [{"factor": k, "importance": round(v, 4),
             "value": feat_dict[k], "method": "rf_importance"} for k, v in top]


def batch_predict(feature_matrix: list[list]) -> list[dict]:
    return [predict_churn(row) for row in feature_matrix]
