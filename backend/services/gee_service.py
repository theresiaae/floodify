"""
Mengambil empat parameter spasial dari Google Earth Engine untuk satu titik
koordinat: elevasi (SRTM), tutupan lahan (ESA WorldCover), NDVI (Landsat 8),
dan kelembapan tanah (ERA5-Land).

Autentikasi:
- Set env var GEE_SERVICE_ACCOUNT_EMAIL dan GEE_SERVICE_ACCOUNT_KEY_PATH untuk
  memakai service account (disarankan untuk server/production), ATAU
- Jalankan `earthengine authenticate` sekali di mesin ini untuk memakai
  Application Default Credentials saat development lokal.
"""

import os
import threading
from datetime import datetime, timedelta, timezone

import ee

_POINT_BUFFER_METERS = 30  # radius kecil di sekitar titik klik, sesuai resolusi SRTM
_ERA5_SEARCH_BUFFER_METERS = 15000  # ~1.5x resolusi native ERA5-Land, buat cari pixel darat tetangga
_init_lock = threading.Lock()
_initialized = False

# Window mundur untuk NDVI supaya datanya representatif untuk kondisi
# terkini, bukan satu tanggal saja yang berisiko tertutup awan / kosong
# (khususnya untuk citra optik Landsat).
NDVI_LOOKBACK_DAYS = 60


def _initialize():
    global _initialized
    if _initialized:
        return
    with _init_lock:
        if _initialized:
            return
        service_account = os.environ.get("GEE_SERVICE_ACCOUNT_EMAIL")
        key_path = os.environ.get("GEE_SERVICE_ACCOUNT_KEY_PATH")
        key_json = os.environ.get("GEE_SERVICE_ACCOUNT_KEY_JSON") or os.environ.get("GEE_SERVICE_ACCOUNT_PRIVATE_KEY")
        # Wajib sejak GEE mengharuskan tiap request terhubung ke Cloud Project
        # terdaftar. Isi dengan Project ID hasil registrasi di
        # https://code.earthengine.google.com/register
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
            # Memakai Application Default Credentials hasil `earthengine authenticate`
            ee.Initialize(project=project_id)
        _initialized = True


def _date_str(dt: datetime) -> str:
    return dt.strftime("%Y-%m-%d")


def _mask_landsat8_clouds(image):
    qa = image.select("QA_PIXEL")
    cloud_bit = 1 << 3
    cloud_shadow_bit = 1 << 4
    mask = qa.bitwiseAnd(cloud_bit).eq(0).And(qa.bitwiseAnd(cloud_shadow_bit).eq(0))
    return image.updateMask(mask)


def _get_elevation(point):
    srtm = ee.Image("USGS/SRTMGL1_003")
    return srtm.select("elevation").reduceRegion(
        reducer=ee.Reducer.mean(),
        geometry=point.buffer(_POINT_BUFFER_METERS),
        scale=30,
        bestEffort=True,
    ).get("elevation")


def _get_land_cover(point):
    worldcover = ee.ImageCollection("ESA/WorldCover/v200").first()
    return worldcover.select("Map").reduceRegion(
        reducer=ee.Reducer.mode(),
        geometry=point.buffer(_POINT_BUFFER_METERS),
        scale=10,
        bestEffort=True,
    ).get("Map")


def _get_ndvi(point, start_date: str, end_date: str):
    def compute_ndvi(image):
        nir = image.select("SR_B5").multiply(0.0000275).add(-0.2)
        red = image.select("SR_B4").multiply(0.0000275).add(-0.2)
        return nir.subtract(red).divide(nir.add(red)).rename("NDVI")

    collection = (
        ee.ImageCollection("LANDSAT/LC08/C02/T1_L2")
        .filterBounds(point)
        .filterDate(start_date, end_date)
        .map(_mask_landsat8_clouds)
        .map(compute_ndvi)
    )

    composite = collection.median()
    return composite.reduceRegion(
        reducer=ee.Reducer.mean(),
        geometry=point.buffer(_POINT_BUFFER_METERS),
        scale=30,
        bestEffort=True,
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
        scale=11132,  # resolusi native ERA5-Land (~0.1 derajat)
        bestEffort=True,
    ).get("volumetric_soil_water_layer_1")


def get_gee_parameters(lat: float, lng: float, target_date=None, **kwargs) -> dict:
    """
    Mengembalikan dict: elevasi, tutupan_lahan, ndvi, kelembapan_tanah.
    """
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

    return values