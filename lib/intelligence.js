/**
 * PARAKH AI — Decision Intelligence & Utility Engine
 * Generates rule-based plain-language summaries, data confidence scores, and report exports.
 */

export function getProjectSummary(p) {
  if (!p) return 'Active central infrastructure project under longitudinal tracking.';

  const delay = p.delay_months || 0;
  const costOverrun = p.cost_overrun_cr || (p.revised_cost_cr && p.original_cost_cr ? p.revised_cost_cr - p.original_cost_cr : 0);
  const costRatio = p.original_cost_cr > 0 && p.revised_cost_cr > 0 
    ? ((p.revised_cost_cr / p.original_cost_cr) * 100).toFixed(0)
    : 100;

  if (p.risk_band === 'Critical') {
    if (delay > 24 && costOverrun > 500) {
      return `Severe dual compounding: ${delay}mo schedule slip with ₹${costOverrun.toLocaleString('en-IN')} Cr (+${costRatio - 100}%) cost escalation; requires urgent inter-ministerial intervention.`;
    }
    if (delay > 24) {
      return `Critical timeline bottleneck: ${delay}mo accumulated delay primarily driven by right-of-way and statutory clearance milestones.`;
    }
    return `Critical budgetary variance: capital expenditure at ${costRatio}% of sanctioned outlay with elevated milestone risk.`;
  }

  if (p.risk_band === 'High') {
    if (delay > 12) {
      return `Moderate timeline slippage of ${delay}mo; expenditure remains monitored under revised FY capital allocations.`;
    }
    return `Cost escalation variance detected; early warning alerts triggered for quarterly review before fiscal compounding.`;
  }

  if (p.risk_band === 'Medium') {
    return `Stable delivery trajectory with minor milestone variance (${delay}mo); within standard contingency tolerance.`;
  }

  return `Nominal execution trajectory: milestones progressing within approved time and cost parameters.`;
}

export function getConfidenceScore(p) {
  if (!p) return { score: 92, label: 'High Confidence' };

  let score = 75;
  if (p.original_cost_cr && p.original_cost_cr > 0) score += 5;
  if (p.revised_cost_cr && p.revised_cost_cr > 0) score += 5;
  if (p.delay_months !== undefined && p.delay_months !== null) score += 5;
  if (p.state) score += 4;
  if (p.ministry) score += 5;

  const bounded = Math.min(score, 98);
  const label = bounded >= 90 ? 'High Confidence' : 'Med Confidence';

  return { score: bounded, label };
}

export function exportToCsv(data, filename = 'parakh-ai-portfolio-export.csv') {
  if (!data || !data.length) return;

  const headers = ['Code', 'Project Name', 'Ministry', 'State', 'Risk Band', 'Cost Overrun (Cr)', 'Delay (Months)', 'Risk Score'];
  const rows = data.map(p => {
    const code = p.project_code || p.code || '';
    const name = p.project_name || p.name || '';
    const delay = p.doc_slip_months_so_far ?? p.delay_months ?? 0;
    const costOverrun = p.cost_overrun_cr ?? (p.revised_cost_cr && p.original_cost_cr ? p.revised_cost_cr - p.original_cost_cr : 0);
    const score = p.risk_score ? Number(p.risk_score).toFixed(1) : '75.0';

    return [
      `"#${code}"`,
      `"${String(name).replace(/"/g, '""')}"`,
      `"${String(p.ministry || '').replace(/"/g, '""')}"`,
      `"${String(p.state || '').replace(/"/g, '""')}"`,
      p.risk_band || 'High',
      Math.round(costOverrun),
      delay,
      score,
    ];
  });

  const csvContent = [headers.join(','), ...rows.map(r => r.join(','))].join('\n');
  const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.setAttribute('href', url);
  link.setAttribute('download', filename);
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
}

export function getBottleneckSignal(p) {
  if (!p) return 'Active Surveillance';
  const delay = p.doc_slip_months_so_far ?? p.delay_months ?? 0;
  const costOverrun = p.cost_overrun_cr ?? (p.revised_cost_cr && p.original_cost_cr ? p.revised_cost_cr - p.original_cost_cr : 0);
  const costRatio = p.original_cost_cr > 0 && p.revised_cost_cr > 0 
    ? Math.round((p.revised_cost_cr / p.original_cost_cr) * 100)
    : 100;

  if (delay > 24 && costOverrun > 500) {
    return `Dual Variance: +${delay}mo · CapEx ${costRatio}%`;
  }
  if (costRatio >= 130) {
    return `Spend Escalation (${costRatio}% of outlay)`;
  }
  if (delay >= 24) {
    return `Severe Delay (+${delay} mos)`;
  }
  if (delay > 0) {
    return `Schedule Slip (+${delay} mos)`;
  }
  if (costOverrun > 0) {
    return `Budget Revision (+₹${Math.round(costOverrun)} Cr)`;
  }
  return 'Milestone Variance Monitored';
}
