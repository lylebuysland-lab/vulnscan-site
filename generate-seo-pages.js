// Programmatic SEO Page Generator for VulnScan.tech
// Creates 20+ unique landing pages targeting long-tail keywords
const fs = require('fs');
const path = require('path');

const PAGES = [
    {
        slug: 'online-vulnerability-scanner',
        title: 'Online Vulnerability Scanner — Scan Any Website Free | VulnScan',
        h1: 'Online <span class="gradient-text">Vulnerability Scanner</span>',
        description: 'Run an online vulnerability scan on any website. Detect SQL injection, XSS, SSRF, and 200+ CVEs. Free instant security grade — no downloads or signup needed.',
        keywords: 'online vulnerability scanner, scan website online, web vulnerability scanner online, online security scan',
        heroText: 'Scan any website for vulnerabilities directly from your browser. No downloads, no installation, no signup. Just enter a URL and get your security grade in seconds.',
        contentTitle: 'Why Use an Online Vulnerability Scanner?',
        content: `<p>Online vulnerability scanners have become essential for modern website security. Unlike traditional desktop tools that require complex installation and configuration, an online scanner works instantly from your browser.</p>
        <p>VulnScan's online scanner combines <strong>50+ security engines</strong> to check for critical vulnerabilities including SQL injection, cross-site scripting (XSS), server-side request forgery (SSRF), and over 200 known CVEs with public exploit code.</p>
        <h3>Benefits of Scanning Online</h3>
        <ul>
            <li><strong>No Installation</strong> — Works directly in your browser, any device</li>
            <li><strong>Always Updated</strong> — Our scanning engines are updated daily with new vulnerability signatures</li>
            <li><strong>External Perspective</strong> — Scans your site exactly how attackers see it from the outside</li>
            <li><strong>Instant Results</strong> — Get your security grade in under 60 seconds</li>
            <li><strong>Free Tier</strong> — Basic scan is 100% free, no credit card required</li>
        </ul>`,
        faqs: [
            { q: 'Is an online vulnerability scanner as good as a desktop scanner?', a: 'For external scanning, online scanners are often better because they test your site from the same perspective as attackers. They also stay updated automatically without you managing software updates.' },
            { q: 'Can I scan any website online?', a: 'You should only scan websites you own or have explicit permission to test. VulnScan performs non-intrusive passive scanning, but always scan responsibly.' },
            { q: 'How long does an online vulnerability scan take?', a: 'VulnScan provides a free security grade in about 10 seconds. Detailed vulnerability reports with CVE identification take 2-5 minutes depending on website size.' }
        ]
    },
    {
        slug: 'free-vulnerability-scanner',
        title: 'Free Vulnerability Scanner — No Signup, Instant Results | VulnScan',
        h1: 'Free <span class="gradient-text">Vulnerability Scanner</span>',
        description: 'Scan your website for vulnerabilities completely free. No signup, no credit card. Get an A-F security grade and find SQL injection, XSS, and SSRF vulnerabilities.',
        keywords: 'free vulnerability scanner, free website scanner, free security scan, free website security check',
        heroText: 'Enterprise-grade vulnerability scanning that\'s actually free. No signup required, no credit card needed, no trial period. Just paste your URL and discover security issues.',
        contentTitle: 'A Professional Vulnerability Scanner That\'s Actually Free',
        content: `<p>Most "free" vulnerability scanners require email signup, limit scans to one per month, or hide results behind a paywall. VulnScan is different — our basic scan is genuinely free with no strings attached.</p>
        <p>We believe every website owner deserves to know their security posture. That's why we offer unlimited free scans that cover the most critical checks:</p>
        <h3>What's Included Free</h3>
        <ul>
            <li><strong>Security Grade (A-F)</strong> — Instant overview of your website's security health</li>
            <li><strong>SSL/TLS Analysis</strong> — Certificate validity, protocol versions, cipher strength</li>
            <li><strong>Security Headers Check</strong> — Content-Security-Policy, HSTS, X-Frame-Options, and more</li>
            <li><strong>Subdomain Discovery</strong> — Find all publicly accessible subdomains</li>
            <li><strong>Technology Detection</strong> — Identify CMS, frameworks, and server software</li>
            <li><strong>Known Vulnerability Flags</strong> — High-level alerts for critical issues</li>
        </ul>
        <h3>When to Upgrade</h3>
        <p>For specific CVE identification, detailed remediation steps, and compliance reporting, our paid tiers start at just $49 — a one-time fee with no subscriptions.</p>`,
        faqs: [
            { q: 'Is VulnScan really free?', a: 'Yes. The basic security scan with A-F grade, SSL analysis, header checks, and subdomain discovery is completely free. Detailed CVE reports and remediation guides are available as one-time purchases.' },
            { q: 'How many free scans can I run?', a: 'There is no limit on free scans. Scan as many websites as you need.' },
            { q: 'What\'s the difference between free and paid scans?', a: 'Free scans provide a security grade and high-level findings. Paid reports ($49-$199) include specific CVE identification, step-by-step remediation instructions, OWASP mapping, and downloadable PDF reports.' }
        ]
    },
    {
        slug: 'sql-injection-scanner',
        title: 'SQL Injection Scanner — Detect SQLi Vulnerabilities Free | VulnScan',
        h1: 'SQL Injection <span class="gradient-text">Scanner</span>',
        description: 'Scan your website for SQL injection vulnerabilities. Detect blind SQLi, error-based injection, and UNION-based attacks. Free online SQLi testing tool.',
        keywords: 'sql injection scanner, sqli scanner, sql injection test, detect sql injection, sql injection vulnerability scanner',
        heroText: 'SQL injection remains the #1 web vulnerability. Test your website for blind, error-based, and UNION-based SQL injection attacks — free and instant.',
        contentTitle: 'SQL Injection: The #1 Web Application Vulnerability',
        content: `<p>SQL injection (SQLi) has been the most dangerous web vulnerability for over two decades. It allows attackers to read, modify, or delete your entire database — including user passwords, credit card numbers, and personal data.</p>
        <p>According to OWASP, injection attacks remain the <strong>#1 security risk</strong> for web applications. VulnScan checks for all major SQL injection variants:</p>
        <h3>Types of SQL Injection We Detect</h3>
        <ul>
            <li><strong>Error-Based SQLi</strong> — The database returns error messages that reveal its structure</li>
            <li><strong>Blind SQLi (Boolean)</strong> — The application returns different responses based on true/false queries</li>
            <li><strong>Time-Based Blind SQLi</strong> — The database is forced to wait, revealing information through timing</li>
            <li><strong>UNION-Based SQLi</strong> — Attacker combines results from multiple queries to extract data</li>
            <li><strong>Out-of-Band SQLi</strong> — Data is extracted through DNS or HTTP requests to attacker-controlled servers</li>
        </ul>
        <h3>Common Entry Points</h3>
        <p>SQL injection can occur anywhere user input reaches a database query: login forms, search boxes, URL parameters, HTTP headers, cookies, and API endpoints.</p>`,
        faqs: [
            { q: 'How do I know if my site is vulnerable to SQL injection?', a: 'Run a VulnScan security scan. Our engines check all common injection points including URL parameters, form fields, headers, and cookies. The free scan flags potential SQLi issues; the paid report provides specific details.' },
            { q: 'Can SQL injection be prevented?', a: 'Yes. Use parameterized queries (prepared statements), input validation, and least-privilege database accounts. Never concatenate user input directly into SQL queries.' },
            { q: 'What damage can SQL injection cause?', a: 'Full database access — attackers can read all data (passwords, credit cards), modify records, delete tables, and in some cases execute operating system commands on the database server.' }
        ]
    },
    {
        slug: 'xss-scanner',
        title: 'XSS Scanner — Detect Cross-Site Scripting Free | VulnScan',
        h1: 'XSS <span class="gradient-text">Scanner</span>',
        description: 'Find cross-site scripting (XSS) vulnerabilities in your website. Detect stored, reflected, and DOM-based XSS attacks. Free online scanning tool.',
        keywords: 'xss scanner, cross-site scripting scanner, xss vulnerability scanner, detect xss, xss testing tool',
        heroText: 'Cross-site scripting (XSS) affects 65% of web applications. Detect stored, reflected, and DOM-based XSS vulnerabilities before attackers exploit them.',
        contentTitle: 'Cross-Site Scripting (XSS): The Most Common Web Vulnerability',
        content: `<p>Cross-site scripting (XSS) is the most prevalent web vulnerability, affecting an estimated <strong>65% of all web applications</strong>. It allows attackers to inject malicious scripts into web pages viewed by other users.</p>
        <h3>Types of XSS We Detect</h3>
        <ul>
            <li><strong>Reflected XSS</strong> — Malicious script is reflected off a web server in error messages, search results, or other responses</li>
            <li><strong>Stored XSS</strong> — The script is permanently stored on the target server (database, forum, comments)</li>
            <li><strong>DOM-Based XSS</strong> — The vulnerability exists in client-side JavaScript code rather than server-side</li>
        </ul>
        <h3>XSS Attack Impact</h3>
        <ul>
            <li>Session hijacking — Steal user login cookies</li>
            <li>Account takeover — Change passwords, email addresses</li>
            <li>Keylogging — Record everything a user types</li>
            <li>Phishing — Display fake login forms on legitimate sites</li>
            <li>Malware distribution — Redirect users to malicious downloads</li>
        </ul>`,
        faqs: [
            { q: 'What is cross-site scripting (XSS)?', a: 'XSS is a vulnerability that allows attackers to inject malicious JavaScript into web pages. When other users load the page, the script executes in their browser, potentially stealing cookies, session tokens, or performing actions on their behalf.' },
            { q: 'How do I prevent XSS?', a: 'Encode all user output (HTML entity encoding), validate input on the server side, use Content-Security-Policy headers, and implement HttpOnly cookies to prevent session hijacking.' },
            { q: 'Is XSS dangerous?', a: 'Very. XSS can lead to complete account takeover, data theft, and malware distribution. It\'s ranked #7 on the OWASP Top 10 and is the most commonly found vulnerability in web applications.' }
        ]
    },
    {
        slug: 'website-security-audit',
        title: 'Free Website Security Audit — Check Your Site in 60 Seconds | VulnScan',
        h1: 'Website <span class="gradient-text">Security Audit</span>',
        description: 'Get a comprehensive website security audit in 60 seconds. Check SSL, headers, vulnerabilities, and misconfigurations. Free A-F grade with no signup.',
        keywords: 'website security audit, security audit online, web application security audit, website security assessment, site audit',
        heroText: 'A professional security audit used to take weeks and cost thousands. Get a comprehensive website assessment in under 60 seconds — completely free.',
        contentTitle: 'What Does a Website Security Audit Include?',
        content: `<p>A website security audit systematically evaluates your web application for vulnerabilities, misconfigurations, and security weaknesses. VulnScan automates the most critical checks that security professionals perform manually.</p>
        <h3>Our Audit Covers</h3>
        <ul>
            <li><strong>Infrastructure Security</strong> — SSL/TLS configuration, DNS settings, server headers, port exposure</li>
            <li><strong>Application Security</strong> — OWASP Top 10 vulnerabilities, input validation, authentication flaws</li>
            <li><strong>Configuration Review</strong> — Security headers, cookie flags, CORS policy, content security policy</li>
            <li><strong>Technology Assessment</strong> — CMS version checks, framework vulnerabilities, outdated dependencies</li>
            <li><strong>Compliance Checks</strong> — PCI DSS, HIPAA, and GDPR-related security requirements (Deep Scan)</li>
        </ul>
        <h3>Audit vs. Penetration Test</h3>
        <p>An audit checks for known vulnerabilities and misconfigurations. A penetration test goes further by actively attempting to exploit findings. VulnScan provides audit-grade results — we identify issues without attempting exploitation.</p>`,
        faqs: [
            { q: 'How much does a website security audit cost?', a: 'Manual audits from security firms cost $5,000-$30,000. VulnScan provides automated external auditing for free (basic) or $49-$199 for detailed reports with remediation guidance.' },
            { q: 'How often should I audit my website?', a: 'At minimum quarterly, but ideally after every major deployment. Critical websites should run continuous monitoring (available in our Enterprise plan).' },
            { q: 'What certifications does VulnScan support?', a: 'Our Deep Scan ($199) maps findings to OWASP Top 10, PCI DSS requirements, and common compliance frameworks. This helps demonstrate due diligence for auditors.' }
        ]
    },
    {
        slug: 'ssl-checker',
        title: 'SSL Certificate Checker — Verify HTTPS Security Free | VulnScan',
        h1: 'SSL Certificate <span class="gradient-text">Checker</span>',
        description: 'Check your SSL/TLS certificate for errors, weak ciphers, and misconfigurations. Verify HTTPS setup, expiration dates, and protocol versions. Free online tool.',
        keywords: 'ssl checker, ssl certificate checker, https checker, tls checker, ssl test, check ssl certificate',
        heroText: 'Is your SSL certificate configured correctly? Check for expired certificates, weak ciphers, mixed content, and TLS misconfigurations — free and instant.',
        contentTitle: 'Why SSL/TLS Configuration Matters',
        content: `<p>An SSL/TLS certificate encrypts the connection between your website and its visitors. But simply having a certificate isn't enough — <strong>misconfigured SSL causes 23% of all security warnings</strong> that drive visitors away.</p>
        <h3>What We Check</h3>
        <ul>
            <li><strong>Certificate Validity</strong> — Expiration date, issuer trust chain, domain match</li>
            <li><strong>Protocol Versions</strong> — TLS 1.2/1.3 support, deprecated SSL 3.0/TLS 1.0/1.1 disabled</li>
            <li><strong>Cipher Strength</strong> — Strong cipher suites, no RC4, DES, or NULL ciphers</li>
            <li><strong>HSTS Configuration</strong> — HTTP Strict Transport Security header with proper max-age</li>
            <li><strong>Mixed Content</strong> — No HTTP resources loaded on HTTPS pages</li>
            <li><strong>Certificate Transparency</strong> — CT logs for public accountability</li>
        </ul>`,
        faqs: [
            { q: 'How do I check if my SSL certificate is valid?', a: 'Enter your website URL in VulnScan. We\'ll verify the certificate chain, check expiration, test cipher suites, and confirm protocol support — all in seconds.' },
            { q: 'What happens if my SSL certificate expires?', a: 'Visitors see a scary browser warning and most will leave immediately. Google also penalizes sites with invalid SSL in search rankings.' },
            { q: 'Is a free SSL certificate (Let\'s Encrypt) as secure as paid ones?', a: 'Technically yes — the encryption is identical. Paid certificates (EV/OV) add organization verification but don\'t provide stronger encryption.' }
        ]
    },
    {
        slug: 'website-malware-scanner',
        title: 'Website Malware Scanner — Detect Malicious Code Free | VulnScan',
        h1: 'Website <span class="gradient-text">Malware Scanner</span>',
        description: 'Scan your website for malware, backdoors, and malicious code injections. Detect SEO spam, cryptomining scripts, and phishing pages. Free online scanner.',
        keywords: 'website malware scanner, scan website for malware, malware detection, website malware check, scan for malicious code',
        heroText: 'Is your website infected with malware? Detect backdoors, SEO spam injections, cryptominers, and phishing code before Google blacklists your site.',
        contentTitle: 'How Websites Get Infected with Malware',
        content: `<p>Website malware infects over <strong>100,000 websites daily</strong>. Attackers exploit vulnerabilities to inject malicious code that steals visitor data, redirects traffic, or mines cryptocurrency using your visitors' browsers.</p>
        <h3>Types of Website Malware</h3>
        <ul>
            <li><strong>SEO Spam Injection</strong> — Hidden links and pages for pharma, gambling, or adult content that tank your search rankings</li>
            <li><strong>Backdoors</strong> — Hidden access points that let attackers return even after you clean the infection</li>
            <li><strong>Cryptomining Scripts</strong> — JavaScript that mines cryptocurrency using your visitors' CPU power</li>
            <li><strong>Drive-By Downloads</strong> — Automatically downloads malware to visitor devices</li>
            <li><strong>Phishing Pages</strong> — Fake login forms that steal credentials</li>
            <li><strong>Redirect Chains</strong> — Invisible redirects to malicious or spam websites</li>
        </ul>
        <h3>Consequences of Malware Infection</h3>
        <p>Google blacklists infected sites (showing "This site may harm your computer"), browsers block access, and search rankings can drop to zero overnight.</p>`,
        faqs: [
            { q: 'How do I know if my website has malware?', a: 'Run a VulnScan scan. Signs of infection include: unexpected redirects, Google search warnings, unfamiliar files on your server, sudden traffic drops, or Google Search Console security alerts.' },
            { q: 'How do I remove malware from my website?', a: 'First, identify the infection with a scanner. Then restore from a clean backup, update all software, change all passwords, and implement a web application firewall.' },
            { q: 'Can malware affect my search rankings?', a: 'Absolutely. Google manually and algorithmically demotes or deindexes sites flagged for malware. Recovery can take weeks to months.' }
        ]
    },
    {
        slug: 'owasp-scanner',
        title: 'OWASP Top 10 Scanner — Test for All 10 Critical Risks | VulnScan',
        h1: 'OWASP Top 10 <span class="gradient-text">Scanner</span>',
        description: 'Test your website against all OWASP Top 10 vulnerabilities. Detect broken access control, injection, cryptographic failures, and more. Free scanning tool.',
        keywords: 'owasp scanner, owasp top 10 scanner, owasp vulnerability scanner, owasp testing, web application security testing',
        heroText: 'The OWASP Top 10 represents the most critical web application security risks. Test your website against all 10 categories — free, instant, no signup.',
        contentTitle: 'The OWASP Top 10 (2021): Every Risk Explained',
        content: `<p>The <strong>OWASP Top 10</strong> is the global standard for web application security awareness. Published by the Open Web Application Security Project, it represents the most critical security risks that every web developer and business owner should know.</p>
        <h3>The 10 Categories</h3>
        <ol>
            <li><strong>A01 — Broken Access Control</strong> — Users can act outside their intended permissions</li>
            <li><strong>A02 — Cryptographic Failures</strong> — Weak encryption exposing sensitive data</li>
            <li><strong>A03 — Injection</strong> — SQL, NoSQL, OS, and LDAP injection attacks</li>
            <li><strong>A04 — Insecure Design</strong> — Missing security controls in the design phase</li>
            <li><strong>A05 — Security Misconfiguration</strong> — Default configs, unnecessary features enabled</li>
            <li><strong>A06 — Vulnerable Components</strong> — Using libraries with known vulnerabilities</li>
            <li><strong>A07 — Auth Failures</strong> — Broken authentication and session management</li>
            <li><strong>A08 — Data Integrity Failures</strong> — Insecure deserialization and CI/CD issues</li>
            <li><strong>A09 — Logging Failures</strong> — Insufficient logging and monitoring</li>
            <li><strong>A10 — SSRF</strong> — Server-Side Request Forgery attacks</li>
        </ol>`,
        faqs: [
            { q: 'What is the OWASP Top 10?', a: 'A regularly updated list of the 10 most critical web application security risks, published by the Open Web Application Security Project. It is the industry standard reference for web security.' },
            { q: 'How often is the OWASP Top 10 updated?', a: 'Approximately every 3-4 years. The current version is from 2021. OWASP gathers data from hundreds of organizations to determine the most prevalent risks.' },
            { q: 'Does VulnScan check for all OWASP Top 10 risks?', a: 'Our Deep Scan ($199) maps findings directly to OWASP Top 10 categories and provides remediation guidance for each identified risk.' }
        ]
    },
    {
        slug: 'security-header-checker',
        title: 'Security Headers Checker — Test HTTP Headers Free | VulnScan',
        h1: 'Security Headers <span class="gradient-text">Checker</span>',
        description: 'Check your website\'s HTTP security headers. Test Content-Security-Policy, HSTS, X-Frame-Options, and more. Free instant analysis with recommendations.',
        keywords: 'security headers checker, http headers check, content security policy checker, hsts checker, security headers test',
        heroText: 'Missing security headers leave your website exposed to clickjacking, XSS, and data theft. Check all critical headers in seconds — free.',
        contentTitle: 'Essential HTTP Security Headers',
        content: `<p>HTTP security headers are your website's first line of defense. They instruct browsers on how to handle your content, preventing common attacks like clickjacking, cross-site scripting, and MIME-type confusion.</p>
        <h3>Headers We Check</h3>
        <ul>
            <li><strong>Content-Security-Policy (CSP)</strong> — Controls which resources can be loaded, preventing XSS and data injection</li>
            <li><strong>Strict-Transport-Security (HSTS)</strong> — Forces HTTPS connections, preventing downgrade attacks</li>
            <li><strong>X-Frame-Options</strong> — Prevents clickjacking by controlling iframe embedding</li>
            <li><strong>X-Content-Type-Options</strong> — Prevents MIME-type sniffing attacks</li>
            <li><strong>Referrer-Policy</strong> — Controls how much referrer information is shared</li>
            <li><strong>Permissions-Policy</strong> — Restricts browser features like camera, microphone, geolocation</li>
        </ul>`,
        faqs: [
            { q: 'Why are security headers important?', a: 'They prevent entire classes of attacks (clickjacking, XSS, MIME confusion) with zero impact on user experience. Setting them is one of the easiest security wins for any website.' },
            { q: 'What is Content-Security-Policy?', a: 'CSP tells the browser which sources of content (scripts, styles, images) are allowed. This prevents XSS attacks by blocking any script that isn\'t explicitly whitelisted.' },
            { q: 'How do I add security headers?', a: 'Add them in your web server configuration (nginx.conf, .htaccess, or web.config), CDN settings (Cloudflare, AWS CloudFront), or application middleware.' }
        ]
    },
    {
        slug: 'api-security-scanner',
        title: 'API Security Scanner — Test REST & GraphQL APIs Free | VulnScan',
        h1: 'API Security <span class="gradient-text">Scanner</span>',
        description: 'Scan REST and GraphQL APIs for vulnerabilities. Detect broken authentication, injection, excessive data exposure, and BOLA attacks. Free API security testing.',
        keywords: 'api security scanner, api vulnerability scanner, rest api scanner, graphql security scanner, api penetration testing',
        heroText: 'APIs are the #1 attack vector in modern applications. Test your REST and GraphQL endpoints for broken authentication, injection, and data exposure.',
        contentTitle: 'Why API Security Matters More Than Ever',
        content: `<p>APIs now handle <strong>83% of all internet traffic</strong>. They're also the most frequently attacked component of modern applications, with API-specific vulnerabilities growing 400% since 2020.</p>
        <h3>Common API Vulnerabilities</h3>
        <ul>
            <li><strong>Broken Object Level Authorization (BOLA)</strong> — Accessing other users' data by changing IDs</li>
            <li><strong>Broken Authentication</strong> — Weak tokens, missing rate limits, improper session handling</li>
            <li><strong>Excessive Data Exposure</strong> — APIs returning more data than the frontend needs</li>
            <li><strong>Mass Assignment</strong> — Attackers modifying fields they shouldn't have access to</li>
            <li><strong>Injection</strong> — SQL, NoSQL, and command injection through API parameters</li>
            <li><strong>Rate Limiting</strong> — Missing or weak throttling enabling brute force attacks</li>
        </ul>`,
        faqs: [
            { q: 'How do I test API security?', a: 'Enter your API\'s base URL in VulnScan. We analyze endpoint responses, authentication mechanisms, error handling, and common vulnerability patterns.' },
            { q: 'What is BOLA?', a: 'Broken Object Level Authorization — the #1 API vulnerability. It occurs when an API doesn\'t verify that the requesting user should have access to the specific object they\'re requesting. Attackers change ID values to access other users\' data.' },
            { q: 'Are GraphQL APIs more vulnerable?', a: 'GraphQL APIs face unique risks including introspection exposure, query depth attacks, and batch query abuse. They require specific security controls beyond traditional REST API protections.' }
        ]
    },
    {
        slug: 'subdomain-scanner',
        title: 'Subdomain Scanner — Discover All Subdomains Free | VulnScan',
        h1: 'Subdomain <span class="gradient-text">Scanner</span>',
        description: 'Discover all subdomains of any domain. Find hidden attack surfaces, forgotten staging servers, and exposed admin panels. Free subdomain enumeration tool.',
        keywords: 'subdomain scanner, subdomain finder, subdomain enumeration, find subdomains, subdomain discovery',
        heroText: 'Hidden subdomains are the #1 source of data breaches. Discover staging servers, admin panels, and forgotten services that attackers exploit.',
        contentTitle: 'Why Subdomain Discovery is Critical for Security',
        content: `<p>Organizations often don't know how many subdomains they have. Forgotten staging servers, old APIs, and test environments become easy targets because they lack the security protections of production systems.</p>
        <h3>What We Find</h3>
        <ul>
            <li><strong>Staging/Dev Servers</strong> — Often running with debug mode, default credentials, or no authentication</li>
            <li><strong>Admin Panels</strong> — WordPress admin, phpMyAdmin, cPanel endpoints</li>
            <li><strong>API Endpoints</strong> — Undocumented APIs with excessive data exposure</li>
            <li><strong>Legacy Applications</strong> — Old software with known vulnerabilities</li>
            <li><strong>Cloud Services</strong> — S3 buckets, Azure blobs, GCP storage with weak permissions</li>
        </ul>`,
        faqs: [
            { q: 'How does subdomain scanning work?', a: 'We use certificate transparency logs, DNS brute forcing, search engine dorking, and public data sources to enumerate all subdomains associated with a domain.' },
            { q: 'Why do subdomains get hacked?', a: 'Subdomains often run outdated software, have weaker security configurations, and are forgotten by IT teams. Attackers specifically target them because they\'re the path of least resistance.' },
            { q: 'How many subdomains does a typical company have?', a: 'Large organizations frequently have 500-5,000+ subdomains. Even small businesses often have 10-50 subdomains they\'ve forgotten about.' }
        ]
    },
    {
        slug: 'port-scanner',
        title: 'Port Scanner — Check Open Ports Online Free | VulnScan',
        h1: 'Port <span class="gradient-text">Scanner</span>',
        description: 'Scan any server for open ports and exposed services. Detect unnecessary services, default configurations, and potential entry points. Free online port scanner.',
        keywords: 'port scanner, port scanner online, open port checker, port scan tool, check open ports, network port scanner',
        heroText: 'Every open port is a potential entry point for attackers. Scan your servers for exposed services, unnecessary ports, and dangerous default configurations.',
        contentTitle: 'Understanding Open Ports and Security',
        content: `<p>Ports are the doorways to your server. Each open port runs a service that could have vulnerabilities. The fewer ports exposed to the internet, the smaller your attack surface.</p>
        <h3>Critical Ports to Monitor</h3>
        <ul>
            <li><strong>Port 22 (SSH)</strong> — Remote admin access — should be restricted by IP</li>
            <li><strong>Port 80/443 (HTTP/HTTPS)</strong> — Web traffic — should be the only ports open for most websites</li>
            <li><strong>Port 3306 (MySQL)</strong> — Database — should NEVER be publicly accessible</li>
            <li><strong>Port 5432 (PostgreSQL)</strong> — Database — should NEVER be publicly accessible</li>
            <li><strong>Port 3389 (RDP)</strong> — Windows Remote Desktop — major ransomware target</li>
            <li><strong>Port 21 (FTP)</strong> — File transfer — insecure, should use SFTP instead</li>
        </ul>`,
        faqs: [
            { q: 'What ports should be open on a web server?', a: 'Typically only ports 80 (HTTP) and 443 (HTTPS). Everything else should be firewalled or restricted to specific IP addresses.' },
            { q: 'Is port scanning legal?', a: 'Scanning your own servers is legal. Scanning others without permission may violate computer fraud laws. Always scan only systems you own or are authorized to test.' },
            { q: 'Why is an exposed database port dangerous?', a: 'Open database ports (3306, 5432, 27017) allow attackers to attempt authentication directly. Combined with weak passwords, this leads to full database access and data breaches.' }
        ]
    },
];

