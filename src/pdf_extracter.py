"""Extract ongoing-project tables from OCMS and PAIMANA Flash Reports.

Table boundaries and columns come from the PDF's detected table/header structure;
page numbers and x-coordinate bands are not part of the extraction rules.
"""
from __future__ import annotations

import re
from pathlib import Path

import pdfplumber


PARSER_VERSION = "paimana-native-tables-v4"
OCMS_ID = re.compile(r"^N\d{8}$", re.I)
PAIMANA_ID = re.compile(r"^\d{6}$")
NUMBER = re.compile(r"-?\d[\d,]*(?:\.\d+)?")
DATE = re.compile(r"(?<!\d)(\d{1,2})\s*[/\-]\s*(\d{4})(?!\d)")
MONTH_DATE = re.compile(r"\b(Jan|Feb|Mar|Apr|May|Jun|Jul|Aug|Sep|Sept|Oct|Nov|Dec)[a-z]*[- /](\d{2,4})\b", re.I)


def _text(value):
    return " ".join(str(value or "").replace("\u00a0", " ").split())


def _date(value):
    value = _text(value)
    # The OCMS PDF text layer sometimes inserts spaces between individual digits.
    value = re.sub(r"(\d{1,2})\s*([/\-])\s*(\d\s+\d\s+\d\s+\d)(?!\d)",
                   lambda m: m.group(1) + m.group(2) + re.sub(r"\s+", "", m.group(3)), value)
    match = DATE.search(value)
    if match:
        month, year = int(match.group(1)), int(match.group(2))
        if 1 <= month <= 12:
            return f"{month:02d}/{year:04d}"
    match = MONTH_DATE.search(value)
    if match:
        months = {"jan": 1, "feb": 2, "mar": 3, "apr": 4, "may": 5, "jun": 6,
                  "jul": 7, "aug": 8, "sep": 9, "sept": 9, "oct": 10, "nov": 11, "dec": 12}
        year = int(match.group(2))
        year += 2000 if year < 100 else 0
        return f"{months[match.group(1).lower()]:02d}/{year:04d}"
    return None


def _amount(value, bracket=None):
    value = str(value or "")
    if bracket:
        found = re.search(r"[({]\s*([^)}]+?)\s*[)}]", value)
        value = found.group(1) if found else ""
    else:
        value = re.split(r"[({]", value, maxsplit=1)[0]
    match = NUMBER.search(value)
    if not match:
        return None
    try:
        return float(match.group(0).replace(",", ""))
    except ValueError:
        return None


def _column_map(table, family):
    # Header rows may be repeated, or split across multiple rows by the PDF.
    width = max((len(row) for row in table[:4]), default=0)
    headers = []
    for col in range(width):
        headers.append(" ".join(_text(row[col]).lower() for row in table[:4] if col < len(row)))
    compact = [re.sub(r"[^a-z0-9]+", " ", h).strip() for h in headers]

    def find(*needles):
        return next((i for i, h in enumerate(compact) if all(n in h for n in needles)), None)

    cols = {
        "serial": find("sl", "no"),
        "name": find("project", "name"),
        "state": find("state"),
        "sector": find("sector"),
        "approval": find("approval"),
        "completion": find("commissioning") if family == "ocms" else find("target", "doc"),
        "cost": find("cost", "original") if find("cost", "original") is not None
                else find("cost", "orignal"),
        "expenditure": find("cumulative", "expenditure"),
        "progress": find("physical", "progress"),
    }
    required = ("serial", "name", "approval", "completion", "cost", "expenditure", "progress")
    if any(cols[k] is None for k in required):
        return None
    # A full-page title/contents cell can contain every header word while the
    # remaining cells are empty. Require semantic headers to occupy distinct
    # columns so that such merged text cannot masquerade as the data table.
    required_indexes = [cols[k] for k in required]
    if len(set(required_indexes)) != len(required_indexes) or width < 7:
        return None
    return cols


def _family_and_title(pdf):
    first_pages = "\n".join((page.extract_text() or "") for page in pdf.pages[:8]).lower()
    if "ocms" in first_pages or "cspm.gov.in" in first_pages or "table:-7" in first_pages:
        return "ocms", "Table 7: Project List — Ongoing Projects as of report date"
    if "paimana" in first_pages:
        return "paimana", "All Ongoing Projects"
    return None, None


