"""
Mengambil curah hujan untuk satu titik koordinat dari Visual Crossing
Weather API (https://www.visualcrossing.com/) — bisa untuk hari ini,
tanggal lampau (historis), maupun tanggal ke depan (forecast).

Dipisah dari GEE karena CHIRPS/data satelit curah hujan di GEE punya jeda
publikasi beberapa hari, sedangkan Visual Crossing menyediakan data cuaca
observasi/forecast yang lebih dekat ke kondisi saat ini.
"""

import os
from datetime import date, datetime, timezone

import requests

_BASE_URL = (
    "https://weather.visualcrossing.com/VisualCrossingWebServices"
    "/rest/services/timeline"
)
_TIMEOUT_SECONDS = 10

# Tier gratis Visual Crossing hanya menyediakan forecast ~15 hari ke depan.
# Tanggal yang diminta di luar rentang ini akan ditolak lebih awal dengan
# pesan yang jelas, daripada gagal samar-samar di panggilan API.
MAX_FORECAST_DAYS_AHEAD = 15


def _today() -> date:
    return datetime.now(timezone.utc).date()


def get_rainfall(lat: float, lng: float, target_date: date | None = None) -> float:
    api_key = os.environ.get("VISUALCROSSING_API_KEY")
    if not api_key:
        raise RuntimeError("VISUALCROSSING_API_KEY belum di-set di environment.")

    today = _today()
    query_date = target_date or today

    max_allowed = today.toordinal() + MAX_FORECAST_DAYS_AHEAD
    if query_date.toordinal() > max_allowed:
        raise ValueError(
            f"Tanggal terlalu jauh ke depan. Maksimal {MAX_FORECAST_DAYS_AHEAD} "
            "hari dari hari ini untuk data forecast."
        )

    date_str = query_date.strftime("%Y-%m-%d")
    url = f"{_BASE_URL}/{lat},{lng}/{date_str}"

    params = {
        "unitGroup": "metric",
        # 'current' cuma valid untuk hari ini; untuk tanggal lain kita ambil
        # akumulasi harian dari 'days'.
        "include": "days" if query_date != today else "current,days",
        "elements": "precip,precipprob,preciptype,datetime",
        "key": api_key,
        "contentType": "json",
    }

    response = requests.get(url, params=params, timeout=_TIMEOUT_SECONDS)
    response.raise_for_status()
    data = response.json()

    precip = None
    if query_date == today:
        current = data.get("currentConditions", {})
        precip = current.get("precip")

    if precip is None:
        day = (data.get("days") or [{}])[0]
        precip = day.get("precip", 0.0)

    return float(precip or 0.0)