import os
import sys
import traceback

current_dir = os.path.dirname(os.path.abspath(__file__))
root_dir = os.path.abspath(os.path.join(current_dir, ".."))
backend_dir = os.path.join(root_dir, "backend")

for p in [backend_dir, root_dir]:
    if p not in sys.path:
        sys.path.insert(0, p)

try:
    from app import app
except Exception as err:
    tb = traceback.format_exc()
    from flask import Flask, jsonify

    app = Flask(__name__)

    @app.route("/", defaults={"path": ""})
    @app.route("/<path:path>")
    def startup_error(path):
        return (
            jsonify(
                {
                    "error": "Serverless Startup Error",
                    "detail": str(err),
                    "traceback": tb,
                }
            ),
            500,
        )

if __name__ == "__main__":
    app.run()
