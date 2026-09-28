import re
import pandas as pd
import numpy as np
from pathlib import Path

RAW_DIR = Path("data/raw")
OUT_PATH = Path("data/processed/panel.parquet")

def parse_mmyyyy(s):
    if pd.isna(s) or str(s).strip() in ("-", "", "NA", "N/A"):
        return pd.NaT
    value = str(s).strip()
    match = re.fullmatch(r"(\d{1,2})\s*[/\-]\s*(\d{4})", value)
    if match:
        try:
            return pd.Timestamp(year=int(match.group(2)), month=int(match.group(1)), day=1)
        except ValueError:
            return pd.NaT
    for fmt in ("%b-%y", "%B-%y", "%b-%Y", "%B-%Y"):
        try:
            return pd.to_datetime(value, format=fmt).replace(day=1)
        except (ValueError, TypeError):
            pass
    return pd.NaT

NUMBER = re.compile(r"-?\d+(?:\.\d+)?")
PROJECT_CODE = re.compile(r"^\d{6}$")
OCMS_CODE = re.compile(r"^N\d{8}$", re.I)
MONTH_CSV = re.compile(r"^[A-Z][a-z]+\d{4}\.csv$")  # e.g. April2026.csv; skips "copy" files

try:  # Supports both package imports and direct `python src/...` execution.
    from .report_utils import month_tag_from_filename
except ImportError:
    from report_utils import month_tag_from_filename


def clean_numeric(s):
    """First number in the cell.

    The extractor sometimes glues the page footer ("523.61 visit: https://...") or a
    neighbouring value ("139.77 10762.01") onto a cell. float() rejected those, which
    blanked about 134 expenditure values per month.
    """
    if pd.isna(s):
        return np.nan
    m = NUMBER.search(str(s).replace(",", ""))
    return float(m.group()) if m else np.nan


def recover_project_code(row):
    """Preserve an official identifier from either report generation."""
    for col in ("source_project_id", "project_code", "legacy_ocms_code", "pmgid"):
        value = str(row.get(col, "")).strip()
        if PROJECT_CODE.fullmatch(value):
            return value
        if OCMS_CODE.fullmatch(value):
            return value.upper()
    return np.nan


def recover_project_key(row):
    """Prefer the report's own official ID; crosswalks are applied after uniqueness checks."""
    for col in ("source_project_id", "project_code", "pmgid", "legacy_ocms_code"):
        value = str(row.get(col, "")).strip()
        if OCMS_CODE.fullmatch(value):
            return value.upper()
    for col in ("source_project_id", "project_code", "pmgid"):
        value = str(row.get(col, "")).strip()
        if PROJECT_CODE.fullmatch(value):
            return value
    return np.nan


def load_all_months(raw_dir: Path = RAW_DIR) -> pd.DataFrame:
    files = sorted(f for f in raw_dir.glob("*.csv") if MONTH_CSV.match(f.name))
    if not files:
        raise FileNotFoundError(f"No CSVs found in {raw_dir}")
    frames = []
    for file in files:
        frame = pd.read_csv(file, dtype=str)
        # Ignore a generated CSV whose filename no longer matches its source
        # PDF's month (for example, the old Frapril2025.csv output).
        if "source_pdf" in frame and frame["source_pdf"].notna().any():
            source_tags = {month_tag_from_filename(Path(v).name)
                           for v in frame["source_pdf"].dropna().unique()}
            if (len(source_tags) == 1 and file.stem not in source_tags
                    and any((raw_dir / f"{tag}.csv").exists() for tag in source_tags)):
                print(f"[data_loader] Skipping stale generated export {file.name}; "
                      f"source report month is {next(iter(source_tags))}")
                continue
        frames.append(frame)
    if not frames:
        raise FileNotFoundError(f"No current monthly CSV exports found in {raw_dir}")
    return pd.concat(frames, ignore_index=True)

