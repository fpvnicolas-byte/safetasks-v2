"""
Logging configuration for the application.

This module sets up structured logging with appropriate levels and formats
for development and production environments.
"""
import logging
import sys
from typing import Any, Dict

from app.core.config import settings


def setup_logging() -> None:
    """
    Configure application-wide logging.
    
    Sets up:
    - Console handler with structured format
    - Log level based on environment
    - JSON formatting for production (if needed)
    """
    
    # Determine log level from environment or default to INFO
    log_level = getattr(settings, 'log_level', 'INFO').upper()
    
    # Create root logger
    root_logger = logging.getLogger()
    root_logger.setLevel(getattr(logging, log_level, logging.INFO))
    
    # Remove existing handlers to avoid duplicates
    root_logger.handlers.clear()
    
    # Create console handler with structured format
    console_handler = logging.StreamHandler(sys.stdout)
    console_handler.setLevel(getattr(logging, log_level, logging.INFO))
    
    # Create formatter with detailed information
    formatter = logging.Formatter(
        fmt='%(asctime)s | %(levelname)-8s | %(name)s | %(message)s',
        datefmt='%Y-%m-%d %H:%M:%S'
    )
    console_handler.setFormatter(formatter)
    
    # Add handler to root logger
    root_logger.addHandler(console_handler)
    
    # Set specific loggers to appropriate levels
    logging.getLogger('sqlalchemy.engine').setLevel(logging.WARNING)
    logging.getLogger('uvicorn.access').setLevel(logging.WARNING)
    logging.getLogger('uvicorn.error').setLevel(logging.INFO)
    
    # Application logger
    app_logger = logging.getLogger('app')
    app_logger.setLevel(getattr(logging, log_level, logging.INFO))
    
    logging.info("Logging configured", extra={"log_level": log_level})


def get_logger(name: str) -> logging.Logger:
    """
    Get a logger instance for a specific module.
    
    Args:
        name: Logger name (typically __name__ of the module)
        
    Returns:
        Configured logger instance
    """
    return logging.getLogger(f"app.{name}")

