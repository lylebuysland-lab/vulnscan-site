/**
 * content-publisher.js
 * Sovereign Agent: Weekly auto-publisher
 * Posts unique security articles to all platforms with free APIs
 * 
 * PLATFORMS (fully automated, zero karma required):
 * - Dev.to         (DA91, free API) ← already configured
 * - Hashnode       (DA82, free GraphQL API)
 * - Mastodon       (DA77+, infosec.exchange, free REST API)
 * - Telegram       (your own channel, Bot API, free)
 * 
 * SCHEDULE: Every Monday 10 AM UTC (via GitHub Actions cron)
 * Each post = unique Gemini-written article + canonical link to vulnscan.tech
 */

const https = require('https');
const fs = require('fs');

const SITE_URL = 'https://vulnscan.tech';
const GEMINI_KEY = process.env.GEMINI_API_KEY;
const DEVTO_KEY = process.env.DEVTO_API_KEY;
const HASHNODE_KEY = process.env.HASHNODE_API_KEY;
const MASTODON_TOKEN = process.env.MASTODON_TOKEN;         // mastodon.social
const MASTODON_INSTANCE = (process.env.MASTODON_INSTANCE || 'https://mastodon.social').replace(/\/$/, '');
const TELEGRAM_TOKEN = process.env.TELEGRAM_BOT_TOKEN;
const TELEGRAM_CHANNEL = process.env.TELEGRAM_CHANNEL_ID; // e.g. @vulnscan_alerts

const DATA_DIR = '.github/data';
const PUB_LOG = `${DATA_DIR}/publisher-log.json`;
const RANK_FILE = `${DATA_DIR}/ranking-data.json`;
if (!fs.existsSync(DATA_DIR)) fs.mkdirSync(DATA_DIR, { recursive: true });

let pubLog = { posts: [], total: 0 };
try { pubLog = JSON.parse(fs.readFileSync(PUB_LOG, 'utf-8')); } catch(e) {}

// ═══════════════════════════════════════════════
// CONTENT GENERATION
// ═══════════════════════════════════════════════

async function callGemini(prompt) {
  if (!GEMINI_KEY) return null;
  return new Promise((resolve) => {
    const body = JSON.stringify({
      contents: [{ parts: [{ text: prompt }] }],
      generationConfig: { temperature: 0.8, maxOutputTokens: 1200 }
    });
    const opts = {
      hostname: 'generativelanguage.googleapis.com',
      path: `/v1beta/models/gemini-1.5-flash:generateContent?key=${GEMINI_KEY}`,
      method: 'POST',
      headers: { 'Content-Type': 'application/json', 'Content-Length': Buffer.byteLength(body) }
    };
    const t = setTimeout(() => resolve(null), 20000);
    const req = https.request(opts, (r) => {
      let d = ''; r.on('data', c => d += c);
      r.on('end', () => {
        clearTimeout(t);
        try { resolve(JSON.parse(d).candidates?.[0]?.content?.parts?.[0]?.text || null); } catch(e) { resolve(null); }
      });
    });
    req.on('error', () => { clearTimeout(t); resolve(null); });
    req.write(body); req.end();
  });
}

async function getTopGSCKeywords() {
  // Read real ranking data written by rank-analyst.js
  try {
    const data = JSON.parse(fs.readFileSync(RANK_FILE, 'utf-8'));
    const keywords = data.topKeywords || data.keywords || [];
    if (keywords.length > 0) {
      // Sort by clicks desc, take top 10
      const top = keywords
        .sort((a, b) => (b.clicks || 0) - (a.clicks || 0))
        .slice(0, 10)
        .map(k => k.query || k.keyword || k);
      console.log(`  📊 Loaded ${top.length} top GSC keywords: ${top.slice(0,3).join(', ')}...`);
      return top;
    }
  } catch(e) {
    console.log('  ℹ️  No GSC ranking data yet — using curated security topics');
  }
  // Fallback: high-value security keywords from vulnscan.tech pages
  return [
    'website vulnerability scanner', 'free security scanner', 'sql injection scanner',
    'xss vulnerability scanner', 'wordpress security scanner', 'online vulnerability scanner',
    'web application security testing', 'cve scanner', 'owasp scanner', 'ssl checker'
  ];
}

