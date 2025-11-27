# EPI-Q PCI-DSS Compliance Assessment

**Document Version:** 1.0  
**Last Updated:** November 27, 2025  
**Applicable Standard:** PCI-DSS v4.0  
**Compliance Status:** Complete (SAQ A-EP Scope)

---

## Executive Summary

EPI-Q implements payment processing through third-party payment gateways (Razorpay, PayU, Payoneer) without storing, processing, or transmitting cardholder data directly. This assessment documents our compliance with PCI-DSS requirements applicable to merchants who outsource payment processing.

**Scope:** SAQ A-EP (E-commerce merchants who partially outsource payment processing)  
**Overall Compliance Status: 100%**

---

## Scope Definition

### Cardholder Data Environment (CDE)

EPI-Q does **not** store, process, or transmit cardholder data. All payment processing is handled by PCI-DSS certified payment service providers:

| Provider | PCI-DSS Level | Certificate | Integration Type |
|----------|---------------|-------------|------------------|
| Razorpay | Level 1 | Valid | Redirect/API |
| PayU | Level 1 | Valid | Redirect/API |
| Payoneer | Level 1 | Valid | Redirect |

### What We Store

| Data Type | Stored | PCI Scope |
|-----------|--------|-----------|
| Credit Card Numbers (PAN) | No | N/A |
| CVV/CVC | No | N/A |
| Cardholder Name | No | N/A |
| Expiration Date | No | N/A |
| Transaction IDs | Yes | Out of Scope |
| Payment Status | Yes | Out of Scope |
| Amount | Yes | Out of Scope |

---

## PCI-DSS Requirements Assessment

### Requirement 1: Install and Maintain Network Security Controls

| Sub-Requirement | Applicability | Implementation | Status |
|-----------------|---------------|----------------|--------|
| 1.1 Define security policies | Applicable | Network security policy documented | ✅ Complete |
| 1.2 Network security controls | Applicable | Cloud provider firewall, WAF | ✅ Complete |
| 1.3 Restrict access | Applicable | No direct database access from internet | ✅ Complete |
| 1.4 Network connections | Applicable | TLS 1.3 for all connections | ✅ Complete |
| 1.5 Risks from untrusted networks | Applicable | All traffic encrypted | ✅ Complete |

### Requirement 2: Apply Secure Configurations

| Sub-Requirement | Applicability | Implementation | Status |
|-----------------|---------------|----------------|--------|
| 2.1 Secure configuration standards | Applicable | Documented security configurations | ✅ Complete |
| 2.2 Manage default accounts | Applicable | No default credentials in production | ✅ Complete |
| 2.3 Wireless security | N/A | No wireless in CDE | ✅ N/A |

### Requirement 3: Protect Stored Account Data

| Sub-Requirement | Applicability | Implementation | Status |
|-----------------|---------------|----------------|--------|
| 3.1 Data storage minimization | Applicable | No cardholder data stored | ✅ Complete |
| 3.2 Sensitive auth data | N/A | Not stored after authorization | ✅ N/A |
| 3.3 PAN display masking | N/A | PAN not displayed or stored | ✅ N/A |
| 3.4 PAN unreadable | N/A | PAN not stored | ✅ N/A |
| 3.5 Protect keys | Applicable | HSM-backed key management for app data | ✅ Complete |

### Requirement 4: Protect Cardholder Data During Transmission

| Sub-Requirement | Applicability | Implementation | Status |
|-----------------|---------------|----------------|--------|
| 4.1 Strong cryptography | Applicable | TLS 1.3 for all transmissions | ✅ Complete |
| 4.2 End-user messaging | N/A | No PAN in messages | ✅ N/A |

### Requirement 5: Protect Against Malware

| Sub-Requirement | Applicability | Implementation | Status |
|-----------------|---------------|----------------|--------|
| 5.1 Anti-malware solution | Applicable | Cloud provider protection | ✅ Complete |
| 5.2 Malware prevention | Applicable | Input validation, security scanning | ✅ Complete |
| 5.3 Anti-malware mechanisms | Applicable | Automated cloud scanning | ✅ Complete |
| 5.4 Anti-phishing | Applicable | Security awareness training | ✅ Complete |

### Requirement 6: Develop Secure Systems and Software

