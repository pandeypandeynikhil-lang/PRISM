"""
PRISM ML Engine — Gradient Boosted Churn Model
Trains on synthetic banking data; swap dataset path for production.
"""
import os
import pickle
import numpy as np
import pandas as pd
from sklearn.ensemble import GradientBoostingClassifier
from sklearn.preprocessing import StandardScaler
from sklearn.model_selection import train_test_split
from sklearn.metrics import classification_report, roc_auc_score
import logging

logger = logging.getLogger(__name__)

MODEL_PATH  = os.path.join(os.path.dirname(__file__), "churn_model.pkl")
SCALER_PATH = os.path.join(os.path.dirname(__file__), "scaler.pkl")

FEATURE_NAMES = [
    "credit_score", "account_balance", "num_products", "has_credit_card",
    "is_active_member", "estimated_salary", "tenure_months", "age",
    "num_transactions_last_90d", "avg_transaction_value",
    "digital_login_frequency", "complaints_last_year",
    "nps_score", "days_since_last_contact",
]


def generate_synthetic_data(n=5000, seed=42):
    rng = np.random.default_rng(seed)
    df = pd.DataFrame({
        "credit_score":               rng.integers(300, 850, n),
        "account_balance":            rng.exponential(25000, n),
        "num_products":               rng.integers(1, 5, n),
        "has_credit_card":            rng.integers(0, 2, n),
        "is_active_member":           rng.integers(0, 2, n),
        "estimated_salary":           rng.uniform(20000, 200000, n),
        "tenure_months":              rng.integers(1, 120, n),
        "age":                        rng.integers(18, 75, n),
        "num_transactions_last_90d":  rng.integers(0, 60, n),
        "avg_transaction_value":      rng.exponential(500, n),
        "digital_login_frequency":    rng.integers(0, 30, n),
        "complaints_last_year":       rng.integers(0, 5, n),
        "nps_score":                  rng.uniform(0, 10, n),
        "days_since_last_contact":    rng.integers(0, 365, n),
    })

    # Churn probability driven by realistic signals
    churn_score = (
        -0.003 * df["credit_score"]
        - 0.000005 * df["account_balance"]
        - 0.3 * df["num_products"]
        - 0.4 * df["is_active_member"]
        + 0.5 * df["complaints_last_year"]
        - 0.1 * df["nps_score"]
        + 0.002 * df["days_since_last_contact"]
        - 0.003 * df["num_transactions_last_90d"]
        + rng.normal(0, 0.5, n)
    )
    prob = 1 / (1 + np.exp(-churn_score))
    df["churn"] = (prob > 0.5).astype(int)
    return df


def train():
    logger.info("Training PRISM churn model...")
    df = generate_synthetic_data()
    X = df[FEATURE_NAMES]
    y = df["churn"]

    X_train, X_test, y_train, y_test = train_test_split(X, y, test_size=0.2, random_state=42, stratify=y)

    scaler = StandardScaler()
    X_train_s = scaler.fit_transform(X_train)
    X_test_s  = scaler.transform(X_test)

    model = GradientBoostingClassifier(
        n_estimators=200,
        max_depth=4,
        learning_rate=0.05,
        subsample=0.8,
        random_state=42,
    )
    model.fit(X_train_s, y_train)

    y_pred = model.predict(X_test_s)
    y_prob = model.predict_proba(X_test_s)[:, 1]
    auc = roc_auc_score(y_test, y_prob)
    logger.info(f"AUC-ROC: {auc:.4f}")
    logger.info("\n" + classification_report(y_test, y_pred))

    with open(MODEL_PATH,  "wb") as f: pickle.dump(model,  f)
    with open(SCALER_PATH, "wb") as f: pickle.dump(scaler, f)
    logger.info(f"✅ Model saved → {MODEL_PATH}")
    return model, scaler


def ensure_model_exists():
    if not os.path.exists(MODEL_PATH) or not os.path.exists(SCALER_PATH):
        logger.info("No trained model found — training now...")
        train()
    else:
        logger.info("✅ Pre-trained model found")


def load_model():
    with open(MODEL_PATH,  "rb") as f: model  = pickle.load(f)
    with open(SCALER_PATH, "rb") as f: scaler = pickle.load(f)
    return model, scaler


def get_feature_importances():
    model, _ = load_model()
    return dict(zip(FEATURE_NAMES, model.feature_importances_.tolist()))


if __name__ == "__main__":
    logging.basicConfig(level=logging.INFO)
    train()
