import Link from 'next/link';
import { ArrowRight, FileText, SlidersHorizontal, ScanLine, ChartNoAxesCombined } from 'lucide-react';
import PageIntro from '@/components/PageIntro';
import metrics from '@/data/processed/model_metrics.json';
import extractionAudit from '@/data/raw/extraction_quality.json';

const sections = [['start', 'Start here'], ['pipeline', 'From report to record'], ['quality', 'Extraction checks'], ['reading-risk', 'Read the signals'], ['models', 'Model evidence'], ['limits', 'Known limits'], ['api', 'Data & API']];
const flow = [
  [FileText, 'Read the official reports', 'Extract project tables from monthly MoSPI PAIMANA PDFs. The source is a published report, not a live feed.'],
  [SlidersHorizontal, 'Make records comparable', 'Clean dates and costs, link projects across reports, and calculate changes in spending, progress, and completion dates.'],
  [ScanLine, 'Describe risk today', 'Apply an open rule-based score. A higher score means more reported signs of cost, schedule, or implementation pressure.'],
  [ChartNoAxesCombined, 'Test an early warning', 'Use historical records to estimate whether the completion date or revised cost changes in the next available report. Test predictions on unseen projects and a later month.'],
];

export default function About() {
  return (
    <>
      <PageIntro title="Understand the signal. Know its limits." description="A practical guide to Parakh: where the data comes from, what the scores mean, and what to check before acting on them." />
      <div className="guide-layout">
        <nav className="guide-nav" aria-label="On this page">{sections.map(([id, title]) => <a key={id} href={`#${id}`}>{title}</a>)}</nav>
        <article className="guide-article">
          <section id="start"><h2>A clearer starting point for review.</h2>
            <p>Parakh helps monitoring teams find infrastructure projects that deserve a closer look. It turns MoSPI’s monthly Flash Reports into a searchable portfolio, transparent rule scores, and experimental early warnings.</p>
            <p>You do not need to understand machine learning to use it. Start with a project, read what changed, and compare it with other projects in the same ministry and state.</p>
            <ol className="guide-steps"><li><Link href="/projects?band=Critical">Find priority projects</Link><span>Filter the directory by risk band, ministry, state, or main driver.</span></li><li><Link href="/projects">Open a project record</Link><span>Review its budget, schedule, progress, and model caveats.</span></li><li><Link href="/benchmarks">Put it in context</Link><span>Compare ministry portfolios and check the peer group in each record.</span></li></ol>
          </section>
          <section id="pipeline"><h2>From a published report to an inspectable record.</h2><div className="guide-pipeline">{flow.map(([Icon, title, text]) => <div key={title}><Icon size={23} strokeWidth={1.5} aria-hidden="true" /><div><h3>{title}</h3><p>{text}</p></div></div>)}</div></section>
          <section id="quality"><h2>Extraction results carry a review state.</h2>
            <p>The recorded audit covers {extractionAudit.reports.length} monthly report runs: {extractionAudit.reports.filter((report) => report.status === 'VERIFIED').length} passed configured checks and {extractionAudit.reports.filter((report) => report.status === 'REVIEW_REQUIRED').length} require review. It records {extractionAudit.failed_reports || 0} failed reports and {extractionAudit.reports.reduce((sum, report) => sum + (report.rows_review_required || 0), 0).toLocaleString()} flagged rows. A warning identifies a check to inspect; it is not automatically proof of an extraction error.</p>
            <p className="workspace-note">This checkout contains all {extractionAudit.pdf_count} source PDFs in the recorded audit, covering March 2025–July 2026. Their page references and row warnings are available in the audit; newly added report layouts still need their own quality review. Source: <code>data/raw/extraction_quality.json</code>.</p>
          </section>
          <section id="reading-risk"><h2>Two signals. Two different questions.</h2>
            <div className="signal-explanation"><div><h3>Rule score: what is happening now?</h3><p>A score from 0–100 combines reported cost increases, schedule delay, slow progress, spending divergence, and revisions. Missing signals are excluded and remaining weights are renormalized; the record shows signal coverage. It is an index of observed risk—not a percentage chance of failure.</p><p>The main driver is a rule-based indication of pressure, not proof of a real-world cause. Its progress comparison uses a linear approval-to-target timeline proxy.</p></div><div><h3>Model estimate: what might change next?</h3><p>The schedule model ranks projects by the likelihood that a completion date moves in the next available monthly report. Its current score is uncalibrated decision support, not a real-world event probability.</p><p>The cost model remains weak on the ordered test and must not be used as a reliable cost forecast.</p></div></div>
            <p>Low, Medium, High, and Critical are rule bands. A high rule score and a low model estimate can occur together: they answer different questions.</p>
          </section>
          <section id="models"><h2>Evidence, not an accuracy headline.</h2>
            <p>Training data covers {metrics.months.length} monthly reports, from {metrics.months[0]} to {metrics.months.at(-1)}. Group-held-out results average five splits with no project crossing train and test. Ordered results average up to three later months, each trained only on earlier reports; rare cost increases leave one recent test month with enough events. These results do not guarantee future performance.</p>
            <div className="ln-table-wrap"><table className="ln-table model-table"><caption>Generated evaluation · ROC-AUC (higher is better; 0.5 is chance ranking)</caption><thead><tr><th scope="col">Target / model</th><th scope="col">Unseen projects, mean</th><th scope="col">Ordered months, mean</th><th scope="col">PR-AUC / event rate</th><th scope="col">PR lift vs event rate</th></tr></thead><tbody>
              {[['schedule_slipped_label', 'Schedule slip'], ['cost_revised_up_label', 'Cost revision']].flatMap(([key, label]) => [['logistic_regression', 'Logistic regression'], ['gradient_boosting', 'Gradient boosting']].map(([model, name]) => <tr key={`${key}-${model}`}><td><strong>{label}</strong><span className="cell-primary ln-muted">{name}{metrics[key].selected_model === model ? ' · selected' : ''}</span></td><td className="ln-num">{metrics[key].group_split[model].roc_auc.toFixed(3)}</td><td className="ln-num">{metrics[key].temporal_split[model].roc_auc.toFixed(3)}</td><td className="ln-num">{metrics[key].temporal_split[model].pr_auc.toFixed(3)} / {metrics[key].temporal_split[model].positive_rate.toFixed(3)}</td><td className="ln-num">{metrics[key].temporal_split[model].pr_lift_over_prevalence.toFixed(2)}×</td></tr>))}
            </tbody></table></div>
            <h3>Signals used by the selected models</h3>
            <p>Permutation importance shows how much test-set PR-AUC changed when one input was shuffled. It describes portfolio-level predictive signal, not a cause or an explanation for one project.</p>
            <div className="ln-table-wrap"><table className="ln-table model-table"><thead><tr><th scope="col">Outcome</th><th scope="col">Selected model</th><th scope="col">Highest test-set signals</th></tr></thead><tbody>
              {[['schedule_slipped_label', 'Schedule slip'], ['cost_revised_up_label', 'Cost revision']].map(([key, label]) => {
                const target = metrics[key];
                const signals = Object.entries(target.temporal_split.selected_model_permutation_importance || {}).filter(([, value]) => value > 0).slice(0, 5);
                return <tr key={key}><th scope="row">{label}</th><td>{target.selected_model.replaceAll('_', ' ')}</td><td>{signals.length ? signals.map(([feature, value]) => `${feature.replaceAll('_', ' ')} (+${value.toFixed(3)} PR-AUC)`).join(' · ') : 'Not enough positive test cases to estimate'}</td></tr>;
              })}
            </tbody></table></div>
            <p className="workspace-note">Verified training cohort: schedule slip {metrics.schedule_slipped_label.group_split.n_rows_used.toLocaleString()} rows / {metrics.schedule_slipped_label.group_split.n_projects_used.toLocaleString()} projects; cost revision {metrics.cost_revised_up_label.group_split.n_positive_labels} positive events. Latest ordered test month: {metrics.schedule_slipped_label.temporal_split.test_month}. Model probabilities are not calibrated. Source: <code>data/processed/model_metrics.json</code>.</p>
            <p>ROC-AUC measures ranking, not “percent correct.” PR-AUC is shown beside the event rate because positive events are rare. Rule-score comparisons and more detail are available in the <Link href="/#evidence">overview evidence section</Link>.</p>
          </section>
          <section id="limits"><h2>What this prototype does not do.</h2>
            <ul className="guide-limits"><li><strong>It does not replace a project review.</strong> Confirm the report, the extraction, and the local context with the responsible team.</li><li><strong>It is not a live monitoring feed.</strong> The latest generated snapshot is only as current as the reports processed.</li><li><strong>It does not dispatch official alerts.</strong> The watchlist helps identify records for review; exports are local downloads.</li><li><strong>It has limited history.</strong> Projects can leave the reports, rare events have small samples, and probability calibration still needs validation.</li><li><strong>It does not establish causation.</strong> Rule drivers and the illustrative sensitivity tool cannot tell you which intervention will work.</li></ul>
          </section>
          <section id="api"><h2>Open the underlying data.</h2><p>The Next.js app reads generated JSON snapshots from the Python extraction and modelling pipeline. These read-only endpoints expose the same data used in the interface.</p>
            <div className="api-links">{[['/api/health', 'Snapshot health'], ['/api/kpis', 'Portfolio summary'], ['/api/projects', 'Project directory'], ['/api/filters', 'Available filters'], ['/api/benchmarks/ministries', 'Ministry comparisons']].map(([href, label]) => <a key={href} href={href} target="_blank" rel="noreferrer"><span>{label}</span><code>{href}</code><ArrowRight size={16} /></a>)}</div>
            <p className="workspace-note">Generate data with <code>python src/run_all.py</code>, then start the app with <code>npm run dev</code>. The extraction and model methodology still require human review.</p>
          </section>
        </article>
      </div>
    </>
  );
}
