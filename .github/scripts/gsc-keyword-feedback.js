/**
 * gsc-keyword-feedback.js
 * Runs weekly in GitHub Actions:
 * 1. Reads keyword ranking data from Google Search Console API
 * 2. Identifies "striking distance" keywords (pos 4-30, >5 impressions) — easy wins
 * 3. Identifies top-performing topics to double down on
 * 4. Auto-generates targeted content pages for the best opportunities
 * 5. Commits + pushes → instant new content targeting YOUR best keywords
 * 
 * Requires: GSC_SERVICE_ACCOUNT secret (JSON key from Google Cloud)
 * Also requires: service account email added as user in Search Console
 */

const https = require('https');
const crypto = require('crypto');
const fs = require('fs');
const path = require('path');

const ROOT = process.cwd();
const TODAY = new Date().toISOString().split('T')[0];
const SITE_URL = 'https://vulnscan.tech/';

// --- Parse service account from env ---
const SA = process.env.GSC_SERVICE_ACCOUNT ? JSON.parse(process.env.GSC_SERVICE_ACCOUNT) : null;
if (!SA) { console.log('GSC_SERVICE_ACCOUNT not set — skipping keyword analysis'); process.exit(0); }

// --- Create JWT for Google OAuth2 ---
function base64url(buf) {
    return buf.toString('base64').replace(/=/g, '').replace(/\+/g, '-').replace(/\//g, '_');
}

function createJWT() {
    const now = Math.floor(Date.now() / 1000);
    const header = base64url(Buffer.from(JSON.stringify({ alg: 'RS256', typ: 'JWT' })));
    const payload = base64url(Buffer.from(JSON.stringify({
        iss: SA.client_email,
        scope: 'https://www.googleapis.com/auth/webmasters.readonly',
        aud: 'https://oauth2.googleapis.com/token',
        exp: now + 3600,
        iat: now
    })));
    const sign = crypto.createSign('RSA-SHA256');
    sign.update(header + '.' + payload);
    const sig = base64url(sign.sign(SA.private_key));
    return header + '.' + payload + '.' + sig;
}

// --- Get OAuth2 access token ---
function getAccessToken() {
    return new Promise((resolve, reject) => {
        const jwt = createJWT();
        const body = `grant_type=urn%3Aietf%3Aparams%3Aoauth%3Agrant-type%3Ajwt-bearer&assertion=${jwt}`;
        const req = https.request({
            hostname: 'oauth2.googleapis.com', path: '/token', method: 'POST',
            headers: { 'Content-Type': 'application/x-www-form-urlencoded', 'Content-Length': Buffer.byteLength(body) }
        }, r => { let d = ''; r.on('data', c => d += c); r.on('end', () => { try { resolve(JSON.parse(d).access_token); } catch(e) { reject(d); } }); });
        req.on('error', reject);
        req.write(body); req.end();
    });
}

// --- Query GSC Search Analytics ---
function queryGSC(token, queryBody) {
    return new Promise((resolve) => {
        const encodedSite = encodeURIComponent(SITE_URL);
        const body = JSON.stringify(queryBody);
        const req = https.request({
            hostname: 'www.googleapis.com',
            path: `/webmasters/v3/sites/${encodedSite}/searchAnalytics/query`,
            method: 'POST',
            headers: { Authorization: 'Bearer ' + token, 'Content-Type': 'application/json', 'Content-Length': Buffer.byteLength(body) }
        }, r => { let d = ''; r.on('data', c => d += c); r.on('end', () => { try { resolve(JSON.parse(d)); } catch(e) { resolve({}); } }); });
        req.on('error', e => { console.log('GSC API error:', e.message); resolve({}); });
        req.write(body); req.end();
    });
}

// --- Generate a keyword-targeted landing page ---
function generateKeywordPage(keyword, position, impressions, clicks) {
    const slug = keyword.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '');
    const title = `${keyword.charAt(0).toUpperCase() + keyword.slice(1)} — Free Online Tool 2026 | VulnScan`;
    const desc = `${keyword} — free, instant, no signup. VulnScan detects security vulnerabilities in 60 seconds. Used by developers and security teams.`;
    
    return {
        slug,
        html: `<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <meta name="google-site-verification" content="vcMnDYS6l_rY36emCOS1d0A5uQYKYc_deC">
    <title>${title}</title>
    <meta name="description" content="${desc}">
    <meta name="robots" content="index, follow, max-snippet:-1, max-image-preview:large">
    <link rel="canonical" href="https://vulnscan.tech/${slug}">
    <link rel="icon" type="image/svg+xml" href="data:image/svg+xml,<svg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 100 100'><text y='.9em' font-size='90'>⚡</text></svg>">
    <link rel="preconnect" href="https://fonts.googleapis.com">
    <link href="https://fonts.googleapis.com/css2?family=Inter:wght@400;600;700;800&display=swap" rel="stylesheet">
    <link rel="stylesheet" href="style.css">
    <script type="application/ld+json">${JSON.stringify({
        "@context":"https://schema.org","@type":"WebPage",
        "name": title, "description": desc,
        "url": `https://vulnscan.tech/${slug}`,
        "provider": {"@type":"Organization","name":"VulnScan","url":"https://vulnscan.tech"}
    })}</script>
