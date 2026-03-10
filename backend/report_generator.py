"""
VulnScan.tech — Automated Security Report Generator
Generates professional PDF reports from scan results and emails them to clients.
Zero personal information — everything is branded under VulnScan.
"""

import os
import json
import smtplib
import subprocess
from datetime import datetime
from email.mime.multipart import MIMEMultipart
from email.mime.base import MIMEBase
from email.mime.text import MIMEText
from email import encoders
from pathlib import Path

from reportlab.lib import colors
from reportlab.lib.pagesizes import letter
from reportlab.lib.styles import getSampleStyleSheet, ParagraphStyle
from reportlab.lib.units import inch
from reportlab.platypus import (
    SimpleDocTemplate, Paragraph, Spacer, Table, TableStyle,
    PageBreak, HRFlowable, Image
)
from reportlab.lib.enums import TA_CENTER, TA_LEFT, TA_RIGHT

# ============================================
# CONFIG — Update with your Zoho Mail creds
# ============================================
EMAIL_CONFIG = {
    'smtp_server': 'smtp.zoho.com',
    'smtp_port': 587,
    'sender_email': 'reports@vulnscan.tech',
    'sender_password': os.environ.get('VULNSCAN_EMAIL_PASS', ''),
    'sender_name': 'VulnScan Security',
}

# Brand colors
BRAND = {
    'primary': colors.HexColor('#6366f1'),
    'secondary': colors.HexColor('#8b5cf6'),
    'dark': colors.HexColor('#0a0a0f'),
    'text': colors.HexColor('#333333'),
    'muted': colors.HexColor('#666666'),
    'danger': colors.HexColor('#ef4444'),
    'warning': colors.HexColor('#f59e0b'),
    'success': colors.HexColor('#22c55e'),
    'info': colors.HexColor('#3b82f6'),
}

SEVERITY_COLORS = {
    'critical': colors.HexColor('#dc2626'),
    'high': colors.HexColor('#ef4444'),
    'medium': colors.HexColor('#f59e0b'),
    'low': colors.HexColor('#3b82f6'),
    'info': colors.HexColor('#6b7280'),
}


