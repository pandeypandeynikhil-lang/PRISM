"""
PRISM ML Engine v2
- Random Forest (better explainability with SHAP than GBM)
- 5-Zone Seismic Risk Classification (0-0.20 / 0.21-0.40 / 0.41-0.60 / 0.61-0.80 / 0.81-1.0)
- SHAP feature importance for explainability
- RFM + engagement + demographic signals
- Trains with DataFrame so feature names are preserved
"""
import os, pickle, logging
import numpy as np
import pandas as pd
from sklearn.ensemble import RandomForestClassifier
from sklearn.preprocessing import StandardScaler
from sklearn.model_selection import train_test_split
from sklearn.metrics import classification_report, roc_auc_score

logger = logging.getLogger(__name__)

MODEL_PATH  = os.path.join(os.path.dirname(__file__), "churn_model.pkl")
SCALER_PATH = os.path.join(os.path.dirname(__file__), "scaler.pkl")

FEATURE_NAMES = [
    # Financial
    "credit_score", "account_balance", "estimated_salary", "avg_transaction_value",
    # Products
    "num_products", "has_credit_card", "is_active_member",
    # RFM signals
    "num_transactions_last_90d", "days_since_last_transaction", "total_annual_txn_value",
    # Engagement
    "digital_login_frequency", "tenure_months", "days_since_last_contact",
    # Satisfaction
    "complaints_last_year", "nps_score",
    # Demographics
    "age",
]

# 5-Zone Seismic Risk Classification
RISK_ZONES = {
    "zone_1": (0.00, 0.20, "Very Low",  "passive_communication"),
    "zone_2": (0.21, 0.40, "Low",       "loyalty_programs"),
    "zone_3": (0.41, 0.60, "Moderate",  "re_engagement_campaigns"),
    "zone_4": (0.61, 0.80, "High",      "targeted_outreach"),
    "zone_5": (0.81, 1.00, "Critical",  "rm_intervention"),
}


def classify_zone(prob: float) -> dict:
    for zone, (lo, hi, label, action) in RISK_ZONES.items():
        if lo <= prob <= hi:
            return {"zone": zone, "zone_number": int(zone[-1]), "risk_level": label,
                    "recommended_action": action, "probability_range": f"{lo}-{hi}"}
    return {"zone": "zone_5", "zone_number": 5, "risk_level": "Critical",
            "recommended_action": "rm_intervention", "probability_range": "0.81-1.00"}


def compute_opportunity_score(row: pd.Series) -> float:
    """Business value / profitability of retaining this customer (0-100)."""
    score = 0.0
    score += min(30, row["account_balance"] / 10000)
    score += min(20, row["estimated_salary"] / 50000)
    score += row["num_products"] * 8
    score += (row["tenure_months"] / 120) * 15
    score += (row["avg_transaction_value"] / 5000) * 10
    if row["has_credit_card"]: score += 5
    return round(min(100.0, max(0.0, score)), 2)


def compute_inclusion_score(row: pd.Series) -> float:
    """
    Fairness factor — ensures economically underserved segments aren't marginalised.
    Higher score = more underserved = needs more attention for financial inclusion.
    """
    score = 50.0
    if row["account_balance"] < 10000:  score += 20
    elif row["account_balance"] < 50000: score += 10
    if row["estimated_salary"] < 300000: score += 15
    elif row["estimated_salary"] < 600000: score += 7
    if row["credit_score"] < 600: score += 15
    elif row["credit_score"] < 700: score += 7
    if row["num_products"] == 1: score += 10
    if row["digital_login_frequency"] < 2: score += 10
    return round(min(100.0, max(0.0, score)), 2)


def compute_cpi(crs: float, os_score: float, is_score: float,
                alpha: float = 0.5, beta: float = 0.3, gamma: float = 0.2) -> float:
    """
    CPI = α·CRS + β·OS + γ·IS
    CRS = Churn Risk Score (0-1)
    OS  = Opportunity Score (0-100, normalised)
    IS  = Inclusion Score (0-100, normalised)
    Weights: α=Urgency, β=Business Value, γ=Inclusion Priority
    """
    return round(alpha * crs + beta * (os_score / 100) + gamma * (is_score / 100), 4)


