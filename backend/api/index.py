"""
Vercel serverless entry point.

Vercel's Python runtime looks for an ASGI `app` object in this file.
We re-export the FastAPI app from our main module so that:
  - All routes, middleware, and configuration are shared
  - Local dev (uvicorn app.main:app) works identically to production
  - No code duplication between local and deployed environments
"""

import os
import sys

# Ensure project root is in sys.path so 'app' is always importable
_root = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
if _root not in sys.path:
    sys.path.insert(0, _root)

from app.main import app  # noqa: F401 — re-export for Vercel
