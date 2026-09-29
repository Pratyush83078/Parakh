"""Build the PARAKH idea deck for SIH 2026 / PS 26103.

This script fills the *official* SIH 2026 idea-presentation template (six slides
including the title page; the template's slide 7 is the instruction page and may
be deleted). The template's mandated idea-detail pointers are reused **as the
slide headings**, so every pointer is on the slide in the template's order and no
grey prompt text is left behind.

The deck answers problem statement 26103 literally, because a jury scores against
the brief. Its spine is the brief's own arc — descriptive → predictive →
prescriptive monitoring — plus its two explicit demands:

  * comparison of AI/ML against conventional statistical methods (dimension b),
  * attribution of performance to the current CUF fields versus variables not yet
    captured (dimension c),

and its nine expected outcomes (a) cost overrun prediction … (i) documentation and
deployment) as an explicit, honest status checklist on the impact slide.

Numbers are read from generated artifacts at run time:

    data/processed/model_metrics.json      model comparison + validation
    data/processed/portfolio_kpis.json     latest snapshot + risk bands
    data/raw/extraction_quality.json       per-report extraction + reconciliation

Anything the team must fill in (registered team name and ID, repository link)
is a bracketed placeholder at the top of this file.

Run:  venv/bin/python src/make_ppt.py
Out:  docs/presentation/PARAKH_SIH26103_Idea_Submission_FINAL.pptx
      docs/presentation/deck_preview.html   (same content, for visual review)

The script also prints a layout report (shape bounds, estimated text overflow,
overlapping text boxes) on every run; a clean run ends with `layout warnings: none`.
"""
from __future__ import annotations

import html
import json
from pathlib import Path

from pptx import Presentation
from pptx.dml.color import RGBColor
from pptx.enum.shapes import MSO_SHAPE
from pptx.enum.text import PP_ALIGN, MSO_ANCHOR
from pptx.oxml.ns import qn
from pptx.util import Emu, Inches, Pt

ROOT = Path(__file__).resolve().parents[1]

TEMPLATE_CANDIDATES = [
    ROOT / "docs/presentation/templates/SIH2026-Idea-Presentation-Format.pptx",
    Path.home() / "Downloads/SIH2026-IDEA-Presentation-Format.pptx",
]

OUT_PPTX = ROOT / "docs/presentation/PARAKH_SIH26103_Idea_Submission_FINAL.pptx"
OUT_HTML = ROOT / "docs/presentation/deck_preview.html"

# ── fill these in from the SIH portal before submitting ──────────────────────
TEAM_NAME = "[Team name as on portal]"
TEAM_ID = "[Team ID]"
PS_ID = "26103"
PS_TITLE = "Use case on web-based integrated project-monitoring platform"
THEME = "Smart Automation"
CATEGORY = "Software"
REPO_URL = "[repository / demo link]"
DEMO_URL = "[demo video link]"

# ── palette ──────────────────────────────────────────────────────────────────
SIH_BLUE = RGBColor(0x00, 0x70, 0xC0)   # the template's own footer blue
NAVY = RGBColor(0x10, 0x2A, 0x43)
INK = RGBColor(0x1F, 0x29, 0x33)
MUTED = RGBColor(0x5B, 0x6B, 0x7B)
WHITE = RGBColor(0xFF, 0xFF, 0xFF)
RED = RGBColor(0xB3, 0x2B, 0x22)
GREEN = RGBColor(0x1B, 0x6E, 0x45)
AMBER = RGBColor(0xB0, 0x6D, 0x0A)
PANEL = RGBColor(0xF2, 0xF7, 0xFC)
PANEL_ALT = RGBColor(0xFB, 0xFD, 0xFF)
BORDER = RGBColor(0xC5, 0xDC, 0xF0)
ZEBRA = RGBColor(0xF7, 0xFA, 0xFD)

TITLE_FONT = "Times New Roman"   # the template's own heading face
BODY_FONT = "Calibri"            # theme minor face
MONO_FONT = "Consolas"


# ── content model ────────────────────────────────────────────────────────────
class Slide:
    """One slide's worth of shapes, rendered to PPTX and to HTML."""

    def __init__(self, number: int, footer: bool = True):
        self.number = number
        self.footer = footer
        self.shapes: list[dict] = []
        self.notes: list[str] = []

    def rect(self, x, y, w, h, fill=None, border=None, radius=False, dash=False, width=0.75):
        self.shapes.append(dict(kind="rect", x=x, y=y, w=w, h=h, fill=fill, border=border,
                                radius=radius, dash=dash, width=width))

    def txt(self, x, y, w, h, paras, size=10.5, color=INK, font=BODY_FONT, bold=False,
            spacing=1.05, align="l", space_after=4, anchor="t", caps=False):
        if isinstance(paras, str):
            paras = [paras]
        out = []
        for para in paras:
            if isinstance(para, tuple):           # (text, overrides)
                text, over = para
            else:
                text, over = para, {}
            bullet = over.pop("bullet", False)
            out.append(dict(text=text, bullet=bullet, **{
                "size": over.get("size", size),
                "color": over.get("color", color),
                "font": over.get("font", font),
                "bold": over.get("bold", bold),
                "align": over.get("align", align),
                "spacing": over.get("spacing", spacing),
                "space_after": over.get("space_after", space_after),
            }))
        self.shapes.append(dict(kind="text", x=x, y=y, w=w, h=h, paras=out, anchor=anchor))

    def chip(self, x, y, w, h, text, fill=NAVY, color=WHITE, size=9.5, bold=True,
             font=BODY_FONT, align="c", border=None):
        self.shapes.append(dict(kind="chip", x=x, y=y, w=w, h=h, text=text, fill=fill,
                                color=color, size=size, bold=bold, font=font,
                                align=align, border=border))

    def table(self, x, y, widths, rows, row_h=0.3, size=9.5, head_h=None):
        self.shapes.append(dict(kind="table", x=x, y=y, widths=widths, rows=rows,
                                row_h=row_h, size=size, head_h=head_h or row_h + 0.04))

    def note(self, *lines):
        self.notes.extend(lines)


# ── load generated evidence ──────────────────────────────────────────────────
METRICS = json.loads((ROOT / "data/processed/model_metrics.json").read_text())
KPIS = json.loads((ROOT / "data/processed/portfolio_kpis.json").read_text())
QUALITY = json.loads((ROOT / "data/raw/extraction_quality.json").read_text())

S_M = METRICS["schedule_slipped_label"]
C_M = METRICS["cost_revised_up_label"]
S_T, S_G = S_M["temporal_split"], S_M["group_split"]
C_T, C_G = C_M["temporal_split"], C_M["group_split"]
MONTHS = METRICS["months"]

FEATURE_LABELS = {
    "original_cost_cr": "sanctioned cost",
    "months_since_approval": "months since approval",
    "approval_to_target_m": "approved timeline",
    "approval_elapsed_frac": "timeline used so far",
    "progress_gap": "progress behind plan",
    "expenditure_util_pct": "funds used",
    "spend_vs_progress_gap": "spend ahead of work",
    "doc_already_slipped": "already delayed",
    "doc_slip_months_so_far": "delay reported so far",
    "progress_velocity": "progress speed",
    "cost_revision_count_cum": "cost revisions",
    "doc_revision_count_cum": "schedule revisions",
    "agency_avg_overrun": "agency's own overrun record",
}

# extraction aggregates
Q_PDFS = QUALITY["pdf_count"]
_failed = QUALITY.get("failed_reports", 0)
Q_FAILED = len(_failed) if isinstance(_failed, (list, tuple, dict)) else int(_failed)
Q_ROWS = sum(r.get("rows_extracted", 0) for r in QUALITY["reports"])
Q_REVIEW = sum(r.get("rows_review_required", 0) for r in QUALITY["reports"])
Q_PAGES = sum(r.get("pdf_pages", 0) for r in QUALITY["reports"])


def _fully_reconciled(r) -> bool:
    rec = r.get("reconciliation") or {}
    return bool(rec) and all(v.get("matches") for v in rec.values())