def clean_panel(panel: pd.DataFrame) -> pd.DataFrame:
    df = panel.copy()

    for col in ["original_cost_cr", "revised_cost_cr",
                "cumulative_expenditure_cr", "physical_progress_pct"]:
        df[col] = df[col].apply(clean_numeric)

    for col in ["approval_date", "start_date", "target_doc", "revised_doc"]:
        df[col] = df[col].apply(parse_mmyyyy)

    df["report_month_dt"] = pd.to_datetime(df["report_month"], format="%B%Y", errors="coerce")
    if "source_pdf" in df:
        missing_month = df["report_month_dt"].isna() & df["source_pdf"].notna()
        inferred = df.loc[missing_month, "source_pdf"].map(
            lambda value: pd.to_datetime(month_tag_from_filename(Path(value).name),
                                         format="%B%Y", errors="coerce"))
        df.loc[missing_month, "report_month_dt"] = inferred
    if "source_project_id" not in df:
        df["source_project_id"] = df.get("project_code")
    else:
        df["source_project_id"] = df["source_project_id"].where(
            df["source_project_id"].notna(), df.get("project_code"))
    if "legacy_ocms_code" not in df:
        df["legacy_ocms_code"] = np.nan
    df["project_code"] = df.apply(recover_project_code, axis=1)
    df["project_key"] = df.apply(recover_project_key, axis=1)
    # Apply legacy OCMS links only when exactly one PAIMANA official ID points
    # to that code. A one-to-many code is retained as an explicit review item.
    paimana = df["source_project_id"].astype(str).str.fullmatch(r"\d{6}")
    crosswalk = (df.loc[paimana & df["legacy_ocms_code"].notna()]
                 .groupby("legacy_ocms_code")["source_project_id"].agg(lambda ids: set(ids)))
    for legacy, project_ids in crosswalk.items():
        mask = paimana & df["legacy_ocms_code"].eq(legacy)
        if len(project_ids) == 1:
            df.loc[mask, "project_key"] = legacy.upper()
        else:
            df.loc[mask, "project_key"] = df.loc[mask, "source_project_id"]
            df.loc[mask, "quality_status"] = "REVIEW_REQUIRED"
            warnings = df.loc[mask, "quality_warnings"].fillna("")
            df.loc[mask, "quality_warnings"] = warnings.apply(
                lambda value: ";".join(filter(None, [value, "ambiguous_legacy_ocms_reference"])))
    lost = df["project_code"].isna().sum()
    if lost:
        print(f"[data_loader] WARNING: {lost} rows have no official project ID; retained in source CSV only")
    df = df.dropna(subset=["project_code", "project_key"])

    dup_mask = df.duplicated(subset=["project_key", "report_month_dt"], keep=False)
    dups = int(dup_mask.sum())
    if dups:
        print(f"[data_loader] WARNING: {dups} duplicate official-ID/report-month rows; kept with review flags")
        df.loc[dup_mask, "scoring_eligible"] = False
        df.loc[dup_mask, "quality_status"] = "REVIEW_REQUIRED"
        warnings = df.loc[dup_mask, "quality_warnings"].fillna("")
        df.loc[dup_mask, "quality_warnings"] = warnings.apply(
            lambda value: ";".join(filter(None, [value, "duplicate_project_month"])))
    df = df.sort_values(["project_key", "report_month_dt"]).reset_index(drop=True)

    if "scoring_eligible" not in df:
        df["scoring_eligible"] = True
    df["scoring_eligible"] = df["scoring_eligible"].fillna(False).map(
        lambda value: value if isinstance(value, (bool, np.bool_))
        else str(value).strip().lower() in {"true", "1", "yes"})
    required = ["original_cost_cr", "cumulative_expenditure_cr", "physical_progress_pct",
                "approval_date", "target_doc", "report_month_dt"]
    valid = df[required].notna().all(axis=1)
    valid &= (df["original_cost_cr"] > 0) & (df["cumulative_expenditure_cr"] >= 0)
    valid &= df["physical_progress_pct"].between(0, 100)
    df["scoring_eligible"] &= valid
    return df

if __name__ == "__main__":
    panel = clean_panel(load_all_months())
    OUT_PATH.parent.mkdir(parents=True, exist_ok=True)
    panel.to_parquet(OUT_PATH, index=False)
    print(f"{panel['project_code'].nunique()} projects, "
          f"{panel['report_month_dt'].nunique()} months, {len(panel)} rows")
