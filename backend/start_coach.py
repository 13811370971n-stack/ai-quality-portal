"""
Wrapper to start the Six Sigma Coach backend (server_glean.py) on port 5000.
This allows it to coexist with the Next.js frontend on port 3000.
"""
import sys
import os

# Add coach project to path
COACH_DIR = r"C:\Users\elizimi\AIDE\six-sigma-coach-ui"
sys.path.insert(0, COACH_DIR)
os.chdir(COACH_DIR)

# Monkey-patch the port before importing
import importlib.util
spec = importlib.util.spec_from_file_location("server_glean", os.path.join(COACH_DIR, "server_glean.py"))
mod = importlib.util.module_from_spec(spec)

# Override main to use port 5000
from http.server import HTTPServer

def patched_main():
    # Import the handler from the module after it's loaded
    port = 5000
    server = HTTPServer(('127.0.0.1', port), mod.CoachHandler)
    print(f"""
{'='*50}
  Six Sigma Coach Server (for AI Quality Portal)
{'='*50}
  API:    http://localhost:{port}/api/
  Mode:   Glean LLM Backend
  Token:  {'LOADED' if mod.GLEAN_TOKEN else 'MISSING'}
  
  Portal: http://localhost:3000/coach
{'='*50}
""")
    try:
        server.serve_forever()
    except KeyboardInterrupt:
        print("\nShutting down coach server...")
        server.shutdown()

# Load the module (this runs all top-level code including token loading)
spec.loader.exec_module(mod)

# Run with patched port
if __name__ == '__main__':
    patched_main()