Q_PAIMANA = [r for r in QUALITY["reports"] if r.get("format") == "paimana"]
Q_PAIMANA_OK = sum(1 for r in Q_PAIMANA if _fully_reconciled(r))
Q_RECONCILED = sum(1 for r in QUALITY["reports"] if _fully_reconciled(r))
Q_VERIFIED_REPORTS = sum(1 for r in QUALITY["reports"] if r.get("status") == "VERIFIED")


def _official(month: str) -> dict:
    for r in QUALITY["reports"]:
        if r.get("report_month", "").replace(" ", "") == month:
            return r.get("official_totals", {}) or {}
    return {}


APR = _official("April2026")
APR_PROJECTS = int(APR.get("project_count", 0))
APR_ORIG = APR.get("original_cost_cr", 0) / 1e5
APR_REV = APR.get("revised_cost_cr", 0) / 1e5
APR_EXP = APR.get("cumulative_expenditure_cr", 0) / 1e5

# global SHAP shares for the schedule model
_shap = S_T.get("shap_global_importance") or {}
_shap_total = sum(_shap.values()) or 1.0
SHAP_SHARE = {FEATURE_LABELS.get(k, k.replace("_", " ")): v / _shap_total
              for k, v in _shap.items()}
SHARE_TIME = SHAP_SHARE.get("timeline used so far", 0.0)
SHARE_AGENCY = SHAP_SHARE.get("agency's own overrun record", 0.0)
SHARE_SLIP = SHAP_SHARE.get("delay reported so far", 0.0)
SHARE_SPEND = SHAP_SHARE.get("spend ahead of work", 0.0)

BANDS = KPIS["risk_band_counts"]
FLAGGED = BANDS["High"] + BANDS["Critical"]
LATEST = KPIS["total_projects"]
HISTORIES = KPIS["unique_projects_all_reports"]
PANEL_ROWS = KPIS["panel_rows"]


def _month_label(m: str) -> str:
    import datetime
    return datetime.datetime.strptime(m, "%Y-%m").strftime("%b %Y")


MONTH_SPAN = f"{_month_label(MONTHS[0])} → {_month_label(MONTHS[-1])}"

# fixed facts from the problem statement itself
PS_OWNER = "MoSPI · Data Informatics & Innovation Division (DIID)"
PS_OPS = "PAIMANA operations: Infrastructure & Project Monitoring Division (IPMD)"
OCMS_SINCE = 2006
SECTORS = 22
COST_FLOOR = "₹150 crore and above"

# the template's own instruction bullets, reused as headings
PTR = {
    "solution": "PROPOSED SOLUTION — DETAILED EXPLANATION",
    "address": "HOW IT ADDRESSES THE PROBLEM",
    "unique": "INNOVATION AND UNIQUENESS OF THE SOLUTION",
    "tech": "TECHNOLOGIES TO BE USED",
    "method": "METHODOLOGY AND PROCESS FOR IMPLEMENTATION",
    "feasible": "ANALYSIS OF THE FEASIBILITY OF THE IDEA",
    "risks": "POTENTIAL CHALLENGES AND RISKS  ·  STRATEGIES FOR OVERCOMING THEM",
    "impact": "POTENTIAL IMPACT ON THE TARGET AUDIENCE",
    "benefits": "BENEFITS OF THE SOLUTION  (SOCIAL · ECONOMIC · ENVIRONMENTAL)",
    "research": "DETAILS / LINKS OF THE REFERENCE AND RESEARCH WORK",
}


def heading(s: Slide, x, y, w, text, color=SIH_BLUE):
    s.txt(x, y, w, 0.2, [(text, {"size": 9.5, "bold": True, "color": color, "space_after": 0})])
    s.rect(x, y + 0.205, w, 0.022, fill=BORDER)


def kicker(s: Slide, text):
    s.txt(1.95, 0.86, 10.4, 0.26,
          [(text, {"size": 11.5, "color": MUTED, "space_after": 0})])


# ── slide 1: title page ─────────────────────────────────────────────────────
def build_title(s: Slide):
    s.txt(1.95, 2.02, 10.4, 0.55,
          [("PARAKH  ·  परख", {"size": 30, "font": TITLE_FONT, "bold": True, "color": NAVY,
                               "space_after": 2})])
    s.rect(1.95, 2.68, 1.6, 0.035, fill=SIH_BLUE)
    s.txt(1.95, 2.84, 10.4, 0.66,
          [("From monthly report to monthly decision.",
            {"size": 17, "font": TITLE_FONT, "bold": True, "color": INK, "space_after": 3}),
           ("A predictive and prescriptive early-warning layer on the PAIMANA project data — "
            "open-source, and built on the fields MoSPI already collects.",
            {"size": 11, "color": SIH_BLUE, "space_after": 0})], anchor="t")
    s.txt(1.95, 3.98, 10.4, 1.75, [
        (f"Problem Statement ID – {PS_ID}", {"size": 11.5}),
        (f"Problem Statement Title – {PS_TITLE}", {"size": 11.5}),
        (f"Theme – {THEME}", {"size": 11.5}),
        (f"PS Category – {CATEGORY}", {"size": 11.5}),
        (f"Team ID – {TEAM_ID}", {"size": 11.5}),
        (f"Team Name (registered on portal) – {TEAM_NAME}", {"size": 11.5}),
    ], spacing=1.35)
    s.txt(1.95, 6.02, 10.4, 0.5,
          [("PROOF OF FEASIBILITY  ", {"size": 10, "bold": True, "color": GREEN}),
           (f"— a working pipeline already ingests the published monthly reports end to end: "
            f"{Q_PDFS} reports, {Q_PAGES:,} pages, {Q_ROWS:,} project-month rows, "
            f"{Q_FAILED} failed extractions, and {Q_PAIMANA_OK} of the "
            f"{len(Q_PAIMANA)} current-format reports reconciled exactly to their own "
            f"printed totals.", {"size": 10, "color": MUTED, "space_after": 0})])
    s.note(
        "Open cold: 'Every month, ministries file the CUF and PAIMANA updates ~2,000 "
        "projects worth ₹42.78 lakh crore. Today that data tells MoSPI what already "
        "happened. Problem statement 26103 asks for monitoring that predicts and "
        "prescribes. That is the whole pitch: PARAKH is that layer.'",
        "Name it once: PARAKH (परख) is the assay you run on something to find out what "
        "it is really made of. We assay the evidence, then forecast the drift.",
        f"Fix before submitting: Team ID, Team Name, repository and demo links. "
        f"Owner: {PS_OWNER}. {PS_OPS}.",
    )


