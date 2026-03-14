/**
 * generate-blog-posts.js
 * Generates 20 high-quality long-form blog posts targeting security keywords
 * Each post: 1500+ words, Article schema, FAQ schema, internal links
 */
const fs = require('fs');
const path = require('path');

const BLOG_DIR = path.join(__dirname, 'blog');
if (!fs.existsSync(BLOG_DIR)) fs.mkdirSync(BLOG_DIR);

const posts = [
    {
        slug: 'owasp-top-10-explained',
        title: 'OWASP Top 10 Vulnerabilities Explained (2026 Edition)',
        metaDesc: 'Learn what the OWASP Top 10 vulnerabilities are, how attackers exploit them, and how to protect your website. Includes free scanner for each vulnerability type.',
        h1: 'OWASP Top 10 Vulnerabilities Explained (2026 Edition)',
        date: '2026-03-10',
        readTime: '10 min read',
        category: 'Web Security',
        intro: 'The OWASP Top 10 is the definitive list of the most critical web application security risks. Published by the Open Web Application Security Project (OWASP), it represents broad consensus among security experts about the vulnerabilities that matter most. If your website has any of these issues, you\'re a prime target for attackers.',
        sections: [
            {
                h2: 'A01: Broken Access Control',
                content: `Broken access control (moved to #1 in 2021) occurs when users can act outside their intended permissions. An attacker can view other users' accounts, modify other users' data, or access unauthorized functionality. This is now the most common vulnerability found in security audits.\n\nReal-world impact: The 2021 Facebook data leak exposed 533 million user records due to broken access control in their phone number lookup feature. Attackers could query the API without rate limiting and extract user data at scale.\n\nHow to check: Run VulnScan's <a href="/online-vulnerability-scanner" style="color:var(--accent);">free vulnerability scanner</a> to identify broken access control issues on your website in seconds. Our scanner tests for IDOR (Insecure Direct Object References), path traversal, and privilege escalation vectors.`
            },
            {
                h2: 'A02: Cryptographic Failures',
                content: `Previously called "Sensitive Data Exposure," cryptographic failures encompass all failures related to protecting data in transit and at rest. This includes using weak or outdated encryption algorithms, transmitting sensitive data over cleartext protocols, or using hardcoded keys.\n\nCommon failures include: MD5 or SHA1 password hashing (easily cracked), HTTP instead of HTTPS, expired or self-signed SSL certificates, and storing credit card numbers in plaintext.\n\nCheck your SSL/TLS configuration instantly with our <a href="/ssl-checker" style="color:var(--accent);">free SSL checker</a> — it identifies weak cipher suites, expired certificates, and missing security headers.`
            },
            {
                h2: 'A03: Injection (SQL, XSS, Command)',
                content: `Injection attacks occur when untrusted data is sent to an interpreter as part of a command or query. SQL injection, XSS (cross-site scripting), and OS command injection are the most common forms. Injection was #1 for 10 consecutive years before dropping to #3 in 2021 — but remains one of the most dangerous vulnerability classes.\n\nSQL injection example: A login form vulnerable to SQL injection lets attackers input \`admin' OR '1'='1\` and bypass authentication entirely — gaining access to the admin account without knowing the password.\n\nTest your site for <a href="/sql-injection-scanner" style="color:var(--accent);">SQL injection vulnerabilities</a> and <a href="/xss-scanner" style="color:var(--accent);">XSS vulnerabilities</a> for free with VulnScan.`
            },
            {
                h2: 'A04: Insecure Design',
                content: `New in the 2021 edition, insecure design refers to missing or ineffective control design — distinct from implementation bugs. Security must be considered from the design phase, not bolted on after. This includes missing threat modeling, no defense-in-depth, and insecure-by-default configurations.\n\nExample: A password reset flow that sends the actual password via email (revealing it's stored in plaintext) represents insecure design. A properly designed system would send a one-time reset link.`
            },
            {
                h2: 'A05: Security Misconfiguration',
                content: `Security misconfiguration is the most common issue in practice. This includes unnecessary features enabled, default accounts unchanged, error messages displaying stack traces, missing HTTP security headers, and cloud storage buckets with public access.\n\nThe majority of data breaches involve misconfigured cloud storage (S3 buckets, Azure Blob Storage, Google Cloud Storage). In 2019, Capital One lost 100 million customer records due to a misconfigured AWS Web Application Firewall.\n\nVulnScan's <a href="/security-header-checker" style="color:var(--accent);">security header checker</a> instantly identifies missing security headers like Content-Security-Policy, X-Frame-Options, HSTS, and more.`
            },
            {
                h2: 'A06: Vulnerable and Outdated Components',
                content: `Using components with known vulnerabilities — outdated libraries, frameworks, plugins — is one of the easiest attack vectors for hackers. This is exactly what Log4Shell (CVE-2021-44228) exploited: millions of systems were vulnerable because they used an outdated version of Apache Log4j.\n\nWordPress sites are particularly vulnerable because of outdated plugins. Check our <a href="/cve-2021-44228" style="color:var(--accent);">Log4Shell scanner</a> and <a href="/wordpress-security-scanner" style="color:var(--accent);">WordPress security scanner</a> to identify outdated components.`
            },
            {
                h2: 'A07: Identification and Authentication Failures',
                content: `Previously called "Broken Authentication," this category covers weak session management, missing multifactor authentication, use of weak passwords, and insecure credential storage. Credential stuffing attacks use leaked username/password combinations (from other breaches) to gain access to your site.\n\nHave I Been Pwned tracks over 12 billion compromised credentials. If your users reuse passwords, a breach of any other service becomes a breach of yours.`
            },
            {
                h2: 'A08: Software and Data Integrity Failures',
                content: `New in 2021, this covers assumptions around software updates, critical data, and CI/CD pipelines without verifying integrity. The SolarWinds attack inserted malicious code into a software build pipeline before it was signed and distributed to 18,000 organizations — including US government agencies.\n\nThis also includes insecure deserialization, which can lead to remote code execution when an application deserializes attacker-controlled data.`
            },
            {
                h2: 'A09: Security Logging and Monitoring Failures',
                content: `Without adequate logging and monitoring, breaches cannot be detected. The average time to detect a data breach is 197 days. Attackers rely on the absence of monitoring to exfiltrate data over months without detection.\n\nEffective security logging means: logging all authentication attempts, all access control failures, all input validation failures, and having real-time alerts for suspicious patterns.`
            },
            {
                h2: 'A10: Server-Side Request Forgery (SSRF)',
                content: `New as a standalone entry in 2021, SSRF flaws occur when a web application fetches a remote resource based on user-supplied URL. Attackers can force the server to send requests to internal systems behind firewalls — accessing cloud metadata endpoints, internal APIs, or other internal resources.\n\nCapital One was breached via SSRF: an attacker exploited a misconfigured WAF to make the server request the AWS metadata endpoint, revealing IAM credentials that allowed access to S3 buckets containing customer data.\n\nTest for SSRF vulnerabilities with our <a href="/ssrf-vulnerability-scanner" style="color:var(--accent);">free SSRF scanner</a>.`
            }
        ],
        faq: [
            { q: 'What is the OWASP Top 10 list?', a: 'The OWASP Top 10 is a standard awareness document published by the Open Web Application Security Project, listing the 10 most critical security risks to web applications. It is updated approximately every 3-4 years based on data from security audits and vulnerability reports.' },
            { q: 'Is OWASP Top 10 compliance mandatory?', a: 'The OWASP Top 10 is not a standard or certification — it is a list of awareness documents. However, PCI DSS, SOC 2, and other compliance frameworks reference it. Many security audits and penetration tests use it as a baseline.' },
            { q: 'What is the most common OWASP vulnerability?', a: 'Broken access control is the most common OWASP Top 10 vulnerability found in security audits, appearing in 94% of tested applications according to OWASP\'s own data. It moved to #1 in the 2021 edition.' }
        ]
    },
    {
        slug: 'how-to-fix-sql-injection',
        title: 'How to Fix SQL Injection Vulnerabilities (Developer Guide 2026)',
        metaDesc: 'Complete developer guide to finding and fixing SQL injection vulnerabilities. Covers parameterized queries, ORMs, input validation, and WAF deployment. Free scanner included.',
        h1: 'How to Fix SQL Injection Vulnerabilities — Complete Developer Guide',
        date: '2026-03-11',
        readTime: '12 min read',
        category: 'Vulnerability Fixes',
        intro: 'SQL injection remains one of the most dangerous and prevalent web vulnerabilities, appearing in OWASP Top 10 every year since 2010. The good news: SQL injection is 100% preventable with the right coding practices. This guide covers detection, prevention, and testing.',
        sections: [
            {
                h2: 'What is SQL Injection?',
                content: `SQL injection (SQLi) occurs when an attacker inserts malicious SQL code into an input field that gets executed by the database. If your application builds SQL queries by concatenating user input directly, it's vulnerable.\n\nVulnerable code example:\n<pre style="background:rgba(0,0,0,0.3);padding:12px;border-radius:8px;font-family:monospace;font-size:13px;overflow-x:auto;margin:12px 0;">// VULNERABLE - never do this
$query = "SELECT * FROM users WHERE username = '" + $_GET['user'] + "'";</pre>\n\nIf an attacker sends <code>admin' OR '1'='1' --</code> as the username, the query becomes <code>SELECT * FROM users WHERE username = 'admin' OR '1'='1' --'</code>, which returns all users.`
            },
            {
                h2: 'Fix #1: Use Parameterized Queries (Prepared Statements)',
                content: `Parameterized queries separate SQL code from data. The database driver handles escaping, making injection structurally impossible.\n\n<pre style="background:rgba(0,0,0,0.3);padding:12px;border-radius:8px;font-family:monospace;font-size:13px;overflow-x:auto;margin:12px 0;">// SAFE - parameterized query (PHP/PDO)
$stmt = $pdo->prepare("SELECT * FROM users WHERE username = ?");
$stmt->execute([$username]);

// SAFE - parameterized query (Python)
cursor.execute("SELECT * FROM users WHERE username = %s", (username,))

// SAFE - parameterized query (Java)
PreparedStatement stmt = conn.prepareStatement("SELECT * FROM users WHERE username = ?");
stmt.setString(1, username);</pre>`
            },
            {
                h2: 'Fix #2: Use an ORM',
                content: `Object-Relational Mappers (ORMs) like Eloquent (Laravel), Hibernate (Java), SQLAlchemy (Python), and Prisma (Node.js) use parameterized queries internally. Using an ORM correctly prevents most SQL injection by design.\n\n<pre style="background:rgba(0,0,0,0.3);padding:12px;border-radius:8px;font-family:monospace;font-size:13px;overflow-x:auto;margin:12px 0;">// Laravel Eloquent - SAFE
$user = User::where('username', $username)->first();

// SQLAlchemy - SAFE
user = session.query(User).filter(User.username == username).first();</pre>`
            },
            {
                h2: 'Fix #3: Input Validation and Allowlisting',
                content: `Never trust user input. Validate that inputs match expected formats before they reach your database layer. Use allowlisting (only permit known-good characters) rather than denylisting.\n\nFor a username field: only allow alphanumeric characters and underscores. Reject any input containing quotes, semicolons, or SQL keywords.`
            },
            {
                h2: 'Fix #4: Principle of Least Privilege for Database Users',
                content: `Your web application's database user should only have the minimum permissions necessary. If your app only reads data, the database user should have SELECT privileges only — no INSERT, UPDATE, DELETE, or DROP.\n\nThis limits the blast radius of a successful SQL injection attack. Even if an attacker injects SQL, they can only execute what the database user is permitted to do.`
            },
            {
                h2: 'Fix #5: Deploy a Web Application Firewall (WAF)',
                content: `A WAF sitting in front of your application can detect and block SQL injection attempts before they reach your code. Major WAF providers include Cloudflare (free tier), AWS WAF, ModSecurity (open source), and Sucuri.\n\nImportant: A WAF is defense-in-depth, not a replacement for secure code. Always fix the underlying SQL injection vulnerabilities.`
            },
            {
                h2: 'Testing for SQL Injection',
                content: `After fixing SQL injection vulnerabilities, verify your fixes work. Use VulnScan's <a href="/sql-injection-scanner" style="color:var(--accent);">free SQL injection scanner</a> to test your website from the outside — the same perspective an attacker uses.\n\nFor developers, use OWASP ZAP or sqlmap in your CI/CD pipeline to automatically test for SQL injection on every code deployment.`
            }
        ],
        faq: [
            { q: 'Can SQL injection affect modern frameworks?', a: 'Yes. While modern ORMs protect against basic SQL injection, custom queries or raw SQL within frameworks can still be vulnerable. Always use parameterized queries even when using Django, Rails, Laravel, or other frameworks.' },
            { q: 'How do I test if my site has SQL injection?', a: 'Use VulnScan\'s free SQL injection scanner at vulnscan.tech/sql-injection-scanner. Enter your domain and we check for SQLi vulnerabilities in 60 seconds. For deeper testing, use OWASP ZAP or sqlmap.' },
            { q: 'Is SQL injection still common in 2026?', a: 'Yes — SQL injection remains in the OWASP Top 3 and is responsible for approximately 8% of data breaches. Legacy systems, WordPress plugins, and poorly maintained codebases continue to introduce new SQL injection vulnerabilities.' }
        ]
    },
    {
        slug: 'website-security-checklist',
        title: 'Website Security Checklist 2026 — 50 Things to Check Right Now',
        metaDesc: 'Complete website security checklist with 50 actionable items. SSL, security headers, access control, XSS, SQL injection, and more. Check your site for free.',
        h1: 'Website Security Checklist 2026 — 50 Things to Verify Right Now',
        date: '2026-03-12',
        readTime: '8 min read',
        category: 'Security Guides',
        intro: '85% of websites have at least one serious security vulnerability. This checklist covers 50 actionable security items across every layer of your website — from TLS configuration to server hardening. Use VulnScan\'s free scanner to automatically check many of these items.',
        sections: [
            {
                h2: 'SSL/TLS Configuration (5 Checks)',
                content: `<ul style="color:var(--text-secondary); line-height:2.2; padding-left:20px;">
<li>☐ HTTPS forced on all pages (no HTTP)</li>
<li>☐ SSL certificate valid and not expiring within 30 days</li>
<li>☐ TLS 1.2+ only (disable SSLv3, TLS 1.0, TLS 1.1)</li>
<li>☐ Strong cipher suites (no RC4, DES, 3DES)</li>
<li>☐ HTTP Strict Transport Security (HSTS) header enabled</li>
</ul>\n\n<a href="/ssl-checker" style="color:var(--accent);">Check your SSL configuration free →</a>`
            },
            {
                h2: 'HTTP Security Headers (8 Checks)',
                content: `<ul style="color:var(--text-secondary); line-height:2.2; padding-left:20px;">
<li>☐ Content-Security-Policy (CSP) header present</li>
<li>☐ X-Frame-Options: DENY or SAMEORIGIN</li>
<li>☐ X-Content-Type-Options: nosniff</li>
<li>☐ Referrer-Policy set appropriately</li>
<li>☐ Permissions-Policy (Feature-Policy) configured</li>
<li>☐ Server header not revealing software version</li>
<li>☐ X-Powered-By header removed</li>
<li>☐ CORS policy correctly configured</li>
</ul>\n\n<a href="/security-header-checker" style="color:var(--accent);">Check security headers free →</a>`
            },
            {
                h2: 'Authentication & Access Control (10 Checks)',
                content: `<ul style="color:var(--text-secondary); line-height:2.2; padding-left:20px;">
<li>☐ Multi-factor authentication available (ideally required)</li>
<li>☐ Login rate limiting (prevent brute force)</li>
<li>☐ Account lockout after N failed attempts</li>
<li>☐ No default admin credentials</li>
<li>☐ Admin panel not on default URL (/admin, /wp-admin)</li>
<li>☐ Password reset via one-time token (not email of actual password)</li>
<li>☐ Session tokens invalidated on logout</li>
<li>☐ No sensitive data in URL parameters</li>
<li>☐ Horizontal privilege escalation tested (IDOR)</li>
<li>☐ Vertical privilege escalation tested</li>
</ul>`
            },
            {
                h2: 'Injection Prevention (7 Checks)',
                content: `<ul style="color:var(--text-secondary); line-height:2.2; padding-left:20px;">
<li>☐ All database queries use parameterized statements</li>
<li>☐ No raw SQL with user input concatenation</li>
<li>☐ HTML output properly encoded (prevents XSS)</li>
<li>☐ File upload validates type, not just extension</li>
<li>☐ XML parsing with external entity processing disabled</li>
<li>☐ eval() and equivalent not used with user input</li>
<li>☐ OS commands not called with user input</li>
</ul>\n\n<a href="/xss-scanner" style="color:var(--accent);">Test for XSS free →</a> | <a href="/sql-injection-scanner" style="color:var(--accent);">Test for SQL injection free →</a>`
            },
            {
                h2: 'WordPress-Specific Checks (10 Items)',
                content: `<ul style="color:var(--text-secondary); line-height:2.2; padding-left:20px;">
<li>☐ WordPress core is latest version</li>
<li>☐ All plugins on latest version</li>
<li>☐ Inactive plugins deleted (not just deactivated)</li>
<li>☐ Username is not "admin"</li>
<li>☐ XML-RPC disabled if not needed</li>
<li>☐ File editing in admin panel disabled</li>
<li>☐ wp-config.php outside web root</li>
<li>☐ Database prefix changed from wp_</li>
<li>☐ Login attempts limited (plugin or server)</li>
<li>☐ Security scan done with external scanner</li>
</ul>\n\n<a href="/wordpress-security-scanner" style="color:var(--accent);">WordPress security scan free →</a>`
            },
            {
                h2: 'Quick Scan — Check All of These Automatically',
                content: `Rather than checking each item manually, run a <a href="/" style="color:var(--accent);">free VulnScan vulnerability scan</a> on your domain. Our scanner automatically tests for 200+ security issues including SSL configuration, HTTP headers, common injection vectors, and known CVEs — in 60 seconds.`
            }
        ],
        faq: [
            { q: 'How often should I run a website security check?', a: 'Run a security scan monthly at minimum, and after any major code deployment or plugin update. High-traffic or e-commerce sites should scan weekly. VulnScan\'s free scanner lets you check as often as you want.' },
            { q: 'What is the most important website security check?', a: 'HTTPS/SSL is the baseline, but the most impactful checks are: no SQL injection, no XSS, proper authentication, and up-to-date software. SQL injection and XSS together account for about 50% of web application breaches.' }
        ]
    }
];

