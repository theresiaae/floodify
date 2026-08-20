"""
Mengambil curah hujan untuk satu titik koordinat dari Visual Crossing
Weather API (https://www.visualcrossing.com/) atau Open-Meteo API.
Mendukung data historis, hari ini, dan ramalan cuaca (forecast).
"""

import logging
import os
from datetime import date, datetime, timezone

import requests

logger = logging.getLogger("floodify.weather")

_BASE_URL = (
    "https://weather.visualcrossing.com/VisualCrossingWebServices"
    "/rest/services/timeline"
)
_TIMEOUT_SECONDS = 10
MAX_FORECAST_DAYS_AHEAD = 15


def _today() -> date:
    return datetime.now(timezone.utc).date()


def get_rainfall(lat: float, lng: float, target_date: date | None = None) -> float:
    today = _today()
    max_forecast_date = date.fromordinal(today.toordinal() + MAX_FORECAST_DAYS_AHEAD)
    min_historical_date = date(2015, 1, 1)

    query_date = target_date or today
    if query_date > max_forecast_date:
        query_date = max_forecast_date
    elif query_date < min_historical_date:
        query_date = min_historical_date

    date_str = query_date.strftime("%Y-%m-%d")

    # 1. Coba Visual Crossing jika API key tersedia di Environment Variables
    api_key = os.environ.get("VISUALCROSSING_API_KEY")
    if api_key:
        try:
            url = f"{_BASE_URL}/{lat},{lng}/{date_str}"
            params = {
                "unitGroup": "metric",
                "include": "days",
                "elements": "precip,precipprob,preciptype,datetime",
                "key": api_key,
                "contentType": "json",
            }
            response = requests.get(url, params=params, timeout=_TIMEOUT_SECONDS)
            if response.ok:
                data = response.json()
                days = data.get("days") or [{}]
                precip = days[0].get("precip", 0.0)
                return float(precip or 0.0)
        except Exception as e:
            logger.warning("Visual Crossing request failed: %s, trying fallback", e)

    # 2. Fallback Open-Meteo API (Akurat, Real-time & Historis, Tanpa API Key)
    try:
        if query_date < today:
            om_url = (
                f"https://archive-api.open-meteo.com/v1/archive?"
                f"latitude={lat}&longitude={lng}&start_date={date_str}&end_date={date_str}"
                f"&daily=precipitation_sum&timezone=Asia%2FMakassar"
            )
        else:
            om_url = (
                f"https://api.open-meteo.com/v1/forecast?"
                f"latitude={lat}&longitude={lng}&start_date={date_str}&end_date={date_str}"
                f"&daily=precipitation_sum&timezone=Asia%2FMakassar"
            )

        resp = requests.get(om_url, timeout=_TIMEOUT_SECONDS)
        if resp.ok:
            data = resp.json()
            precip_list = data.get("daily", {}).get("precipitation_sum", [])
            if precip_list and precip_list[0] is not None:
                return float(precip_list[0])
    except Exception as e:
        logger.warning("Open-Meteo fallback request failed: %s", e)

    return 0.0