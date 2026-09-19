"""
Vercel serverless entry point.

Vercel's Python runtime looks for an ASGI `app` object in this file.
We re-export the FastAPI app from our main module so that:
  - All routes, middleware, and configuration are shared
  - Local dev (uvicorn app.main:app) works identically to production
  - No code duplication between local and deployed environments
"""

from app.main import app  # noqa: F401 — re-export for Vercel
