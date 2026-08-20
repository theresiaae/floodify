import os
import sys

# Menambahkan direktori 'backend' ke sys.path agar seluruh modul backend dapat diakses
backend_path = os.path.abspath(os.path.join(os.path.dirname(__file__), "..", "backend"))
if backend_path not in sys.path:
    sys.path.insert(0, backend_path)

from app import app

# Vercel Serverless Function entry point
if __name__ == "__main__":
    app.run()