| Sub-Requirement | Applicability | Implementation | Status |
|-----------------|---------------|----------------|--------|
| 6.1 Security development lifecycle | Applicable | Secure SDLC implemented | ✅ Complete |
| 6.2 Bespoke software security | Applicable | Code review, security testing | ✅ Complete |
| 6.3 Security vulnerabilities | Applicable | Dependency scanning, updates | ✅ Complete |
| 6.4 Web application security | Applicable | WAF, CSRF protection, input validation | ✅ Complete |
| 6.5 Change management | Applicable | Formal change control process | ✅ Complete |

### Requirement 7: Restrict Access by Business Need

| Sub-Requirement | Applicability | Implementation | Status |
|-----------------|---------------|----------------|--------|
| 7.1 Access control policy | Applicable | Role-based access control | ✅ Complete |
| 7.2 User access management | Applicable | Least privilege principle | ✅ Complete |
| 7.3 Access control systems | Applicable | RBAC with audit logging | ✅ Complete |

### Requirement 8: Identify Users and Authenticate Access

| Sub-Requirement | Applicability | Implementation | Status |
|-----------------|---------------|----------------|--------|
| 8.1 User identification | Applicable | Unique user IDs | ✅ Complete |
| 8.2 User authentication | Applicable | Strong authentication (JWT, bcrypt) | ✅ Complete |
| 8.3 Strong authentication | Applicable | MFA via SSO/SAML | ✅ Complete |
| 8.4 MFA implementation | Applicable | IdP MFA support | ✅ Complete |
| 8.5 MFA for remote access | Applicable | SSO with MFA for all access | ✅ Complete |
| 8.6 Application/system accounts | Applicable | Service account management | ✅ Complete |

### Requirement 9: Restrict Physical Access

| Sub-Requirement | Applicability | Implementation | Status |
|-----------------|---------------|----------------|--------|
| 9.1 Physical access controls | N/A | Cloud-hosted, no physical CDE | ✅ Cloud Provider |
| 9.2 Visitor management | N/A | Cloud-hosted | ✅ Cloud Provider |
| 9.3 Media protection | N/A | Cloud-hosted | ✅ Cloud Provider |
| 9.4 Media disposal | N/A | Cloud-hosted | ✅ Cloud Provider |
| 9.5 POI device protection | N/A | No POI devices | ✅ N/A |

### Requirement 10: Log and Monitor All Access

| Sub-Requirement | Applicability | Implementation | Status |
|-----------------|---------------|----------------|--------|
| 10.1 Audit logging | Applicable | Comprehensive audit logging | ✅ Complete |
| 10.2 Audit log content | Applicable | User, timestamp, action, resource | ✅ Complete |
| 10.3 Audit log protection | Applicable | Tamper-proof with hash chain | ✅ Complete |
| 10.4 Time synchronization | Applicable | Cloud provider NTP | ✅ Complete |
| 10.5 Audit log security | Applicable | Encrypted storage, access controls | ✅ Complete |
| 10.6 Log review | Applicable | Automated alerting, manual review | ✅ Complete |
| 10.7 Log retention | Applicable | 1 year online, 7 years archive | ✅ Complete |

### Requirement 11: Test Security Regularly

| Sub-Requirement | Applicability | Implementation | Status |
|-----------------|---------------|----------------|--------|
| 11.1 Wireless detection | N/A | No wireless in environment | ✅ N/A |
| 11.2 Vulnerability management | Applicable | Regular vulnerability scanning | ✅ Complete |
| 11.3 Penetration testing | Applicable | Annual external penetration test | ✅ Complete |
| 11.4 Intrusion detection | Applicable | Cloud provider IDS/IPS | ✅ Complete |
| 11.5 Change detection | Applicable | Configuration monitoring | ✅ Complete |
| 11.6 Payment page security | Applicable | Integrity monitoring for payment redirects | ✅ Complete |

### Requirement 12: Support Security with Policies

| Sub-Requirement | Applicability | Implementation | Status |
|-----------------|---------------|----------------|--------|
| 12.1 Information security policy | Applicable | Comprehensive security policy | ✅ Complete |
| 12.2 Acceptable use | Applicable | Acceptable use policy | ✅ Complete |
| 12.3 Risk assessment | Applicable | Annual risk assessment | ✅ Complete |
| 12.4 PCI-DSS responsibility | Applicable | This assessment document | ✅ Complete |
| 12.5 Scope documentation | Applicable | CDE scope documented | ✅ Complete |
| 12.6 Security awareness | Applicable | Security training program | ✅ Complete |
| 12.7 Personnel screening | Applicable | Background check policy | ✅ Complete |
| 12.8 Third-party management | Applicable | Vendor management program | ✅ Complete |
| 12.9 TPSP acknowledgment | Applicable | Payment provider compliance verified | ✅ Complete |
| 12.10 Incident response | Applicable | Incident response plan | ✅ Complete |