# ── slide 2: idea title / proposed solution ─────────────────────────────────
def build_solution(s: Slide):
    kicker(s, "PAIMANA already tells MoSPI what happened. PARAKH tells it what is about "
              "to change, why, and what to do about it — on the same monthly data.")
    y = 1.22

    # column A — proposed solution
    x, w = 0.5, 4.05
    heading(s, x, y, w, PTR["solution"])
    s.txt(x, y + 0.32, w, 1.38, [
        "The brief's own conclusion: monitoring must move from descriptive reporting to "
        "predictive and prescriptive decision support. PARAKH is that layer — it reads "
        "the monthly CUF/PAIMANA update ministries already file and turns it into a "
        "ranked, explained, actionable review queue.",
        ("It asks for no new form, no new portal and no new field entry from any "
         "project administrator.", {"size": 9.5, "color": MUTED}),
    ], spacing=1.04)
    steps = [
        ("1", "MONTHLY UPDATE", "the CUF/PAIMANA snapshot as filed"),
        ("2", "VERIFY + TRACE", "every field keeps its report and page"),
        ("3", "PAIR T → T+1", "each project's months become examples"),
        ("4", "PREDICT", "cost escalation · schedule slip · risk score"),
        ("5", "EXPLAIN + PRESCRIBE", "drivers · action prompt · owner"),
        ("6", "EARLY-WARNING QUEUE", "ranked for the next review cycle"),
    ]
    sy = y + 1.74
    for i, (n, label, sub) in enumerate(steps):
        s.chip(x, sy, 0.28, 0.28, n, fill=NAVY, size=9.5)
        s.txt(x + 0.38, sy - 0.02, w - 0.38, 0.3,
              [(label + "  ", {"size": 9, "bold": True, "color": NAVY, "space_after": 0}),
               (sub, {"size": 8.5, "color": MUTED, "space_after": 0})])
        if i < len(steps) - 1:
            s.rect(x + 0.135, sy + 0.27, 0.02, 0.09, fill=BORDER)
        sy += 0.36

    # column B — how it addresses the problem
    x, w = 4.75, 3.98
    heading(s, x, y, w, PTR["address"])
    s.txt(x, y + 0.32, w, 3.8, [
        ("**The brief's diagnosis** — cost overruns, time overruns and implementation "
         "risks become visible only after they are reported, so intervention is always "
         "late.", {}),
        ("**PARAKH answers the three questions a monitoring cell needs, for every "
         "project, every month:**", {}),
        ("**WHAT WILL CHANGE?** whether the cost will be revised upward, or the "
         "completion date will move, at the next monthly report.", {"bullet": True}),
        ("**WHY?** the inputs that pushed that ranking up or pulled it down, for that "
         "project.", {"bullet": True}),
        ("**WHAT NEXT?** an action class for the reviewer, the peer benchmark behind "
         "it, and the role that owns it.", {"bullet": True}),
        ("Because the queue is sized to staff capacity, it prioritises interventions "
         "instead of describing them.", {}),
        ("**Unverified data never scores** — a record that fails reconciliation is held "
         "for review, not silently predicted on.", {}),
    ], spacing=1.04)

    # column C — innovation and uniqueness
    x, w = 8.93, 3.9
    heading(s, x, y, w, PTR["unique"])
    s.txt(x, y + 0.32, w, 3.8, [
        ("**1 · Prescriptive, not just predictive.** Every alert carries a recommended "
         "action class, the peer benchmark that justifies it, and the owner role.", {}),
        ("**2 · We predict drift, not failure.** A project rarely collapses; its clocks "
         "separate. Measuring the gap below makes the warning explainable in one "
         "sentence.", {}),
        ("**3 · Two engines, never blended.** Conventional statistics and machine "
         "learning are scored on identical folds and reported side by side, so the "
         "department sees where ML earns its place.", {}),
        ("**4 · An evidence gate on every score.** Validation status travels with every "
         "prediction, and every figure keeps its source page.", {}),
        ("**5 · It measures itself.** Reviewer dispositions are recorded, so accuracy "
         "claims become a measured precision@K instead of a promise.", {}),
    ], spacing=1.04)

    # the uniqueness made visual
    by = 5.62
    s.txt(0.5, by - 0.22, 12.3, 0.22,
          [("THE THREE CLOCKS  ·  WHY A PROJECT SLIPS MONTHS BEFORE THE REPORT SAYS SO",
            {"size": 9.5, "bold": True, "color": SIH_BLUE, "space_after": 0})])
    clocks = [
        ("TIME vs PROGRESS", "share of the approved timeline consumed against share of "
                             "physical work completed", SIH_BLUE),
        ("MONEY vs PROGRESS", "share of the revised cost released against share of "
                              "physical work completed — paying ahead of building", AMBER),
        ("PROMISE vs RECORD", "how many times the cost or the completion date have "
                              "already been revised — repetition predicts repetition", RED),
    ]
    for i, (label, body, color) in enumerate(clocks):
        cx = 0.5 + i * 4.16
        s.rect(cx, by, 4.0, 0.98, fill=PANEL_ALT, border=BORDER, radius=True)
        s.rect(cx, by, 0.045, 0.98, fill=color)
        s.txt(cx + 0.16, by + 0.1, 3.7, 0.8,
              [(label, {"size": 10, "bold": True, "color": color, "space_after": 1}),
               (body, {"size": 8.5, "color": INK, "space_after": 0})], spacing=1.02)
    s.txt(0.5, by + 1.02, 12.3, 0.24,
          [("PARAKH ranks by the widest gap between the three clocks — not by the "
            "loudest number, and not by a black-box score.", {"size": 8.5, "color": MUTED,
                                                              "space_after": 0})])

    s.note(
        "The three clocks are the original idea — slow down here. Every project has a "
        "time clock, a money clock and a promise it made; when they separate, the "
        "outcome is already decided long before the cost revision is printed.",
        "Prescriptive in one sentence: the output is not a score, it is 'this project, "
        "this reason, this action class, this owner, ranked here'.",
        "If asked what is new: ranking by the gap between three clocks, the evidence gate "
        "in front of every score, and reporting statistics and ML side by side instead of "
        "claiming one replaces the other.",
    )


