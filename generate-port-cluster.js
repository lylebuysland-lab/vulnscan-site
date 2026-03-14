/**
 * generate-port-scanner-cluster.js
 * Builds 5 high-value port scanner keyword cluster pages
 * Port-scanner is already ranking #1 — this amplifies topical authority
 */
const fs = require('fs');
const path = require('path');

const ROOT = 'C:/Users/User/Documents/claude/scanforge';

const pages = [
    {
        slug: 'open-port-checker',
        title: 'Open Port Checker — Free Online Port Tester 2026',
        h1: 'Open Port Checker',
        metaDesc: 'Check if ports are open or closed on any website or server instantly. Free online open port checker — no download, no signup. Test TCP port status in seconds.',
        keywords: 'open port checker, port open checker, check open ports online, is port open',
        intro: 'An open port checker instantly tests whether a specific TCP port on a website or server is open (listening) or closed (filtered). Open ports are potential entry points for attackers — knowing which ports are exposed is step one of any security audit.',
        faq: [
            { q: 'How do I check if a port is open?', a: 'Enter the hostname or IP address and the port number into VulnScan\'s open port checker. The tool attempts a TCP connection and reports back "OPEN" (connected) or "CLOSED/FILTERED" within seconds.' },
            { q: 'Which ports should be open on a web server?', a: 'Port 80 (HTTP), 443 (HTTPS), and 22 (SSH, if needed) are typical. All other ports should be closed or firewalled. Open database ports (3306 MySQL, 5432 PostgreSQL, 27017 MongoDB) are major security risks.' },
            { q: 'Is it safe to have any open ports?', a: 'Open ports are necessary for services to function, but unnecessary open ports dramatically increase your attack surface. Each open port should have a specific business purpose, run up-to-date software, and be protected by a firewall.' },
        ],
        relatedPages: ['/port-scanner', '/online-vulnerability-scanner', '/security-header-checker'],
        relatedLabels: ['Port Scanner', 'Vulnerability Scanner', 'Security Headers'],
    },
    {
        slug: 'what-ports-are-open-on-my-computer',
        title: 'What Ports Are Open on My Computer? (Check in 60 Seconds)',
        h1: 'What Ports Are Open on My Computer?',
        metaDesc: 'Find out what ports are open on your computer or server in 60 seconds. Free open port scan — no software download needed. Check for unexpected open ports that hackers exploit.',
        keywords: 'what ports are open on my computer, check open ports on my computer, find open ports',
        intro: 'If you\'ve ever wondered "what ports are open on my computer?" — you\'re asking exactly the right security question. Open ports are network entry points. Every open port is a door, and you need to know which doors you\'ve left unlocked.',
        faq: [
            { q: 'How do I find all open ports on my computer?', a: 'For your own computer: on Windows, run "netstat -an" in Command Prompt. On Linux/Mac, run "ss -tuln". For external visibility (what hackers see), use VulnScan\'s free port scanner — it shows which ports are open from the internet\'s perspective.' },
            { q: 'What does port 443 open mean?', a: 'Port 443 HTTPS is open means your website is correctly serving encrypted traffic — this is expected and good. If you see port 443 open on a server that shouldn\'t have a web server, investigate further.' },
            { q: 'Is port 3389 dangerous if open?', a: 'Yes. Port 3389 is Windows Remote Desktop Protocol (RDP). If exposed to the internet, it is one of the most attacked ports. Brute force attacks against RDP are automated and continuous. Close it or restrict to specific IPs immediately.' },
        ],
        relatedPages: ['/port-scanner', '/open-port-checker', '/security-header-checker'],
        relatedLabels: ['Port Scanner', 'Open Port Checker', 'Security Headers'],
    },
    {
        slug: 'port-scan-online',
        title: 'Port Scan Online — Free Network Port Scanner | VulnScan',
        h1: 'Port Scan Online — Free Network Port Scanner',
        metaDesc: 'Run a free online port scan from any browser. No software install required. Scan common ports (80, 443, 22, 3306, etc.) and get instant results with security recommendations.',
        keywords: 'port scan online, online port scan, port scanner online free, network port scan online',
        intro: 'Running a port scan online is the fastest way to see what network services are exposed on a website or server — from an external attacker\'s perspective. VulnScan\'s online port scanner connects from our infrastructure to your target, testing common ports and flagging risky ones.',
        faq: [
            { q: 'What is an online port scan?', a: 'An online port scan tests which TCP/UDP ports on a server are open (accepting connections) from the public internet. Unlike local scans, an online port scan shows exactly what an outside attacker sees — giving you the most accurate security picture.' },
            { q: 'Which ports does the online scanner check?', a: 'VulnScan checks 20+ common ports including: 21 (FTP), 22 (SSH), 23 (Telnet), 25 (SMTP), 53 (DNS), 80 (HTTP), 110 (POP3), 143 (IMAP), 443 (HTTPS), 445 (SMB), 1433 (MSSQL), 3306 (MySQL), 3389 (RDP), 5432 (PostgreSQL), 6379 (Redis), 27017 (MongoDB).' },
            { q: 'Is it legal to port scan a website?', a: 'It is legal to port scan websites you own or have explicit authorization to test. Port scanning third-party websites without permission may violate the Computer Fraud and Abuse Act (CFAA). VulnScan is designed for security testing your own infrastructure.' },
        ],
        relatedPages: ['/port-scanner', '/open-port-checker', '/online-vulnerability-scanner'],
        relatedLabels: ['Port Scanner', 'Open Port Checker', 'Vulnerability Scanner'],
    },
    {
        slug: 'check-if-port-is-open',
        title: 'Check if Port Is Open — Free TCP Port Tester | VulnScan 2026',
        h1: 'Check If a Port Is Open',
        metaDesc: 'Check if any TCP port is open on a website or server instantly. Free online tool — no install needed. Get immediate results: port open, closed, or filtered.',
        keywords: 'check if port is open, how to check if a port is open, test if port is open',
        intro: 'Need to check if a port is open? Whether you\'re a developer debugging a firewall rule, a sysadmin verifying a service is running, or a security professional auditing your attack surface — VulnScan\'s port tester gives you an instant answer from any browser.',
        faq: [
            { q: 'Why would a port show as filtered instead of closed?', a: '"Filtered" means a firewall is blocking the scan probe — the port may or may not be open behind the firewall. "Closed" means the port is reachable but no service is listening. "Open" means a service is actively accepting connections.' },
            { q: 'How can I open a blocked port?', a: 'To open a port on a server: configure your firewall (iptables, ufw, AWS Security Groups, etc.) to allow inbound traffic on that port, and ensure the service is running and bound to that port. Consult your hosting provider\'s documentation for specific steps.' },
            { q: 'What is the difference between TCP and UDP ports?', a: 'TCP ports require a confirmed handshake — they are reliable and used for web (80/443), SSH (22), databases. UDP ports are connectionless — faster but unreliable, used for DNS (53), VoIP, gaming. Most web security scans focus on TCP ports.' },
        ],
        relatedPages: ['/port-scanner', '/open-port-checker', '/port-scan-online'],
        relatedLabels: ['Port Scanner', 'Open Port Checker', 'Port Scan Online'],
    },
];