def _is_target_page(text, family):
    text = text.lower()
    if family == "ocms":
        return ("project list: ongoing projects as of" in text
                and "sl no" in text and "physical" in text and "project name" in text)
    return ("all ongoing projects" in text
            and ("sl.no" in text or "sl no" in text)
            and "project name" in text and "physical progress" in text
            and ("project code" in text or "project id" in text))


def _paimana_text_layout_rows(page):
    """Recover a PAIMANA page from its text layer when borders defeat table finding.

    Header words define column locations on each page. Values are grouped around
    the printed serial numbers, so no page number or fixed coordinate is used.
    """
    words = page.extract_words(x_tolerance=2, y_tolerance=3, keep_blank_chars=False)
    norm = lambda w: re.sub(r"[^a-z0-9/]", "", w["text"].lower())
    anchors = {}
    for word in words:
        token = norm(word)
        if token in {"slno", "state", "approval", "cumulative", "physical"}:
            key = {"slno": "serial", "state": "state", "approval": "approval",
                   "cumulative": "expenditure", "physical": "progress"}[token]
            anchors.setdefault(key, word)
        elif token == "project":
            same_line = [w for w in words if abs(w["top"] - word["top"]) < 3]
            if any(norm(w) == "name" for w in same_line):
                anchors.setdefault("name", word)
        elif token in {"orignal/target", "original/target", "target"}:
            anchors.setdefault("completion", word)
        elif token in {"orignal", "original"}:
            anchors.setdefault("cost", word)
    required = ("serial", "name", "state", "approval", "completion", "cost", "expenditure", "progress")
    if any(key not in anchors for key in required):
        return []
    header_top = max(anchors[k]["top"] for k in required)
    ordered = sorted((anchors[k]["x0"], k) for k in required)
    header_words = [w for w in words if header_top - 18 <= w["top"] <= header_top + 12]
    right_edges = []
    for i, (start_x, _) in enumerate(ordered):
        next_x = ordered[i + 1][0] if i + 1 < len(ordered) else page.width
        extent = [w["x1"] for w in header_words if start_x <= (w["x0"] + w["x1"]) / 2 < next_x]
        right_edges.append(max(extent, default=anchors[ordered[i][1]]["x1"]))
    bounds = [(right_edges[i] + ordered[i + 1][0]) / 2 for i in range(len(ordered) - 1)]
    table_settings = {"vertical_strategy": "text", "horizontal_strategy": "lines"}
    tables = page.find_tables(table_settings=table_settings)
    table_rows = []
    for table in tables:
        values = table.extract()
        candidate = []
        for index, row in enumerate(values):
            first = _text(row[0] if row else "")
            if re.fullmatch(r"\d{1,4}", first):
                candidate.append((int(first), table.rows[index].bbox))
        if len(candidate) > len(table_rows):
            table_rows = candidate
    if not table_rows:
        return []
    rows = []
    for serial_no, bbox in table_rows:
        _, upper, _, lower = bbox
        cells = {k: [] for k in required}
        for word in words:
            if word["top"] < upper or word["top"] >= lower or word["top"] <= header_top:
                continue
            center = (word["x0"] + word["x1"]) / 2
            idx = next((j for j, bound in enumerate(bounds) if center < bound), len(bounds))
            key = ordered[idx][1]
            if key == "serial":
                if re.fullmatch(r"\d{1,4}", word["text"]):
                    continue
                key = "name"
            cells[key].append(word)
        values = {}
        for key, cell_words in cells.items():
            lines = {}
            for word in cell_words:
                line_key = round(word["top"] / 3) * 3
                lines.setdefault(line_key, []).append(word)
            values[key] = "\n".join(" ".join(w["text"] for w in sorted(line, key=lambda w: w["x0"]))
                                      for _, line in sorted(lines.items()))
        rows.append([str(serial_no), values["name"], values["state"], values["approval"],
                     values["completion"], values["cost"], values["expenditure"], values["progress"]])
    return rows


