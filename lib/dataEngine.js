import fs from 'fs';
import path from 'path';
import { resolveMinistry } from '@/lib/ministryMap';

let projectsData = [];
let kpiData = {};
let isLoaded = false;

function resolveDataPath(filename) {
  return path.resolve(process.cwd(), 'data', 'processed', filename);
}

export function loadData(force = false) {
  if (isLoaded && !force) return;

  const snapshotPath = resolveDataPath('latest_snapshot.json');
  const kpisPath = resolveDataPath('portfolio_kpis.json');

  try {
    if (fs.existsSync(snapshotPath)) {
      const rawSnapshot = fs.readFileSync(snapshotPath, 'utf-8');
      projectsData = JSON.parse(rawSnapshot);
      // The extractor cannot read a ministry column (PAIMANA's table lists
      // agencies only). Derive it from the agency so benchmarks, filters
      // and peer groups have a real parent ministry instead of "Unknown".
      projectsData = projectsData.map(p => ({ ...p, ministry: resolveMinistry(p) }));
      console.log(`[Data Engine] Loaded ${projectsData.length} projects from ${snapshotPath}`);
    } else {
      console.warn(`[Data Engine Warning] Snapshot file not found at ${snapshotPath}`);
    }

    if (fs.existsSync(kpisPath)) {
      const rawKpis = fs.readFileSync(kpisPath, 'utf-8');
      kpiData = JSON.parse(rawKpis);
      console.log(`[Data Engine] Loaded portfolio KPIs from ${kpisPath}`);
    } else {
      console.warn(`[Data Engine Warning] KPIs file not found at ${kpisPath}`);
    }

    isLoaded = true;
  } catch (err) {
    console.error('[Data Engine Error] Failed to load processed data:', err.message);
  }
}

// Ensure initial load
loadData();

export function getHealth() {
  loadData();
  return {
    status: 'online',
    timestamp: new Date().toISOString(),
    total_projects_loaded: projectsData.length,
    kpis_ready: Boolean(kpiData?.total_projects),
    framework: 'Next.js 15 App Router Full-Stack'
  };
}

export function getKpis() {
  loadData();
  return kpiData;
}

export function getFilters() {
  loadData();
  const ministries = [...new Set(projectsData.map(p => p.ministry).filter(Boolean))].sort();
  const states = [...new Set(projectsData.map(p => p.state).filter(Boolean))].sort();
  const riskBands = ['Critical', 'High', 'Medium', 'Low'];
  const riskDrivers = [...new Set(projectsData.map(p => p.primary_risk_driver).filter(Boolean))].sort();

  return {
    ministries,
    states,
    risk_bands: riskBands,
    risk_drivers: riskDrivers
  };
}

export function getAlerts(limit = 10) {
  loadData();
  const numLimit = parseInt(limit) || 10;
  const criticalAndHigh = projectsData
    .filter(p => p.risk_band === 'Critical' || p.risk_band === 'High')
    .sort((a, b) => (b.risk_score || 0) - (a.risk_score || 0))
    .slice(0, numLimit);

  const total = projectsData.filter(p => p.risk_band === 'Critical' || p.risk_band === 'High').length;

  return {
    total_alerts: total,
    limit: numLimit,
    projects: criticalAndHigh,
    data: criticalAndHigh
  };
}

export function getMinistryBenchmarks() {
  loadData();
  const ministryMap = {};

  projectsData.forEach(p => {
    const min = p.ministry || 'Not attributed';
    if (!ministryMap[min]) {
      ministryMap[min] = {
        ministry: min,
        total_projects: 0,
        total_original_cost: 0,
        total_revised_cost: 0,
        total_cost_overrun: 0,
        cumulative_risk_score: 0,
        total_delay_months: 0,
        critical_count: 0,
        high_count: 0
      };
    }

    const m = ministryMap[min];
    m.total_projects += 1;
    m.total_original_cost += p.original_cost_cr || 0;
    m.total_revised_cost += p.revised_cost_cr || 0;
    m.total_cost_overrun += Math.max(0, (p.revised_cost_cr || 0) - (p.original_cost_cr || 0));
    m.cumulative_risk_score += p.risk_score || 0;
    m.total_delay_months += Math.max(0, p.doc_slip_months_so_far || 0);

    if (p.risk_band === 'Critical') m.critical_count += 1;
    if (p.risk_band === 'High') m.high_count += 1;
  });

  return Object.values(ministryMap).map(m => ({
    ministry: m.ministry,
    total_projects: m.total_projects,
    project_count: m.total_projects,
    total_original_cost_cr: Number(m.total_original_cost.toFixed(2)),
    total_revised_cost_cr: Number(m.total_revised_cost.toFixed(2)),
    total_cost_overrun_cr: Number(m.total_cost_overrun.toFixed(2)),
    avg_risk_score: Number((m.cumulative_risk_score / m.total_projects).toFixed(1)),
    avg_delay_months: Number((m.total_delay_months / m.total_projects).toFixed(1)),
    critical_count: m.critical_count,
    high_count: m.high_count
  })).sort((a, b) => b.total_cost_overrun_cr - a.total_cost_overrun_cr);
}

