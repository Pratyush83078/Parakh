"""Data-quality report for the monthly panel.

Run: python src/checker.py        (exit code 1 if a hard check fails)

FAIL = must be fixed before a demo (duplicates, impossible values, totals that
do not reconcile with official figures). WARN = disclose in docs and UI.
"""
import sys
import pandas as pd

PANEL = "data/processed/full_panel.parquet"
# Official April 2026 totals from the SIH 26103 problem statement (Rs lakh crore).
OFFICIAL_APR = {"projects": 1981, "original": 37.13, "revised": 42.78, "expenditure": 20.36}
TOLERANCE = 0.02

df = pd.read_parquet(PANEL)
month = df["report_month_dt"]
fails, warns = [], []


def check(ok, msg, hard=True):
    if not ok:
        (fails if hard else warns).append(msg)


print(f"Rows {len(df)} | projects {df.project_code.nunique()}")
print(df.groupby(month.dt.strftime("%Y-%m")).size().to_string(), "\n")

# 1. Identity
identity = "project_key" if "project_key" in df else "project_code"
dups = df.duplicated([identity, "report_month_dt"]).sum()
check(dups == 0, f"{dups} duplicate project-month rows")

# 2. Completeness
key = ["original_cost_cr", "revised_cost_cr", "cumulative_expenditure_cr",
       "physical_progress_pct", "start_date", "target_doc", "revised_doc", "ministry", "state"]
miss = (df[key].isna().mean() * 100).round(1)
print("Missing %:\n" + miss.to_string(), "\n")
for c in ["original_cost_cr", "physical_progress_pct", "target_doc"]:
    check(miss[c] < 5, f"{c} missing in {miss[c]}% of rows", hard=False)

# 3. Ranges
p = df.physical_progress_pct
bad_progress = p.notna() & ~p.between(0, 100)
n = int(bad_progress.sum())
if n:
    safely_flagged = (
        df.get("quality_status", pd.Series("VERIFIED", index=df.index)).eq("REVIEW_REQUIRED")
        & ~df.get("scoring_eligible", pd.Series(True, index=df.index)).fillna(False)
    )
    unsafe = bad_progress & ~safely_flagged
    check(not unsafe.any(),
          f"{int(unsafe.sum())} out-of-range progress rows are not both review-required and excluded from scoring")
    if not unsafe.any():
        warns.append(f"{n} out-of-range progress row(s) are review-required and excluded from scoring")
n = (df.original_cost_cr <= 0).sum()
check(n == 0, f"{n} rows with original cost <= 0")
n = (df.original_cost_cr < 150).sum()
check(n == 0, f"{n} rows below the Rs 150 cr threshold (unit or parse error?)", hard=False)
budget = df.revised_cost_cr.fillna(df.original_cost_cr)
n = (df.cumulative_expenditure_cr > 1.5 * budget).sum()
check(n == 0, f"{n} rows spending more than 150% of revised cost", hard=False)
n = (df.revised_cost_cr < 0.5 * df.original_cost_cr).sum()
check(n == 0, f"{n} rows where revised cost < 50% of original (column swap?)", hard=False)

# 4. Date order
n = (df.target_doc < df.start_date).sum()
check(n == 0, f"{n} rows with target completion before start", hard=False)
n = (df.revised_doc < df.target_doc).sum()
check(n == 0, f"{n} rows with revised completion earlier than original", hard=False)

# 5. Month-over-month consistency
g = df.sort_values([identity, "report_month_dt"]).groupby(identity)
n = (g.physical_progress_pct.diff() < -1).sum()
check(n == 0, f"{n} month-to-month drops in physical progress > 1 pt", hard=False)
n = (g.report_month_dt.diff().dt.days > 40).sum()
check(n == 0, f"{n} project histories skip a month (labels treat the gap as unlabelled)", hard=False)
latest = df[month == month.max()][identity].nunique()
print(f"Projects absent from the latest month: {df[identity].nunique() - latest}")
if "quality_status" in df:
    print("\nExtraction quality status:")
    print(df.quality_status.value_counts(dropna=False).to_string())
    print(f"Scoring-eligible records: {int(df.scoring_eligible.sum()) if 'scoring_eligible' in df else 'unknown'}")

# 6. Label coverage
for lab in ["cost_revised_up_label", "schedule_slipped_label"]:
    if lab in df:
        print(f"{lab}: labelled {df[lab].notna().sum()}, positives {int(df[lab].sum())} "
              f"({df[lab].mean() * 100:.1f}%)")

# 7. Reconciliation with official April totals
apr = df[month == pd.Timestamp("2026-04-01")]
got = {"projects": len(apr), "original": apr.original_cost_cr.sum() / 1e5,
       "revised": budget[apr.index].sum() / 1e5, "expenditure": apr.cumulative_expenditure_cr.sum() / 1e5}
print("\nApril reconciliation (ours vs official):")
for k, off in OFFICIAL_APR.items():
    diff = (got[k] - off) / off
    print(f"  {k:12s} {got[k]:>10.2f} vs {off:>8.2f}  ({diff:+.1%})")
    check(abs(diff) <= TOLERANCE, f"April {k} differs from official by {diff:+.1%}")

print()
for w in warns:
    print("WARN ", w)
for f in fails:
    print("FAIL ", f)
print(f"\n{len(fails)} failed, {len(warns)} warnings")
sys.exit(1 if fails else 0)
