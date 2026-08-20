"""
Menjalankan model Random Forest (hasil skripsi) untuk memprediksi status
risiko banjir dari lima parameter: curah_hujan, elevasi, tutupan_lahan,
ndvi, kelembapan_tanah.
"""

import logging
import os

import joblib
import numpy as np
import pandas as pd

logger = logging.getLogger("floodify.predict")

FEATURE_ORDER = ["curah_hujan", "elevasi", "tutupan_lahan", "ndvi", "kelembapan_tanah"]

_model = None


def _get_model_path():
    candidates = [
        os.path.join(os.path.dirname(__file__), "..", "model", "model_rf_baseline.pkl"),
        os.path.join(os.path.dirname(__file__), "..", "..", "backend", "model", "model_rf_baseline.pkl"),
        os.path.join(os.getcwd(), "backend", "model", "model_rf_baseline.pkl"),
        os.path.join(os.getcwd(), "model", "model_rf_baseline.pkl"),
    ]
    for c in candidates:
        abs_c = os.path.abspath(c)
        if os.path.isfile(abs_c):
            return abs_c
    return os.path.abspath(candidates[0])


def _load_model():
    global _model
    if _model is None:
        model_path = _get_model_path()
        if not os.path.isfile(model_path):
            raise FileNotFoundError(f"Model file not found at: {model_path}")
        _model = joblib.load(model_path)
    return _model


def _prepare_features(raw_values: dict | None) -> pd.DataFrame:
    if not isinstance(raw_values, dict):
        raw_values = {}
    row = {
        "curah_hujan": float(raw_values.get("curah_hujan") if raw_values.get("curah_hujan") is not None else 0.0),
        "elevasi": float(raw_values.get("elevasi") if raw_values.get("elevasi") is not None else 20.0),
        "tutupan_lahan": int(raw_values.get("tutupan_lahan") if raw_values.get("tutupan_lahan") is not None else 50),
        "ndvi": float(raw_values.get("ndvi") if raw_values.get("ndvi") is not None else 0.3),
        "kelembapan_tanah": float(raw_values.get("kelembapan_tanah") if raw_values.get("kelembapan_tanah") is not None else 0.35),
    }
    return pd.DataFrame([row], columns=FEATURE_ORDER)


def predict(raw_values: dict) -> dict:
    model = _load_model()
    features = _prepare_features(raw_values)

    proba = model.predict_proba(features)[0]
    pred_class = model.predict(features)[0]

    classes = list(model.classes_)
    if 1 in classes:
        flood_index = classes.index(1)
    elif "Banjir" in classes:
        flood_index = classes.index("Banjir")
    else:
        flood_index = int(np.argmax(proba))

    probability = round(float(proba[flood_index]) * 100, 1)
    is_flood_prone = pred_class == classes[flood_index]

    status = "Banjir" if is_flood_prone else "Tidak Banjir"

    return {
        "status": status,
        "probabilitas": probability,
    }