def generate_synthetic_data(n: int = 10000, seed: int = 42) -> pd.DataFrame:
    rng = np.random.default_rng(seed)

    df = pd.DataFrame({
        "credit_score":               rng.integers(300, 850, n).astype(float),
        "account_balance":            rng.exponential(50000, n),
        "estimated_salary":           rng.uniform(120000, 2500000, n),
        "avg_transaction_value":      rng.exponential(4000, n),
        "num_products":               rng.integers(1, 6, n).astype(float),
        "has_credit_card":            rng.integers(0, 2, n).astype(float),
        "is_active_member":           rng.integers(0, 2, n).astype(float),
        "num_transactions_last_90d":  rng.integers(0, 80, n).astype(float),
        "days_since_last_transaction": rng.integers(0, 180, n).astype(float),
        "total_annual_txn_value":     rng.exponential(200000, n),
        "digital_login_frequency":    rng.integers(0, 30, n).astype(float),
        "tenure_months":              rng.integers(1, 144, n).astype(float),
        "days_since_last_contact":    rng.integers(0, 365, n).astype(float),
        "complaints_last_year":       rng.integers(0, 7, n).astype(float),
        "nps_score":                  rng.uniform(0, 10, n),
        "age":                        rng.integers(18, 75, n).astype(float),
    })

    # Realistic multi-factor churn signal targeting ~30% churn rate
    logit = (
        - 0.004  * df["credit_score"]
        - 0.000006 * df["account_balance"]
        - 0.55   * df["num_products"]
        - 1.4    * df["is_active_member"]
        + 0.75   * df["complaints_last_year"]
        - 0.20   * df["nps_score"]
        + 0.005  * df["days_since_last_contact"]
        + 0.006  * df["days_since_last_transaction"]
        - 0.045  * df["num_transactions_last_90d"]
        - 0.09   * df["digital_login_frequency"]
        - 0.010  * df["tenure_months"]
        - 0.30   * df["has_credit_card"]
        + 0.90
        + rng.normal(0, 0.55, n)
    )
    prob = 1 / (1 + np.exp(-logit))
    df["churn"] = (prob > 0.5).astype(int)
    logger.info(f"Synthetic churn rate: {df['churn'].mean():.1%}")
    return df


def train():
    logger.info("Training PRISM v2 Random Forest model...")
    df    = generate_synthetic_data(n=10000)
    X     = df[FEATURE_NAMES]
    y     = df["churn"]

    X_train, X_test, y_train, y_test = train_test_split(
        X, y, test_size=0.2, random_state=42, stratify=y
    )

    scaler     = StandardScaler()
    X_train_s  = pd.DataFrame(scaler.fit_transform(X_train), columns=FEATURE_NAMES)
    X_test_s   = pd.DataFrame(scaler.transform(X_test),      columns=FEATURE_NAMES)

    model = RandomForestClassifier(
        n_estimators=400,
        max_depth=12,
        min_samples_leaf=10,
        max_features="sqrt",
        class_weight="balanced",   # handles imbalance
        random_state=42,
        n_jobs=-1,
    )
    model.fit(X_train_s, y_train)

    y_pred = model.predict(X_test_s)
    y_prob = model.predict_proba(X_test_s)[:, 1]
    auc    = roc_auc_score(y_test, y_prob)
    logger.info(f"AUC-ROC: {auc:.4f}")
    logger.info("\n" + classification_report(y_test, y_pred))

    with open(MODEL_PATH,  "wb") as f: pickle.dump(model,  f)
    with open(SCALER_PATH, "wb") as f: pickle.dump(scaler, f)
    logger.info(f"Model saved → {MODEL_PATH}")
    return model, scaler


def ensure_model_exists():
    if not os.path.exists(MODEL_PATH) or not os.path.exists(SCALER_PATH):
        logger.info("No trained model found — training now...")
        train()
    else:
        logger.info("Pre-trained model found")


def load_model():
    with open(MODEL_PATH,  "rb") as f: model  = pickle.load(f)
    with open(SCALER_PATH, "rb") as f: scaler = pickle.load(f)
    return model, scaler


def get_feature_importances() -> dict:
    model, _ = load_model()
    return dict(zip(FEATURE_NAMES, model.feature_importances_.tolist()))


if __name__ == "__main__":
    logging.basicConfig(level=logging.INFO)
    train()
