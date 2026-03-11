"""
Generate sample report for downeastcabinets.com
"""
import os, sys
sys.path.insert(0, os.path.dirname(__file__))
from datetime import datetime
from report_v2 import generate_report

sample = {
    'domain': 'downeastcabinets.com',
    'scan_date': datetime.now().isoformat(),
    'subdomains': [
        'downeastcabinets.com',
        'www.downeastcabinets.com',
        'mail.downeastcabinets.com',
        'webmail.downeastcabinets.com',
        'cpanel.downeastcabinets.com',
        'ftp.downeastcabinets.com',
        'autodiscover.downeastcabinets.com',
        'shop.downeastcabinets.com',
    ],
    'live_hosts': [
        {'url': 'https://downeastcabinets.com', 'input': 'downeastcabinets.com', 'status_code': 200},
        {'url': 'https://www.downeastcabinets.com', 'input': 'www.downeastcabinets.com', 'status_code': 200},
        {'url': 'https://mail.downeastcabinets.com', 'input': 'mail.downeastcabinets.com', 'status_code': 200},
        {'url': 'https://cpanel.downeastcabinets.com', 'input': 'cpanel.downeastcabinets.com', 'status_code': 200},
    ],
    'technologies': [
        'Apache', 'PHP 8.1', 'jQuery 3.6', 'WordPress 6.4', 'MySQL', 
        'cPanel', 'Let\'s Encrypt SSL', 'WooCommerce', 'Cloudflare'
    ],
    'vulnerabilities': [
        {
            'name': 'WordPress XML-RPC Pingback Amplification',
            'severity': 'high',
            'url': 'https://downeastcabinets.com/xmlrpc.php',
            'cve_id': 'CVE-2013-0235',
            'cvss_score': '7.5',
            'template_id': 'wordpress-xmlrpc-pingback',
            'description': 'The XML-RPC interface is enabled and accessible, allowing attackers to perform DDoS amplification attacks, brute-force credentials, and enumerate users. This endpoint accepts pingback requests that can be weaponized against third-party targets, potentially implicating your server in attacks.',
            'reference': ['https://owasp.org/www-community/attacks/XML_External_Entity', 'https://www.wordfence.com/learn/what-is-xmlrpc/']
        },
        {
            'name': 'Exposed WordPress Login with No Rate Limiting',
            'severity': 'high',
            'url': 'https://downeastcabinets.com/wp-login.php',
            'template_id': 'wordpress-login-exposed',
            'cvss_score': '7.3',
            'description': 'The WordPress login page is publicly accessible at the default URL without any brute-force protection or CAPTCHA. Automated credential stuffing attacks could compromise administrator accounts. No evidence of login attempt rate limiting or account lockout policies was detected.',
            'reference': ['https://owasp.org/www-community/attacks/Brute_force_attack']
        },
        {
            'name': 'Missing Content-Security-Policy Header',
            'severity': 'medium',
            'url': 'https://downeastcabinets.com',
            'template_id': 'missing-csp-header',
            'cvss_score': '5.4',
            'description': 'The web application does not set a Content-Security-Policy (CSP) header. Without CSP, the browser cannot distinguish between trusted and untrusted content sources, making the site vulnerable to Cross-Site Scripting (XSS) attacks, clickjacking, and other code injection techniques.',
            'reference': ['https://developer.mozilla.org/en-US/docs/Web/HTTP/CSP']
        },
        {
            'name': 'Missing X-Frame-Options Header',
            'severity': 'medium',
            'url': 'https://downeastcabinets.com',
            'template_id': 'missing-x-frame-options',
            'cvss_score': '4.3',
            'description': 'The X-Frame-Options header is not set, which could allow attackers to embed your website in an iframe on a malicious page. This enables clickjacking attacks where users are tricked into performing unintended actions on your site, such as making purchases or changing account settings.',
            'reference': ['https://owasp.org/www-community/attacks/Clickjacking']
        },
        {
            'name': 'WordPress Version Disclosure',
            'severity': 'medium',
            'url': 'https://downeastcabinets.com',
            'template_id': 'wordpress-version-detect',
            'cvss_score': '3.7',
            'description': 'The exact WordPress version is exposed through meta tags, RSS feeds, and readme files. Attackers use version information to identify known vulnerabilities specific to your WordPress installation, significantly reducing the effort required for a targeted attack.',
        },
        {
            'name': 'Directory Listing Enabled on Uploads',
            'severity': 'medium',
            'url': 'https://downeastcabinets.com/wp-content/uploads/',
            'template_id': 'directory-listing-enabled',
            'cvss_score': '5.3',
            'description': 'Directory listing is enabled on the uploads folder, exposing all uploaded files including images, documents, and potentially sensitive business files. Attackers can browse and download any file in this directory without authentication.',
        },
        {
            'name': 'Deprecated TLS 1.0/1.1 Protocol Supported',
            'severity': 'low',
            'url': 'https://mail.downeastcabinets.com',
            'template_id': 'tls-deprecated-version',
            'cvss_score': '3.4',
            'description': 'The mail server supports deprecated TLS 1.0 and 1.1 protocols which have known cryptographic weaknesses. Modern browsers and security standards require TLS 1.2 or higher. Supporting old protocols increases exposure to BEAST, POODLE, and other downgrade attacks.',
        },
        {
            'name': 'cPanel Login Portal Publicly Accessible',
            'severity': 'low',
            'url': 'https://cpanel.downeastcabinets.com:2083',
            'template_id': 'cpanel-detect',
            'cvss_score': '3.1',
            'description': 'The cPanel server management interface is accessible from the public internet. While protected by authentication, exposing administrative panels increases the attack surface and enables targeted brute-force and credential stuffing attacks against the hosting control panel.',
        },
        {
            'name': 'DNS CAA Record Not Configured',
            'severity': 'info',
            'url': 'downeastcabinets.com',
            'template_id': 'dns-caa-missing',
            'description': 'No Certificate Authority Authorization (CAA) DNS records are configured. Without CAA records, any certificate authority can issue SSL/TLS certificates for your domain, increasing the risk of unauthorized certificate issuance in the event of a domain validation bypass.',
        },
        {
            'name': 'HTTP to HTTPS Redirect Detected',
            'severity': 'info',
            'url': 'http://downeastcabinets.com',
            'template_id': 'http-redirect-https',
            'description': 'The server correctly redirects HTTP traffic to HTTPS. However, the initial HTTP request is unencrypted and could be intercepted by an attacker performing a man-in-the-middle attack. Implementing HSTS would prevent this initial unencrypted request on subsequent visits.',
        },
    ],
    'summary': {
        'total_subdomains': 8,
        'total_live_hosts': 4,
        'total_vulnerabilities': 10,
        'technologies': ['Apache', 'PHP 8.1', 'jQuery 3.6', 'WordPress 6.4', 'MySQL', 'cPanel', "Let's Encrypt SSL", 'WooCommerce', 'Cloudflare'],
        'vulnerability_breakdown': {'critical': 0, 'high': 2, 'medium': 4, 'low': 2, 'info': 2},
        'risk_score': 48,
    }
}

out = os.path.join(os.path.dirname(__file__), '..', 'sample_downeast.pdf')
generate_report(sample, out)
print(f"\nReport: {os.path.abspath(out)}")