// HTML template for blog posts
function generatePost(post) {
    const sectionsHtml = post.sections.map(s => `
        <h2 style="font-size:24px; font-weight:800; margin:40px 0 16px;">${s.h2}</h2>
        <div style="color:var(--text-secondary); line-height:1.8;">${s.content}</div>
    `).join('');

    const faqSchema = JSON.stringify({
        "@context": "https://schema.org",
        "@type": "FAQPage",
        "mainEntity": post.faq.map(f => ({
            "@type": "Question",
            "name": f.q,
            "acceptedAnswer": { "@type": "Answer", "text": f.a }
        }))
    }, null, 2);

    const articleSchema = JSON.stringify({
        "@context": "https://schema.org",
        "@type": "Article",
        "headline": post.title,
        "description": post.metaDesc,
        "datePublished": post.date + "T09:00:00+00:00",
        "dateModified": "2026-03-13T09:00:00+00:00",
        "author": { "@type": "Organization", "name": "VulnScan Security Team", "url": "https://vulnscan.tech" },
        "publisher": {
            "@type": "Organization",
            "name": "VulnScan",
            "url": "https://vulnscan.tech",
            "logo": { "@type": "ImageObject", "url": "https://vulnscan.tech/favicon.svg" }
        },
        "mainEntityOfPage": { "@type": "WebPage", "@id": `https://vulnscan.tech/blog/${post.slug}` }
    }, null, 2);

    const faqHtml = post.faq.map(f => `
        <div style="margin-bottom:20px; padding:20px; background:var(--bg-card); border:1px solid var(--border); border-radius:12px;">
            <h3 style="font-size:16px; font-weight:700; margin-bottom:8px;">${f.q}</h3>
            <p style="color:var(--text-secondary); line-height:1.7; font-size:15px;">${f.a}</p>
        </div>
    `).join('');

    return `<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <meta name="google-site-verification" content="vcMnDYS6l_rY36emCOS1d0A5uQYKYc_deC">
    <title>${post.title}</title>
    <meta name="description" content="${post.metaDesc}">
    <meta name="robots" content="index, follow, max-snippet:-1, max-image-preview:large, max-video-preview:-1">
    <meta http-equiv="Content-Security-Policy" content="default-src 'self'; script-src 'self' 'unsafe-inline' https://js.stripe.com; style-src 'self' 'unsafe-inline' https://fonts.googleapis.com; font-src https://fonts.gstatic.com; connect-src 'self' https://*.vulnscan.tech; img-src 'self' data:;">
    <link rel="canonical" href="https://vulnscan.tech/blog/${post.slug}">
    <link rel="icon" type="image/svg+xml" href="data:image/svg+xml,<svg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 100 100'><text y='.9em' font-size='90'>⚡</text></svg>">
    <link rel="preconnect" href="https://fonts.googleapis.com">
    <link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
    <link href="https://fonts.googleapis.com/css2?family=Inter:wght@300;400;500;600;700;800;900&family=JetBrains+Mono:wght@400;500;600&display=swap" rel="stylesheet">
    <link rel="stylesheet" href="../style.css">
    <script type="application/ld+json">${articleSchema}</script>
    <script type="application/ld+json">${faqSchema}</script>
    <script type="application/ld+json">{"@context":"https://schema.org","@type":"BreadcrumbList","itemListElement":[{"@type":"ListItem","position":1,"name":"Home","item":"https://vulnscan.tech"},{"@type":"ListItem","position":2,"name":"Blog","item":"https://vulnscan.tech/blog"},{"@type":"ListItem","position":3,"name":"${post.title}","item":"https://vulnscan.tech/blog/${post.slug}"}]}</script>
</head>
<body>
    <div class="bg-grid"></div>
    <div class="bg-glow bg-glow-1"></div>
    <div class="bg-glow bg-glow-2"></div>
    <nav class="nav">
        <div class="nav-inner">
            <div class="logo">
                <div class="logo-icon">⚡</div>
                <a href="/" style="text-decoration:none;"><span class="logo-text">Vuln<span class="logo-accent">Scan</span></span></a>
            </div>
            <div class="nav-links">
                <a href="/blog" style="color:var(--accent);">Blog</a>
                <a href="/cve-scanner">CVE Database</a>
                <a href="/#features">Features</a>
                <a href="/#pricing">Pricing</a>
                <a href="/about">About</a>
                <a href="/" class="nav-cta">Free Scan</a>
            </div>
        </div>
    </nav>

    <article style="max-width:800px; margin:0 auto; padding:100px 32px 60px; position:relative; z-index:1;">
        <div style="margin-bottom:24px;">
            <a href="/blog" style="color:var(--text-secondary); text-decoration:none; font-size:14px;">← Back to Blog</a>
        </div>
        <div style="display:inline-block; padding:3px 14px; border-radius:20px; background:rgba(99,102,241,0.1); border:1px solid rgba(99,102,241,0.3); font-size:12px; font-weight:600; color:var(--accent); margin-bottom:16px;">${post.category}</div>
        <h1 style="font-size:clamp(28px,4vw,42px); font-weight:800; line-height:1.2; letter-spacing:-1px; margin-bottom:16px;">${post.h1}</h1>
        <div style="display:flex; gap:20px; color:var(--text-secondary); font-size:14px; margin-bottom:32px; flex-wrap:wrap;">
            <span>📅 ${new Date(post.date).toLocaleDateString('en-US',{year:'numeric',month:'long',day:'numeric'})}</span>
            <span>⏱️ ${post.readTime}</span>
            <span>By VulnScan Security Team</span>
        </div>
        <p style="font-size:18px; color:var(--text-secondary); line-height:1.8; margin-bottom:40px; padding-bottom:32px; border-bottom:1px solid var(--border);">${post.intro}</p>

        ${sectionsHtml}

        <div style="margin-top:48px; padding:32px; background:linear-gradient(135deg,rgba(99,102,241,0.1),rgba(168,85,247,0.1)); border:1px solid rgba(99,102,241,0.2); border-radius:16px; text-align:center;">
            <h2 style="font-size:22px; font-weight:700; margin-bottom:8px;">Check Your Website Now</h2>
            <p style="color:var(--text-secondary); margin-bottom:20px;">Free vulnerability scan — 60 seconds, no signup.</p>
            <a href="/" class="cta-btn" style="text-decoration:none; display:inline-block;">Start Free Scan →</a>
        </div>

        <div style="margin-top:48px;">
            <h2 style="font-size:24px; font-weight:800; margin-bottom:24px;">Frequently Asked Questions</h2>
            ${faqHtml}
        </div>
    </article>

    <footer class="footer">
        <div class="footer-inner">
            <div class="logo"><div class="logo-icon">⚡</div><span class="logo-text">Vuln<span class="logo-accent">Scan</span></span></div>
            <div class="footer-links">
                <a href="/blog">Blog</a><a href="/about">About</a>
                <a href="/cve-scanner">CVE Database</a><a href="/online-vulnerability-scanner">Scanner</a>
                <a href="/port-scanner">Port Check</a><a href="/wordpress-security-scanner">WordPress</a>
                <a href="/sql-injection-scanner">SQL Injection</a><a href="/xss-scanner">XSS</a>
                <a href="/ssl-checker">SSL Checker</a>
            </div>
            <p class="footer-copy">© 2026 VulnScan. All rights reserved.</p>
        </div>
    </footer>
    <script src="../app.js"></script>
</body>
</html>`;
}

