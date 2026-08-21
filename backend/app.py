import logging
import os
from datetime import date, datetime

from flask import Flask, jsonify, request, send_from_directory
from flask_cors import CORS

try:
    from dotenv import load_dotenv
    load_dotenv(os.path.join(os.path.dirname(__file__), ".env"))
    load_dotenv(os.path.join(os.path.dirname(__file__), "..", ".env"))
    load_dotenv()
except ImportError:
    pass

from services.boundary_service import is_inside_denpasar
from services.gee_service import get_gee_parameters
from services.weather_service import get_rainfall
from services.predict_service import predict

logging.basicConfig(level=logging.INFO)
logger = logging.getLogger("floodify")

import traceback

app = Flask(__name__)
CORS(app)


@app.errorhandler(Exception)
def handle_exception(e):
    logger.exception("Unhandled error: %s", e)
    return (
        jsonify(
            {
                "error": "Internal Server Error",
                "detail": str(e),
                "traceback": traceback.format_exc(),
            }
        ),
        500,
    )

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
    rainfall = get_rainfall(lat, lng, target_date=target_date)
    gee_values = get_gee_parameters(lat, lng, target_date=target_date, rainfall=rainfall)
    if not isinstance(gee_values, dict):
        gee_values = {}
    return {**gee_values, "curah_hujan": rainfall}


_DIST_DIR = os.path.abspath(os.path.join(os.path.dirname(__file__), "..", "dist"))


@app.route("/api/health", methods=["GET"])
@app.route("/health", methods=["GET"])
def health():
    return jsonify({"status": "ok", "message": "Floodify API is running"})


@app.route("/api/parameters", methods=["POST"])
@app.route("/parameters", methods=["POST"])
def parameters():
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
    except Exception as e:
        logger.exception("Gagal menjalankan model prediksi: %s", e)
        return jsonify({"error": f"Gagal menjalankan model prediksi: {str(e)}"}), 500

    return jsonify({**result, "parameters": values})


@app.route("/assets/<path:filename>")
def serve_assets(filename):
    assets_dir = os.path.join(_DIST_DIR, "assets")
    target = os.path.join(assets_dir, filename)
    if not os.path.isfile(target):
        ext = filename.rsplit(".", 1)[-1].lower() if "." in filename else ""
        if os.path.isdir(assets_dir):
            for f in os.listdir(assets_dir):
                if f.endswith(f".{ext}"):
                    resp = send_from_directory(assets_dir, f)
                    if ext == "js":
                        resp.headers["Content-Type"] = "text/javascript; charset=utf-8"
                    elif ext == "css":
                        resp.headers["Content-Type"] = "text/css; charset=utf-8"
                    return resp
    resp = send_from_directory(assets_dir, filename)
    if filename.endswith(".js"):
        resp.headers["Content-Type"] = "text/javascript; charset=utf-8"
    elif filename.endswith(".css"):
        resp.headers["Content-Type"] = "text/css; charset=utf-8"
    return resp


@app.route("/")
def index():
    index_file = os.path.join(_DIST_DIR, "index.html")
    if os.path.isfile(index_file):
        resp = send_from_directory(_DIST_DIR, "index.html")
        resp.headers["Cache-Control"] = "no-cache, no-store, must-revalidate"
        resp.headers["Pragma"] = "no-cache"
        resp.headers["Expires"] = "0"
        return resp
    return jsonify({"status": "ok", "message": "Floodify API is running"})


@app.route("/<path:filename>", methods=["GET", "POST"])
def serve_static(filename):
    clean = filename.strip("/").lower()
    req_path = request.path.lower()
    query_p = request.args.get("path", "").lower()
    raw = f"{clean} {req_path} {query_p}"

    if request.method == "POST":
        if "param" in raw:
            return parameters()
        if "pred" in raw:
            return predict_route()
        return jsonify({"error": "Endpoint POST tidak ditemukan.", "received": raw}), 404

    # GET requests
    if "health" in raw or clean in ["api", "api/index", "api/index.py"]:
        return health()

    target = os.path.join(_DIST_DIR, filename)
    if os.path.isfile(target):
        return send_from_directory(_DIST_DIR, filename)

    index_file = os.path.join(_DIST_DIR, "index.html")
    if os.path.isfile(index_file):
        return send_from_directory(_DIST_DIR, "index.html")

    return jsonify({"status": "ok", "message": "Floodify API is running"})


if __name__ == "__main__":
    port = int(os.environ.get("PORT", 5000))
    app.run(host="0.0.0.0", port=port, debug=True)