---

## Payment Integration Security

### Secure Payment Flow

```
1. Customer initiates payment in EPI-Q
2. EPI-Q redirects to payment provider (Razorpay/PayU/Payoneer)
3. Customer enters card details on payment provider page
4. Payment provider processes transaction
5. Payment provider redirects back with transaction ID
6. EPI-Q stores only transaction ID and status
```

### Security Controls for Payment Pages

| Control | Implementation | Verification |
|---------|----------------|--------------|
| HTTPS Only | TLS 1.3 enforced | SSL Labs A+ rating |
| CSP Headers | Content Security Policy configured | CSP header verification |
| SRI | Subresource Integrity for scripts | SRI hash verification |
| No Iframe | X-Frame-Options: DENY | Header inspection |
| Secure Cookies | Secure, HttpOnly, SameSite | Cookie attribute check |

### Payment Provider Webhooks

| Security Measure | Implementation |
|------------------|----------------|
| Signature Verification | Webhook payloads verified with provider secret |
| IP Whitelisting | Webhooks accepted only from provider IPs |
| Replay Prevention | Transaction ID deduplication |
| Logging | All webhook events logged |

---

## Third-Party Service Provider Management

### Payment Provider Due Diligence

| Provider | PCI-DSS AOC | Last Verified | Next Review |
|----------|-------------|---------------|-------------|
| Razorpay | On file | November 2025 | November 2026 |
| PayU | On file | November 2025 | November 2026 |
| Payoneer | On file | November 2025 | November 2026 |

### Provider Responsibilities

| Responsibility | EPI-Q | Payment Provider |
|----------------|-------|------------------|
| Cardholder data storage | No | Yes |
| Payment form security | Redirect only | Yes |
| PCI-DSS compliance | SAQ A-EP | Level 1 |
| Transaction processing | No | Yes |
| Fraud detection | No | Yes |

---

## Compliance Summary

| Requirement Category | Total | Applicable | Complete | N/A |
|---------------------|-------|------------|----------|-----|
| Req 1: Network Security | 5 | 5 | 5 | 0 |
| Req 2: Secure Configuration | 3 | 2 | 2 | 1 |
| Req 3: Stored Data | 5 | 2 | 2 | 3 |
| Req 4: Transmission | 2 | 1 | 1 | 1 |
| Req 5: Malware | 4 | 4 | 4 | 0 |
| Req 6: Secure Development | 5 | 5 | 5 | 0 |
| Req 7: Access Restriction | 3 | 3 | 3 | 0 |
| Req 8: Authentication | 6 | 6 | 6 | 0 |
| Req 9: Physical Access | 5 | 0 | 0 | 5 |
| Req 10: Logging | 7 | 7 | 7 | 0 |
| Req 11: Security Testing | 6 | 5 | 5 | 1 |
| Req 12: Policies | 10 | 10 | 10 | 0 |
| **Total** | **61** | **50** | **50** | **11** |

**Overall Compliance: 100%** (All applicable requirements met)

---

## Annual Validation

### SAQ A-EP Submission Schedule

| Quarter | Activity | Responsible |
|---------|----------|-------------|
| Q1 | Quarterly vulnerability scan | Security Team |
| Q2 | Quarterly vulnerability scan | Security Team |
| Q3 | Quarterly vulnerability scan, penetration test | Security Team |
| Q4 | Annual SAQ submission, AOC generation | Compliance Team |

### Attestation of Compliance (AOC)

The EPI-Q platform maintains compliance with PCI-DSS requirements as documented in this assessment. All payment processing is delegated to PCI-DSS Level 1 certified payment service providers.

---

## Revision History

| Version | Date | Author | Changes |
|---------|------|--------|---------|
| 1.0 | 2025-11-27 | Compliance Team | Initial assessment |

---

*This document is maintained by the Compliance Team and reviewed annually. For questions, contact compliance@epi-q.com*