export function getProjects(params = {}) {
  loadData();
  const {
    search = '',
    risk_band = '',
    ministry = '',
    state = '',
    driver = '',
    sort_by = 'risk_score',
    order = 'desc',
    page = 1,
    limit = 20
  } = params;

  const pageNum = Math.max(1, parseInt(page) || 1);
  const requestedLimit = limit === 'all' ? 5000 : parseInt(limit);
  const limitNum = Math.min(requestedLimit || 20, 5000);

  let filtered = projectsData;

  // Search by project name, code, agency, ministry, or state
  if (search && search.trim()) {
    const q = search.trim().toLowerCase();
    filtered = filtered.filter(p =>
      (p.project_name && p.project_name.toLowerCase().includes(q)) ||
      (p.project_code && p.project_code.toString().includes(q)) ||
      (p.agency && p.agency.toLowerCase().includes(q)) ||
      (p.ministry && p.ministry.toLowerCase().includes(q)) ||
      (p.state && p.state.toLowerCase().includes(q))
    );
  }

  // Filter by risk band (can be comma-separated: e.g. "Critical,High")
  if (risk_band) {
    const bands = risk_band.split(',').map(b => b.trim().toLowerCase());
    filtered = filtered.filter(p => p.risk_band && bands.includes(p.risk_band.toLowerCase()));
  }

  // Filter by ministry
  if (ministry) {
    filtered = filtered.filter(p => p.ministry && p.ministry.toLowerCase() === ministry.trim().toLowerCase());
  }

  // Filter by state
  if (state) {
    filtered = filtered.filter(p => p.state && p.state.toLowerCase().includes(state.trim().toLowerCase()));
  }

  // Filter by primary risk driver
  if (driver) {
    filtered = filtered.filter(p => p.primary_risk_driver && p.primary_risk_driver.toLowerCase() === driver.trim().toLowerCase());
  }

  // Sort
  const validSortFields = [
    'risk_score', 'revised_cost_cr', 'original_cost_cr',
    'cumulative_expenditure_cr', 'physical_progress_pct',
    'cost_overrun_ratio_so_far', 'doc_slip_months_so_far',
    'cost_revised_up_risk_pct', 'schedule_slipped_risk_pct'
  ];

  if (validSortFields.includes(sort_by)) {
    const isAsc = order.toLowerCase() === 'asc';
    filtered.sort((a, b) => {
      const valA = a[sort_by] ?? -Infinity;
      const valB = b[sort_by] ?? -Infinity;
      return isAsc ? valA - valB : valB - valA;
    });
  }

  const total = filtered.length;
  const totalPages = Math.ceil(total / limitNum) || 1;
  const startIndex = (pageNum - 1) * limitNum;
  const paginatedProjects = filtered.slice(startIndex, startIndex + limitNum);

  return {
    page: pageNum,
    limit: limitNum,
    total_projects: total,
    total_pages: totalPages,
    data: paginatedProjects
  };
}

export function generateAssessment(p) {
  const band = p.risk_band;
  const driver = p.primary_risk_driver || 'Timeline Deviation';
  const delay = p.doc_slip_months_so_far || 0;
  const costOverrun = p.cost_overrun_ratio_so_far ? (p.cost_overrun_ratio_so_far * 100).toFixed(1) : 0;

  if (band === 'Critical') {
    return `CRITICAL INTERVENTION REQUIRED: Driven primarily by ${driver}. The project exhibits a delay of ${delay} months with cost escalation of ${costOverrun}%. Immediate milestone review recommended.`;
  }
  if (band === 'High') {
    return `HIGH RISK ALERT: Primary bottleneck is ${driver}. Schedule has slipped by ${delay} months. Escalation mitigation measures should be enacted.`;
  }
  if (band === 'Medium') {
    return `MODERATE WATCH: Driven by ${driver}. Minor delays or spend-progress divergence detected. Regular monthly tracking advised.`;
  }
  return `NORMAL IMPLEMENTATION: Project performance is largely within expected variance.`;
}