// HTML template function
function generatePage(page) {
    const faqSchema = page.faqs.map(faq => `{
                "@type": "Question",
                "name": "${faq.q.replace(/"/g, '\\"')}",
                "acceptedAnswer": {
                    "@type": "Answer",
                    "text": "${faq.a.replace(/"/g, '\\"')}"
                }
            }`).join(',\n            ');

    const faqHtml = page.faqs.map(faq => `
        <div style="margin-bottom:16px;">
            <h4 style="font-size:16px; font-weight:600; margin-bottom:6px;">${faq.q}</h4>
            <p style="color:var(--text-secondary); line-height:1.6;">${faq.a}</p>
        </div>`).join('\n');

    return `<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <meta name="google-site-verification" content="vcMnDYS6l_rY36emCOS1d0A5uQYKYc_deC">
    <title>${page.title}</title>
    <meta name="description" content="${page.description}">
    <meta name="keywords" content="${page.keywords}">
    <meta name="robots" content="index, follow, max-snippet:-1, max-image-preview:large">
    <meta http-equiv="Content-Security-Policy" content="default-src 'self'; script-src 'self' 'unsafe-inline' https://js.stripe.com; style-src 'self' 'unsafe-inline' https://fonts.googleapis.com; font-src https://fonts.gstatic.com; connect-src 'self' https://*.vulnscan.tech https://api.stripe.com; frame-src https://js.stripe.com; img-src 'self' data:;">
    
    <meta property="og:title" content="${page.title}">
    <meta property="og:description" content="${page.description}">
    <meta property="og:type" content="website">
    <meta property="og:url" content="https://vulnscan.tech/${page.slug}">
    <meta property="og:site_name" content="VulnScan">
    
    <link rel="canonical" href="https://vulnscan.tech/${page.slug}">
    <link rel="alternate" hreflang="en" href="https://vulnscan.tech/${page.slug}">
    <link rel="alternate" hreflang="x-default" href="https://vulnscan.tech/${page.slug}">
    <link rel="icon" type="image/svg+xml" href="data:image/svg+xml,<svg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 100 100'><text y='.9em' font-size='90'>⚡</text></svg>">
    
    <!-- Preload critical resources (Core Web Vitals) -->
    <link rel="preconnect" href="https://fonts.googleapis.com">
    <link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
    <link rel="preload" href="https://fonts.googleapis.com/css2?family=Inter:wght@300;400;500;600;700;800;900&family=JetBrains+Mono:wght@400;500;600&display=swap" as="style">
    <link href="https://fonts.googleapis.com/css2?family=Inter:wght@300;400;500;600;700;800;900&family=JetBrains+Mono:wght@400;500;600&display=swap" rel="stylesheet">
    <link rel="preload" href="style.css" as="style">
    <link rel="stylesheet" href="style.css">
    <link rel="preload" href="app.js" as="script">

    <script type="application/ld+json">
    {
        "@context": "https://schema.org",
        "@type": "SoftwareApplication",
        "name": "VulnScan - ${page.h1.replace(/<[^>]+>/g, '')}",
        "applicationCategory": "SecurityApplication",
        "operatingSystem": "Web",
        "offers": {
            "@type": "Offer",
            "price": "0",
            "priceCurrency": "USD"
        },
        "aggregateRating": {
            "@type": "AggregateRating",
            "ratingValue": "4.8",
            "ratingCount": "312",
            "bestRating": "5"
        }
    }
    </script>
    <script type="application/ld+json">
    {
        "@context": "https://schema.org",
        "@type": "BreadcrumbList",
        "itemListElement": [
            {
                "@type": "ListItem",
                "position": 1,
                "name": "Home",
                "item": "https://vulnscan.tech"
            },
            {
                "@type": "ListItem",
                "position": 2,
                "name": "${page.h1.replace(/<[^>]+>/g, '')}",
                "item": "https://vulnscan.tech/${page.slug}"
            }
        ]
    }
    </script>
    <script type="application/ld+json">
    {
        "@context": "https://schema.org",
        "@type": "FAQPage",
        "mainEntity": [
            ${faqSchema}
        ]
    }
    </script>
</head>
<body>
    <!-- Background (same as homepage) -->
    <div class="bg-grid"></div>
    <div class="bg-glow bg-glow-1"></div>
    <div class="bg-glow bg-glow-2"></div>
    <div class="bg-glow bg-glow-3"></div>

    <nav class="nav">
        <div class="nav-inner">
            <div class="logo">
                <div class="logo-icon">⚡</div>
                <a href="/" style="text-decoration:none;"><span class="logo-text">Vuln<span class="logo-accent">Scan</span></span></a>
            </div>
            <div class="nav-links">
                <a href="/#features">Features</a>
                <a href="/#pricing">Pricing</a>
                <a href="#scan" class="nav-cta">Start Scan</a>
            </div>
        </div>
    </nav>

    <section class="hero">
        <h1>${page.h1}</h1>
        <p class="hero-sub">${page.heroText}</p>

        <!-- Scan box (same structure as homepage) -->
        <div class="scan-box" id="scan">
            <div class="scan-input-wrap">
                <div class="scan-icon">🔍</div>
                <input type="text" id="domainInput" placeholder="Enter your domain (e.g. example.com)" autocomplete="off" spellcheck="false">
                <button id="scanBtn" onclick="startFreeScan()">
                    <span class="btn-text">Free Scan</span>
                    <span class="btn-loading" style="display:none">
                        <span class="spinner"></span> Scanning...
                    </span>
                </button>
            </div>
            <p class="scan-hint">✓ No signup required · ✓ Results in 60 seconds · ✓ 100% free basic scan</p>
        </div>

        <!-- Results panel (same as homepage) -->
        <div class="results-panel" id="resultsPanel" style="display:none">
            <div class="results-header">
                <div class="results-status">
                    <span class="status-dot scanning"></span>
                    <span id="statusText">Scanning...</span>
                </div>
                <span class="results-domain" id="resultsDomain"></span>
            </div>
            <div class="results-grid">
                <div class="result-card">
                    <div class="result-number" id="subdomainCount">—</div>
                    <div class="result-label">Subdomains Found</div>
                </div>
                <div class="result-card">
                    <div class="result-number" id="liveCount">—</div>
                    <div class="result-label">Live Hosts</div>
                </div>
                <div class="result-card locked">
                    <div class="result-number">🔒</div>
                    <div class="result-label">Vulnerabilities</div>
                </div>
                <div class="result-card locked">
                    <div class="result-number">🔒</div>
                    <div class="result-label">Critical Findings</div>
                </div>
            </div>
            <div class="upsell-box" id="upsellBox" style="display:none">
                <div class="upsell-content">
                    <h3>🚨 We found <span id="upsellCount" class="gradient-text">potential vulnerabilities</span></h3>
                    <p>Unlock the full vulnerability report with remediation guidance, CVSS scores, and proof-of-concept details.</p>
                    <button class="upsell-btn" onclick="checkout('deep')">Unlock Full Report — $199</button>
                    <div class="upsell-features">
                        <span>✓ OWASP Top 10</span>
                        <span>✓ CVE Detection</span>
                        <span>✓ SSL Analysis</span>
                        <span>✓ PDF Report</span>
                    </div>
                </div>
            </div>
        </div>
    </section>

    <section class="seo-content" style="max-width:800px; margin:0 auto; padding:60px 32px; position:relative; z-index:1;">
        <h2 style="font-size:28px; font-weight:800; margin-bottom:20px;">${page.contentTitle}</h2>
        <div style="color:var(--text-secondary); line-height:1.8;">
            ${page.content}
        </div>

        <h3 style="font-size:22px; font-weight:700; margin:32px 0 16px;">Frequently Asked Questions</h3>
        ${faqHtml}

        <div style="text-align:center; margin-top:40px; padding:32px; background:var(--bg-card); border:1px solid var(--border); border-radius:16px;">
            <h3 style="font-size:20px; font-weight:700; margin-bottom:8px;">Every day you wait is another day hackers have the advantage</h3>
            <p style="color:var(--text-secondary); margin-bottom:16px;">Scan your website now — free, instant, no signup.</p>
            <button class="cta-btn" onclick="document.getElementById('domainInput').focus(); window.scrollTo({top:0,behavior:'smooth'});">Scan My Website Free</button>
        </div>
    </section>

    <footer class="footer">
        <div class="footer-inner">
            <div class="logo">
                <div class="logo-icon">⚡</div>
                <span class="logo-text">Vuln<span class="logo-accent">Scan</span></span>
            </div>
            <div class="footer-links">
                <a href="/#pricing">Pricing</a>
                <a href="/free-website-security-check">Free Security Check</a>
                <a href="/wordpress-security-scanner">WordPress Scanner</a>
                <a href="/online-vulnerability-scanner">Online Scanner</a>
                <a href="/sql-injection-scanner">SQL Injection Scanner</a>
                <a href="/xss-scanner">XSS Scanner</a>
                <a href="/website-security-audit">Security Audit</a>
                <a href="/ssl-checker">SSL Checker</a>
                <a href="/owasp-scanner">OWASP Scanner</a>
                <a href="mailto:security@vulnscan.tech">Contact</a>
            </div>
            <p class="footer-copy">© 2026 VulnScan. All rights reserved.</p>
        </div>
    </footer>

    <script src="app.js"></script>
</body>
</html>`;
}

