import os
import sys

# Tambahkan path backend ke sys.path
backend_dir = os.path.abspath(os.path.join(os.path.dirname(__file__), "..", "backend"))
if backend_dir not in sys.path:
    sys.path.insert(0, backend_dir)

from app import app

# Expose top-level WSGI variables untuk Vercel Serverless Function
application = app
handler = app

if __name__ == "__main__":
    app.run()