export function getProjectByCode(code) {
  loadData();
  const trimmedCode = (code || '').toString().trim();
  const project = projectsData.find(p => p.project_code.toString() === trimmedCode);

  if (!project) return null;

  const originalCost = project.original_cost_cr || 0;
  const revisedCost = project.revised_cost_cr || originalCost;
  const expenditure = project.cumulative_expenditure_cr || 0;
  const overrunCr = Math.max(0, revisedCost - originalCost);
  const overrunPct = originalCost > 0 ? ((overrunCr / originalCost) * 100).toFixed(1) : 0;
  const delayMonths = Math.max(0, project.doc_slip_months_so_far || 0);

  return {
    ...project,
    ai_assessment: generateAssessment(project),
    analytics: {
      cost_escalation_amount_cr: Number(overrunCr.toFixed(2)),
      cost_escalation_pct: Number(overrunPct),
      delay_months: delayMonths,
      funds_spent_pct: revisedCost > 0 ? Number(((expenditure / revisedCost) * 100).toFixed(1)) : 0,
      physical_progress_pct: project.physical_progress_pct || 0,
      ai_assessment: generateAssessment(project)
    }
  };
}

export function getProjectPeers(code) {
  loadData();
  const trimmedCode = (code || '').toString().trim();
  const project = projectsData.find(p => p.project_code.toString() === trimmedCode);

  if (!project) return null;

  const peers = projectsData.filter(p =>
    p.project_code.toString() !== trimmedCode &&
    p.ministry === project.ministry &&
    p.state === project.state
  );

  if (peers.length === 0) {
    return {
      project_code: trimmedCode,
      peer_group: { ministry: project.ministry, state: project.state, count: 0 },
      message: 'No peer projects found in same ministry + state combination.'
    };
  }

  const avg = (arr, key) => {
    const vals = arr.map(p => p[key]).filter(v => v != null && isFinite(v));
    return vals.length ? Number((vals.reduce((a, b) => a + b, 0) / vals.length).toFixed(2)) : null;
  };

  const peerStats = {
    count: peers.length,
    ministry: project.ministry,
    state: project.state,
    avg_cost_overrun_pct: Number(((avg(peers, 'cost_overrun_ratio_so_far') || 0) * 100).toFixed(1)),
    avg_schedule_delay_months: avg(peers, 'doc_slip_months_so_far'),
    avg_physical_progress_pct: avg(peers, 'physical_progress_pct'),
    avg_risk_score: avg(peers, 'risk_score'),
    risk_band_distribution: {
      Critical: peers.filter(p => p.risk_band === 'Critical').length,
      High: peers.filter(p => p.risk_band === 'High').length,
      Medium: peers.filter(p => p.risk_band === 'Medium').length,
      Low: peers.filter(p => p.risk_band === 'Low').length,
    }
  };

  const thisOverrunPct = Number(((project.cost_overrun_ratio_so_far || 0) * 100).toFixed(1));
  const peerOverrunPct = peerStats.avg_cost_overrun_pct;
  const overrunDiff = thisOverrunPct - peerOverrunPct;
  const thisDelay = project.doc_slip_months_so_far || 0;
  const peerDelay = peerStats.avg_schedule_delay_months || 0;

  let insight = `${peers.length} similar ${project.ministry} projects in ${project.state} `;
  insight += `have an average cost overrun of ${peerOverrunPct}% and schedule delay of ${peerDelay} months. `;

  if (overrunDiff > 5) {
    insight += `This project's overrun (${thisOverrunPct}%) is ${overrunDiff.toFixed(1)}% above the peer average — a significant warning sign.`;
  } else if (overrunDiff < -5) {
    insight += `This project's overrun (${thisOverrunPct}%) is below the peer average — performing better than similar projects.`;
  } else {
    insight += `This project shows a similar overrun pattern (${thisOverrunPct}%) to its peers — early warning indicators align with the group trend.`;
  }

  return {
    project_code: trimmedCode,
    project_name: project.project_name,
    this_project: {
      cost_overrun_pct: thisOverrunPct,
      schedule_delay_months: thisDelay,
      risk_score: project.risk_score,
      risk_band: project.risk_band
    },
    peer_group: peerStats,
    peer_insight: insight,
    top_peers_by_risk: peers
      .sort((a, b) => (b.risk_score || 0) - (a.risk_score || 0))
      .slice(0, 5)
      .map(p => ({
        project_code: p.project_code,
        project_name: p.project_name,
        risk_score: p.risk_score,
        risk_band: p.risk_band,
        cost_overrun_pct: Number(((p.cost_overrun_ratio_so_far || 0) * 100).toFixed(1)),
        schedule_delay_months: p.doc_slip_months_so_far
      }))
  };
}

export function reloadData() {
  loadData(true);
  return {
    message: 'Data successfully reloaded from disk!',
    total_projects: projectsData.length
  };
}