async function generateWeeklyContent() {
  const gscKeywords = await getTopGSCKeywords();
  const week = Math.floor(Date.now() / (7 * 24 * 60 * 60 * 1000));

  // Fallback structured topics if not enough GSC data
  const topics = [
    { title: 'Top 5 Critical CVEs You Should Patch This Week', angle: 'recently added to CISA KEV catalog', cta: 'Check if your domain is exposed at VulnScan', url: SITE_URL },
    { title: 'Why Free Website Security Scanners Beat Paid Ones for External Testing', angle: 'attacker perspective vs internal scanners', cta: 'Try it free', url: `${SITE_URL}/free-website-security-check` },
    { title: 'How to Check if Your WordPress Site is Vulnerable (Free Method)', angle: 'step by step external scan', cta: 'WordPress vulnerability scanner', url: `${SITE_URL}/wordpress-security-scanner` },
    { title: 'Log4Shell Is Still Alive: Unpatched Systems in 2026', angle: 'current exploitation stats', cta: 'Check for Log4Shell', url: `${SITE_URL}/cve-2021-44228` },
    { title: 'regreSSHion (CVE-2024-6387): Is Your Server Still Vulnerable?', angle: 'race condition in OpenSSH, millions of systems', cta: 'Check your SSH exposure', url: `${SITE_URL}/cve-2024-6387` },
    { title: 'OWASP Top 10 2025: What Changed and How to Test For It', angle: 'practical scanning guide', cta: 'Test your site against OWASP Top 10', url: `${SITE_URL}/online-vulnerability-scanner` },
    { title: 'The Hidden Attack Surface: Subdomains You Forgot About', angle: 'subdomain takeover, forgotten assets', cta: 'Discover your attack surface', url: SITE_URL },
    { title: 'SQL Injection Still Works in 2026: Real Stats and How to Check', angle: 'Why SQLi persists and free testing method', cta: 'Free SQLi scanner', url: `${SITE_URL}/sql-injection-scanner` },
  ];

  const topic = topics[week % topics.length];
  const keywordContext = gscKeywords.slice(0, 6).join(', ');

  const prompt = `Write a practical, technical blog post titled "${topic.title}" for a security-savvy developer audience.

Focus on: ${topic.angle}.

IMPORTANT: Naturally incorporate these high-traffic SEO keywords where relevant (do NOT force them): ${keywordContext}

Structure:
1. Brief intro (2 sentences why this matters NOW)
2. Key technical details (3-4 paragraphs, factual, specific CVE numbers/stats)
3. Practical "how to detect/check" section  
4. One-line mention of ${topic.cta} at ${topic.url}

Write in markdown. Use ## for headers. Be specific and technical. Max 600 words.`;

  const body = await callGemini(prompt) || `# ${topic.title}\n\n${topic.cta}: [${topic.url}](${topic.url})`;
  return { body, ...topic, keywords: gscKeywords.slice(0, 5) };
}

// ═══════════════════════════════════════════════
// PLATFORM PUBLISHERS
// ═══════════════════════════════════════════════

async function publishDevTo(title, body, canonicalUrl, tags = ['security', 'cybersecurity', 'webdev', 'cve']) {
  if (!DEVTO_KEY) { console.log('⚠️  No DEVTO_API_KEY'); return false; }
  
  const article = JSON.stringify({
    article: {
      title, body_markdown: body, published: true, tags,
      canonical_url: canonicalUrl
    }
  });
  
  return new Promise((resolve) => {
    const opts = {
      hostname: 'dev.to',
      path: '/api/articles',
      method: 'POST',
      headers: {
        'api-key': DEVTO_KEY, 'Content-Type': 'application/json',
        'Content-Length': Buffer.byteLength(article)
      }
    };
    const req = https.request(opts, (r) => {
      let d = ''; r.on('data', c => d += c);
      r.on('end', () => {
        const ok = r.statusCode === 201;
        let url = '';
        try { url = JSON.parse(d).url || ''; } catch(e) {}
        console.log(`  ${ok ? '✅' : '❌'} Dev.to: ${r.statusCode} ${url}`);
        resolve(ok);
      });
    });
    req.on('error', (e) => { console.log(`  ❌ Dev.to error: ${e.message}`); resolve(false); });
    req.write(article); req.end();
  });
}

async function publishHashnode(title, body, canonicalUrl) {
  if (!HASHNODE_KEY) { console.log('⚠️  No HASHNODE_API_KEY'); return false; }
  
  // Hashnode requires a publication ID — stored in env or data file
  const pubId = process.env.HASHNODE_PUBLICATION_ID;
  if (!pubId) { console.log('⚠️  No HASHNODE_PUBLICATION_ID'); return false; }
  
  const query = JSON.stringify({
    query: `mutation PublishPost($input: PublishPostInput!) {
      publishPost(input: $input) { post { url } }
    }`,
    variables: {
      input: {
        title, contentMarkdown: body, publicationId: pubId,
        originalArticleURL: canonicalUrl,
        tags: [
          { name: 'Security', slug: 'security' },
          { name: 'Cybersecurity', slug: 'cybersecurity' }
        ]
      }
    }
  });
  
  return new Promise((resolve) => {
    const opts = {
      hostname: 'gql.hashnode.com',
      path: '/',
      method: 'POST',
      headers: {
        'Authorization': HASHNODE_KEY, 'Content-Type': 'application/json',
        'Content-Length': Buffer.byteLength(query)
      }
    };
    const req = https.request(opts, (r) => {
      let d = ''; r.on('data', c => d += c);
      r.on('end', () => {
        const ok = r.statusCode === 200;
        let url = '';
        try { url = JSON.parse(d).data?.publishPost?.post?.url || ''; } catch(e) {}
        console.log(`  ${ok ? '✅' : '❌'} Hashnode: ${r.statusCode} ${url}`);
        resolve(ok);
      });
    });
    req.on('error', (e) => { console.log(`  ❌ Hashnode error: ${e.message}`); resolve(false); });
    req.write(query); req.end();
  });
}