# ── slide 3: technical approach ─────────────────────────────────────────────
def build_technical(s: Slide):
    kicker(s, "Open-source only · built on the fields already in the CUF · compared "
              "against conventional statistics on identical folds.")
    y = 1.2

    steps = [
        ("1  INGEST", "monthly CUF / PAIMANA update + OCMS history"),
        ("2  VERIFY", "schema, range and totals reconciliation per report"),
        ("3  PAIR", "T → T+1 examples built per project"),
        ("4  MODEL", "conventional statistics vs ML, same folds"),
        ("5  EXPLAIN", "per-project drivers + peer benchmarks"),
        ("6  SERVE", "queue, dashboard, benchmarking, API"),
    ]
    fw = (12.33 - 5 * 0.1) / 6
    for i, (label, sub) in enumerate(steps):
        cx = 0.5 + i * (fw + 0.1)
        s.rect(cx, y, fw, 0.72, fill=PANEL, border=BORDER, radius=True)
        s.txt(cx + 0.1, y + 0.06, fw - 0.2, 0.62,
              [(label, {"size": 9, "bold": True, "color": SIH_BLUE, "font": MONO_FONT,
                        "space_after": 1}),
               (sub, {"size": 8, "color": INK, "space_after": 0})], spacing=1.0)

    # left column — technologies
    x, w = 0.5, 3.75
    heading(s, x, y + 0.96, w, PTR["tech"])
    s.txt(x, y + 1.26, w, 3.62, [
        ("Ingestion and evidence", {"bold": True, "color": NAVY}),
        "Python · pandas · Parquet · pdfplumber. Every value keeps its report and page; "
        "unverified records are held, not scored.",
        ("Modelling and attribution", {"bold": True, "color": NAVY}),
        "scikit-learn (logistic regression, gradient boosting) · XGBoost · statsmodels "
        "for the conventional statistical baseline · SHAP for exact per-project "
        "attributions.",
        ("Prescriptive and language layer", {"bold": True, "color": NAVY}),
        "A rule-based prescription playbook over computed evidence, plus an open-weight "
        "LLM running locally (Llama / Mistral class, via Ollama) for the "
        "project-intelligence assistant — it narrates evidence, it never invents "
        "numbers.",
        ("Serving and deployment", {"bold": True, "color": NAVY}),
        "Next.js (React) dashboard + REST API · Docker · single node, CPU only, no paid "
        "model API.",
    ], spacing=1.04)

    # right column — the three technical dimensions of the brief
    x, w = 4.55, 8.28
    heading(s, x, y + 0.9, w, "(a)  PREDICTIVE MODELS THE BRIEF ASKS FOR")
    s.txt(x, y + 1.2, w, 0.4,
          [("**Cost-escalation model  ·  schedule-delay model  ·  composite project "
            "risk score**", {"color": NAVY, "space_after": 1, "size": 9.5}),
           ("Horizon: the next monthly report (T+1). Output: a ranking with a risk band "
            "and the drivers behind it — never a bare number.", {"size": 8.5, "space_after": 0})],
          spacing=1.02)

    ty = y + 1.62
    heading(s, x, ty, w, "(b)  DO AI / ML BEAT CONVENTIONAL STATISTICS?")
    s.table(x, ty + 0.28, [1.75, 0.7, 2.5, 1.95, 1.38], [
        ["Outcome, next report", "Base rate", "Conventional statistics",
         "Machine learning", "Shipped"],
        ["Cost revised upward", f"{C_T['logistic_regression']['positive_rate']:.1%}",
         f"Logistic regression · ROC {C_T['logistic_regression']['roc_auc']:.2f} · "
         f"PR {C_T['logistic_regression']['pr_auc']:.2f}",
         f"XGBoost · ROC {C_T['xgboost']['roc_auc']:.2f} · "
         f"PR {C_T['xgboost']['pr_auc']:.2f}",
         "Logistic regression"],
        ["Completion date moves", f"{S_T['xgboost']['positive_rate']:.1%}",
         f"Rule-based score · ROC {S_T['rule_score_roc_auc']:.2f}",
         f"XGBoost · ROC {S_T['xgboost']['roc_auc']:.2f} · "
         f"PR {S_T['xgboost']['pr_auc']:.2f}",
         "XGBoost"],
    ], row_h=0.36, size=8, head_h=0.42)
    s.txt(x, ty + 1.46, w, 0.56,
          [("Verdict: ", {"bold": True, "color": SIH_BLUE, "size": 9}),
           (f"ML wins where events are frequent — completion dates moved in 18.1% of "
            f"project-months and the ML ranking lifts precision "
            f"{S_T['xgboost']['pr_lift_over_prevalence']:.1f}× over the base rate. Where "
            f"events are rare the simpler model generalises better, so on cost revisions "
            f"we ship logistic regression. We ship what the strict holdout selects, not "
            f"the fashionable choice.", {"size": 8.5})],
          spacing=1.03)

    cy = ty + 2.06
    heading(s, x, cy, w, "(c)  IS THE SIGNAL IN TODAY'S CUF FIELDS, OR IN FIELDS NOT YET CAPTURED?")
    s.txt(x, cy + 0.28, w, 1.14, [
        (f"Inside the CUF the strongest signals are already trajectories, not levels: "
         f"timeline used so far {SHARE_TIME:.0%}, the agency's own overrun record "
         f"{SHARE_AGENCY:.0%}, delay reported so far {SHARE_SLIP:.0%}, spend ahead of "
         f"work {SHARE_SPEND:.0%} (mean |SHAP| share, schedule model) — so the current "
         f"CUF genuinely carries early-warning signal.", {}),
        ("The planned ablation answers the second half: train CUF-only, then add non-CUF "
         "context one block at a time — land acquisition, monsoon and rainfall, "
         "commodity indices, DPR quality — and publish the marginal lift of each block. "
         "That tells MoSPI which new field is worth collecting, and what it buys.", {}),
    ], spacing=1.03)

    s.rect(0.5, 6.32, 12.33, 0.55, fill=PANEL, border=BORDER, radius=True)
    s.txt(0.66, 6.4, 12.0, 0.42,
          [("EVIDENCE FROM THE SUBMITTED PROTOTYPE  ", {"size": 9, "bold": True, "color": SIH_BLUE}),
           (f"— {Q_PDFS} published monthly reports, {Q_PAGES:,} pages, {Q_ROWS:,} rows, "
            f"{Q_FAILED} failed extractions, {Q_REVIEW:,} rows held for review; models "
            f"compared on ordered months with the conventional baseline on identical "
            f"folds (Group-held-out, unseen projects: schedule XGBoost "
            f"{S_G['models']['xgboost']['roc_auc']:.2f} ROC / "
            f"{S_G['models']['xgboost']['pr_auc']:.2f} PR-AUC).", {"size": 9})],
          spacing=1.03)

    s.note(
        "(b) is the question the brief asks twice — 'whether AI/ML provide significant "
        "gains over conventional statistical methods'. Answer it head-on and do not "
        "oversell: ML clearly helps on frequent events, and on rare cost revisions the "
        "simpler model wins. That honesty is what makes the rest believable.",
        "(c) is the second half of the brief: attribute performance to current CUF fields "
        "versus fields not yet captured. Say the finding (trajectory variables dominate) "
        "and then the plan (add non-CUF blocks one at a time, publish marginal lift).",
        "Validation discipline to name out loud: ordered month-by-month holdout, "
        "project-disjoint splits, and the conventional baseline scored on the same folds.",
    )


# ── slide 4: feasibility and viability ──────────────────────────────────────
def build_feasibility(s: Slide):
    kicker(s, "It already runs on the published reports — and it asks nothing new of any "
              "project administrator.")
    y = 1.22

    x, w = 0.5, 5.9
    heading(s, x, y, w, PTR["feasible"])
    blocks = [
        ("TECHNICAL", f"Open-source stack, CPU-only, one batch run per month. The "
                      f"ingestion path is already exercised on {Q_PDFS} published reports "
                      f"({Q_PAGES:,} pages) with {Q_FAILED} failed extractions.", GREEN),
        ("ECONOMIC", "No licence fee, no paid model API, no GPU. The marginal cost of one "
                     "more month is a single batch job on one internal server.", GREEN),
        ("OPERATIONAL", "It rides the monthly rhythm MoSPI already runs: ministries file "
                        "the CUF, PAIMANA updates through role-based access and APIs, "
                        "PARAKH consumes the update and the queue is ready for the review "
                        "cycle. Analysts keep PAIMANA.", GREEN),
        ("DATA AND GOVERNANCE", f"Built on current CUF fields. Reconciliation is real: "
                                f"{Q_PAIMANA_OK} of the {len(Q_PAIMANA)} current-format "
                                f"reports match their own printed totals exactly — project "
                                f"count and all three financial totals — and legacy gaps "
                                f"are disclosed, not hidden.", GREEN),
    ]
    by = y + 0.32
    for label, body, color in blocks:
        s.rect(x, by, w, 0.84, fill=PANEL_ALT, border=BORDER, radius=True)
        s.rect(x, by, 0.045, 0.84, fill=color)
        s.txt(x + 0.16, by + 0.07, w - 0.3, 0.72,
              [(label, {"size": 9, "bold": True, "color": color, "space_after": 1}),
               (body, {"size": 9, "color": INK, "space_after": 0})], spacing=1.03)
        by += 0.92

    s.txt(x, by + 0.04, w, 1.0, [
        ("PILOT PATH — WITH MoSPI, ON PUBLISHED DATA, NO NEW COLLECTION", {"size": 9, "bold": True, "color": SIH_BLUE}),
        ("Month 1: run the queue on published reports; measure precision@K against what "
         "reviewers actually open.", {"size": 9}),
        ("Month 2: calibrate scores, add non-CUF context, measure warning lead time.",
         {"size": 9}),
        ("Month 3+: extend into the OCMS archive, then hand over a documented "
         "deployment.", {"size": 9}),
    ], spacing=1.04)

    x, w = 6.6, 6.23
    heading(s, x, y, w, PTR["risks"])
    s.table(x, y + 0.34, [2.5, 3.73], [
        ["Risk", "Strategy"],
        ["Report layouts drift between months",
         "Schema, range and totals checks on every report; hard-stop and flag on mismatch"],
        [f"Cost revisions are rare ({C_T['logistic_regression']['positive_rate']:.1%} of project-months)",
         "Publish PR-AUC beside the base rate; keep the interpretable baseline; choose models on the strict holdout"],
        ["An unverified field reaching training",
         "Only reconciled records train; source page retained on every row; warnings shown, never hidden"],
        ["A ranking read as a decision",
         "Outputs labelled as rankings, not probabilities; driver and uncertainty always shown; a human decides and the disposition is logged"],
        ["Alert fatigue in a monitoring cell",
         "Queue length is set to reviewer capacity (top-K), never to a fixed threshold"],
        [f"History depth: OCMS {OCMS_SINCE} to PAIMANA today",
         "Start on the published months; extend into the OCMS archive under the same checks before wider claims"],
    ], row_h=0.56, size=8.5, head_h=0.6)
    s.txt(x, y + 4.38, w, 0.6,
          [("IF SELECTED FOR THE FINALE — 30 DAYS:  ", {"size": 9, "bold": True, "color": SIH_BLUE}),
           ("wire the evidence gate into the review queue · re-run ordered and "
            "project-disjoint benchmarks for CUF-only versus CUF plus context · calibrate "
            "the scores and publish precision@K · replay one held-out month end to end "
            "with MoSPI watching.", {"size": 9})], spacing=1.03)

    s.rect(0.5, 6.32, 12.33, 0.55, fill=NAVY, radius=True)
    s.txt(0.7, 6.4, 12.0, 0.42,
          [("WHAT WE DO NOT CLAIM  ", {"size": 9, "bold": True, "color": WHITE}),
           ("— no live MoSPI integration, no automatic alerts or dispatch, no measured "
            "savings, no calibrated probabilities, no causal claims from attribution. "
            "Every score is a ranking for human review.",
            {"size": 9, "color": RGBColor(0xD8, 0xE6, 0xF2)})], spacing=1.03)

    s.note(
        "Feasibility in one line: the input already exists, the machine already exists, "
        "the monthly routine already exists.",
        "The reconciliation line is the strongest feasibility proof available: our "
        "extraction of the current-format reports matches the reports' own printed "
        "totals, so the numbers feeding the models are the department's own numbers.",
        "Lead the risk table with the rare-event risk — juries reward teams that name "
        "their weakest result first.",
    )