def _metadata(name_cell, family):
    raw = str(name_cell or "")
    lines = [_text(line) for line in raw.splitlines() if _text(line)]
    ids, agency = [], None
    metadata_start = len(lines)
    for i, line in enumerate(lines):
        token = re.fullmatch(r"\(([^()]*)\)", line)
        if not token:
            continue
        value = _text(token.group(1))
        compact = re.sub(r"\s+", "", value)
        if OCMS_ID.fullmatch(compact) or PAIMANA_ID.fullmatch(compact):
            ids.append(compact.upper() if OCMS_ID.fullmatch(compact) else compact)
            metadata_start = min(metadata_start, i)
        elif value in ("-", "—"):
            metadata_start = min(metadata_start, i)
        elif re.search(r"[A-Za-z]", value):
            if agency is None:
                agency = value
            metadata_start = min(metadata_start, i)
    project_name = _text(" ".join(lines[:metadata_start]))
    if not project_name:
        # Some table extractors keep the name and agency in one visual line.
        project_name = re.split(r"\n\s*\(", raw, maxsplit=1)[0]
        project_name = _text(re.sub(r"\s+\([^()]*\)\s*$", "", project_name))
    project_code = next((value for value in ids if PAIMANA_ID.fullmatch(value)), None)
    legacy_code = next((value for value in ids if OCMS_ID.fullmatch(value)), None)
    pmgid = next((value for value in ids if value not in (project_code, legacy_code)), None)
    source_id = legacy_code if family == "ocms" else (project_code or legacy_code or pmgid)
    return project_name or None, agency, project_code, legacy_code, pmgid, source_id


def _split_dates(value):
    value = str(value or "")
    base = re.split(r"[({]", value, maxsplit=1)[0]
    revised = re.search(r"\(([^()]*)\)", value)
    anticipated = re.search(r"\{([^{}]*)\}", value)
    base_dates = [_date(line) for line in base.splitlines()]
    base_dates = [date for date in base_dates if date]
    target = base_dates[0] if base_dates else _date(base)
    revised_date = _date(revised.group(1)) if revised else (base_dates[1] if len(base_dates) > 1 else None)
    anticipated_date = _date(anticipated.group(1)) if anticipated else None
    return target, revised_date, anticipated_date


def _record(row, cols, family, page_num, table_title, report_month, carried):
    def cell(key):
        index = cols.get(key)
        return row[index] if index is not None and index < len(row) else None

    serial = _text(cell("serial"))
    if not re.fullmatch(r"\d+", serial):
        return None
    project_name, agency, project_code, legacy_code, pmgid, source_id = _metadata(cell("name"), family)
    approval = _date(cell("approval"))
    target_doc, revised_doc, anticipated_doc = _split_dates(cell("completion"))
    original_cost = _amount(cell("cost"))
    revised_cost = _amount(cell("cost"), bracket=True)
    anticipated_cost = None
    anticipated = re.search(r"\{([^{}]*)\}", str(cell("cost") or ""))
    if anticipated:
        anticipated_cost = _amount(anticipated.group(1))
    state = _text(cell("state")) or carried.get("state")
    sector = _text(cell("sector")) or carried.get("sector")
    expenditure = _amount(cell("expenditure"))
    progress = _amount(cell("progress"))

    warnings = []
    if not project_name or len(project_name) < 4:
        warnings.append("missing_project_name")
    if not source_id:
        warnings.append("missing_official_project_id")
    if original_cost is None or original_cost <= 0:
        warnings.append("invalid_original_cost")
    if expenditure is None or expenditure < 0:
        warnings.append("invalid_cumulative_expenditure")
    if progress is None or not 0 <= progress <= 100:
        warnings.append("missing_or_invalid_physical_progress")
    if not approval:
        warnings.append("missing_or_unparsed_approval_date")
    if not target_doc:
        warnings.append("missing_or_unparsed_target_completion_date")

    scoring_eligible = bool(source_id and original_cost and original_cost > 0
                            and expenditure is not None and expenditure >= 0
                            and progress is not None and 0 <= progress <= 100
                            and approval and target_doc and report_month)
    return {
        "sl_no": int(serial),
        "project_code": project_code or (legacy_code if family == "ocms" else None),
        "legacy_ocms_code": legacy_code,
        "pmgid": pmgid,
        "source_project_id": source_id,
        "project_name": project_name,
        "agency": agency,
        "state": state,
        "ministry": None,
        "sector": sector,
        "approval_date": approval,
        "start_date": None,
        "target_doc": target_doc,
        "revised_doc": revised_doc,
        "anticipated_doc": anticipated_doc,
        "original_cost_cr": original_cost,
        "revised_cost_cr": revised_cost,
        "anticipated_cost_cr": anticipated_cost,
        "cumulative_expenditure_cr": expenditure,
        "physical_progress_pct": progress,
        "report_month": report_month,
        "source_pdf": None,
        "source_page": page_num,
        "source_table": table_title,
        "report_format": family,
        "quality_status": "REVIEW_REQUIRED" if warnings else "VERIFIED",
        "quality_warnings": ";".join(warnings),
        "scoring_eligible": scoring_eligible,
    }


