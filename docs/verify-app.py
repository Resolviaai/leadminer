# verify-app-fast-quality.py
import re
import dns.resolver
from flask import Flask, request, jsonify
from concurrent.futures import ThreadPoolExecutor, as_completed

# --- CONFIGURATION ---
EMAIL_REGEX = re.compile(r"[^@]+@[^@]+\.[^@]+")
DISPOSABLE_DOMAINS = {"mailinator.com", "10minutemail.com", "guerrillamail.com"}
ROLE_BASED_PREFIXES = {"info", "support", "admin", "sales", "contact"}
MAJOR_PROVIDERS = {"gmail.com", "yahoo.com", "outlook.com", "hotmail.com", "icloud.com"}
DNS_TIMEOUT = 3  # seconds
MAX_WORKERS = 20  # concurrent MX checks

app = Flask(__name__)

# --- EMAIL CHECK FUNCTION ---
def check_email(email):
    """Fast + quality email check."""
    if not email or not EMAIL_REGEX.match(email):
        return email, "invalid", "bad_syntax"

    local, domain = email.split('@')[0].lower(), email.split('@')[1].lower()

    if domain in DISPOSABLE_DOMAINS:
        return email, "invalid", "disposable_domain"
    if local in ROLE_BASED_PREFIXES:
        return email, "invalid", "role_based"

    # Major provider optimization
    if domain in MAJOR_PROVIDERS:
        return email, "valid", "major_provider"

    # MX lookup
    try:
        answers = dns.resolver.resolve(domain, 'MX', lifetime=DNS_TIMEOUT)
        if not answers:
            return email, "invalid", "no_mx"
    except Exception:
        return email, "invalid", "invalid_domain"

    # Domain exists but not major provider → risky
    return email, "risky", "domain_valid_no_smtp"

# --- ROUTES ---
@app.route('/verify-json', methods=['POST'])
def verify_json():
    emails = request.json.get('emails', [])
    results = []

    with ThreadPoolExecutor(max_workers=MAX_WORKERS) as executor:
        future_to_email = {executor.submit(check_email, e): e for e in emails}
        for future in as_completed(future_to_email):
            results.append(future.result())

    # Format results
    formatted = [{"email": e, "status": s, "reason": r} for e, s, r in results]
    return jsonify(formatted)

@app.route('/')
def home():
    return "<h1>Fast + Quality Email Verifier API - POST emails to /verify-json</h1>"

# --- MAIN ---
if __name__ == "__main__":
    import os
    port = int(os.environ.get("PORT", 5050))
    app.run(host="0.0.0.0", port=port, debug=False)