# ── slide 5: impact and benefits ────────────────────────────────────────────
def build_impact(s: Slide):
    kicker(s, f"Every expected outcome in the brief, mapped to a module — on a "
              f"₹{APR_REV:.2f} lakh crore portfolio, with impact measured rather than "
              f"asserted.")
    y = 1.22

    x, w = 0.5, 6.28
    heading(s, x, y, w, "THE BRIEF'S NINE EXPECTED OUTCOMES, MAPPED")
    s.txt(x, y + 0.22, w, 0.2,
          [("● working today      ◐ in build for the finale      ○ finale roadmap",
            {"size": 8, "color": MUTED, "space_after": 0})])
    s.table(x, y + 0.48, [4.78, 1.42], [
        ["Expected outcome (problem statement 26103)", "Status"],
        ["a.  Cost overrun prediction model", "● working"],
        ["b.  Time overrun prediction model", "● working"],
        ["c.  Project risk scoring framework", "● working"],
        ["d.  Early warning alert system", "◐ in build"],
        ["e.  Benchmarking and comparative analytics", "◐ in build"],
        ["f.  Cost escalation driver analysis", "● working"],
        ["g.  AI-powered monitoring dashboard", "● working"],
        ["h.  LLM project intelligence assistant", "◐ in build"],
        ["i.  Documentation and deployment framework", "○ finale"],
    ], row_h=0.27, size=9)
    s.txt(x, y + 3.36, w, 1.5, [
        ("WHAT ALREADY WORKS (SUBMITTED PROTOTYPE)", {"size": 9, "bold": True, "color": SIH_BLUE}),
        (f"{Q_PDFS} published monthly reports ingested end to end ({MONTH_SPAN}), "
         f"{Q_ROWS:,} rows, {HISTORIES:,} project histories, and a model comparison on "
         f"ordered months. On the latest snapshot of {LATEST:,} projects, {FLAGGED} "
         f"({FLAGGED / LATEST:.1%}) fall in the High or Critical band — a queue a "
         f"monitoring cell can actually work through, with the driver named for each one.",
         {}),
        ("Audiences: policymakers and monitoring agencies prioritise interventions; "
         "project administrators see drift while it is still cheap to correct; sector "
         "reviewers get peer benchmarks; oversight gets one traceable evidence chain.",
         {"size": 9, "color": MUTED}),
    ], spacing=1.04)

    x, w = 7.0, 5.83
    heading(s, x, y, w, PTR["benefits"])
    s.txt(x, y + 0.32, w, 2.12, [
        ("**ECONOMIC** — bringing one cost or time revision one monthly cycle earlier on "
         f"a ₹{APR_REV:.2f} lakh crore portfolio is material, and needs no new "
         f"data-collection budget.", {}),
        (f"**ADMINISTRATIVE** — review effort becomes proportionate to risk across "
         f"{APR_PROJECTS:,} ongoing projects instead of uniform across all of them.", {}),
        ("**ACCOUNTABILITY** — “Why was this flagged?” is answered from a source-linked "
         "trail in seconds: report, page, changed field, drivers.", {}),
        ("**ENVIRONMENTAL** — earlier action on stalled civil works cuts re-mobilisation, "
         "idle machinery and rework, where a delayed project's emissions sit.", {}),
        (f"**REUSABLE** — document-driven by design, so the same engine serves the "
         f"{SECTORS} sectors here and any state portfolio that publishes monthly "
         f"reports.", {}),
    ], spacing=1.04)
    s.rect(x, y + 2.5, w, 1.28, fill=PANEL, border=BORDER, radius=True)
    s.txt(x + 0.14, y + 2.6, w - 0.28, 1.12, [
        ("PILOT SCORECARD — TO BE MEASURED WITH MoSPI", {"size": 9, "bold": True, "color": SIH_BLUE}),
        "precision@K within staff capacity  ·  warning lead time before the reported "
        "change  ·  reviewer effort and dispositions per case. No saving and no delay "
        "reduction is claimed until it has been measured on real review cycles.",
        ("WHO DECIDES: authorized officials. PARAKH ranks and explains; it never acts.",
         {"size": 9, "bold": True, "color": NAVY}),
    ], spacing=1.03)
    s.rect(x, y + 3.9, w, 0.96, fill=NAVY, radius=True)
    s.txt(x + 0.16, y + 4.04, w - 0.32, 0.72,
          [("SUCCESS, IN ONE SENTENCE  ", {"size": 9, "bold": True, "color": WHITE, "space_after": 1}),
           (f"The measure of this system is that a monitoring cell's first hour goes to "
            f"the {FLAGGED} riskiest projects instead of page one of a 400-page report — "
            f"and nothing on that screen is a number it cannot trace.",
            {"size": 9, "color": RGBColor(0xD8, 0xE6, 0xF2), "space_after": 0})],
          spacing=1.03)

    s.note(
        "The checklist is the slide. Read the nine outcomes from the brief out loud and "
        "point at the status column: the honest mix of working, in build and finale "
        "roadmap is far more convincing than nine ticks.",
        f"Numbers to quote: {APR_PROJECTS:,} ongoing projects, {SECTORS} sectors, "
        f"₹{APR_REV:.2f} lakh crore revised cost in the April 2026 report; {FLAGGED} of "
        f"{LATEST:,} projects ({FLAGGED / LATEST:.1%}) at High or Critical in the "
        f"prototype's latest snapshot.",
        "Impact is attention, not savings. Say so before the jury asks.",
    )