def _overview_totals(pdf):
    # PAIMANA's overview states project count and portfolio totals together.
    text = "\n".join((page.extract_text() or "") for page in pdf.pages[:15])
    match = re.search(r"\b(\d{3,5})\s*\|\s*\d+\s*₹\s*([\d,]+)\s*₹\s*([\d,]+)\s*₹\s*([\d,]+)", text)
    if not match:
        return None
    return {"project_count": int(match.group(1)),
            "original_cost_cr": float(match.group(2).replace(",", "")),
            "revised_cost_cr": float(match.group(3).replace(",", "")),
            "cumulative_expenditure_cr": float(match.group(4).replace(",", ""))}


def _ocms_overview_totals(pdf):
    for page in pdf.pages[:20]:
        text = (page.extract_text() or "").lower()
        if "sector-wise distribution" not in text or "ongoing projects" not in text:
            continue
        for table in page.extract_tables():
            for row in table:
                if not any("total" in _text(cell).lower() for cell in row):
                    continue
                cells = [_text(cell) for cell in row]
                numbers = [i for i, cell in enumerate(cells) if re.search(r"\d", cell)]
                if len(numbers) < 3:
                    continue
                count_index = numbers[0]
                count_match = re.search(r"\d+", cells[count_index])
                if not count_match:
                    continue
                cost_index = numbers[1]
                expense_index = numbers[-1]
                return {
                    "project_count": int(count_match.group()),
                    "original_cost_cr": _amount(cells[cost_index]),
                    "revised_cost_cr": _amount(cells[cost_index], bracket=True),
                    "cumulative_expenditure_cr": _amount(cells[expense_index]),
                }
    return None


