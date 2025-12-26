# Infrastructure & Hosting Architecture  
**Project:** niwashibase.com  
**Last updated:** 2025-01-XX  

---

## 📌 Purpose

This document explains how hosting, SSL, Cloudflare, and Workers are configured for `niwashibase.com`.  
It exists to prevent accidental misconfiguration and downtime.

⚠️ **Do not change settings described here unless you fully understand the impact.**

---

## 🌐 Domain Overview

### Primary Domain
- **niwashibase.com**
- DNS provider: **Cloudflare**

### Subdomains
| Subdomain | Purpose | Hosting | Proxy |
|----------|---------|---------|--------|
| `ios.niwashibase.com` | Main web app + gated content | GitHub Pages (via Worker) | 🟠 Proxied |
| `gate.niwashibase.com` (optional) | Worker-only endpoints | Cloudflare Worker | 🟠 Proxied |
| Other subdomains | Static sites | Google Sites | 🔘 DNS only |

---

## 🔐 SSL / HTTPS Configuration

### Cloudflare SSL Mode
- **Mode:** `Full`
- ❌ NOT `Full (strict)`

**Reason:**  
GitHub Pages does not reliably support strict origin validation when proxied through Cloudflare.  
Using `Full` keeps HTTPS encryption without breaking availability.

---

### Always Use HTTPS
- ✅ Enabled  
- Redirects all HTTP traffic to HTTPS safely.

---

### HSTS (HTTP Strict Transport Security)
- ❌ Disabled intentionally

**Reason:**
- Multiple subdomains use different providers.
- Enabling HSTS (especially with `includeSubDomains`) can permanently break access.
- Avoided unless all subdomains are fully controlled and HTTPS-only.

---

## 🧠 Worker Architecture

### Purpose of the Worker
The Cloudflare Worker handles:

- Cookie-based access control
- Session creation & validation
- Protected route gating
- Download tracking
- Logging events to Notion

It is **not** a Cloudflare Access / Zero Trust setup.

---

### Authentication Model
- Custom signed cookie (`wc`)
- Cookie attributes:
  - `Secure`
  - `HttpOnly`
  - `SameSite=Lax`
- Signed using HMAC
- Validated on every protected request

---

### Protected Paths
Examples:
