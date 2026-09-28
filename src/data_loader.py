import re
import pandas as pd
import numpy as np
from pathlib import Path

RAW_DIR = Path("data/raw")
OUT_PATH = Path("data/processed/panel.parquet")

def parse_mmyyyy(s):
    if pd.isna(s) or str(s).strip() in ("-", "", "NA", "N/A"):
        return pd.NaT
    try:
        mm, yyyy = str(s).strip().split("/")
        return pd.Timestamp(year=int(yyyy), month=int(mm), day=1)
    except Exception:
        return pd.NaT

NUMBER = re.compile(r"-?\d+(?:\.\d+)?")
PROJECT_CODE = re.compile(r"^\d{6}$")
MONTH_CSV = re.compile(r"^[A-Z][a-z]+\d{4}\.csv$")  # e.g. April2026.csv; skips "copy" files


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
    """The 6-digit PAIMANA code, wherever the extractor put it.

    For some NHAI/MoRTH/AAI rows the agency name or "-" lands in project_code and the
    real code shifts into legacy_ocms_code or pmgid. Those rows then collided as
    duplicates and were dropped (1,981 extracted -> 1,962 kept in April).
    """
    for col in ("project_code", "legacy_ocms_code", "pmgid"):
        v = str(row.get(col, "")).strip()
        if PROJECT_CODE.match(v):
            return v
    return np.nan


def load_all_months(raw_dir: Path = RAW_DIR) -> pd.DataFrame:
    files = sorted(f for f in raw_dir.glob("*.csv") if MONTH_CSV.match(f.name))
    if not files:
        raise FileNotFoundError(f"No CSVs found in {raw_dir}")
    frames = [pd.read_csv(f, dtype=str) for f in files]
    return pd.concat(frames, ignore_index=True)

def clean_panel(panel: pd.DataFrame) -> pd.DataFrame:
    df = panel.copy()

    for col in ["original_cost_cr", "revised_cost_cr",
                "cumulative_expenditure_cr", "physical_progress_pct"]:
        df[col] = df[col].apply(clean_numeric)

    for col in ["approval_date", "start_date", "target_doc", "revised_doc"]:
        df[col] = df[col].apply(parse_mmyyyy)

    df["report_month_dt"] = pd.to_datetime(df["report_month"], format="%B%Y", errors="coerce")
    df["project_code"] = df.apply(recover_project_code, axis=1)
    lost = df["project_code"].isna().sum()
    if lost:
        print(f"[data_loader] WARNING: {lost} rows have no 6-digit project code; dropped")
    df = df.dropna(subset=["project_code"])

    dups = df.duplicated(subset=["project_code", "report_month_dt"]).sum()
    if dups:
        print(f"[data_loader] WARNING: {dups} duplicate project-month rows; keeping the last")
    df = df.drop_duplicates(subset=["project_code", "report_month_dt"], keep="last")
    df = df.sort_values(["project_code", "report_month_dt"]).reset_index(drop=True)
    return df

if __name__ == "__main__":
    panel = clean_panel(load_all_months())
    OUT_PATH.parent.mkdir(parents=True, exist_ok=True)
    panel.to_parquet(OUT_PATH, index=False)
    print(f"{panel['project_code'].nunique()} projects, "
          f"{panel['report_month_dt'].nunique()} months, {len(panel)} rows")

