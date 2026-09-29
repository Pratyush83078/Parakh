// Agency → Ministry resolution.
//
// The PAIMANA "All Ongoing Projects" table lists the implementing agency
// per row and never the parent ministry (the extractor leaves the field
// empty — src/pdf_extracter.py has no ministry column to read). Table 1
// of the report ("Ministry-wise Ongoing Projects") proves the mapping
// exists officially; this table encodes it from the agency prefixes that
// actually appear in the snapshot so benchmarks, peers, and the watchlist
// show real ministries instead of "Unknown".
//
// Order matters: first match wins, so specific aliases (zone railways,
// coal subsidiaries, metro corporations) precede generic keyword rules.

const ALIASES = [
  // Railways — zones and production units
  [/^(SR|ERS|SER|NR|NER|NFR|ER|CR|WR|SWR|SCR|SECR|ECR|ECoR|NCR|WCR|NWR|NCR)\b|Southern Railway|Eastern Railway|Northern Railway|South Eastern Railway|North Eastern Railway|Northeast Frontier Railway|East Central Railway|East Coast Railway|South Central Railway|South Western Railway|West Central Railway|North Western Railway|North Central Railway|Southeast Central Railway|Chittaranjan|Rail Wheel|IRCON|Rail Vikas|RVNL|DFCCIL|Konkan Railway|Dedicated Freight/i, 'Railways'],
  [/^CAOC\b|Chief Administrative Officer.*Construction|CAO\/[Cc]?\w*\b|\bWPO\//i, 'Railways'],

  // Communications
  [/Department of Telecommunications|Telecom|\bDoT\b|BSNL|MTNL/i, 'Ministry of Communications'],
  [/Posts?\b(?!al)|India Post/i, 'Ministry of Communications'],

  // Transport & Highways
  [/\bNHAI\b|National Highways Authority/i, 'Ministry of Road Transport & Highways'],
  [/\bMoRTH\b|M[oO]RT[Hh]\b/i, 'Ministry of Road Transport & Highways'],
  [/NHIDCL|National Highways &? Infrastructure Development/i, 'Ministry of Road Transport & Highways'],
  [/\bNH\b[ /-]?\d|National Highway(?!s Authority)/i, 'Ministry of Road Transport & Highways'],
  [/Ministry of Shipping|Ports?,? Shipping &? Waterways|Sagarmala|Kandla|Jawaharlal Nehru Port|Paradip|VO Chidambaranar|Deendayal|Mumbai Port|Kolkata Port|Chennai Port|Cochin Port|New Mangalore|Mormugao/i, 'Ministry of Ports, Shipping & Waterways'],
  [/Inland Waterways|IWAI/i, 'Ministry of Ports, Shipping & Waterways'],

  // Civil aviation
  [/\bAAI\b|Airport(s)? Authority|Airports? Authority/i, 'Ministry of Civil Aviation'],
  [/Air India|NALCO? Air|Pawan Hans|IndiGo|Airports? Economic/i, 'Ministry of Civil Aviation'],

  // Power & Coal
  [/\bNTPC\b|National Thermal Power/i, 'Ministry of Power'],
  [/\bNHPC\b|North Eastern Electric|NEEPCO|THDC|SJVN|Satluj Jal/i, 'Ministry of Power'],
  [/\bPGCIL\b|Power Grid|POWERGRID|Adani Transmission/i, 'Ministry of Power'],
  [/\bNHPCL\b|Thermal Power Corporation|NTPC.?Vidyut/i, 'Ministry of Power'],
  [/\bDVC\b|Damodar Valley/i, 'Ministry of Power'],
  [/\bNALCO\b|National Aluminium|\bNLC\b|Neyveli/i, 'Ministry of Heavy Industries'],
  [/\bBHEL\b|Bharat Heavy Electricals/i, 'Ministry of Heavy Industries'],
  [/Coal India|\bCIL\b|ECL|WCL|CCL|BCCL|NCL|SECL|MCL|ECL -|Coal Mines|Northern Coalfields|South Eastern Coalfields|Central Coalfields|Bharat Coking Coal|Mahanadi Coalfields|Eastern Coalfields|Western Coalfields/i, 'Ministry of Coal'],
  [/\bCMPDIL\b|Central Mine Planning/i, 'Ministry of Coal'],

  // Petroleum & Natural Gas
  [/Indian Oil|\bIOCL\b/i, 'Ministry of Petroleum & Natural Gas'],
  [/\bONGC\b|Oil and Natural Gas/i, 'Ministry of Petroleum & Natural Gas'],
  [/\bGAIL\b/i, 'Ministry of Petroleum & Natural Gas'],
  [/\bHPCL\b|Hindustan Petroleum/i, 'Ministry of Petroleum & Natural Gas'],
  [/\bBPCL\b|Bharat Petroleum/i, 'Ministry of Petroleum & Natural Gas'],
  [/\bOIL\b\b|Oil India/i, 'Ministry of Petroleum & Natural Gas'],
  [/\bMRPL\b|Mangalore Refinery/i, 'Ministry of Petroleum & Natural Gas'],
  [/\bCPCL\b|Chennai Petroleum/i, 'Ministry of Petroleum & Natural Gas'],
  [/\bIGL\b|\bMGL\b|\bGSPL\b|\bRBML\b/i, 'Ministry of Petroleum & Natural Gas'],

  // Steel & Mining
  [/\bSAIL\b|Steel Authority/i, 'Ministry of Steel'],
  [/Rashtriya Ispat|RINL|Visakhapatnam Steel|Durgapur Steel|Bokaro Steel|Rourkela Steel|Bhilai Steel|IISCO/i, 'Ministry of Steel'],
  [/Hindustan Copper|\bHCL\b/i, 'Ministry of Mines'],
  [/NMDC|National Mineral Development/i, 'Ministry of Steel'],

  // Urban & Housing
  [/Metro (Rail )?Corporation|Metro Rail|Chennai Metro|Delhi Metro|Bangalore Metro|BMRCL|LMRC|Jaipur Metro|Kolkata Metro|MMRDA|Ahmedabad Metro|Gujarat Metro|Kanpur Metro|Lucknow Metro|Agra Metro|Nagpur Metro|Pune Metro|Patna Metro|Bhopal Metro|Indore Metro|Surat Metro|Meerut Metro/i, 'Ministry of Housing & Urban Affairs'],
  [/\bCPWD\b|Central Public Works/i, 'Ministry of Housing & Urban Affairs'],
  [/NBCC|National Buildings? Construction/i, 'Ministry of Housing & Urban Affairs'],
  [/HUDCO/i, 'Ministry of Housing & Urban Affairs'],

  // Water & rivers
  [/\bNPCC\b|National Projects Construction/i, 'Ministry of Jal Shakti'],
  [/Brahmaputra Board|Farakka|Ganga|Namami|Water Resources|Irrigation|WPO\//i, 'Ministry of Jal Shakti'],

  // Atomic energy & space
  [/\bNPCIL\b|Nuclear Power/i, 'Department of Atomic Energy'],
  [/\bISRO\b|Space|VSSC|SDSC|Satish Dhawan|Vikram Sarabhai/i, 'Department of Space'],

  // Defense
  [/\bDRDO\b|Defence Research/i, 'Ministry of Defence'],
  [/\bHAL\b|Hindustan Aeronautics/i, 'Ministry of Defence'],
  [/\bBEL\b|Bharat Electronics/i, 'Ministry of Defence'],
  [/\bMDL\b|Mazagon/i, 'Ministry of Defence'],
  [/\bGRSE\b|Garden Reach/i, 'Ministry of Defence'],
  [/\bBEML\b/i, 'Ministry of Defence'],
  [/Mishra Dhatu|\bMIDHANI\b/i, 'Ministry of Defence'],
  [/Military Engineer|\bMES\b|Border Roads|\bBRO\b/i, 'Ministry of Defence'],

  // Textiles, Food, Chemicals & Fertilizers, others
  [/National Textile|\bNTC\b|Textiles Committee/i, 'Ministry of Textiles'],
  [/\bFCI\b|Food Corporation/i, 'Ministry of Consumer Affairs, Food & Public Distribution'],
  [/Hindustan Organic|HOC\b|Fertilizers? & Chemicals| Travancore |FACT\b|Madras Fertilizers|RCF\b|Rashtriya Chemicals/i, 'Department of Fertilizers'],
  [/Hindustan Insecticides|HIL\b/i, 'Ministry of Chemicals & Petrochemicals'],
  [/Hindustan Paper|HPVL/i, 'Ministry of Heavy Industries'],
  [/Engineering Projects|\bEPIL\b/i, 'Ministry of Heavy Industries'],
  [/Hindustan Machine|\bHMT\b/i, 'Ministry of Heavy Industries'],
  [/Andrew Yule|\bAYCL\b/i, 'Ministry of Heavy Industries'],
  [/Bengal Chemical/i, 'Ministry of Chemicals & Petrochemicals'],
  [/Nagaland Pulp/i, 'Ministry of Heavy Industries'],

  // Case-typo belt: agencies arrive with mangled casing from the PDF tables.
  [/^ministry of housing/i, 'Ministry of Housing & Urban Affairs'],
  [/^ministry of coal/i, 'Ministry of Coal'],
  [/^ministry of petroleum/i, 'Ministry of Petroleum & Natural Gas'],

  // Education, Health, IT, Labour
  [/\bIIT\b|Indian Institute of Technology|Indian Institute of Management|\bIIM\b|NIT\b|National Institute of Technology|University|School of Planning|Sports/i, 'Ministry of Education'],
  [/\bAIIMS\b|All India Institute|PMSSY|Medical Education|ESIC|Employees? State Insurance/i, 'Ministry of Health & Family Welfare'],
  [/\bC-DAC\b|\bCDAC\b|NIC\b|National Informatics|Software Technology|STPI/i, 'Ministry of Electronics & IT'],
  [/Industrial Corridor|NICDC|Delhi.Mumbai.*Corridor|RVNL/i, 'Ministry of Commerce & Industry'],

  // Development finance & north-east
  [/\bNABARD\b|North Eastern Development|\bNERAMAC\b|\bNEC\b\b/i, 'Ministry of Development of North Eastern Region'],
  [/\bIREDA\b|Renewable Energy/i, 'Ministry of New & Renewable Energy'],
  [/WAPCOS|Engineering Consult/i, 'Ministry of Jal Shakti'],
];

const KEYWORDS = [
  [/railway/i, 'Railways'],
  [/telecom|communications/i, 'Ministry of Communications'],
  [/road|highway|transport/i, 'Ministry of Road Transport & Highways'],
  [/shipping|port\b|waterways/i, 'Ministry of Ports, Shipping & Waterways'],
  [/aviation|airport/i, 'Ministry of Civil Aviation'],
  [/power|thermal|hydro|electric/i, 'Ministry of Power'],
  [/coal/i, 'Ministry of Coal'],
  [/petroleum|oil|gas|refiner|pipeline/i, 'Ministry of Petroleum & Natural Gas'],
  [/steel|ispat/i, 'Ministry of Steel'],
  [/mining|minerals/i, 'Ministry of Mines'],
  [/metro|urban|municipal|town/i, 'Ministry of Housing & Urban Affairs'],
  [/water|river|irrigation|jal/i, 'Ministry of Jal Shakti'],
  [/atomic|nuclear/i, 'Department of Atomic Energy'],
  [/space/i, 'Department of Space'],
  [/defen[cs]e|ordnance/i, 'Ministry of Defence'],
  [/textile/i, 'Ministry of Textiles'],
  [/food|consumer/i, 'Ministry of Consumer Affairs, Food & Public Distribution'],
  [/fertilizer|chemical/i, 'Department of Fertilizers'],
  [/heavy indust/i, 'Ministry of Heavy Industries'],
  [/education|school/i, 'Ministry of Education'],
  [/health|hospital|medical/i, 'Ministry of Health & Family Welfare'],
  [/electron|IT\b|software/i, 'Ministry of Electronics & IT'],
  [/north.?east/i, 'Ministry of Development of North Eastern Region'],
  [/renewable|solar|wind/i, 'Ministry of New & Renewable Energy'],
];

const cache = new Map();

/**
 * Resolve the parent ministry for a PAIMANA row. Prefers an explicit
 * `ministry` field (future-proof: the extractor may fill it one day),
 * then exact/keyword alias matching on the agency string. Falls back to
 * 'Not attributed' so unmapped agencies stay visible and auditable.
 */
export function resolveMinistry(row) {
  if (row.ministry) return row.ministry;
  const agency = String(row.agency || '').trim();
  if (!agency) return 'Not attributed';
  if (cache.has(agency)) return cache.get(agency);

  let ministry = null;
  for (const [re, name] of ALIASES) {
    if (re.test(agency)) { ministry = name; break; }
  }
  if (!ministry) {
    for (const [re, name] of KEYWORDS) {
      if (re.test(agency)) { ministry = name; break; }
    }
  }
  if (!ministry) ministry = 'Not attributed';
  cache.set(agency, ministry);
  return ministry;
}