def run_scan(domain: str, output_dir: str) -> dict:
    """Run the full scanning pipeline on a domain and return results."""
    os.makedirs(output_dir, exist_ok=True)
    results = {
        'domain': domain,
        'scan_date': datetime.now().isoformat(),
        'subdomains': [],
        'live_hosts': [],
        'technologies': [],
        'vulnerabilities': [],
        'ssl_issues': [],
        'summary': {},
    }

    # Step 1: Subdomain enumeration
    print(f"[*] Enumerating subdomains for {domain}...")
    try:
        sub_file = os.path.join(output_dir, 'subdomains.txt')
        subprocess.run(
            ['subfinder', '-d', domain, '-silent', '-o', sub_file],
            timeout=120, capture_output=True, text=True
        )
        if os.path.exists(sub_file):
            with open(sub_file) as f:
                results['subdomains'] = [l.strip() for l in f if l.strip()]
    except Exception as e:
        print(f"[!] Subfinder error: {e}")

    # Step 2: Live host detection
    print(f"[*] Probing live hosts...")
    try:
        live_file = os.path.join(output_dir, 'live_hosts.txt')
        sub_input = '\n'.join(results['subdomains']) if results['subdomains'] else domain
        proc = subprocess.run(
            ['httpx', '-silent', '-status-code', '-tech-detect', '-json', '-o', live_file],
            input=sub_input, timeout=180, capture_output=True, text=True
        )
        if os.path.exists(live_file):
            with open(live_file) as f:
                for line in f:
                    try:
                        host_data = json.loads(line.strip())
                        results['live_hosts'].append(host_data)
                        # Extract technologies
                        if 'tech' in host_data:
                            results['technologies'].extend(host_data['tech'])
                    except json.JSONDecodeError:
                        pass
    except Exception as e:
        print(f"[!] httpx error: {e}")

    # Step 3: Vulnerability scanning with Nuclei
    print(f"[*] Running vulnerability scan...")
    try:
        vuln_file = os.path.join(output_dir, 'vulnerabilities.json')
        targets = [h.get('url', h.get('input', '')) for h in results['live_hosts']]
        if not targets:
            targets = [f"https://{domain}", f"http://{domain}"]
        target_file = os.path.join(output_dir, 'targets.txt')
        with open(target_file, 'w') as f:
            f.write('\n'.join(targets))

        subprocess.run(
            ['nuclei', '-l', target_file, '-severity', 'critical,high,medium,low',
             '-json', '-o', vuln_file, '-rate-limit', '50', '-c', '10',
             '-timeout', '5', '-retries', '1'],
            timeout=600, capture_output=True, text=True
        )
        if os.path.exists(vuln_file):
            with open(vuln_file) as f:
                for line in f:
                    try:
                        vuln = json.loads(line.strip())
                        results['vulnerabilities'].append({
                            'name': vuln.get('info', {}).get('name', 'Unknown'),
                            'severity': vuln.get('info', {}).get('severity', 'info'),
                            'description': vuln.get('info', {}).get('description', ''),
                            'url': vuln.get('matched-at', vuln.get('host', '')),
                            'template_id': vuln.get('template-id', ''),
                            'tags': vuln.get('info', {}).get('tags', []),
                            'reference': vuln.get('info', {}).get('reference', []),
                            'cvss_score': vuln.get('info', {}).get('classification', {}).get('cvss-score', ''),
                            'cve_id': vuln.get('info', {}).get('classification', {}).get('cve-id', ''),
                        })
                    except json.JSONDecodeError:
                        pass
    except Exception as e:
        print(f"[!] Nuclei error: {e}")

    # Build summary
    vuln_counts = {'critical': 0, 'high': 0, 'medium': 0, 'low': 0, 'info': 0}
    for v in results['vulnerabilities']:
        sev = v.get('severity', 'info').lower()
        vuln_counts[sev] = vuln_counts.get(sev, 0) + 1

    results['summary'] = {
        'total_subdomains': len(results['subdomains']),
        'total_live_hosts': len(results['live_hosts']),
        'total_vulnerabilities': len(results['vulnerabilities']),
        'technologies': list(set(results['technologies']))[:20],
        'vulnerability_breakdown': vuln_counts,
        'risk_score': min(100, vuln_counts['critical'] * 25 + vuln_counts['high'] * 15 +
                         vuln_counts['medium'] * 5 + vuln_counts['low'] * 1),
    }

    # Save full results
    with open(os.path.join(output_dir, 'results.json'), 'w') as f:
        json.dump(results, f, indent=2)

    print(f"[+] Scan complete: {results['summary']}")
    return results


