"""
VulnScan Python Scanner — Replaces nuclei for Cloud Run
Fast, reliable security checks using pure Python (no binary dependencies)
Checks: Security headers, SSL/TLS, DNS records, tech disclosure
"""
import ssl
import socket
import json
import re
from urllib.request import urlopen, Request
from urllib.error import URLError, HTTPError
from datetime import datetime


def scan_domain(domain):
    """Run all security checks on a domain. Returns list of vulnerability dicts."""
    vulns = []
    url = f'https://{domain}'

    # Step 1: HTTP headers check
    headers = {}
    server_info = {}
    try:
        req = Request(url, headers={'User-Agent': 'VulnScan Security Scanner/1.0'})
        resp = urlopen(req, timeout=15)
        headers = {k.lower(): v for k, v in resp.getheaders()}
        server_info['status'] = resp.status
        server_info['url'] = resp.url
    except HTTPError as e:
        headers = {k.lower(): v for k, v in e.headers.items()}
        server_info['status'] = e.code
    except Exception as e:
        # Try HTTP fallback
        try:
            req = Request(f'http://{domain}', headers={'User-Agent': 'VulnScan Security Scanner/1.0'})
            resp = urlopen(req, timeout=15)
            headers = {k.lower(): v for k, v in resp.getheaders()}
            server_info['status'] = resp.status
            vulns.append({
                'template_id': 'no-https',
                'name': 'HTTPS Not Available',
                'severity': 'high',
                'url': f'http://{domain}',
                'description': f'The site does not support HTTPS. All traffic is sent unencrypted.',
            })
        except:
            pass

    # ═══════ SECURITY HEADERS ═══════
    if headers:
        # Content-Security-Policy
        if 'content-security-policy' not in headers:
            vulns.append({
                'template_id': 'missing-csp',
                'name': 'Missing Content-Security-Policy Header',
                'severity': 'high',
                'url': url,
                'description': 'No Content-Security-Policy header found. This leaves your site vulnerable to cross-site scripting (XSS) attacks.',
            })

        # X-Frame-Options
        if 'x-frame-options' not in headers:
            vulns.append({
                'template_id': 'missing-x-frame-options',
                'name': 'Missing X-Frame-Options Header',
                'severity': 'high',
                'url': url,
                'description': 'X-Frame-Options header is missing. Your site can be embedded in iframes, enabling clickjacking attacks.',
            })

        # Strict-Transport-Security (HSTS)
        if 'strict-transport-security' not in headers:
            vulns.append({
                'template_id': 'missing-hsts',
                'name': 'Missing HSTS Header',
                'severity': 'medium',
                'url': url,
                'description': 'Strict-Transport-Security header not set. Users can be downgraded to HTTP via SSL stripping attacks.',
            })
        else:
            hsts = headers['strict-transport-security']
            if 'max-age' in hsts:
                try:
                    age = int(re.search(r'max-age=(\d+)', hsts).group(1))
                    if age < 31536000:
                        vulns.append({
                            'template_id': 'weak-hsts',
                            'name': 'Weak HSTS Max-Age',
                            'severity': 'low',
                            'url': url,
                            'description': f'HSTS max-age is {age} seconds ({age//86400} days). Should be at least 31536000 (1 year).',
                        })
                except:
                    pass

        # X-Content-Type-Options
        if 'x-content-type-options' not in headers:
            vulns.append({
                'template_id': 'missing-xcto',
                'name': 'Missing X-Content-Type-Options Header',
                'severity': 'medium',
                'url': url,
                'description': 'X-Content-Type-Options header not set. Browsers may MIME-sniff content, enabling XSS via file uploads.',
            })

        # Permissions-Policy / Feature-Policy
        if 'permissions-policy' not in headers and 'feature-policy' not in headers:
            vulns.append({
                'template_id': 'missing-permissions-policy',
                'name': 'Missing Permissions-Policy Header',
                'severity': 'medium',
                'url': url,
                'description': 'No Permissions-Policy header. Third-party scripts could access camera, microphone, and location.',
            })

        # Referrer-Policy
        if 'referrer-policy' not in headers:
            vulns.append({
                'template_id': 'missing-referrer-policy',
                'name': 'Missing Referrer-Policy Header',
                'severity': 'low',
                'url': url,
                'description': 'Referrer-Policy not set. Full URLs (including query strings with tokens) may leak to third parties.',
            })

        # Server header disclosure
        if 'server' in headers and headers['server'] not in ('', 'cloudflare'):
            vulns.append({
                'template_id': 'tech-disclosure',
                'name': 'Server Technology Disclosed',
                'severity': 'low',
                'url': url,
                'description': f'Server header reveals: "{headers["server"]}". This helps attackers find CVEs for your exact version.',
            })

        # X-Powered-By disclosure
        if 'x-powered-by' in headers:
            vulns.append({
                'template_id': 'tech-disclosure',
                'name': 'X-Powered-By Technology Disclosed',
                'severity': 'low',
                'url': url,
                'description': f'X-Powered-By header reveals: "{headers["x-powered-by"]}". Attackers can target known vulnerabilities.',
            })

        # CORS misconfiguration
        if 'access-control-allow-origin' in headers:
            origin = headers['access-control-allow-origin']
            if origin == '*':
                vulns.append({
                    'template_id': 'cors-wildcard',
                    'name': 'CORS Wildcard Origin',
                    'severity': 'medium',
                    'url': url,
                    'description': 'Access-Control-Allow-Origin is set to "*". Any website can make authenticated requests to your API.',
                })

    # ═══════ SSL/TLS CHECKS ═══════
    try:
        ctx = ssl.create_default_context()
        with ctx.wrap_socket(socket.socket(), server_hostname=domain) as s:
            s.settimeout(10)
            s.connect((domain, 443))
            cert = s.getpeercert()
            cipher = s.cipher()
            version = s.version()

            # Check certificate expiry
            if cert:
                not_after = datetime.strptime(cert['notAfter'], '%b %d %H:%M:%S %Y %Z')
                days_left = (not_after - datetime.utcnow()).days
                if days_left < 30:
                    vulns.append({
                        'template_id': 'ssl-cert-expiring',
                        'name': 'SSL Certificate Expiring Soon',
                        'severity': 'high' if days_left < 7 else 'medium',
                        'url': url,
                        'description': f'SSL certificate expires in {days_left} days ({not_after.strftime("%Y-%m-%d")}). Expired certificates cause browser warnings and lost customers.',
                    })

            # Check TLS version
            if version and version in ('TLSv1', 'TLSv1.1'):
                vulns.append({
                    'template_id': 'deprecated-tls',
                    'name': f'Deprecated TLS Version ({version})',
                    'severity': 'high',
                    'url': url,
                    'description': f'Site supports {version} which is deprecated and insecure. PCI DSS requires TLS 1.2+.',
                })

    except ssl.SSLError as e:
        vulns.append({
            'template_id': 'ssl-error',
            'name': 'SSL/TLS Configuration Error',
            'severity': 'high',
            'url': url,
            'description': f'SSL error: {str(e)[:200]}',
        })
    except Exception:
        pass

    # ═══════ DNS CHECKS ═══════
    try:
        import subprocess
        # Check SPF record
        spf_result = subprocess.run(['nslookup', '-type=txt', domain], capture_output=True, text=True, timeout=10)
        spf_output = spf_result.stdout + spf_result.stderr
        if 'v=spf1' not in spf_output.lower():
            vulns.append({
                'template_id': 'missing-spf',
                'name': 'Missing SPF Record',
                'severity': 'medium',
                'url': domain,
                'description': 'No SPF (Sender Policy Framework) DNS record found. Anyone can send emails pretending to be from your domain.',
            })

        # Check DMARC record
        dmarc_result = subprocess.run(['nslookup', '-type=txt', f'_dmarc.{domain}'], capture_output=True, text=True, timeout=10)
        dmarc_output = dmarc_result.stdout + dmarc_result.stderr
        if 'v=dmarc1' not in dmarc_output.lower():
            vulns.append({
                'template_id': 'missing-dmarc',
                'name': 'Missing DMARC Record',
                'severity': 'medium',
                'url': domain,
                'description': 'No DMARC record found. Email spoofing attacks from your domain cannot be detected or blocked.',
            })

        # Check CAA record
        caa_result = subprocess.run(['nslookup', '-type=caa', domain], capture_output=True, text=True, timeout=10)
        caa_output = caa_result.stdout + caa_result.stderr
        if 'issue' not in caa_output.lower() or 'no caa' in caa_output.lower():
            vulns.append({
                'template_id': 'dns-caa-missing',
                'name': 'Missing CAA DNS Record',
                'severity': 'low',
                'url': domain,
                'description': 'No CAA record restricting which Certificate Authorities can issue SSL certificates for your domain.',
            })
    except Exception:
        pass

    return vulns