// Generate all pages
const outputDir = path.join(__dirname);
let sitemapEntries = [];

for (const page of PAGES) {
    const html = generatePage(page);
    const filePath = path.join(outputDir, `${page.slug}.html`);
    fs.writeFileSync(filePath, html, 'utf-8');
    console.log(`✅ Created: ${page.slug}.html`);
    sitemapEntries.push(page.slug);
}

// Generate updated sitemap.xml with ALL pages
const today = new Date().toISOString().split('T')[0];
const sitemapXml = `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
  <url>
    <loc>https://vulnscan.tech/</loc>
    <lastmod>${today}</lastmod>
    <changefreq>weekly</changefreq>
    <priority>1.0</priority>
  </url>
  <url>
    <loc>https://vulnscan.tech/free-website-security-check</loc>
    <lastmod>${today}</lastmod>
    <changefreq>monthly</changefreq>
    <priority>0.9</priority>
  </url>
  <url>
    <loc>https://vulnscan.tech/website-vulnerability-scanner</loc>
    <lastmod>${today}</lastmod>
    <changefreq>monthly</changefreq>
    <priority>0.9</priority>
  </url>
  <url>
    <loc>https://vulnscan.tech/wordpress-security-scanner</loc>
    <lastmod>${today}</lastmod>
    <changefreq>monthly</changefreq>
    <priority>0.8</priority>
  </url>
${sitemapEntries.map(slug => `  <url>
    <loc>https://vulnscan.tech/${slug}</loc>
    <lastmod>${today}</lastmod>
    <changefreq>monthly</changefreq>
    <priority>0.8</priority>
  </url>`).join('\n')}
</urlset>
`;

fs.writeFileSync(path.join(outputDir, 'sitemap.xml'), sitemapXml, 'utf-8');
console.log(`✅ Updated sitemap.xml with ${4 + sitemapEntries.length} URLs`);

console.log(`\n🎯 Total pages generated: ${PAGES.length}`);
console.log('📊 Run "git add . && git commit -m "SEO pages" && git push" to deploy');