def generate_pdf(results: dict, output_path: str) -> str:
    """Generate a professional PDF security report."""
    doc = SimpleDocTemplate(
        output_path, pagesize=letter,
        topMargin=0.6*inch, bottomMargin=0.6*inch,
        leftMargin=0.75*inch, rightMargin=0.75*inch
    )

    styles = getSampleStyleSheet()

    # Custom styles
    styles.add(ParagraphStyle('BrandTitle', parent=styles['Title'],
        fontSize=28, textColor=BRAND['primary'], spaceAfter=6,
        fontName='Helvetica-Bold'))
    styles.add(ParagraphStyle('SectionHead', parent=styles['Heading1'],
        fontSize=18, textColor=BRAND['primary'], spaceBefore=20,
        spaceAfter=10, fontName='Helvetica-Bold'))
    styles.add(ParagraphStyle('SubHead', parent=styles['Heading2'],
        fontSize=14, textColor=BRAND['text'], spaceBefore=12,
        spaceAfter=6, fontName='Helvetica-Bold'))
    styles.add(ParagraphStyle('BodyText2', parent=styles['Normal'],
        fontSize=10, textColor=BRAND['text'], spaceAfter=6,
        leading=14))
    styles.add(ParagraphStyle('SmallMuted', parent=styles['Normal'],
        fontSize=8, textColor=BRAND['muted'], spaceAfter=4))
    styles.add(ParagraphStyle('CenterText', parent=styles['Normal'],
        fontSize=10, alignment=TA_CENTER, textColor=BRAND['muted']))

    elements = []
    summary = results.get('summary', {})
    domain = results.get('domain', 'Unknown')
    scan_date = datetime.fromisoformat(results.get('scan_date', datetime.now().isoformat()))

    # ── COVER PAGE ──
    elements.append(Spacer(1, 1.5*inch))
    elements.append(Paragraph("⚡ VULNSCAN", styles['BrandTitle']))
    elements.append(Paragraph("SECURITY ASSESSMENT REPORT", ParagraphStyle(
        'CoverSub', parent=styles['Normal'], fontSize=14,
        textColor=BRAND['muted'], spaceAfter=30, fontName='Helvetica')))
    elements.append(HRFlowable(width="100%", thickness=2, color=BRAND['primary']))
    elements.append(Spacer(1, 0.3*inch))

    # Report meta
    meta_data = [
        ['Target Domain:', domain],
        ['Scan Date:', scan_date.strftime('%B %d, %Y at %H:%M UTC')],
        ['Report ID:', f"VS-{scan_date.strftime('%Y%m%d')}-{abs(hash(domain)) % 10000:04d}"],
        ['Classification:', 'CONFIDENTIAL'],
    ]
    meta_table = Table(meta_data, colWidths=[1.8*inch, 4.5*inch])
    meta_table.setStyle(TableStyle([
        ('FONTNAME', (0, 0), (0, -1), 'Helvetica-Bold'),
        ('FONTSIZE', (0, 0), (-1, -1), 11),
        ('TEXTCOLOR', (0, 0), (0, -1), BRAND['primary']),
        ('TEXTCOLOR', (1, 0), (1, -1), BRAND['text']),
        ('BOTTOMPADDING', (0, 0), (-1, -1), 8),
        ('VALIGN', (0, 0), (-1, -1), 'MIDDLE'),
    ]))
    elements.append(meta_table)
    elements.append(Spacer(1, 0.5*inch))

    # Risk score box
    risk = summary.get('risk_score', 0)
    risk_color = BRAND['success'] if risk < 30 else BRAND['warning'] if risk < 70 else BRAND['danger']
    risk_label = 'LOW RISK' if risk < 30 else 'MEDIUM RISK' if risk < 70 else 'HIGH RISK'

    risk_data = [[
        Paragraph(f"<font size=36 color='{risk_color.hexval()}'><b>{risk}</b></font>", styles['Normal']),
        Paragraph(f"<font size=16><b>{risk_label}</b></font><br/>"
                  f"<font size=9 color='#666666'>Overall Security Score (0-100)</font>", styles['Normal']),
    ]]
    risk_table = Table(risk_data, colWidths=[1.5*inch, 4.8*inch])
    risk_table.setStyle(TableStyle([
        ('BACKGROUND', (0, 0), (-1, -1), colors.HexColor('#f8f9fa')),
        ('BOX', (0, 0), (-1, -1), 1, risk_color),
        ('LEFTPADDING', (0, 0), (-1, -1), 20),
        ('RIGHTPADDING', (0, 0), (-1, -1), 20),
        ('TOPPADDING', (0, 0), (-1, -1), 15),
        ('BOTTOMPADDING', (0, 0), (-1, -1), 15),
        ('VALIGN', (0, 0), (-1, -1), 'MIDDLE'),
        ('ALIGN', (0, 0), (0, 0), 'CENTER'),
        ('ROUNDEDCORNERS', [8, 8, 8, 8]),
    ]))
    elements.append(risk_table)
    elements.append(PageBreak())

    # ── EXECUTIVE SUMMARY ──
    elements.append(Paragraph("Executive Summary", styles['SectionHead']))
    elements.append(HRFlowable(width="100%", thickness=1, color=BRAND['primary']))
    elements.append(Spacer(1, 0.2*inch))

    exec_text = (
        f"A comprehensive security assessment was conducted on <b>{domain}</b> "
        f"on {scan_date.strftime('%B %d, %Y')}. The assessment identified "
        f"<b>{summary.get('total_subdomains', 0)} subdomains</b> and "
        f"<b>{summary.get('total_live_hosts', 0)} live hosts</b> within the target's "
        f"external attack surface. A total of "
        f"<b>{summary.get('total_vulnerabilities', 0)} security findings</b> were "
        f"identified across all severity levels."
    )
    elements.append(Paragraph(exec_text, styles['BodyText2']))
    elements.append(Spacer(1, 0.2*inch))

    # Vulnerability breakdown table
    vb = summary.get('vulnerability_breakdown', {})
    vuln_table_data = [
        ['Severity', 'Count', 'Status'],
        ['🔴 Critical', str(vb.get('critical', 0)),
         'IMMEDIATE ACTION' if vb.get('critical', 0) > 0 else 'Clear'],
        ['🟠 High', str(vb.get('high', 0)),
         'ACTION REQUIRED' if vb.get('high', 0) > 0 else 'Clear'],
        ['🟡 Medium', str(vb.get('medium', 0)),
         'Review Recommended' if vb.get('medium', 0) > 0 else 'Clear'],
        ['🔵 Low', str(vb.get('low', 0)),
         'Informational' if vb.get('low', 0) > 0 else 'Clear'],
        ['⚪ Info', str(vb.get('info', 0)), 'Noted'],
    ]
    vt = Table(vuln_table_data, colWidths=[2.2*inch, 1.5*inch, 2.6*inch])
    vt.setStyle(TableStyle([
        ('BACKGROUND', (0, 0), (-1, 0), BRAND['primary']),
        ('TEXTCOLOR', (0, 0), (-1, 0), colors.white),
        ('FONTNAME', (0, 0), (-1, 0), 'Helvetica-Bold'),
        ('FONTSIZE', (0, 0), (-1, -1), 10),
        ('ALIGN', (1, 0), (1, -1), 'CENTER'),
        ('GRID', (0, 0), (-1, -1), 0.5, colors.HexColor('#e0e0e0')),
        ('ROWBACKGROUNDS', (0, 1), (-1, -1), [colors.white, colors.HexColor('#f8f9fa')]),
        ('TOPPADDING', (0, 0), (-1, -1), 8),
        ('BOTTOMPADDING', (0, 0), (-1, -1), 8),
    ]))
    elements.append(vt)
    elements.append(Spacer(1, 0.3*inch))

    # ── ATTACK SURFACE ──
    elements.append(Paragraph("Attack Surface Overview", styles['SectionHead']))
    elements.append(HRFlowable(width="100%", thickness=1, color=BRAND['primary']))
    elements.append(Spacer(1, 0.2*inch))
    elements.append(Paragraph(
        f"The following <b>{summary.get('total_subdomains', 0)} subdomains</b> "
        f"were discovered during enumeration:", styles['BodyText2']))

    # List subdomains (max 50)
    subs = results.get('subdomains', [])[:50]
    if subs:
        sub_data = [['#', 'Subdomain']]
        for i, s in enumerate(subs, 1):
            sub_data.append([str(i), s])
        st = Table(sub_data, colWidths=[0.5*inch, 5.8*inch])
        st.setStyle(TableStyle([
            ('BACKGROUND', (0, 0), (-1, 0), BRAND['primary']),
            ('TEXTCOLOR', (0, 0), (-1, 0), colors.white),
            ('FONTNAME', (0, 0), (-1, 0), 'Helvetica-Bold'),
            ('FONTNAME', (1, 1), (1, -1), 'Courier'),
            ('FONTSIZE', (0, 0), (-1, -1), 9),
            ('GRID', (0, 0), (-1, -1), 0.5, colors.HexColor('#e0e0e0')),
            ('ROWBACKGROUNDS', (0, 1), (-1, -1), [colors.white, colors.HexColor('#f8f9fa')]),
            ('TOPPADDING', (0, 0), (-1, -1), 4),
            ('BOTTOMPADDING', (0, 0), (-1, -1), 4),
        ]))
        elements.append(st)

    if len(results.get('subdomains', [])) > 50:
        elements.append(Paragraph(
            f"... and {len(results['subdomains']) - 50} more subdomains.",
            styles['SmallMuted']))

    elements.append(PageBreak())

    # ── VULNERABILITY DETAILS ──
    vulns = results.get('vulnerabilities', [])
    if vulns:
        elements.append(Paragraph("Vulnerability Details", styles['SectionHead']))
        elements.append(HRFlowable(width="100%", thickness=1, color=BRAND['primary']))
        elements.append(Spacer(1, 0.2*inch))

        # Sort by severity
        sev_order = {'critical': 0, 'high': 1, 'medium': 2, 'low': 3, 'info': 4}
        vulns_sorted = sorted(vulns, key=lambda v: sev_order.get(v.get('severity', 'info'), 4))

        for i, vuln in enumerate(vulns_sorted[:30], 1):
            sev = vuln.get('severity', 'info').lower()
            sev_color = SEVERITY_COLORS.get(sev, BRAND['muted'])

            elements.append(Paragraph(
                f"<font color='{sev_color.hexval()}'>[{sev.upper()}]</font> "
                f"<b>{vuln.get('name', 'Unknown Vulnerability')}</b>",
                styles['SubHead']))

            if vuln.get('url'):
                elements.append(Paragraph(
                    f"<font name='Courier' size=9 color='#6366f1'>{vuln['url']}</font>",
                    styles['Normal']))

            if vuln.get('description'):
                elements.append(Spacer(1, 4))
                elements.append(Paragraph(vuln['description'][:500], styles['BodyText2']))

            if vuln.get('cve_id'):
                elements.append(Paragraph(
                    f"<b>CVE:</b> {vuln['cve_id']}  |  "
                    f"<b>CVSS:</b> {vuln.get('cvss_score', 'N/A')}",
                    styles['SmallMuted']))

            # Remediation
            elements.append(Spacer(1, 4))
            elements.append(Paragraph(
                "<b>Remediation:</b> Apply vendor patches, update to the latest version, "
                "and review security configuration. See references for specific guidance.",
                styles['BodyText2']))

            if vuln.get('reference'):
                refs = vuln['reference'][:3] if isinstance(vuln['reference'], list) else []
                for ref in refs:
                    elements.append(Paragraph(
                        f"<font size=8 color='#6366f1'>→ {ref}</font>",
                        styles['Normal']))

            elements.append(Spacer(1, 0.2*inch))
            elements.append(HRFlowable(width="100%", thickness=0.5, color=colors.HexColor('#e0e0e0')))

    # ── TECHNOLOGIES ──
    techs = summary.get('technologies', [])
    if techs:
        elements.append(PageBreak())
        elements.append(Paragraph("Detected Technologies", styles['SectionHead']))
        elements.append(HRFlowable(width="100%", thickness=1, color=BRAND['primary']))
        elements.append(Spacer(1, 0.2*inch))
        tech_text = ', '.join(techs)
        elements.append(Paragraph(tech_text, styles['BodyText2']))

    # ── FOOTER / DISCLAIMER ──
    elements.append(PageBreak())
    elements.append(Paragraph("Disclaimer & Methodology", styles['SectionHead']))
    elements.append(HRFlowable(width="100%", thickness=1, color=BRAND['primary']))
    elements.append(Spacer(1, 0.2*inch))
    elements.append(Paragraph(
        "This report was generated by VulnScan automated security assessment platform. "
        "All tests were conducted using non-destructive, passive and active scanning techniques. "
        "No exploitation was attempted. Findings represent the state of the target at the time "
        "of scanning and may change as configurations are updated. This report is confidential "
        "and intended solely for the recipient.",
        styles['BodyText2']))
    elements.append(Spacer(1, 0.3*inch))
    elements.append(Paragraph(
        "© 2026 VulnScan Security · vulnscan.tech · Confidential",
        styles['CenterText']))

    # Build PDF
    doc.build(elements)
    print(f"[+] Report generated: {output_path}")
    return output_path


