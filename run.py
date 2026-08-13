import os
import subprocess
import sys
import time

def run():
    print("Starting Lokesh Portfolio locally...")
    
    BASE_DIR = os.path.dirname(os.path.abspath(__file__))
    
    if sys.platform == "win32":
        venv_python = os.path.join(BASE_DIR, "backend", "venv", "Scripts", "python.exe")
    else:
        venv_python = os.path.join(BASE_DIR, "backend", "venv", "bin", "python")

    if not os.path.exists(venv_python):
        print("cd backend && python -m venv venv && venv\\Scripts\\activate && pip install -r requirements.txt")
        sys.exit(1)

    # 1. Start the backend (FastAPI + Uvicorn)
    # We set cwd to "backend" so it correctly finds app.main
    backend_cmd = [venv_python, "-m", "uvicorn", "app.main:app", "--reload", "--host", "0.0.0.0", "--port", "8000"]
    backend_cwd = os.path.join(BASE_DIR, "backend")
    backend_process = subprocess.Popen(backend_cmd, cwd=backend_cwd)

    # 2. Start the frontend (Python built-in http.server)
    # We set cwd to "frontend" so it serves the static files from there
    frontend_cwd = os.path.join(BASE_DIR, "frontend")
    frontend_cmd = [sys.executable, "-m", "http.server", "5500"]
    frontend_process = subprocess.Popen(frontend_cmd, cwd=frontend_cwd)

    print("\n" + "="*50)
    print("Both servers are running in parallel!")
    print("==================================================")
    print("Frontend URL:       http://localhost:5500/index.html")
    print("Backend API Docs:   http://localhost:8000/docs")
    print("==================================================")
    print("Press Ctrl+C in this terminal to shut down both servers cleanly.\n")

    try:
        # Wait for both processes infinitely. 
        # We use wait() so the main script doesn't exit immediately.
        backend_process.wait()
        frontend_process.wait()
    except KeyboardInterrupt:
        # 3. Clean shutdown on Ctrl+C
        print("\nShutting down both servers...")
        backend_process.terminate()
        frontend_process.terminate()
        backend_process.wait()
        frontend_process.wait()
        print("Shutdown complete. Goodbye!")

if __name__ == "__main__":
    run()
