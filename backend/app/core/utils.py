from datetime import datetime
from typing import Optional, Union


def make_datetime_naive(dt: Optional[Union[str, datetime]]) -> Optional[datetime]:
    """Convert datetime or ISO string to offset-naive (remove timezone info) for database storage."""
    if dt is None:
        return None
    
    # 🔒 HANDLE EMPTY STRINGS: Convert to None
    if isinstance(dt, str) and dt.strip() == '':
        return None

    # If it's a string, parse it first
    if isinstance(dt, str):
        try:
            # Try ISO format first (handles 'Z' suffix)
            if dt.endswith('Z'):
                dt = dt[:-1] + '+00:00'
            dt = datetime.fromisoformat(dt.replace('Z', '+00:00'))
        except ValueError:
            # Fallback to basic parsing
            dt = datetime.strptime(dt, '%Y-%m-%dT%H:%M:%S.%f%z')

    # Now dt should be a datetime object
    if dt.tzinfo is not None:
        # Convert to naive datetime (remove timezone)
        return dt.replace(tzinfo=None)
    return dt