function generatePage(page) {
    const navHtml = `<nav class="nav">
        <div class="nav-inner">
            <div class="logo">
                <div class="logo-icon">⚡</div>
                <a href="/" style="text-decoration:none;"><span class="logo-text">Vuln<span class="logo-accent">Scan</span></span></a>
            </div>
            <div class="nav-links">
                <a href="/blog">Blog</a>
                <a href="/cve-scanner">CVE Database</a>
                <a href="/#features">Features</a>
                <a href="/#pricing">Pricing</a>
                <a href="/about">About</a>
                <a href="/" class="nav-cta">Free Scan</a>
            </div>
        </div>
    </nav>`;

    const faqSchema = JSON.stringify({
        "@context": "https://schema.org",
        "@type": "FAQPage",
        "mainEntity": page.faq.map(f => ({
            "@type": "Question",
            "name": f.q,
            "acceptedAnswer": { "@type": "Answer", "text": f.a }
        }))
    });

    const breadcrumbSchema = JSON.stringify({
        "@context": "https://schema.org",
        "@type": "BreadcrumbList",
        "itemListElement": [
            { "@type": "ListItem", "position": 1, "name": "Home", "item": "https://vulnscan.tech" },
            { "@type": "ListItem", "position": 2, "name": page.h1, "item": `https://vulnscan.tech/${page.slug}` }
        ]
    });

    return `<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <meta name="google-site-verification" content="vcMnDYS6l_rY36emCOS1d0A5uQYKYc_deC">
    <title>${page.title}</title>
    <meta name="description" content="${page.metaDesc}">
    <meta name="keywords" content="${page.keywords}">
    <meta name="robots" content="index, follow, max-snippet:-1, max-image-preview:large, max-video-preview:-1">
    <meta http-equiv="Content-Security-Policy" content="default-src 'self'; script-src 'self' 'unsafe-inline' https://js.stripe.com; style-src 'self' 'unsafe-inline' https://fonts.googleapis.com; font-src https://fonts.gstatic.com; connect-src 'self' https://*.vulnscan.tech; img-src 'self' data:;">
    <link rel="canonical" href="https://vulnscan.tech/${page.slug}">
    <link rel="icon" type="image/svg+xml" href="data:image/svg+xml,<svg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 100 100'><text y='.9em' font-size='90'>⚡</text></svg>">
    <link rel="preconnect" href="https://fonts.googleapis.com">
    <link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
    <link href="https://fonts.googleapis.com/css2?family=Inter:wght@300;400;500;600;700;800;900&display=swap" rel="stylesheet">
    <link rel="stylesheet" href="style.css">
    <link rel="alternate" type="application/rss+xml" title="VulnScan Security Blog" href="https://vulnscan.tech/feed.xml">
    <script type="application/ld+json">${faqSchema}</script>
    <script type="application/ld+json">${breadcrumbSchema}</script>
</head>
<body>
    <div class="bg-grid"></div>
    <div class="bg-glow bg-glow-1"></div>
    <div class="bg-glow bg-glow-2"></div>
    ${navHtml}
    <main style="max-width:860px;margin:0 auto;padding:100px 32px 60px;position:relative;z-index:1;">
        <nav style="font-size:13px;color:var(--text-muted);margin-bottom:28px;">
            <a href="/" style="color:var(--text-muted);text-decoration:none;">Home</a> / <span style="color:var(--accent);">${page.h1}</span>
        </nav>
        <h1 style="font-size:clamp(28px,4vw,44px);font-weight:800;line-height:1.2;letter-spacing:-1px;margin-bottom:20px;">${page.h1}</h1>
        <p style="font-size:18px;color:var(--text-secondary);line-height:1.8;margin-bottom:40px;padding-bottom:32px;border-bottom:1px solid var(--border);">${page.intro}</p>
        
        <!-- CTA -->
        <div style="padding:24px;background:linear-gradient(135deg,rgba(99,102,241,0.12),rgba(168,85,247,0.12));border:1px solid rgba(99,102,241,0.25);border-radius:14px;display:flex;align-items:center;justify-content:space-between;flex-wrap:wrap;gap:16px;margin-bottom:48px;">
            <div>
                <div style="font-weight:700;font-size:17px;margin-bottom:4px;">🔍 Start Your Free Port Scan</div>
                <div style="font-size:14px;color:var(--text-secondary);">Scan any website — 60 seconds, no signup</div>
            </div>
            <a href="/port-scanner" style="background:var(--gradient);color:white;padding:12px 24px;border-radius:8px;text-decoration:none;font-weight:700;font-size:14px;white-space:nowrap;">Scan Ports Now →</a>
        </div>

        <!-- Related tools -->
        <h2 style="font-size:20px;font-weight:700;margin:0 0 16px;">Related Port Scanning Tools</h2>
        <div style="display:grid;grid-template-columns:repeat(auto-fit,minmax(200px,1fr));gap:12px;margin-bottom:48px;">
            ${page.relatedPages.map((p, i) => `<a href="${p}" style="display:block;padding:16px;background:var(--bg-card);border:1px solid var(--border);border-radius:12px;text-decoration:none;color:var(--text);font-weight:600;font-size:14px;transition:border-color 0.2s;" onmouseover="this.style.borderColor='var(--accent)'" onmouseout="this.style.borderColor='var(--border)'">${page.relatedLabels[i]}</a>`).join('')}
        </div>

        <!-- Common ports reference -->
        <h2 style="font-size:22px;font-weight:800;margin:0 0 16px;">Common Ports & Their Security Risk</h2>
        <div style="overflow-x:auto;margin-bottom:48px;">
            <table style="width:100%;border-collapse:collapse;font-size:14px;">
                <thead><tr style="border-bottom:2px solid var(--border);">
                    <th style="text-align:left;padding:12px 16px;color:var(--text-secondary);font-weight:600;">Port</th>
                    <th style="text-align:left;padding:12px 16px;color:var(--text-secondary);font-weight:600;">Service</th>
                    <th style="text-align:left;padding:12px 16px;color:var(--text-secondary);font-weight:600;">Risk Level</th>
                    <th style="text-align:left;padding:12px 16px;color:var(--text-secondary);font-weight:600;">Notes</th>
                </tr></thead>
                <tbody>
                    ${[
                        ['22', 'SSH', '⚠️ Medium', 'OK if needed, restrict to known IPs'],
                        ['23', 'Telnet', '🔴 Critical', 'Unencrypted — disable immediately'],
                        ['80', 'HTTP', '🟢 Low', 'Expected for web servers'],
                        ['443', 'HTTPS', '🟢 Low', 'Expected — ensure TLS is current'],
                        ['3306', 'MySQL', '🔴 Critical', 'Database — never expose to internet'],
                        ['3389', 'RDP', '🔴 Critical', 'Most attacked port on internet'],
                        ['5432', 'PostgreSQL', '🔴 Critical', 'Database — close or firewall'],
                        ['6379', 'Redis', '🔴 Critical', 'Often exposed without auth — check now'],
                        ['27017', 'MongoDB', '🔴 Critical', 'Leaked millions of records historically'],
                        ['8080', 'HTTP Alt', '⚠️ Medium', 'Dev servers often exposed accidentally'],
                    ].map(([port, svc, risk, note]) => `<tr style="border-bottom:1px solid var(--border);">
                        <td style="padding:12px 16px;font-family:monospace;font-weight:600;color:var(--accent);">${port}</td>
                        <td style="padding:12px 16px;font-weight:600;">${svc}</td>
                        <td style="padding:12px 16px;">${risk}</td>
                        <td style="padding:12px 16px;color:var(--text-secondary);">${note}</td>
                    </tr>`).join('')}
                </tbody>
            </table>
        </div>

        <!-- FAQ -->
        <h2 style="font-size:22px;font-weight:800;margin:0 0 20px;">Frequently Asked Questions</h2>
        <div style="display:flex;flex-direction:column;gap:12px;margin-bottom:48px;">
            ${page.faq.map(f => `<div style="background:var(--bg-card);border:1px solid var(--border);border-radius:12px;padding:20px;">
                <h3 style="font-size:15px;font-weight:700;margin-bottom:8px;">${f.q}</h3>
                <p style="color:var(--text-secondary);font-size:14px;line-height:1.7;margin:0;">${f.a}</p>
            </div>`).join('')}
        </div>

        <!-- Bottom CTA -->
        <div style="padding:32px;background:linear-gradient(135deg,rgba(99,102,241,0.1),rgba(168,85,247,0.1));border:1px solid rgba(99,102,241,0.2);border-radius:16px;text-align:center;">
            <h2 style="font-size:22px;font-weight:700;margin-bottom:8px;">Scan Your Ports Now — Free</h2>
            <p style="color:var(--text-secondary);margin-bottom:20px;">See exactly what attackers see. Results in 60 seconds.</p>
            <a href="/" class="cta-btn" style="text-decoration:none;display:inline-block;">Start Free Scan →</a>
        </div>
    </main>

    <footer class="footer">
        <div class="footer-inner">
            <div class="logo"><div class="logo-icon">⚡</div><span class="logo-text">Vuln<span class="logo-accent">Scan</span></span></div>
            <div class="footer-links">
                <a href="/port-scanner">Port Scanner</a><a href="/open-port-checker">Open Port Checker</a>
                <a href="/port-scan-online">Port Scan Online</a><a href="/online-vulnerability-scanner">Vulnerability Scanner</a>
                <a href="/blog">Blog</a><a href="/about">About</a>
            </div>
            <p class="footer-copy">© 2026 VulnScan. All rights reserved.</p>
        </div>
    </footer>
    <script src="app.js"></script>
</body>
</html>`;
}

// Generate all pages
let generated = [];
for (const page of pages) {
    const html = generatePage(page);
    const filePath = path.join(ROOT, page.slug + '.html');
    fs.writeFileSync(filePath, html, 'utf-8');
    generated.push(page.slug);
    console.log('Generated:', page.slug + '.html');
}

// Update sitemap
const sitemapPath = path.join(ROOT, 'sitemap.xml');
let sitemap = fs.readFileSync(sitemapPath, 'utf-8');
const today = new Date().toISOString().split('T')[0];
let added = 0;
for (const slug of generated) {
    const url = `https://vulnscan.tech/${slug}`;
    if (!sitemap.includes(url)) {
        sitemap = sitemap.replace('</urlset>', `  <url><loc>${url}</loc><lastmod>${today}</lastmod><changefreq>monthly</changefreq><priority>0.85</priority></url>\n</urlset>`);
        added++;
    }
}
fs.writeFileSync(sitemapPath, sitemap, 'utf-8');
console.log(`\nSitemap updated (+${added} URLs)`);
console.log('Done! Generated', generated.length, 'port scanner cluster pages.');