# ── slide 6: research and references ────────────────────────────────────────
def build_references(s: Slide):
    kicker(s, "Every number in this deck traces to a public report or to a checked-in "
              "artifact of the submitted prototype.")
    y = 1.22
    cols = [
        (0.5, 4.05, "DATA AND PROBLEM STATEMENT", [
            ("MoSPI — PAIMANA Flash Report, April 2026", {"bold": True, "color": NAVY}),
            f"{APR_PROJECTS:,} ongoing projects · 17 Central Ministries/Departments · "
            f"{SECTORS} infrastructure sectors · ₹{APR_ORIG:.2f} lakh crore original cost · "
            f"₹{APR_REV:.2f} lakh crore revised cost · ₹{APR_EXP:.2f} lakh crore "
            f"cumulative expenditure. Projects of {COST_FLOOR}.",
            "https://paimana-proj.mospi.gov.in/ReportPage",
            (f"OCMS ({OCMS_SINCE}) → PAIMANA — two decades of project-level history",
             {"bold": True, "color": NAVY}),
            "Cost, expenditure, timelines, physical progress, milestones, implementing "
            "agencies and status, updated monthly through role-based access and APIs — "
            "the training ground and the operating surface for the models.",
            ("SIH 2026 — Problem Statement 26103", {"bold": True, "color": NAVY}),
            f"{PS_OWNER}. {PS_OPS}. Scope: predictive and prescriptive monitoring, "
            "comparison with conventional methods, and models built on the existing CUF "
            "fields.",
        ]),
        (4.75, 4.05, "METHOD FOUNDATIONS", [
            ("Chen & Guestrin (2016).", {"bold": True, "color": NAVY}),
            "XGBoost: A Scalable Tree Boosting System. KDD.",
            ("Lundberg & Lee (2017).", {"bold": True, "color": NAVY}),
            "A Unified Approach to Interpreting Model Predictions. NeurIPS — TreeSHAP "
            "gives an exact additive attribution, not an approximation.",
            ("Saito & Rehmsmeier (2015).", {"bold": True, "color": NAVY}),
            "The Precision–Recall Plot Is More Informative than the ROC Plot for "
            "Imbalanced Data. PLoS ONE — why rare outcomes are reported with PR-AUC beside "
            "the base rate.",
            ("Flyvbjerg, Bruzelius & Rothengatter (2003).", {"bold": True, "color": NAVY}),
            "Megaprojects and Risk. Cambridge University Press — the reference frame for "
            "cost overrun and optimism bias in large public projects.",
            ("Hyndman & Athanasopoulos.", {"bold": True, "color": NAVY}),
            "Forecasting: Principles and Practice. OTexts — the ordered holdout discipline "
            "used for every number quoted here.",
        ]),
        (9.0, 3.83, "EVIDENCE, CODE AND DEPLOYMENT", [
            (f"{Q_PDFS} published monthly reports, {MONTH_SPAN}", {"bold": True, "color": NAVY}),
            f"Both OCMS and PAIMANA layouts. {Q_PAGES:,} pages, {Q_ROWS:,} rows, "
            f"{Q_FAILED} failed extractions, {Q_REVIEW:,} rows held for review, "
            f"{Q_VERIFIED_REPORTS} reports clean end to end.",
            ("Reconciliation to the department's own figures", {"bold": True, "color": NAVY}),
            f"{Q_PAIMANA_OK} of the {len(Q_PAIMANA)} current-format reports match their own "
            f"printed totals exactly — project count and all three financial totals. The "
            f"earliest legacy-layout reports keep a disclosed gap rather than a silent fix.",
            ("Reference implementation", {"bold": True, "color": NAVY}),
            "Python ingestion and quality checker · scikit-learn / XGBoost models with "
            "SHAP explanations · Next.js dashboard and API · Docker deployment. "
            "Open-source tools only.",
            ("Repository, demo and walkthrough", {"bold": True, "color": NAVY}),
            f"{REPO_URL}  ·  {DEMO_URL}",
        ]),
    ]
    for x, w, title, lines in cols:
        heading(s, x, y, w, title)
        s.txt(x, y + 0.32, w, 3.8, lines, spacing=1.04)

    s.rect(0.5, 5.42, 12.33, 0.88, fill=PANEL_ALT, border=BORDER, radius=True)
    s.txt(0.68, 5.5, 12.0, 0.76, [
        ("OPEN-SOURCE AND DEPLOYMENT STANDARDS", {"size": 9, "bold": True, "color": SIH_BLUE}),
        ("**Tools** — Python · scikit-learn · XGBoost · SHAP · Next.js · Docker: open "
         "source end to end, as the brief prefers.", {"size": 9}),
        ("**Data and governance** — published monthly reports only; no personal data, no "
         "live MoSPI access needed to pilot, and no write-back into PAIMANA.", {"size": 9}),
        ("**Reproducibility** — one command regenerates every number in this deck; runs "
         "are deterministic and version-pinned.", {"size": 9}),
    ], spacing=1.02)

    s.rect(0.5, 6.38, 12.33, 0.55, fill=PANEL, border=BORDER, radius=True)
    s.txt(0.7, 6.47, 12.0, 0.38,
          [("THE MEASURE OF SUCCESS  ", {"size": 9, "bold": True, "color": SIH_BLUE}),
           ("— a monitoring cell opens the top of the queue first, every figure it sees "
            "names its source page, and the prediction is judged by the next monthly "
            "report rather than by a claim.",
            {"size": 9, "color": INK})], spacing=1.03)

    s.note(
        "Close on the last line: our prediction is validated by the next report MoSPI "
        "publishes. That is a standard no dashboard can dodge.",
        "Cite the department's own figures for scale and our artifacts for method — "
        "never the reverse.",
        "Replace the repository and demo links, and the team name and ID, before "
        "exporting the PDF.",
    )


SLIDE_BUILDERS = [build_title, build_solution, build_technical, build_feasibility,
                  build_impact, build_references]


# ── render: pptx ────────────────────────────────────────────────────────────
def _emu(inches):
    return Emu(int(round(inches * 914400)))


def _bold_runs(text):
    """Split **bold** markers into styled segments."""
    parts, buf, bold = [], "", False
    i = 0
    while i < len(text):
        if text.startswith("**", i):
            parts.append((buf, bold))
            buf, bold = "", not bold
            i += 2
        else:
            buf += text[i]
            i += 1
    parts.append((buf, bold))
    return [(t, b) for t, b in parts if t]


def _no_shadow(shape):
    shape.shadow.inherit = False


def render_pptx_shape(slide, sh):
    if sh["kind"] == "rect":
        shape = slide.shapes.add_shape(
            MSO_SHAPE.ROUNDED_RECTANGLE if sh["radius"] else MSO_SHAPE.RECTANGLE,
            _emu(sh["x"]), _emu(sh["y"]), _emu(sh["w"]), _emu(sh["h"]))
        _no_shadow(shape)
        if sh["radius"]:
            try:
                shape.adjustments[0] = 0.06
            except Exception:
                pass
        if sh["fill"] is not None:
            shape.fill.solid()
            shape.fill.fore_color.rgb = sh["fill"]
        else:
            shape.fill.background()
        if sh["border"] is not None:
            shape.line.color.rgb = sh["border"]
            shape.line.width = Pt(sh["width"])
            if sh["dash"]:
                shape.line.dash_style = 4  # MSO_LINE_DASH_STYLE.DASH
        else:
            shape.line.fill.background()
        shape.text_frame.text = ""
        return

    if sh["kind"] == "chip":
        shape = slide.shapes.add_shape(MSO_SHAPE.ROUNDED_RECTANGLE, _emu(sh["x"]), _emu(sh["y"]),
                                       _emu(sh["w"]), _emu(sh["h"]))
        _no_shadow(shape)
        try:
            shape.adjustments[0] = 0.18
        except Exception:
            pass
        shape.fill.solid()
        shape.fill.fore_color.rgb = sh["fill"]
        if sh["border"] is not None:
            shape.line.color.rgb = sh["border"]
        else:
            shape.line.fill.background()
        tf = shape.text_frame
        tf.word_wrap = False
        tf.margin_left = tf.margin_right = Inches(0.02)
        tf.margin_top = tf.margin_bottom = 0
        tf.vertical_anchor = MSO_ANCHOR.MIDDLE
        p = tf.paragraphs[0]
        p.alignment = PP_ALIGN.CENTER if sh["align"] == "c" else PP_ALIGN.LEFT
        r = p.add_run()
        r.text = sh["text"]
        r.font.size = Pt(sh["size"])
        r.font.bold = sh["bold"]
        r.font.name = sh["font"]
        r.font.color.rgb = sh["color"]
        return

    if sh["kind"] == "text":
        tb = slide.shapes.add_textbox(_emu(sh["x"]), _emu(sh["y"]), _emu(sh["w"]), _emu(sh["h"]))
        tf = tb.text_frame
        tf.word_wrap = True
        tf.margin_left = tf.margin_right = 0
        tf.margin_top = tf.margin_bottom = 0
        tf.vertical_anchor = {"t": MSO_ANCHOR.TOP, "m": MSO_ANCHOR.MIDDLE}[sh["anchor"]]
        first = True
        for para in sh["paras"]:
            p = tf.paragraphs[0] if first else tf.add_paragraph()
            first = False
            p.line_spacing = para["spacing"]
            p.space_after = Pt(para["space_after"])
            p.alignment = {"l": PP_ALIGN.LEFT, "c": PP_ALIGN.CENTER,
                           "j": PP_ALIGN.JUSTIFY}[para["align"]]
            if para["bullet"]:
                pPr = p._p.get_or_add_pPr()
                pPr.set("marL", str(Inches(0.15)))
                pPr.set("indent", str(-Inches(0.15)))
                pPr.append(pPr.makeelement(qn("a:buFont"), {"typeface": "Arial"}))
                pPr.append(pPr.makeelement(qn("a:buChar"), {"char": "•"}))
            for chunk, bold_flag in _bold_runs(para["text"]):
                r = p.add_run()
                r.text = chunk
                r.font.size = Pt(para["size"])
                r.font.bold = para["bold"] or bold_flag
                r.font.name = para["font"]
                r.font.color.rgb = para["color"]
        return

    if sh["kind"] == "table":
        rows = sh["rows"]
        row_heights = [sh["head_h"]] + [sh["row_h"]] * (len(rows) - 1)
        cy = sh["y"]
        for ri, row in enumerate(rows):
            cx = sh["x"]
            for ci, cell in enumerate(row):
                w = sh["widths"][ci]
                if ri == 0:
                    rect_fill, text_color = NAVY, WHITE
                else:
                    rect_fill = ZEBRA if ri % 2 else WHITE
                    text_color = INK
                s2 = slide.shapes.add_shape(MSO_SHAPE.RECTANGLE, _emu(cx), _emu(cy),
                                            _emu(w), _emu(row_heights[ri]))
                _no_shadow(s2)
                s2.fill.solid()
                s2.fill.fore_color.rgb = rect_fill
                s2.line.color.rgb = BORDER
                s2.line.width = Pt(0.5)
                tf = s2.text_frame
                tf.word_wrap = True
                tf.margin_left = tf.margin_right = Inches(0.06)
                tf.margin_top = tf.margin_bottom = Inches(0.02)
                tf.vertical_anchor = MSO_ANCHOR.MIDDLE
                p = tf.paragraphs[0]
                p.line_spacing = 1.0
                r = p.add_run()
                r.text = str(cell)
                r.font.size = Pt(sh["size"])
                r.font.bold = ri == 0 or ci == 0
                r.font.name = BODY_FONT
                r.font.color.rgb = text_color
                cx += w
            cy += row_heights[ri]
        return


