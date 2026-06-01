import numpy as np
from app.ml.train_model import load_model, FEATURE_NAMES, get_feature_importances
import logging

logger = logging.getLogger(__name__)

_model  = None
_scaler = None


def _ensure_loaded():
    global _model, _scaler
    if _model is None:
        _model, _scaler = load_model()


def predict_churn(features: list[float]) -> dict:
    _ensure_loaded()
    X = np.array(features).reshape(1, -1)
    X_scaled = _scaler.transform(X)
    prob = float(_model.predict_proba(X_scaled)[0][1])
    risk_tier = _classify_risk(prob)
    importances = get_feature_importances()
    feat_dict = dict(zip(FEATURE_NAMES, features))
    top_factors = _get_top_risk_factors(feat_dict, importances)
    return {
        "churn_probability": round(prob, 4),
        "risk_tier": risk_tier,
        "confidence_score": round(abs(prob - 0.5) * 2, 4),
        "top_risk_factors": top_factors,
        "feature_values": feat_dict,
    }


def _classify_risk(prob: float) -> str:
    if prob >= 0.75: return "critical"
    if prob >= 0.50: return "high"
    if prob >= 0.25: return "medium"
    return "low"


def _get_top_risk_factors(feat_dict: dict, importances: dict) -> list[dict]:
    weighted = {
        k: importances.get(k, 0) * abs(v) / (abs(v) + 1)
        for k, v in feat_dict.items()
    }
    top = sorted(weighted.items(), key=lambda x: x[1], reverse=True)[:5]
    return [{"factor": k, "importance": round(v, 4), "value": feat_dict[k]} for k, v in top]


def batch_predict(feature_matrix: list[list[float]]) -> list[dict]:
    return [predict_churn(row) for row in feature_matrix]
