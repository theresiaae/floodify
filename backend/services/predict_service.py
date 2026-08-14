"""
Menjalankan model Random Forest (hasil skripsi) untuk memprediksi status
risiko banjir dari lima parameter: curah_hujan, elevasi, tutupan_lahan,
ndvi, kelembapan_tanah.

tutupan_lahan dipakai langsung sebagai kode kelas ESA WorldCover (mis. 10 =
Tree cover, 40 = Cropland, 50 = Built-up, dst — lihat dokumentasi ESA
WorldCover v200), karena model dilatih memakai sumber yang sama.
"""

import os

import joblib
import numpy as np
import pandas as pd

_MODEL_PATH = os.path.join(os.path.dirname(__file__), "..", "model", "model_rf_baseline.pkl")

# Urutan fitur harus SAMA PERSIS dengan urutan kolom saat training di Colab.
FEATURE_ORDER = ["curah_hujan", "elevasi", "tutupan_lahan", "ndvi", "kelembapan_tanah"]

_model = None


def _load_model():
    global _model
    if _model is None:
        _model = joblib.load(_MODEL_PATH)
    return _model


def _prepare_features(raw_values: dict) -> pd.DataFrame:
    row = {
        "curah_hujan": raw_values.get("curah_hujan"),
        "elevasi": raw_values.get("elevasi"),
        "tutupan_lahan": raw_values.get("tutupan_lahan"),
        "ndvi": raw_values.get("ndvi"),
        "kelembapan_tanah": raw_values.get("kelembapan_tanah"),
    }
    return pd.DataFrame([row], columns=FEATURE_ORDER)


def predict(raw_values: dict) -> dict:
    model = _load_model()
    features = _prepare_features(raw_values)

    proba = model.predict_proba(features)[0]
    pred_class = model.predict(features)[0]

    # Asumsi label: 1 (atau "Rawan Banjir") = kelas rawan banjir.
    classes = list(model.classes_)
    if 1 in classes:
        flood_index = classes.index(1)
    elif "Rawan Banjir" in classes:
        flood_index = classes.index("Rawan Banjir")
    else:
        flood_index = int(np.argmax(proba))

    probability = round(float(proba[flood_index]) * 100, 1)
    is_flood_prone = pred_class == classes[flood_index]

    status = "Rawan Banjir" if is_flood_prone else "Aman"

    return {
        "status": status,
        "probabilitas": probability,
    }