def send_report(to_email: str, domain: str, pdf_path: str):
    """Send the PDF report to the client via email."""
    msg = MIMEMultipart()
    msg['From'] = f"{EMAIL_CONFIG['sender_name']} <{EMAIL_CONFIG['sender_email']}>"
    msg['To'] = to_email
    msg['Subject'] = f"Security Assessment Report — {domain}"

    body = f"""
Hello,

Your security assessment report for {domain} is ready.

Please find the comprehensive vulnerability report attached. This report includes:

• Attack surface enumeration (subdomains and live hosts)
• Vulnerability scan results with severity ratings
• CVE detection and CVSS scoring
• Remediation guidance for each finding

If you have any questions about the findings or would like to discuss remediation 
strategies, please reply to this email.

For continuous monitoring and real-time alerts, consider upgrading to our 
Sentinel plan at vulnscan.tech.

Best regards,
VulnScan Security Team
vulnscan.tech
"""

    msg.attach(MIMEText(body, 'plain'))

    # Attach PDF
    with open(pdf_path, 'rb') as f:
        attachment = MIMEBase('application', 'pdf')
        attachment.set_payload(f.read())
        encoders.encode_base64(attachment)
        attachment.add_header(
            'Content-Disposition',
            f'attachment; filename="VulnScan_Report_{domain}_{datetime.now().strftime("%Y%m%d")}.pdf"'
        )
        msg.attach(attachment)

    # Send via SMTP
    try:
        server = smtplib.SMTP(EMAIL_CONFIG['smtp_server'], EMAIL_CONFIG['smtp_port'])
        server.starttls()
        server.login(EMAIL_CONFIG['sender_email'], EMAIL_CONFIG['sender_password'])
        server.send_message(msg)
        server.quit()
        print(f"[+] Report sent to {to_email}")
    except Exception as e:
        print(f"[!] Email error: {e}")
        print("[*] Report saved locally — send manually or check SMTP config.")


def full_pipeline(domain: str, client_email: str):
    """Run scan → generate PDF → email to client. The entire automated pipeline."""
    print(f"\n{'='*60}")
    print(f"  VULNSCAN — Security Assessment Pipeline")
    print(f"  Target: {domain}")
    print(f"  Client: {client_email}")
    print(f"{'='*60}\n")

    output_dir = os.path.join(os.path.dirname(__file__), '..', 'reports', domain)
    pdf_path = os.path.join(output_dir, f"VulnScan_Report_{domain}.pdf")

    # Step 1: Scan
    results = run_scan(domain, output_dir)

    # Step 2: Generate PDF
    generate_pdf(results, pdf_path)

    # Step 3: Email to client
    if client_email and EMAIL_CONFIG['sender_password']:
        send_report(client_email, domain, pdf_path)
    else:
        print(f"[*] Email not configured. Report saved: {pdf_path}")

    return pdf_path


if __name__ == '__main__':
    import sys
    if len(sys.argv) < 2:
        print("Usage: python report_generator.py <domain> [email]")
        print("Example: python report_generator.py example.com client@company.com")
        sys.exit(1)

    domain = sys.argv[1]
    email = sys.argv[2] if len(sys.argv) > 2 else None
    full_pipeline(domain, email)
