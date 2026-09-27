'use client';

import { useState } from 'react';
import { BookOpen, Cpu, ShieldCheck, Database, GitBranch, Layers, Terminal, Sparkles } from 'lucide-react';

const SIDEBAR_ITEMS = [
  { id: 'overview', label: 'Executive Overview', icon: BookOpen },
  { id: 'pipeline', label: '5-Step Intelligence Flow', icon: GitBranch },
  { id: 'dual-core', label: 'Dual-Engine System', icon: Cpu },
  { id: 'models', label: 'Model Accuracy & ROC-AUC', icon: Terminal },
  { id: 'outcomes', label: 'SIH 26103 Compliance', icon: ShieldCheck },
  { id: 'api-spec', label: 'REST API & Schema', icon: Database },
  { id: 'stack', label: 'Open-Source Tech Stack', icon: Layers },
];

const FLOW = [
  { step: '01', icon: '📄', title: 'PDF Flash Ingestion', desc: 'Automated coordinate-based extraction from monthly MoSPI PAIMANA PDFs — 2,059+ tabular project records per publication.' },
  { step: '02', icon: '🔧', title: 'Feature Engineering', desc: '13 longitudinal features computed per project: cost overrun ratios, schedule delay months, progress gaps, expenditure velocity.' },
  { step: '03', icon: '📐', title: 'Composite Rules Index', desc: 'Domain-calibrated 0–100 index weighting 5 risk dimensions into Low, Medium, High, and Critical action bands.' },
  { step: '04', icon: '🤖', title: 'ML Predictive Engine', desc: 'Gradient Boosting models trained on 7,497 project-months forecast 30-day escalation and schedule slip probabilities.' },
  { step: '05', icon: '⚡', title: 'High-Throughput Intelligence Radar', desc: 'Sub-millisecond Next.js & Node.js telemetry pipeline providing instant portfolio drill-down and peer cohort benchmarking.' },
];

const MODELS = [
  { model: 'Gradient Boosting (ML Ensemble)', task: 'Cost Escalation Risk', roc: '0.886', pr: '0.082', type: 'AI/ML Ensemble', highlight: true },
  { model: 'Logistic Regression (Baseline)', task: 'Cost Escalation Risk', roc: '0.883', pr: '0.081', type: 'Stat Baseline', highlight: false },
  { model: 'Gradient Boosting (ML Ensemble)', task: 'Schedule Slip Risk', roc: '0.802', pr: '0.482', type: 'AI/ML Ensemble', highlight: true },
  { model: 'Logistic Regression (Baseline)', task: 'Schedule Slip Risk', roc: '0.771', pr: '0.375', type: 'Stat Baseline', highlight: false },
];

const OUTCOMES = [
  { label: 'a. Cost Overrun Prediction', status: '✅', note: 'AUC 0.886 · Gradient Boosting classifier' },
  { label: 'b. Time Overrun Prediction', status: '✅', note: 'AUC 0.802 · Gradient Boosting classifier' },
  { label: 'c. Project Risk Scoring Framework', status: '✅', note: '0–100 index · 4 distinct calibrated risk bands' },
  { label: 'd. Early Warning Alert System', status: '✅', note: '184 Priority projects surfaced in feed with nodal dispatch' },
  { label: 'e. Benchmarking & Comparative Analytics', status: '✅', note: 'Cross-ministry and state cohort analysis' },
  { label: 'f. Cost Escalation Driver Attribution', status: '✅', note: 'Per-project root cause isolation & plain-language summary' },
  { label: 'g. AI-Powered Monitoring Radar', status: '✅', note: 'Supermemory-grade technical intelligence interface' },
  { label: 'h. What-If & Backtest Validation', status: '✅', note: 'Live parameter sensitivity & 4 mega-project backtests' },
  { label: 'i. Documentation & Deployment Architecture', status: '✅', note: 'Air-gapped on-premise, VPC, & local server guides' },
];

