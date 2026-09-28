# PDF extraction audit

This audit describes the current cached run represented by `data/raw/extraction_quality.json`. It covers all 17 PDFs presently under `data/pdfs/`, not a claim of support for arbitrary future layouts.

## Batch outcome

| Report family | Reports | Extracted rows | Rows with warnings | Rows marked not scoring eligible |
|---|---:|---:|---:|---:|
| OCMS (March–June 2025) | 4 | 6,579 | 726 | 724 |
| PAIMANA (July 2025–July 2026) | 13 | 18,601 | 189 | 20 |
| **Total** | **17** | **25,180** | **915** | **744** |

There are no report-level extraction failures. Ten reports have `REVIEW_REQUIRED` status and seven are marked `VERIFIED`. The project panel contains 25,116 identified rows; 64 extracted rows without an official ID remain in source CSVs and are not added to the panel.

## Extraction and quality behavior

`src/run_all.py` scans nested PDF folders. `src/pdf_extracter.py` routes the known report families using document text, target-table headings, detected table structure, and semantic headers. It uses pdfplumber's native text/table extraction and a detected-header text-layout fallback where needed; it does not depend on fixed report page numbers or coordinate bands.

Each export row records its source PDF, report month, page, table, format, quality status, and warning codes. The quality manifest records per-report pages, extraction methods, row counts, duplicate IDs/serials, serial gaps, warnings, and available official-total comparisons. Parseable rows with warnings remain in the CSV. `REVIEW_REQUIRED` is a data-quality state, not a risk band.

## Reconciliation limits

- All four OCMS project counts, original-cost totals, and cumulative-expenditure totals match the figures recorded in the reports.
- The four OCMS revised-cost row sums do **not** reconcile directly with official revised-cost totals. Many rows print revised cost as unavailable; those row values remain unknown. Do not silently fill them or use OCMS revised-cost risk as verified evidence. All four OCMS reports are marked for review and are excluded from model training by the `quality_status=VERIFIED` training filter.
- PAIMANA reports with comparable count and financial totals are reconciled in the manifest. The 189 warned rows remain traceable; 20 lack a field required for scoring.
- Portfolio-total reconciliation and representative page checks provide evidence, not proof that every extracted field is correct.

## Reproduce and inspect

```bash
python src/run_all.py
```

Unchanged PDFs are reused when their hash and parser version match the manifest. To force extraction again:

```bash
python src/run_all.py --force-pdf
```

To inspect a row, open its source PDF and page from `source_pdf` and `source_page`, then compare the source cell with the CSV values and `quality_warnings`. Model training additionally requires `quality_status=VERIFIED` and `scoring_eligible=True`.
