/**
 * scout-agent.js
 * Sovereign Agent: Scouts for new CVEs and breach news every 6 hours
 * Uses NVD API (free, no key required) + CISA KEV catalog
 * Writes opportunities to .github/data/scout-queue.json for Writer Agent
 */

const https = require('https');
const fs = require('fs');
const path = require('path');

const DATA_DIR = '.github/data';
const QUEUE_FILE = `${DATA_DIR}/scout-queue.json`;
const HISTORY_FILE = `${DATA_DIR}/scout-history.json`;

if (!fs.existsSync(DATA_DIR)) fs.mkdirSync(DATA_DIR, { recursive: true });

let history = new Set();
try {
  const h = JSON.parse(fs.readFileSync(HISTORY_FILE, 'utf-8'));
  history = new Set(h.seen || []);
} catch(e) {}

function get(url) {
  return new Promise((resolve) => {
    const t = setTimeout(() => resolve(null), 12000);
    try {
      const u = new URL(url);
      const opts = {
        hostname: u.hostname,
        path: u.pathname + u.search,
        headers: { 'User-Agent': 'VulnScanAgent/2.0', 'Accept': 'application/json' }
      };
      https.get(opts, (r) => {
        let d = '';
        r.on('data', c => d += c);
        r.on('end', () => {
          clearTimeout(t);
          try { resolve(JSON.parse(d)); } catch(e) { resolve(null); }
        });
      }).on('error', () => { clearTimeout(t); resolve(null); });
    } catch(e) { clearTimeout(t); resolve(null); }
  });
}

async function scoutNVD() {
  console.log('🔍 Scouting NVD for recent critical CVEs...');
  
  // NVD API v2 — free, no key for basic queries
  const today = new Date();
  const sevenDaysAgo = new Date(today - 7 * 24 * 60 * 60 * 1000);
  const pubStart = sevenDaysAgo.toISOString().split('.')[0] + '+00:00';
  const pubEnd = today.toISOString().split('.')[0] + '+00:00';
  
  const url = `https://services.nvd.nist.gov/rest/json/cves/2.0?cvssV3Severity=CRITICAL&pubStartDate=${encodeURIComponent(pubStart)}&pubEndDate=${encodeURIComponent(pubEnd)}&resultsPerPage=20`;
  
  const data = await get(url);
  if (!data || !data.vulnerabilities) {
    console.log('  NVD returned no data (rate limit? retry later)');
    return [];
  }
  
  const newCVEs = [];
  for (const vuln of data.vulnerabilities) {
    const cve = vuln.cve;
    const id = cve.id;
    
    if (history.has(id)) continue;
    
    const desc = cve.descriptions?.find(d => d.lang === 'en')?.value || '';
    const cvss = cve.metrics?.cvssMetricV31?.[0]?.cvssData?.baseScore || 
                 cve.metrics?.cvssMetricV30?.[0]?.cvssData?.baseScore || 'N/A';
    const severity = cve.metrics?.cvssMetricV31?.[0]?.cvssData?.baseSeverity || 'CRITICAL';
    const published = cve.published?.split('T')[0] || 'unknown';
    
    // Extract affected tech from desc
    const techMatch = desc.match(/in ([A-Za-z][A-Za-z0-9\s]{2,30}?) (?:before|through|prior)/);
    const tech = techMatch ? techMatch[1].trim() : 'web application';
    
    newCVEs.push({ id, desc: desc.substring(0, 300), cvss, severity, tech, published, source: 'nvd' });
    console.log(`  ✨ New CVE: ${id} (CVSS ${cvss}) — ${tech}`);
  }
  
  return newCVEs;
}

async function scoutCISAKEV() {
  console.log('🔍 Scouting CISA KEV (actively exploited)...');
  
  // CISA Known Exploited Vulnerabilities catalog — free, no auth
  const data = await get('https://www.cisa.gov/sites/default/files/feeds/known_exploited_vulnerabilities.json');
  if (!data || !data.vulnerabilities) return [];
  
  // Get most recently added (last 10)
  const recent = data.vulnerabilities.slice(-10).reverse();
  const newKEVs = [];
  
  for (const vuln of recent) {
    const id = vuln.cveID;
    if (history.has(id)) continue;
    
    newKEVs.push({
      id,
      desc: `${vuln.shortDescription} — Actively exploited in the wild. CISA mandates patching by ${vuln.dueDate}.`,
      cvss: 'N/A',
      severity: 'CRITICAL',
      tech: vuln.product || vuln.vendorProject,
      published: vuln.dateAdded,
      source: 'cisa_kev',
      kev: true // flag as Known Exploited = priority content
    });
    console.log(`  🚨 KEV: ${id} — ${vuln.product} (Added ${vuln.dateAdded})`);
  }
  
  return newKEVs;
}

async function scoutBreachNews() {
  console.log('🔍 Scouting breach news via RSS...');
  
  // Krebs on Security RSS — no auth, free
  const rssData = await get('https://krebsonsecurity.com/feed/');
  // Parse minimal info (RSS is XML, we just extract slug)
  // Actual parsing would require xml parsing; track by date
  
  return []; // Placeholder — full XML parse would need xml2js
}

async function main() {
  console.log(`\n🤖 Scout Agent — ${new Date().toISOString()}\n`);
  
  const [nvdCVEs, cisaCVEs] = await Promise.all([
    scoutNVD(),
    scoutCISAKEV()
  ]);
  
  // Merge and deduplicate
  const allNew = [...nvdCVEs, ...cisaCVEs].filter((v, i, a) => 
    a.findIndex(x => x.id === v.id) === i
  );
  
  // Prioritize KEV findings (actively exploited = higher search intent)
  allNew.sort((a, b) => (b.kev ? 1 : 0) - (a.kev ? 1 : 0));
  
  console.log(`\n📊 Scout Results: ${allNew.length} new opportunities found`);
  
  // Load existing queue and add new items
  let queue = [];
  try { queue = JSON.parse(fs.readFileSync(QUEUE_FILE, 'utf-8')); } catch(e) {}
  
  for (const item of allNew) {
    if (!queue.find(q => q.id === item.id)) {
      queue.push({ ...item, status: 'queued', queued_at: new Date().toISOString() });
      history.add(item.id);
    }
  }
  
  // Keep queue to last 100 items
  queue = queue.slice(-100);
  
  fs.writeFileSync(QUEUE_FILE, JSON.stringify(queue, null, 2));
  fs.writeFileSync(HISTORY_FILE, JSON.stringify({ seen: [...history], updated: new Date().toISOString() }));
  
  console.log(`✅ ${allNew.length} new CVEs queued for Writer Agent`);
  console.log(`📋 Total queue size: ${queue.filter(q => q.status === 'queued').length} pending`);
}

main().catch(console.error);