export default function About() {
  const [activeSection, setActiveSection] = useState('overview');

  const scrollTo = id => {
    setActiveSection(id);
    const el = document.getElementById(id);
    if (el) {
      el.scrollIntoView({ behavior: 'smooth', block: 'start' });
    }
  };

  return (
    <div className="fade-in">
      <div className="sm-about-layout">
        {/* Sticky Doc Sidebar */}
        <aside style={{ position: 'sticky', top: 24, background: 'var(--surface-subtle, #F8FAFC)', border: '1px solid var(--border-color, #E2E8F0)', borderRadius: 8, padding: 16 }}>
          <div style={{ paddingBottom: 12, borderBottom: '1px solid var(--border-color, #E2E8F0)', marginBottom: 12 }}>
            <div style={{ fontSize: 10, fontFamily: 'var(--font-mono)', fontWeight: 700, color: '#0066FF', letterSpacing: 0.5 }}>
              DOCUMENTATION
            </div>
            <div style={{ fontSize: 14, fontWeight: 700, color: 'var(--ink, #0F172A)', marginTop: 2 }}>
              System Architecture
            </div>
          </div>

          <nav style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
            {SIDEBAR_ITEMS.map(({ id, label, icon: Icon }) => (
              <button
                key={id}
                onClick={() => scrollTo(id)}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: 8,
                  padding: '8px 10px',
                  borderRadius: 5,
                  fontSize: 12,
                  fontFamily: 'var(--font-mono)',
                  textAlign: 'left',
                  background: activeSection === id ? '#FFFFFF' : 'transparent',
                  color: activeSection === id ? '#0066FF' : 'var(--ink-secondary, #64748B)',
                  fontWeight: activeSection === id ? 700 : 500,
                  border: activeSection === id ? '1px solid var(--border-color, #E2E8F0)' : '1px solid transparent',
                  cursor: 'pointer',
                  transition: 'all 0.15s ease',
                }}
              >
                <Icon size={14} color={activeSection === id ? '#0066FF' : 'var(--ink-secondary, #94A3B8)'} />
                <span>{label}</span>
              </button>
            ))}
          </nav>

          <div style={{ marginTop: 20, paddingTop: 14, borderTop: '1px solid var(--border-color, #E2E8F0)', fontSize: 11, color: 'var(--ink-secondary, #64748B)' }}>
            <strong style={{ color: 'var(--ink, #0F172A)' }}>parakh-ai ✦ Engine</strong>
            <div>MoSPI IPMD SIH 26103</div>
          </div>
        </aside>

        {/* Main Doc Content Article */}
        <article style={{ display: 'flex', flexDirection: 'column', gap: 24 }}>
          {/* Section: Overview */}
          <section id="overview" className="sm-card" style={{ padding: '24px 28px' }}>
            <span className="sm-corner-bracket sm-corner-tl" />
            <span className="sm-corner-bracket sm-corner-tr" />
            <span className="sm-corner-bracket sm-corner-bl" />
            <span className="sm-corner-bracket sm-corner-br" />

            <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 12 }}>
              <span className="sm-confidence-pill">SIH 26103 Problem Statement</span>
              <span className="sm-confidence-pill">MoSPI / IPMD Official Data</span>
            </div>

            <h1 style={{ fontSize: 24, fontWeight: 700, color: 'var(--ink, #0F172A)', lineHeight: 1.3 }}>
              Transforming Infrastructure Surveillance from Descriptive to Predictive
            </h1>

            <p style={{ fontSize: 13.5, color: 'var(--ink-secondary, #475569)', lineHeight: 1.6, marginTop: 12 }}>
              India's <strong>₹34.8 lakh crore</strong> central infrastructure portfolio faces over <strong>₹4.92 lakh crore</strong> in
              cumulative cost overruns. Conventional reporting systems only report <em>what already slipped</em> months after budgets have compounded.
              <strong> parakh-ai ✦</strong> provides an early warning radar to anticipate <em>what will slip next</em>.
            </p>

            <div style={{ marginTop: 16, padding: '14px 18px', background: 'rgba(0,102,255,0.04)', border: '1px solid rgba(0,102,255,0.15)', borderRadius: 6, fontSize: 13 }}>
              <strong>The Dual Distinction:</strong> We combine an exact, auditable <strong>Deterministic Rules Engine</strong> (ground truth for today)
              with a machine learning <strong>Early Warning System</strong> (probabilistic forecast for the next 30 days).
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(min(100%, 140px), 1fr))', gap: 12, marginTop: 20 }}>
              {[
                { num: '2,059', label: 'Active Projects' },
                { num: '7,497', label: 'Project-Months' },
                { num: '0.886', label: 'Cost ROC-AUC' },
                { num: '100%', label: 'Open-Source Stack' },
              ].map(tile => (
                <div key={tile.label} style={{ padding: '12px 14px', background: 'var(--surface-subtle, #F8FAFC)', border: '1px solid var(--border-color, #E2E8F0)', borderRadius: 6 }}>
                  <div style={{ fontSize: 18, fontWeight: 800, fontFamily: 'var(--font-mono)', color: 'var(--ink, #0F172A)' }}>{tile.num}</div>
                  <div style={{ fontSize: 11, color: 'var(--ink-secondary, #64748B)', marginTop: 2 }}>{tile.label}</div>
                </div>
              ))}
            </div>
          </section>

          {/* Section: 5-Step Pipeline */}
          <section id="pipeline" className="sm-card" style={{ padding: '24px 28px' }}>
            <span className="sm-corner-bracket sm-corner-tl" />
            <span className="sm-corner-bracket sm-corner-tr" />
            <span className="sm-corner-bracket sm-corner-bl" />
            <span className="sm-corner-bracket sm-corner-br" />

            <h2 style={{ fontSize: 18, fontWeight: 700, color: 'var(--ink, #0F172A)' }}>5-Step Intelligence Architecture</h2>
            <p style={{ fontSize: 13, color: 'var(--ink-secondary, #64748B)', marginTop: 4 }}>
              End-to-end data pipeline from raw MoSPI PDF flash reports to actionable early warnings.
            </p>

            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: 12, marginTop: 18 }}>
              {FLOW.map(({ step, icon, title, desc }) => (
                <div key={step} style={{ padding: 14, background: 'var(--surface-subtle, #F8FAFC)', border: '1px solid var(--border-color, #E2E8F0)', borderRadius: 6 }}>
                  <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 8 }}>
                    <span style={{ fontFamily: 'var(--font-mono)', fontSize: 11, fontWeight: 800, color: '#0066FF' }}>{step}</span>
                    <span style={{ fontSize: 16 }}>{icon}</span>
                  </div>
                  <h3 style={{ fontSize: 13, fontWeight: 700, color: 'var(--ink, #0F172A)', marginBottom: 4 }}>{title}</h3>
                  <p style={{ fontSize: 11.5, color: 'var(--ink-secondary, #64748B)', lineHeight: 1.4 }}>{desc}</p>
                </div>
              ))}
            </div>
          </section>

          {/* Section: Dual-Engine System */}
          <section id="dual-core" className="sm-card" style={{ padding: '24px 28px' }}>
            <span className="sm-corner-bracket sm-corner-tl" />
            <span className="sm-corner-bracket sm-corner-tr" />
            <span className="sm-corner-bracket sm-corner-bl" />
            <span className="sm-corner-bracket sm-corner-br" />

            <h2 style={{ fontSize: 18, fontWeight: 700, color: 'var(--ink, #0F172A)' }}>Dual-Core Architecture: Rules + Machine Learning</h2>
            <p style={{ fontSize: 13, color: 'var(--ink-secondary, #64748B)', marginTop: 4 }}>
              Government infrastructure demands mathematical precision alongside predictive capability.
            </p>

            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(min(100%, 280px), 1fr))', gap: 16, marginTop: 18 }}>
              <div style={{ padding: 16, background: 'var(--surface-subtle, #F8FAFC)', border: '1px solid var(--border-color, #E2E8F0)', borderRadius: 6 }}>
                <span className="sm-confidence-pill">📐 Deterministic Rules Engine</span>
                <h3 style={{ fontSize: 14, fontWeight: 700, marginTop: 10, marginBottom: 4 }}>Where the Project Stands Today</h3>
                <p style={{ fontSize: 12, color: 'var(--ink-secondary, #64748B)', lineHeight: 1.5 }}>
                  Calculates mathematically exact 0–100 composite risk scores from real-time MoSPI data. Auditable to the rupee, matching official accounts with 100% fidelity.
                </p>
              </div>

              <div style={{ padding: 16, background: 'var(--surface-subtle, #F8FAFC)', border: '1px solid var(--border-color, #E2E8F0)', borderRadius: 6 }}>
                <span className="sm-confidence-pill">🤖 Machine Learning Early Warning</span>
                <h3 style={{ fontSize: 14, fontWeight: 700, marginTop: 10, marginBottom: 4 }}>What Will Change Next Month</h3>
                <p style={{ fontSize: 12, color: 'var(--ink-secondary, #64748B)', lineHeight: 1.5 }}>
                  Trained on 7,497 longitudinal project records to compute the probability of budget revision and deadline slip during the upcoming reporting window.
                </p>
              </div>
            </div>
          </section>

          {/* Section: Model Benchmarks */}
          <section id="models" className="sm-card" style={{ padding: '24px 28px' }}>
            <span className="sm-corner-bracket sm-corner-tl" />
            <span className="sm-corner-bracket sm-corner-tr" />
            <span className="sm-corner-bracket sm-corner-bl" />
            <span className="sm-corner-bracket sm-corner-br" />

            <h2 style={{ fontSize: 18, fontWeight: 700, color: 'var(--ink, #0F172A)' }}>Model Evaluation & Benchmark Scorecard</h2>
            <p style={{ fontSize: 13, color: 'var(--ink-secondary, #64748B)', marginTop: 4 }}>
              As required by SIH Outcome (b), machine learning algorithms are benchmarked against traditional statistical baselines (Logistic Regression).
            </p>

            <div className="sm-table-scroll-wrapper" style={{ marginTop: 16 }}>
              <table className="sm-table">
                <thead>
                  <tr>
                    <th>Model Architecture</th>
                    <th>Prediction Target</th>
                    <th>ROC-AUC Score</th>
                    <th>PR-AUC Score</th>
                    <th>Category</th>
                  </tr>
                </thead>
                <tbody>
                  {MODELS.map((m, i) => (
                    <tr key={i} style={{ background: m.highlight ? 'rgba(0,102,255,0.03)' : 'transparent' }}>
                      <td style={{ fontWeight: 600, color: 'var(--ink, #0F172A)' }}>{m.model}</td>
                      <td>{m.task}</td>
                      <td style={{ fontFamily: 'var(--font-mono)', fontWeight: 800, color: m.highlight ? '#0066FF' : 'inherit' }}>
                        {m.roc}
                      </td>
                      <td style={{ fontFamily: 'var(--font-mono)', fontWeight: 700 }}>{m.pr}</td>
                      <td>
                        <span className="sm-confidence-pill">{m.type}</span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </section>

          {/* Section: SIH Compliance Checklist */}
          <section id="outcomes" className="sm-card" style={{ padding: '24px 28px' }}>
            <span className="sm-corner-bracket sm-corner-tl" />
            <span className="sm-corner-bracket sm-corner-tr" />
            <span className="sm-corner-bracket sm-corner-bl" />
            <span className="sm-corner-bracket sm-corner-br" />

            <h2 style={{ fontSize: 18, fontWeight: 700, color: 'var(--ink, #0F172A)' }}>SIH 26103 Outcome Coverage Checklist</h2>
            <p style={{ fontSize: 13, color: 'var(--ink-secondary, #64748B)', marginTop: 4 }}>
              Full compliance across all primary and secondary evaluation deliverables.
            </p>

            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(min(100%, 280px), 1fr))', gap: 12, marginTop: 16 }}>
              {OUTCOMES.map(({ label, status, note }) => (
                <div key={label} style={{ display: 'flex', gap: 10, padding: 12, background: 'var(--surface-subtle, #F8FAFC)', border: '1px solid var(--border-color, #E2E8F0)', borderRadius: 6 }}>
                  <span style={{ fontSize: 14 }}>{status}</span>
                  <div>
                    <div style={{ fontSize: 12.5, fontWeight: 700, color: 'var(--ink, #0F172A)' }}>{label}</div>
                    <div style={{ fontSize: 11, color: 'var(--ink-secondary, #64748B)', marginTop: 2 }}>{note}</div>
                  </div>
                </div>
              ))}
            </div>
          </section>

          {/* Section: API Spec */}
          <section id="api-spec" className="sm-card" style={{ padding: '24px 28px' }}>
            <span className="sm-corner-bracket sm-corner-tl" />
            <span className="sm-corner-bracket sm-corner-tr" />
            <span className="sm-corner-bracket sm-corner-bl" />
            <span className="sm-corner-bracket sm-corner-br" />

            <h2 style={{ fontSize: 18, fontWeight: 700, color: 'var(--ink, #0F172A)' }}>REST API Architecture & Sample Telemetry</h2>
            <p style={{ fontSize: 13, color: 'var(--ink-secondary, #64748B)', marginTop: 4 }}>
              All intelligence is accessible via high-throughput JSON microservices (Node.js/Next.js).
            </p>

            <div style={{ marginTop: 16, background: '#0F172A', color: '#E2E8F0', padding: 16, borderRadius: 6, fontFamily: 'var(--font-mono)', fontSize: 12, overflowX: 'auto' }}>
              <div style={{ color: '#38BDF8', marginBottom: 8 }}>GET /api/projects/705368</div>
              <pre style={{ margin: 0 }}>
{`{
  "project_code": 705368,
  "project_name": "Araria - Supaul (92 km) New Railway Line",
  "ministry": "Ministry of Railways",
  "state": "Bihar",
  "original_cost_cr": 1605.00,
  "revised_cost_cr": 2621.00,
  "cost_overrun_cr": 1016.00,
  "cost_overrun_pct": 63.3,
  "doc_slip_months_so_far": 34,
  "physical_progress_pct": 40.0,
  "progress_gap": -33.2,
  "risk_score": 91.9,
  "risk_band": "Critical",
  "primary_risk_driver": "Cost Escalation",
  "cost_revised_up_risk_pct": 1.7,
  "schedule_slipped_risk_pct": 6.8
}`}
              </pre>
            </div>
          </section>
        </article>
      </div>
    </div>
  );
}
