"""
Validasi apakah koordinat yang dikirim dari front-end berada di dalam
wilayah administratif Kota Denpasar.

Front-end sudah membatasi klik lewat mask di peta Leaflet, tapi validasi
ini WAJIB diulang di backend karena request API bisa dikirim langsung
(bukan lewat UI peta) sehingga tidak boleh dipercaya begitu saja.

Poligon batas wilayah (data/denpasar_boundary.json) diambil dari GADM v4.0
(via mahendrayudha/indonesia-geojson) lalu disederhanakan dengan Shapely.
"""

import json
import os

_BOUNDARY_PATH = os.path.join(os.path.dirname(__file__), "..", "data", "denpasar_boundary.json")

with open(_BOUNDARY_PATH, "r") as f:
    _DENPASAR_BOUNDARY = json.load(f)  # list of [lat, lng]


def _point_in_polygon(lat: float, lng: float, polygon) -> bool:
    inside = False
    n = len(polygon)
    j = n - 1
    for i in range(n):
        lat_i, lng_i = polygon[i]
        lat_j, lng_j = polygon[j]
        intersects = ((lng_i > lng) != (lng_j > lng)) and (
            lat < (lat_j - lat_i) * (lng - lng_i) / (lng_j - lng_i) + lat_i
        )
        if intersects:
            inside = not inside
        j = i
    return inside


def is_inside_denpasar(lat: float, lng: float) -> bool:
    return _point_in_polygon(lat, lng, _DENPASAR_BOUNDARY)
