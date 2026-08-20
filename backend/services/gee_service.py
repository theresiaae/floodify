"""
Mengambil empat parameter spasial dari Google Earth Engine untuk satu titik
koordinat: elevasi (SRTM), tutupan lahan (ESA WorldCover), NDVI (Landsat 8),
dan kelembapan tanah (ERA5-Land).

Dilengkapi fallback spasial topografi Denpasar jika kredensial GEE belum
dikonfigurasi pada cloud deployment.
"""

import logging
import os
import threading
from datetime import datetime, timedelta, timezone

logger = logging.getLogger("floodify.gee")

try:
    import ee
    _EE_AVAILABLE = True
except ImportError:
    _EE_AVAILABLE = False

_POINT_BUFFER_METERS = 30
_ERA5_SEARCH_BUFFER_METERS = 15000
_init_lock = threading.Lock()
_initialized = False
NDVI_LOOKBACK_DAYS = 60


def _initialize():
    global _initialized
    if _initialized:
        return
    with _init_lock:
        if _initialized:
            return
        if not _EE_AVAILABLE:
            raise RuntimeError("earthengine-api not installed")

        service_account = os.environ.get("GEE_SERVICE_ACCOUNT_EMAIL")
        key_path = os.environ.get("GEE_SERVICE_ACCOUNT_KEY_PATH")
        key_json = os.environ.get("GEE_SERVICE_ACCOUNT_KEY_JSON") or os.environ.get("GEE_SERVICE_ACCOUNT_PRIVATE_KEY")
        project_id = os.environ.get("GEE_PROJECT_ID")

        if key_json:
            credentials = ee.ServiceAccountCredentials(service_account or "", key_data=key_json)
            ee.Initialize(credentials, project=project_id)
        elif service_account and key_path and os.path.exists(key_path):
            credentials = ee.ServiceAccountCredentials(service_account, key_file=key_path)
            ee.Initialize(credentials, project=project_id)
        elif service_account and key_path:
            credentials = ee.ServiceAccountCredentials(service_account, key_data=key_path)
            ee.Initialize(credentials, project=project_id)
        else:
            ee.Initialize(project=project_id)
        _initialized = True


def _date_str(dt: datetime) -> str:
    return dt.strftime("%Y-%m-%d")


def _get_elevation(point):
    srtm = ee.Image("USGS/SRTMGL1_003")
    return srtm.reduceRegion(
        reducer=ee.Reducer.first(),
        geometry=point.buffer(_POINT_BUFFER_METERS),
        scale=30,
    ).get("elevation")


def _get_land_cover(point):
    worldcover = ee.ImageCollection("ESA/WorldCover/v200").first()
    return worldcover.reduceRegion(
        reducer=ee.Reducer.mode(),
        geometry=point.buffer(_POINT_BUFFER_METERS),
        scale=10,
    ).get("Map")


def _get_ndvi(point, start_date: str, end_date: str):
    def _add_ndvi(img):
        return img.normalizedDifference(["SR_B5", "SR_B4"]).rename("NDVI")

    collection = (
        ee.ImageCollection("LANDSAT/LC08/C02/T1_L2")
        .filterDate(start_date, end_date)
        .filterBounds(point)
        .filter(ee.Filter.lt("CLOUD_COVER", 40))
        .map(_add_ndvi)
        .select("NDVI")
    )
    median_ndvi = collection.median()
    return median_ndvi.reduceRegion(
        reducer=ee.Reducer.first(),
        geometry=point.buffer(_POINT_BUFFER_METERS),
        scale=30,
    ).get("NDVI")


def _get_soil_moisture(point, end_date: str):
    collection = (
        ee.ImageCollection("ECMWF/ERA5_LAND/DAILY_AGGR")
        .filterDate("2015-01-01", end_date)
        .select("volumetric_soil_water_layer_1")
        .sort("system:time_start", False)
    )
    latest_image = collection.first()
    era5_search_buffer = point.buffer(_ERA5_SEARCH_BUFFER_METERS)
    return latest_image.reduceRegion(
        reducer=ee.Reducer.mean(),
        geometry=era5_search_buffer,
        scale=11132,
        bestEffort=True,
    ).get("volumetric_soil_water_layer_1")


def _estimate_denpasar_parameters(lat: float, lng: float) -> dict:
    """Estimator spasial topografi Denpasar jika GEE cloud credentials belum aktif."""
    norm_y = max(0.0, min(1.0, (-8.58 - lat) / (-8.58 - (-8.73))))
    elevasi = round(max(2.0, 48.0 - (norm_y * 44.0) + (lng - 115.21) * 10.0), 1)
    tutupan_lahan = 50
    if lat > -8.62:
        tutupan_lahan = 40
    ndvi = round(0.28 + (1.0 - norm_y) * 0.12, 2)
    kelembapan_tanah = round(0.32 + norm_y * 0.08, 2)
    return {
        "elevasi": elevasi,
        "tutupan_lahan": tutupan_lahan,
        "ndvi": ndvi,
        "kelembapan_tanah": kelembapan_tanah,
    }


def get_gee_parameters(lat: float, lng: float, target_date=None) -> dict:
    try:
        _initialize()
        point = ee.Geometry.Point([lng, lat])

        today = datetime.now(timezone.utc).date()
        anchor = min(target_date, today) if target_date else today
        anchor_dt = datetime(anchor.year, anchor.month, anchor.day, tzinfo=timezone.utc)

        ndvi_start = _date_str(anchor_dt - timedelta(days=NDVI_LOOKBACK_DAYS))
        ndvi_end = _date_str(anchor_dt + timedelta(days=1))
        soil_end = _date_str(anchor_dt + timedelta(days=1))

        values = ee.Dictionary({
            "elevasi": _get_elevation(point),
            "tutupan_lahan": _get_land_cover(point),
            "ndvi": _get_ndvi(point, ndvi_start, ndvi_end),
            "kelembapan_tanah": _get_soil_moisture(point, soil_end),
        }).getInfo()

        fallback = _estimate_denpasar_parameters(lat, lng)
        for k, v in fallback.items():
            if values.get(k) is None:
                values[k] = v
        return values
    except Exception as e:
        logger.warning("GEE offline/unauthenticated (%s). Using spatial model parameters.", e)
        return _estimate_denpasar_parameters(lat, lng)