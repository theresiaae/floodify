import logging
import os
from datetime import date, datetime

from flask import Flask, jsonify, request, send_from_directory
from flask_cors import CORS

load_dotenv()

from services.boundary_service import is_inside_denpasar
from services.gee_service import get_gee_parameters
from services.weather_service import get_rainfall
from services.predict_service import predict

logging.basicConfig(level=logging.INFO)
logger = logging.getLogger("floodify")

_FRONTEND_DIST = os.path.abspath(os.path.join(os.path.dirname(__file__), "..", "frontend", "dist"))

app = Flask(__name__, static_folder=_FRONTEND_DIST, static_url_path="")
CORS(app)

# Cache sementara in-memory: {(lat, lng, date): {parameter: value, ...}}
# Dipakai supaya endpoint /predict tidak perlu memanggil ulang GEE + VisualCrossing
# kalau titik & tanggal yang sama baru saja diambil parameternya lewat /parameters.
_param_cache = {}


def _cache_key(lat, lng, target_date):
    # Dibulatkan supaya klik di titik yang (nyaris) sama tetap kena cache.
    return (round(lat, 5), round(lng, 5), target_date.isoformat())


def _parse_date(raw):
    """raw: string 'YYYY-MM-DD' atau None -> date object. None berarti hari ini."""
    if not raw:
        return date.today(), None
    try:
        return datetime.strptime(raw, "%Y-%m-%d").date(), None
    except ValueError:
        return None, (jsonify({"error": "Format tanggal harus YYYY-MM-DD."}), 400)


def _validate_request():
    body = request.get_json(silent=True) or {}
    lat = body.get("lat")
    lng = body.get("lng")

    if lat is None or lng is None:
        return None, None, None, (jsonify({"error": "Field 'lat' dan 'lng' wajib diisi."}), 400)

    try:
        lat = float(lat)
        lng = float(lng)
    except (TypeError, ValueError):
        return None, None, None, (jsonify({"error": "Format koordinat tidak valid."}), 400)

    if not is_inside_denpasar(lat, lng):
        return None, None, None, (
            jsonify({"error": "Koordinat berada di luar wilayah Kota Denpasar."}),
            422,
        )

    target_date, date_error = _parse_date(body.get("date"))
    if date_error:
        return None, None, None, date_error

    return lat, lng, target_date, None


def _fetch_values(lat, lng, target_date):
    gee_values = get_gee_parameters(lat, lng, target_date=target_date)
    rainfall = get_rainfall(lat, lng, target_date=target_date)
    return {**gee_values, "curah_hujan": rainfall}


@app.route("/api/health", methods=["GET"])
@app.route("/health", methods=["GET"])
def health():
    return jsonify({"status": "ok"})


@app.route("/api/parameters", methods=["POST"])
@app.route("/parameters", methods=["POST"])
def parameters():
    """
    Mengambil lima parameter untuk satu titik koordinat pada tanggal
    tertentu: elevasi, tutupan lahan, NDVI, kelembapan tanah (Google Earth
    Engine) dan curah hujan (Visual Crossing Weather API — historis, hari
    ini, atau forecast beberapa hari ke depan).
    Nilainya di-cache di server dan dikembalikan ke frontend untuk
    menampilkan informasi parameter lingkungan lokasi terpilih.
    """
    lat, lng, target_date, error = _validate_request()
    if error:
        return error

    try:
        values = _fetch_values(lat, lng, target_date)
    except ValueError as e:
        return jsonify({"error": str(e)}), 400
    except Exception:
        logger.exception("Gagal mengambil parameter untuk (%s, %s, %s)", lat, lng, target_date)
        return jsonify({"error": "Gagal mengambil data parameter dari GEE/VisualCrossing."}), 502

    _param_cache[_cache_key(lat, lng, target_date)] = values

    return jsonify({"ready": True, "parameters": values})


@app.route("/api/predict", methods=["POST"])
@app.route("/predict", methods=["POST"])
def predict_route():
    lat, lng, target_date, error = _validate_request()
    if error:
        return error

    key = _cache_key(lat, lng, target_date)
    values = _param_cache.get(key)

    if values is None:
        # Titik/tanggal ini belum pernah diambil parameternya lewat /parameters.
        try:
            values = _fetch_values(lat, lng, target_date)
        except ValueError as e:
            return jsonify({"error": str(e)}), 400
        except Exception:
            logger.exception(
                "Gagal mengambil parameter saat prediksi untuk (%s, %s, %s)", lat, lng, target_date
            )
            return jsonify({"error": "Gagal mengambil data parameter dari GEE/VisualCrossing."}), 502
        _param_cache[key] = values

    logger.info("Parameter untuk (%s, %s, %s): %s", lat, lng, target_date, values)

    try:
        result = predict(values)
    except Exception:
        logger.exception("Gagal menjalankan model prediksi")
        return jsonify({"error": "Gagal menjalankan model prediksi."}), 500

    return jsonify({**result, "parameters": values})


@app.route("/", defaults={"path": ""})
@app.route("/<path:path>")
def serve_frontend(path):
    if path.startswith("api"):
        return jsonify({"error": "Endpoint API tidak ditemukan."}), 404

    if path and os.path.exists(os.path.join(_FRONTEND_DIST, path)):
        return send_from_directory(_FRONTEND_DIST, path)

    if os.path.exists(os.path.join(_FRONTEND_DIST, "index.html")):
        return send_from_directory(_FRONTEND_DIST, "index.html")

    return jsonify({"status": "Floodify API is running"}), 200


if __name__ == "__main__":
    port = int(os.environ.get("PORT", 5000))
    app.run(host="0.0.0.0", port=port, debug=True)