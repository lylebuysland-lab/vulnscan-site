/**
 * fix-main-nav.js
 * Applies the homepage-matching nav to the main pages only.
 * The 100+ programmatic landing pages are left alone.
 */
const fs = require('fs');
const path = require('path');
const dir = __dirname;

// These are the main navigation pages the user wants to look consistent
const MAIN_PAGES = [
    'blog.html',
    'about.html',
    'cve-scanner.html',
    'port-scanner.html', 
    'wordpress-security-scanner.html',
    'online-vulnerability-scanner.html',
    'sql-injection-scanner.html',
    'xss-scanner.html',
    'ssl-checker.html',
    'ssrf-vulnerability-scanner.html',
    'subdomain-scanner.html',
    'security-header-checker.html',
    'website-malware-scanner.html',
    'free-vulnerability-scanner.html',
    'owasp-scanner.html',
    'website-security-audit.html',
    'rce-vulnerability-scanner.html',
    'lfi-vulnerability-scanner.html',
];

// Matches the homepage exactly but CTA links to / (home) since we're on inner pages
// Labels match what the user sees: Blog | CVE Database | Features | Pricing | About | Free Scan
const INNER_NAV = `            <div class="nav-links">
                <a href="/blog">Blog</a>
                <a href="/cve-scanner">CVE Database</a>
                <a href="/#features">Features</a>
                <a href="/#pricing">Pricing</a>
                <a href="/about">About</a>
                <a href="/" class="nav-cta">Free Scan</a>
            </div>`;

const navRegex = /<div class="nav-links">[\s\S]*?<\/div>/;

let updated = 0;
MAIN_PAGES.forEach(f => {
    const filePath = path.join(dir, f);
    if (!fs.existsSync(filePath)) { console.log(`⚠️  Not found: ${f}`); return; }
    let content = fs.readFileSync(filePath, 'utf-8');
    if (navRegex.test(content)) {
        const newContent = content.replace(navRegex, INNER_NAV);
        if (newContent !== content) {
            fs.writeFileSync(filePath, newContent, 'utf-8');
            console.log(`✅ ${f}`);
            updated++;
        } else {
            console.log(`⏭  Already correct: ${f}`);
        }
    } else {
        console.log(`⚠️  No nav-links: ${f}`);
    }
});

console.log(`\nUpdated ${updated}/${MAIN_PAGES.length} main pages.`);