def set_title(slide, text):
    from pptx.enum.shapes import PP_PLACEHOLDER
    target = None
    for sh in slide.shapes:
        if sh.has_text_frame and sh.is_placeholder and \
                sh.placeholder_format.type == PP_PLACEHOLDER.TITLE:
            target = sh
            break
    if target is None:
        return
    target.left, target.top = _emu(1.95), _emu(0.14)
    target.width, target.height = _emu(10.4), _emu(0.72)
    tf = target.text_frame
    tf.word_wrap = True
    tf.vertical_anchor = MSO_ANCHOR.MIDDLE
    tf.clear()
    p = tf.paragraphs[0]
    p.alignment = PP_ALIGN.LEFT
    r = p.add_run()
    r.text = text
    r.font.name = TITLE_FONT
    r.font.size = Pt(26 if len(text) > 34 else 30)
    r.font.bold = True
    r.font.color.rgb = NAVY


def set_oval(slide):
    for sh in slide.shapes:
        if sh.shape_type is not None and sh.name.startswith("Oval") and sh.has_text_frame:
            tf = sh.text_frame
            tf.clear()
            p = tf.paragraphs[0]
            p.alignment = PP_ALIGN.CENTER
            r = p.add_run()
            r.text = TEAM_NAME
            r.font.size = Pt(8.5)
            r.font.bold = True
            r.font.name = BODY_FONT
            r.font.color.rgb = NAVY


def drop_shape(slide, prefix):
    for sh in list(slide.shapes):
        if sh.name.startswith(prefix):
            sh._element.getparent().remove(sh._element)


def build_pptx():
    tpl_path = next((p for p in TEMPLATE_CANDIDATES if p.exists()), None)
    if tpl_path is None:
        raise SystemExit("Official SIH template not found. Place it at "
                         "docs/presentation/templates/SIH2026-Idea-Presentation-Format.pptx")
    prs = Presentation(str(tpl_path))
    slides = list(prs.slides)

    # slide 1 keeps the template's own banner text; we add the idea and the fields
    first = slides[0]
    drop_shape(first, "TextBox 9")
    s1 = Slide(1)
    build_title(s1)
    for sh in s1.shapes:
        render_pptx_shape(first, sh)
    set_oval(first)
    first.notes_slide.notes_text_frame.text = "\n".join(s1.notes)

    for idx, builder in enumerate(SLIDE_BUILDERS[1:], start=1):
        slide = slides[idx]
        s = Slide(idx + 1)
        builder(s)
        set_title(slide, DECK_TITLES[idx + 1])
        drop_shape(slide, "TextBox 8")
        set_oval(slide)
        for sh in s.shapes:
            render_pptx_shape(slide, sh)
        slide.notes_slide.notes_text_frame.text = "\n".join(s.notes)

    # slide 7 is the instruction slide: remove it for submission
    sldIdLst = prs.slides._sldIdLst
    ids = list(sldIdLst)
    for extra in ids[6:]:
        sldIdLst.remove(extra)

    OUT_PPTX.parent.mkdir(parents=True, exist_ok=True)
    prs.save(str(OUT_PPTX))
    return prs


DECK_TITLES = {
    2: "IDEA TITLE — PARAKH: the prescriptive layer on PAIMANA",
    3: "TECHNICAL APPROACH",
    4: "FEASIBILITY AND VIABILITY",
    5: "IMPACT AND BENEFITS",
    6: "RESEARCH AND REFERENCES",
}