</head>
<body>
    <div class="bg-grid"></div><div class="bg-glow bg-glow-1"></div><div class="bg-glow bg-glow-2"></div>
    <nav class="nav">
        <div class="nav-inner">
            <div class="logo"><div class="logo-icon">⚡</div><a href="/" style="text-decoration:none;"><span class="logo-text">Vuln<span class="logo-accent">Scan</span></span></a></div>
            <div class="nav-links">
                <a href="/blog">Blog</a><a href="/cve-scanner">CVE Database</a>
                <a href="/#features">Features</a><a href="/#pricing">Pricing</a>
                <a href="/about">About</a><a href="/" class="nav-cta">Free Scan</a>
            </div>
        </div>
    </nav>
    <main style="max-width:800px;margin:0 auto;padding:100px 32px 60px;position:relative;z-index:1;">
        <h1 style="font-size:clamp(28px,4vw,44px);font-weight:800;line-height:1.2;letter-spacing:-1px;margin-bottom:20px;">${keyword.charAt(0).toUpperCase() + keyword.slice(1)}</h1>
        <p style="font-size:18px;color:var(--text-secondary);line-height:1.8;margin-bottom:40px;">VulnScan provides free online security scanning for ${keyword} and 200+ other vulnerability types. No signup, no software to install — results in 60 seconds.</p>
        <div style="padding:32px;background:linear-gradient(135deg,rgba(99,102,241,0.12),rgba(168,85,247,0.12));border:1px solid rgba(99,102,241,0.25);border-radius:16px;text-align:center;margin-bottom:40px;">
            <h2 style="font-size:22px;font-weight:700;margin-bottom:8px;">Start Free Scan</h2>
            <p style="color:var(--text-secondary);margin-bottom:20px;">Free scan • 60 seconds • No signup</p>
            <a href="/" class="cta-btn" style="text-decoration:none;display:inline-block;">Scan My Website →</a>
        </div>
        <p style="color:var(--text-secondary);font-size:14px;text-align:center;">Also see: <a href="/online-vulnerability-scanner" style="color:var(--accent);">Vulnerability Scanner</a> · <a href="/port-scanner" style="color:var(--accent);">Port Scanner</a> · <a href="/cve-scanner" style="color:var(--accent);">CVE Database</a></p>
    </main>
    <footer class="footer"><div class="footer-inner"><div class="logo"><div class="logo-icon">⚡</div><span class="logo-text">Vuln<span class="logo-accent">Scan</span></span></div><p class="footer-copy">© 2026 VulnScan.</p></div></footer>
    <script src="app.js"></script>
</body></html>`
    };
}

// --- Main pipeline ---
async function main() {
    console.log(`\n🔍 GSC Keyword Feedback Pipeline — ${TODAY}\n`);

    const token = await getAccessToken();
    console.log('✅ GSC authenticated');

    // Fetch last 28 days of keyword data
    const result = await queryGSC(token, {
        startDate: new Date(Date.now() - 28 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
        endDate: TODAY,
        dimensions: ['query'],
        rowLimit: 500,
        startRow: 0
    });

    if (!result.rows) { console.log('No keyword data yet — site may be too new.'); return; }

    const keywords = result.rows;
    console.log(`📊 Found ${keywords.length} keywords in Search Console`);

    // Categorize keywords
    const striking = keywords.filter(k => k.position >= 4 && k.position <= 30 && k.impressions >= 3);
    const winning = keywords.filter(k => k.position < 4);
    const newOpp = keywords.filter(k => k.position > 30 && k.impressions >= 10);

    console.log(`\n🎯 Striking distance (pos 4-30): ${striking.length} keywords`);
    console.log(`🏆 Already winning (pos 1-3): ${winning.length} keywords`);
    console.log(`🌱 New opportunities (pos 30+, high impressions): ${newOpp.length} keywords`);

    // Print top opportunities
    console.log('\n📈 TOP STRIKING DISTANCE KEYWORDS (double down on these):');
    striking.sort((a, b) => b.impressions - a.impressions).slice(0, 10).forEach(k => {
        console.log(`  pos ${k.position.toFixed(1)} | ${k.impressions} impressions | ${k.clicks} clicks | "${k.keys[0]}"`);
    });

    console.log('\n🏆 ALREADY WINNING (protect these):');
    winning.sort((a, b) => a.position - b.position).slice(0, 5).forEach(k => {
        console.log(`  pos ${k.position.toFixed(1)} | ${k.impressions} impressions | "${k.keys[0]}"`);
    });

    // Generate pages for top 5 striking distance keywords that don't have pages yet
    let generated = 0;
    for (const kw of striking.slice(0, 5)) {
        const keyword = kw.keys[0];
        const { slug, html } = generateKeywordPage(keyword, kw.position, kw.impressions, kw.clicks);
        const filePath = path.join(ROOT, slug + '.html');
        if (!fs.existsSync(filePath)) {
            fs.writeFileSync(filePath, html, 'utf-8');
            console.log(`\n✅ Generated page for striking keyword: "${keyword}" (pos ${kw.position.toFixed(1)})`);
            generated++;
        }
    }

    // Save keyword report
    const report = {
        date: TODAY,
        summary: { total: keywords.length, striking: striking.length, winning: winning.length },
        topStriking: striking.slice(0, 20).map(k => ({ keyword: k.keys[0], position: k.position, impressions: k.impressions, clicks: k.clicks })),
        topWinning: winning.slice(0, 10).map(k => ({ keyword: k.keys[0], position: k.position, impressions: k.impressions }))
    };
    fs.writeFileSync(path.join(ROOT, '.github', 'keyword-report.json'), JSON.stringify(report, null, 2));
    console.log(`\n📄 Keyword report saved → .github/keyword-report.json`);
    console.log(`🎯 New pages generated: ${generated}`);
}

main().catch(e => { console.error('GSC pipeline error:', e.message || e); process.exit(0); }); // exit 0 so pipeline doesn't fail
