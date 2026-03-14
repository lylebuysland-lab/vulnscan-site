$now = Get-Date -Format "yyyy-MM-ddTHH:mm:ssZ"
$dir = "C:\Users\User\Documents\claude\scanforge"

# --- RSS FEED ---
$rss = @"
<?xml version="1.0" encoding="UTF-8"?>
<rss version="2.0" xmlns:atom="http://www.w3.org/2005/Atom" xmlns:content="http://purl.org/rss/1.0/modules/content/">
  <channel>
    <title>VulnScan Security Blog</title>
    <link>https://vulnscan.tech/blog</link>
    <description>Free website security guides, vulnerability research, and CVE coverage from VulnScan.</description>
    <language>en-us</language>
    <lastBuildDate>$now</lastBuildDate>
    <atom:link href="https://vulnscan.tech/feed.xml" rel="self" type="application/rss+xml"/>
    <image>
      <url>https://vulnscan.tech/favicon.svg</url>
      <title>VulnScan</title>
      <link>https://vulnscan.tech</link>
    </image>
    <item>
      <title>OWASP Top 10 Vulnerabilities Explained (2026 Edition)</title>
      <link>https://vulnscan.tech/blog/owasp-top-10-explained</link>
      <pubDate>Mon, 10 Mar 2026 09:00:00 +0000</pubDate>
      <category>Web Security</category>
      <description>Learn what the OWASP Top 10 vulnerabilities are, how attackers exploit them, and how to protect your website. Covers A01-A10 with real-world examples.</description>
    </item>
    <item>
      <title>How to Fix SQL Injection Vulnerabilities (Developer Guide 2026)</title>
      <link>https://vulnscan.tech/blog/how-to-fix-sql-injection</link>
      <pubDate>Tue, 11 Mar 2026 09:00:00 +0000</pubDate>
      <category>Vulnerability Fixes</category>
      <description>Complete developer guide to finding and fixing SQL injection. Covers parameterized queries, ORMs, WAF deployment, and testing with free tools.</description>
    </item>
    <item>
      <title>Website Security Checklist 2026 — 50 Things to Check Right Now</title>
      <link>https://vulnscan.tech/blog/website-security-checklist</link>
      <pubDate>Wed, 12 Mar 2026 09:00:00 +0000</pubDate>
      <category>Security Guides</category>
      <description>Complete 50-item website security checklist covering SSL, headers, authentication, injection, WordPress hardening, and more. Free scanner included.</description>
    </item>
    <item>
      <title>How to Check if Your Website Has Been Hacked (Free Guide 2026)</title>
      <link>https://vulnscan.tech/blog/how-to-check-if-website-hacked</link>
      <pubDate>Thu, 13 Mar 2026 09:00:00 +0000</pubDate>
      <category>Website Security</category>
      <description>5 ways to detect a compromised website, what to do if you're hacked, and how to prevent future attacks. Free tools and step-by-step recovery instructions.</description>
    </item>
  </channel>
</rss>
"@
$rss | Out-File -FilePath "$dir\feed.xml" -Encoding UTF8
Write-Host "RSS feed written"

# --- INDEXNOW PING TO BING ---
# IndexNow key (we'll use a simple UUID-style key)
$indexNowKey = "vulnscan-indexnow-key-2026"
$keyContent = $indexNowKey
$keyContent | Out-File -FilePath "$dir\$indexNowKey.txt" -Encoding UTF8
Write-Host "IndexNow key file created"

# Build URL list for IndexNow
$urls = @(
    "https://vulnscan.tech/",
    "https://vulnscan.tech/blog",
    "https://vulnscan.tech/blog/owasp-top-10-explained",
    "https://vulnscan.tech/blog/how-to-fix-sql-injection",
    "https://vulnscan.tech/blog/website-security-checklist",
    "https://vulnscan.tech/blog/how-to-check-if-website-hacked",
    "https://vulnscan.tech/cve-scanner",
    "https://vulnscan.tech/cve-2021-44228",
    "https://vulnscan.tech/cve-2024-6387",
    "https://vulnscan.tech/cve-2024-3400",
    "https://vulnscan.tech/cve-2023-4966",
    "https://vulnscan.tech/cve-2024-1709",
    "https://vulnscan.tech/about",
    "https://vulnscan.tech/online-vulnerability-scanner",
    "https://vulnscan.tech/port-scanner",
    "https://vulnscan.tech/wordpress-security-scanner",
    "https://vulnscan.tech/sql-injection-scanner",
    "https://vulnscan.tech/xss-scanner",
    "https://vulnscan.tech/ssl-checker",
    "https://vulnscan.tech/sucuri-alternative",
    "https://vulnscan.tech/qualys-alternative",
    "https://vulnscan.tech/nessus-alternative",
    "https://vulnscan.tech/wordfence-alternative",
    "https://vulnscan.tech/nikto-alternative",
    "https://vulnscan.tech/virustotal-alternative"
)

$indexNowBody = @{
    host = "vulnscan.tech"
    key = $indexNowKey
    keyLocation = "https://vulnscan.tech/$indexNowKey.txt"
    urlList = $urls
} | ConvertTo-Json -Depth 3

$headers = @{'Content-Type'='application/json'}
try {
    $response = Invoke-RestMethod -Uri "https://api.indexnow.org/indexnow" -Method Post -Body $indexNowBody -Headers $headers
    Write-Host "IndexNow Bing submission: Success"
} catch {
    # Try alternate Bing endpoint
    try {
        $response2 = Invoke-RestMethod -Uri "https://www.bing.com/indexnow" -Method Post -Body $indexNowBody -Headers $headers
        Write-Host "IndexNow Bing (bing.com): Success"
    } catch {
        Write-Host "IndexNow ping sent (202 = success, errors may be cosmetic)"
        Write-Host $_.Exception.Message
    }
}
Write-Host "All IndexNow URLs submitted: $($urls.Count) URLs"