async function postMastodon(text) {
  if (!MASTODON_TOKEN) { console.log('⚠️  No MASTODON_TOKEN'); return false; }
  
  const instance = new URL(MASTODON_INSTANCE);
  const postBody = JSON.stringify({ status: text, visibility: 'public' });

  return new Promise((resolve) => {
    const opts = {
      hostname: instance.hostname,
      path: '/api/v1/statuses',
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${MASTODON_TOKEN}`,
        'Content-Type': 'application/json',
        'Content-Length': Buffer.byteLength(postBody)
      }
    };
    const req = https.request(opts, (r) => {
      let d = ''; r.on('data', c => d += c);
      r.on('end', () => {
        const ok = r.statusCode === 200;
        let url = '';
        try { url = JSON.parse(d).url || ''; } catch(e) {}
        console.log(`  ${ok ? '✅' : '❌'} Mastodon ${instance.hostname}: ${r.statusCode} ${url}`);
        resolve(ok);
      });
    });
    req.on('error', (e) => { console.log(`  ❌ Mastodon error: ${e.message}`); resolve(false); });
    req.write(postBody); req.end();
  });
}

async function postTelegram(text) {
  if (!TELEGRAM_TOKEN || !TELEGRAM_CHANNEL) { console.log('⚠️  No TELEGRAM config'); return false; }
  
  const body = JSON.stringify({ chat_id: TELEGRAM_CHANNEL, text, parse_mode: 'HTML', disable_web_page_preview: false });
  
  return new Promise((resolve) => {
    const opts = {
      hostname: 'api.telegram.org',
      path: `/bot${TELEGRAM_TOKEN}/sendMessage`,
      method: 'POST',
      headers: { 'Content-Type': 'application/json', 'Content-Length': Buffer.byteLength(body) }
    };
    const req = https.request(opts, (r) => {
      console.log(`  ${r.statusCode === 200 ? '✅' : '❌'} Telegram: ${r.statusCode}`);
      resolve(r.statusCode === 200);
    });
    req.on('error', (e) => { console.log(`  ❌ Telegram error: ${e.message}`); resolve(false); });
    req.write(body); req.end();
  });
}

// ═══════════════════════════════════════════════
// MAIN
// ═══════════════════════════════════════════════

async function main() {
  console.log(`\n📣 Content Publisher — ${new Date().toISOString()}\n`);
  
  const today = new Date().toISOString().split('T')[0];
  
  // Check if already posted this week
  const thisWeek = pubLog.posts?.find(p => {
    const d = new Date(p.date);
    const now = new Date();
    return Math.abs(now - d) < 7 * 24 * 60 * 60 * 1000;
  });
  
  if (thisWeek) {
    console.log(`✅ Already published this week (${thisWeek.date}) — skipping`);
    return;
  }
  
  console.log('🤖 Generating weekly article with Gemini...');
  const content = await generateWeeklyContent();
  const { title, body, url: canonicalUrl } = content;
  
  if (!body) { console.log('❌ Gemini generation failed'); return; }
  console.log(`  📝 Title: ${title}`);
  
  // Short Mastodon/Telegram version — use top GSC keywords as hashtags
  const kwHashtags = (content.keywords || []).slice(0,3)
    .map(k => '#' + k.replace(/\s+/g,'').replace(/[^a-zA-Z0-9]/g,''))
    .join(' ');
  const shortPost = `🔐 New on VulnScan Security Blog:\n\n"${title}"\n\nFree external CVE scanner — no signup: ${SITE_URL}\n\n${kwHashtags} #security #cybersecurity #infosec`;
  
  // Publish to all platforms simultaneously
  console.log('\n🚀 Publishing to all platforms...');
  const [devToOk, hashnodeOk, mastodonOk, telegramOk] = await Promise.all([
    publishDevTo(title, body, canonicalUrl),
    publishHashnode(title, body, canonicalUrl),
    postMastodon(shortPost),
    postTelegram(shortPost),
  ]);
  
  // Log results
  pubLog.posts = pubLog.posts || [];
  pubLog.posts.push({ date: today, title, platforms: { devto: devToOk, hashnode: hashnodeOk, mastodon: mastodonOk, telegram: telegramOk } });
  pubLog.posts = pubLog.posts.slice(-52); // keep 1 year
  pubLog.total = (pubLog.total || 0) + [devToOk, hashnodeOk, mastodonOk, telegramOk].filter(Boolean).length;
  fs.writeFileSync(PUB_LOG, JSON.stringify(pubLog, null, 2));
  
  const successCount = [devToOk, hashnodeOk, mastodonOk, telegramOk].filter(Boolean).length;
  console.log(`\n✅ Published to ${successCount}/4 platforms`);
  console.log(`📊 All-time posts: ${pubLog.total} articles published`);
}

main().catch(console.error);
