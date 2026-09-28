"""Utilities shared by report ingestion and the monthly data loader."""
from __future__ import annotations

import re
from pathlib import Path

_MONTHS = {
    "jan": "January", "feb": "February", "mar": "March", "apr": "April",
    "may": "May", "jun": "June", "jul": "July", "aug": "August",
    "sep": "September", "oct": "October", "nov": "November", "dec": "December",
}
_MONTH_TOKEN = r"january|jan|february|feb|march|mar|april|apr|may|june|jun|july|jul|august|aug|september|sept|sep|october|oct|november|nov|december|dec"


def month_tag_from_filename(filename: str) -> str:
    """Return a canonical MonthYYYY tag from common report filenames.

    Accepts prefixes such as ``FRMarch2025`` and either month-year ordering.
    If no month/year can be identified, returns the stem for explicit downstream
    validation rather than guessing a report date.
    """
    stem = Path(filename).stem
    match = re.search(rf"({_MONTH_TOKEN})[^A-Za-z0-9]*(\d{{4}})", stem, re.I)
    if match:
        month = _MONTHS[match.group(1)[:3].lower()]
        return f"{month}{match.group(2)}"
    match = re.search(rf"(\d{{4}})[^A-Za-z0-9]*({_MONTH_TOKEN})", stem, re.I)
    if match:
        month = _MONTHS[match.group(2)[:3].lower()]
        return f"{month}{match.group(1)}"
    return stem