def extract_report(pdf_path, report_month):
    """Return normalized rows plus a reproducible, report-level quality record."""
    pdf_path = Path(pdf_path)
    quality = {
        "source_pdf": pdf_path.as_posix(), "report_month": report_month,
        "parser_version": PARSER_VERSION, "pdf_pages": 0, "format": None,
        "target_table": None, "table_pages": [], "rows_extracted": 0,
        "page_extraction_methods": {},
        "rows_review_required": 0, "rows_not_scoring_eligible": 0,
        "duplicate_source_ids": [], "official_totals": None,
        "extracted_totals": {}, "reconciliation": {}, "status": "FAILED",
        "errors": [], "warning_counts": {},
    }
    records, carried = [], {}
    try:
        with pdfplumber.open(pdf_path) as pdf:
            quality["pdf_pages"] = len(pdf.pages)
            family, title = _family_and_title(pdf)
            quality["format"], quality["target_table"] = family, title
            if not family:
                quality["errors"].append("unrecognized_report_format")
                return records, quality
            quality["official_totals"] = (_ocms_overview_totals(pdf) if family == "ocms"
                                           else _overview_totals(pdf))
            seen_page = set()
            for page_index, page in enumerate(pdf.pages):
                page_text = page.extract_text() or ""
                if not _is_target_page(page_text, family):
                    continue
                tables = page.extract_tables()
                candidates = []
                for table in tables:
                    cols = _column_map(table, family)
                    if cols:
                        candidates.append((len(table), table, cols))
                extracted_page = None
                method = "pdfplumber_table"
                if not candidates:
                    if family != "paimana":
                        continue
                    rows = _paimana_text_layout_rows(page)
                    if not rows:
                        continue
                    cols = {key: i for i, key in enumerate(
                        ("serial", "name", "state", "approval", "completion", "cost", "expenditure", "progress"))}
                    table = rows
                    method = "pdfplumber_header_position_fallback"
                else:
                    _, table, cols = max(candidates, key=lambda item: item[0])
                page_records = []
                for row in table:
                    rec = _record(row, cols, family, page_index + 1, title, report_month, carried)
                    if rec:
                        rec["source_pdf"] = pdf_path.as_posix()
                        page_records.append(rec)
                        carried["state"] = rec["state"]
                        carried["sector"] = rec["sector"]
                if page_records:
                    records.extend(page_records)
                    seen_page.add(page_index + 1)
                    quality["page_extraction_methods"][str(page_index + 1)] = method
            quality["table_pages"] = sorted(seen_page)
            legacy_links = {}
            for record in records:
                if record["legacy_ocms_code"] and record["project_code"]:
                    legacy_links.setdefault(record["legacy_ocms_code"], set()).add(record["project_code"])
            ambiguous_legacy = {code: sorted(ids) for code, ids in legacy_links.items() if len(ids) > 1}
            quality["ambiguous_legacy_ocms_references"] = ambiguous_legacy
            if ambiguous_legacy:
                for record in records:
                    if record["legacy_ocms_code"] in ambiguous_legacy:
                        warning = "ambiguous_legacy_ocms_reference"
                        current = set(filter(None, record["quality_warnings"].split(";")))
                        current.add(warning)
                        record["quality_warnings"] = ";".join(sorted(current))
                        record["quality_status"] = "REVIEW_REQUIRED"
            quality["rows_extracted"] = len(records)
            quality["rows_review_required"] = sum(r["quality_status"] != "VERIFIED" for r in records)
            quality["rows_not_scoring_eligible"] = sum(not r["scoring_eligible"] for r in records)
            counts = {}
            for record in records:
                for warning in filter(None, record["quality_warnings"].split(";")):
                    counts[warning] = counts.get(warning, 0) + 1
            quality["warning_counts"] = counts
            ids = [r["source_project_id"] for r in records if r["source_project_id"]]
            from collections import Counter
            quality["duplicate_source_ids"] = sorted(code for code, count in Counter(ids).items() if count > 1)
            serials = [r["sl_no"] for r in records]
            quality["duplicate_serial_numbers"] = sorted(
                number for number, count in Counter(serials).items() if count > 1)
            unique_serials = sorted(set(serials))
            quality["serial_gaps"] = ([number for number in range(unique_serials[0], unique_serials[-1] + 1)
                                        if number not in set(unique_serials)] if unique_serials else [])
            quality["extracted_totals"] = {
                "project_count": len(records),
                "original_cost_cr": round(sum(r["original_cost_cr"] or 0 for r in records), 2),
                "revised_cost_cr": round(sum(r["revised_cost_cr"] or 0 for r in records), 2),
                "cumulative_expenditure_cr": round(sum(r["cumulative_expenditure_cr"] or 0 for r in records), 2),
            }
            expected = quality["official_totals"]
            if expected:
                actual = quality["extracted_totals"]
                for key, value in expected.items():
                    got = actual[key]
                    if value is None:
                        continue
                    quality["reconciliation"][key] = {
                        "expected": value, "extracted": got,
                        "difference": round(got - value, 2),
                        "matches": abs(got - value) <= max(1.0, abs(value) * 0.001),
                    }
            if not records:
                quality["errors"].append("ongoing_project_table_not_found_or_empty")
            if records and len(seen_page) == 0:
                quality["errors"].append("no_source_pages_recorded")
            if quality["duplicate_source_ids"]:
                quality["errors"].append("duplicate_source_project_ids")
            if quality["duplicate_serial_numbers"]:
                quality["errors"].append("duplicate_serial_numbers")
            if quality["serial_gaps"]:
                quality["warning_counts"]["serial_number_gaps"] = len(quality["serial_gaps"])
            reconciliation_mismatch = any(not item["matches"] for item in quality["reconciliation"].values())
            if reconciliation_mismatch:
                quality["warning_counts"]["portfolio_reconciliation_mismatch"] = 1
            quality["status"] = "FAILED" if quality["errors"] else (
                "REVIEW_REQUIRED" if quality["rows_review_required"] or reconciliation_mismatch
                else "VERIFIED")
    except Exception as exc:
        quality["errors"].append(f"{type(exc).__name__}: {exc}")
    return records, quality


def extract(pdf_path, report_month):
    """Compatibility wrapper used by older callers."""
    return extract_report(pdf_path, report_month)[0]


if __name__ == "__main__":
    import json
    import sys
    path = sys.argv[1]
    month = sys.argv[2] if len(sys.argv) > 2 else "unknown"
    records, quality = extract_report(path, month)
    print(json.dumps(quality, indent=2))
