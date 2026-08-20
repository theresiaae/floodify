import os
import sys

# Pastikan direktori backend dan root berada di sys.path
current_dir = os.path.dirname(os.path.abspath(__file__))
root_dir = os.path.abspath(os.path.join(current_dir, ".."))
backend_dir = os.path.join(root_dir, "backend")

for p in [backend_dir, root_dir]:
    if p not in sys.path:
        sys.path.insert(0, p)

from app import app

if __name__ == "__main__":
    app.run()