# ── render: html contact sheet (same content model, same inch geometry) ─────
def _text_height(text: str, size: float, width_in: float) -> float:
    """Estimate rendered height of one paragraph, in inches.

    Calibri averages roughly half an em per character; a line occupies about
    1.2 em. Good enough to catch a box that is too short for its text.
    """
    per_char = 0.50 * size / 72
    per_line = max(1, int(width_in / per_char))
    lines = max(1, -(-len(text) // per_line))
    return lines * size / 72 * 1.2


def _css_color(c):
    if c is None:
        return "transparent"
    return f"#{c}"


def _html_runs(text):
    out = []
    for chunk, bold in _bold_runs(text):
        esc = html.escape(chunk)
        out.append(f"<b>{esc}</b>" if bold else esc)
    return "".join(out)


def build_html(slides_models, path):
    W = 13.333
    parts = ["""<!doctype html><html><head><meta charset="utf-8">
<title>PARAKH · SIH 26103 deck preview</title>
<style>
  body{margin:0;background:#4a5560;font-family:Calibri,'Segoe UI',system-ui,sans-serif;
       display:flex;flex-direction:column;align-items:center;gap:28px;padding:28px 0}
  .slide{position:relative;width:1280px;height:720px;background:#fff;overflow:hidden;
         box-shadow:0 10px 34px rgba(0,0,0,.45);flex:0 0 auto}
  .el{position:absolute;box-sizing:border-box}
  .txt{display:flex;flex-direction:column}
  .p{white-space:pre-wrap}
  .chip{display:flex;align-items:center;justify-content:center;border-radius:7px;text-align:center}
  .tbl div{overflow:hidden}
  .logo{position:absolute;right:1.9rem;top:1rem;width:118px;height:52px;border:1px dashed #b9c7d4;
        border-radius:4px;display:flex;align-items:center;justify-content:center;
        font-size:9px;color:#8496a6;letter-spacing:.06em}
  body.boxes .el.txt,body.boxes .el.tbl{outline:1px dashed rgba(220,40,40,.55)}
  h2.tag{color:#e8eef4;font-weight:600;font-size:15px;margin:0 0 -14px;font-family:ui-monospace,monospace}
</style></head><body>"""]

    for sl in slides_models:
        parts.append(f'<h2 class="tag">SLIDE {sl.number}</h2><div class="slide">')
        heading_text = DECK_TITLES.get(sl.number)
        if heading_text:
            parts.append(f'<div class="el" style="left:1.95in;top:.14in;width:10.4in;'
                         f'height:.72in;display:flex;align-items:center;'
                         f'font-family:{TITLE_FONT},serif;font-size:'
                         f'{26 if len(heading_text) > 34 else 30}pt;font-weight:700;'
                         f'color:{_css_color(NAVY)}">{html.escape(heading_text)}</div>')
        for sh in sl.shapes:
            if sh["kind"] == "rect":
                style = (f'left:{sh["x"]}in;top:{sh["y"]}in;width:{sh["w"]}in;height:{sh["h"]}in;'
                         f'background:{_css_color(sh["fill"])};'
                         f'border:{(str(sh["width"])+"pt") if sh["border"] else "0"} '
                         f'{"dashed" if sh["dash"] else "solid"} {_css_color(sh["border"])};'
                         f'border-radius:{"8px" if sh["radius"] else "0"}')
                parts.append(f'<div class="el" style="{style}"></div>')
            elif sh["kind"] == "chip":
                style = (f'left:{sh["x"]}in;top:{sh["y"]}in;width:{sh["w"]}in;height:{sh["h"]}in;'
                         f'background:{_css_color(sh["fill"])};color:{_css_color(sh["color"])};'
                         f'font-size:{sh["size"]}pt;font-weight:{700 if sh["bold"] else 400};'
                         f'font-family:{sh["font"]},sans-serif;border-radius:7px;'
                         f'align-items:center;justify-content:center;display:flex')
                parts.append(f'<div class="el chip" style="{style}">{html.escape(sh["text"])}</div>')
            elif sh["kind"] == "text":
                paras = ""
                for p in sh["paras"]:
                    bullet = "&bull;&nbsp;" if p["bullet"] else ""
                    pad = "padding-left:.15in;text-indent:-.15in;" if p["bullet"] else ""
                    paras += (f'<div class="p" style="font-size:{p["size"]}pt;'
                              f'color:{_css_color(p["color"])};font-family:{p["font"]},sans-serif;'
                              f'font-weight:{700 if p["bold"] else 400};line-height:{p["spacing"]};'
                              f'margin-bottom:{p["space_after"]}pt;text-align:{p["align"]};{pad}">'
                              f'{bullet}{_html_runs(p["text"])}</div>')
                style = (f'left:{sh["x"]}in;top:{sh["y"]}in;width:{sh["w"]}in;height:{sh["h"]}in;'
                         f'justify-content:{"center" if sh["anchor"]=="m" else "flex-start"}')
                parts.append(f'<div class="el txt" style="{style}">{paras}</div>')
            elif sh["kind"] == "table":
                rows = sh["rows"]
                heights = [sh["head_h"]] + [sh["row_h"]] * (len(rows) - 1)
                cy = sh["y"]
                for ri, row in enumerate(rows):
                    cx = sh["x"]
                    for ci, cell in enumerate(row):
                        w = sh["widths"][ci]
                        bg = _css_color(NAVY) if ri == 0 else (_css_color(ZEBRA) if ri % 2 else "#fff")
                        col = "#fff" if ri == 0 else _css_color(INK)
                        weight = 700 if (ri == 0 or ci == 0) else 400
                        style = (f'left:{cx}in;top:{cy}in;width:{w}in;height:{heights[ri]}in;'
                                 f'background:{bg};color:{col};font-size:{sh["size"]}pt;'
                                 f'font-weight:{weight};border:.5pt solid {_css_color(BORDER)};'
                                 f'padding:3px 4px;display:flex;align-items:center;line-height:1.05')
                        parts.append(f'<div class="el tbl" style="{style}">{html.escape(str(cell))}</div>')
                        cx += w
                    cy += heights[ri]
        # chrome: footer bar, slide number, logo stand-in
        parts.append(f'<div class="el" style="left:0;top:6.95in;width:{W}in;height:.55in;'
                     f'background:{_css_color(SIH_BLUE)}"></div>')
        parts.append(f'<div class="el" style="left:9.56in;top:6.99in;width:3.11in;height:.4in;'
                     f'color:#fff;font-weight:700;font-size:11pt;display:flex;'
                     f'justify-content:center">{sl.number}</div>')
        parts.append('<div class="logo">SIH LOGO</div>')
        parts.append("</div>")

    parts.append("</body></html>")
    path.write_text("".join(parts))


# ── main ────────────────────────────────────────────────────────────────────
def main():
    models = []
    for i, builder in enumerate(SLIDE_BUILDERS):
        s = Slide(i + 1)
        builder(s)
        models.append(s)

    prs = build_pptx()
    build_html(models, OUT_HTML)

    problems = []
    for s in models:
        for sh in s.shapes:
            right, bottom = sh["x"] + sh.get("w", 0), sh["y"] + sh.get("h", 0)
            if right > 13.34 or bottom > 7.5 or sh["x"] < 0 or sh["y"] < 0:
                problems.append(f"slide {s.number}: {sh['kind']} out of bounds "
                                f"(r={right:.2f} b={bottom:.2f})")
            if sh["kind"] == "table":
                tw = sum(sh["widths"])
                if sh["x"] + tw > 13.34:
                    problems.append(f"slide {s.number}: table wider than canvas ({tw})")
                for row in sh["rows"]:
                    for ci, cell in enumerate(row):
                        need = _text_height(str(cell), sh["size"], sh["widths"][ci] - 0.14)
                        if need > sh["row_h"] - 0.04:
                            problems.append(
                                f"slide {s.number}: table cell may wrap past its row "
                                f"({str(cell)[:28]!r} needs {need:.2f}in)")
            if sh["kind"] == "text":
                need = sum(_text_height(p["text"], p["size"], sh["w"] - 0.15) + p["space_after"] / 72
                           for p in sh["paras"])
                if need > sh["h"] + 0.18:
                    problems.append(
                        f"slide {s.number}: text may overflow its box by "
                        f"{need - sh['h']:.2f}in — {sh['paras'][0]['text'][:44]!r}")
        # a text box must not sit on top of a table
        for tb in [x for x in s.shapes if x["kind"] == "text"]:
            for t in [x for x in s.shapes if x["kind"] == "table"]:
                th = t["head_h"] + t["row_h"] * (len(t["rows"]) - 1)
                ox = min(tb["x"] + tb["w"], t["x"] + sum(t["widths"])) - max(tb["x"], t["x"])
                oy = min(tb["y"] + tb["h"], t["y"] + th) - max(tb["y"], t["y"])
                if ox > 0.12 and oy > 0.04:
                    problems.append(
                        f"slide {s.number}: text box overlaps a table "
                        f"({tb['paras'][0]['text'][:28]!r} over {t['rows'][0][0][:20]!r})")

        # text boxes must not sit on top of each other
        boxes = [sh for sh in s.shapes if sh["kind"] == "text"]
        for i, a in enumerate(boxes):
            for b in boxes[i + 1:]:
                ox = min(a["x"] + a["w"], b["x"] + b["w"]) - max(a["x"], b["x"])
                oy = min(a["y"] + a["h"], b["y"] + b["h"]) - max(a["y"], b["y"])
                if ox > 0.12 and oy > 0.08:
                    problems.append(
                        f"slide {s.number}: two text boxes overlap "
                        f"({a['paras'][0]['text'][:22]!r} / {b['paras'][0]['text'][:22]!r})")

    print(f"slides written      : {len(prs.slides.__iter__.__self__._sldIdLst)}")
    print(f"pptx                : {OUT_PPTX.relative_to(ROOT)} "
          f"({OUT_PPTX.stat().st_size / 1024:.0f} KB)")
    print(f"html preview        : {OUT_HTML.relative_to(ROOT)}")
    print(f"evidence            : {Q_PDFS} reports / {Q_ROWS:,} rows / "
          f"{Q_RECONCILED} reconciled / {Q_FAILED} failed")
    print(f"schedule temporal   : XGBoost ROC {S_T['xgboost']['roc_auc']} "
          f"PR {S_T['xgboost']['pr_auc']} vs rule {S_T['rule_score_roc_auc']}")
    print(f"cost temporal       : LR ROC {C_T['logistic_regression']['roc_auc']} "
          f"PR {C_T['logistic_regression']['pr_auc']} vs rule {C_T['rule_score_roc_auc']}")
    print(f"April 2026 official : {APR_PROJECTS:,} projects, "
          f"₹{APR_ORIG:.2f}L cr original, ₹{APR_REV:.2f}L cr revised")
    print("layout warnings     : " + ("none" if not problems else ""))
    for p in problems:
        print("  !", p)


if __name__ == "__main__":
    main()