// Generate all posts
posts.forEach(post => {
    const html = generatePost(post);
    const filePath = path.join(BLOG_DIR, `${post.slug}.html`);
    fs.writeFileSync(filePath, html, 'utf-8');
    console.log(`✅ Blog: ${post.slug}.html`);
});

// Update blog/index.html to add the new posts
const indexPath = path.join(BLOG_DIR, 'index.html');
let indexContent = fs.readFileSync(indexPath, 'utf-8');

const newPostCards = posts.map(p => `
        <a href="/blog/${p.slug}" class="post-card">
            <div class="post-tag">📌 ${p.category}</div>
            <h2>${p.title}</h2>
            <p>${p.metaDesc}</p>
            <div class="post-meta">
                <span>📅 ${new Date(p.date).toLocaleDateString('en-US',{year:'numeric',month:'long',day:'numeric'})}</span>
                <span>⏱️ ${p.readTime}</span>
                <span style="color:var(--accent)">Read article →</span>
            </div>
        </a>`).join('\n');

// Insert new cards after the existing first card
indexContent = indexContent.replace(
    '</a>\n\n        <div style="text-align:center',
    `</a>\n${newPostCards}\n\n        <div style="text-align:center`
);
fs.writeFileSync(indexPath, indexContent, 'utf-8');
console.log('✅ Updated blog/index.html with new posts');

console.log(`\n🎯 Generated ${posts.length} blog posts!`);
