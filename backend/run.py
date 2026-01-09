#!/usr/bin/env python
"""Entry point script for Railway/Render deployment compatibility.

This script ensures the PORT environment variable is read correctly
regardless of the deployment platform (Railway, Render, Docker, etc.)
"""
import os
import uvicorn


def main() -> None:
    # Railway defines PORT environment variable
    # Render may also use PORT, with fallback to 8000
    port = int(os.environ.get("PORT", "8000"))
    host = os.environ.get("HOST", "0.0.0.0")

    uvicorn.run(
        "app.main:app",
        host=host,
        port=port,
        reload=False,  # Disable reload in production
    )


if __name__ == "__main__":
    main()
