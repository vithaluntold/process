# Business Associate Agreement Template

**EPI-Q Platform**

---

## HIPAA BUSINESS ASSOCIATE AGREEMENT

This Business Associate Agreement ("Agreement") is entered into as of ________________ ("Effective Date") by and between:

**Covered Entity:** ___________________________________ ("Covered Entity")

**Business Associate:** EPI-Q Technologies, Inc. ("Business Associate")

Collectively referred to as the "Parties."

---

## RECITALS

WHEREAS, Covered Entity is a "covered entity" as defined by the Health Insurance Portability and Accountability Act of 1996 ("HIPAA"), as amended by the Health Information Technology for Economic and Clinical Health Act ("HITECH Act");

WHEREAS, Business Associate provides the EPI-Q process mining and analytics platform services to Covered Entity that may involve access to Protected Health Information ("PHI");

WHEREAS, the Parties wish to enter into this Agreement to comply with the requirements of HIPAA, the HITECH Act, and their implementing regulations at 45 C.F.R. Parts 160 and 164 (collectively, the "HIPAA Rules");

NOW, THEREFORE, in consideration of the mutual promises and covenants contained herein, the Parties agree as follows:

---

## ARTICLE 1: DEFINITIONS

**1.1** Terms used but not otherwise defined in this Agreement shall have the meanings set forth in the HIPAA Rules.

**1.2** "Breach" means the acquisition, access, use, or disclosure of PHI in a manner not permitted under the HIPAA Rules which compromises the security or privacy of the PHI.

**1.3** "Electronic Protected Health Information" or "ePHI" means PHI that is transmitted by or maintained in electronic media.

**1.4** "Protected Health Information" or "PHI" means individually identifiable health information transmitted or maintained in any form or medium.

**1.5** "Security Incident" means the attempted or successful unauthorized access, use, disclosure, modification, or destruction of information or interference with system operations in an information system.

---

## ARTICLE 2: OBLIGATIONS OF BUSINESS ASSOCIATE

**2.1 Permitted Uses and Disclosures**

Business Associate agrees to:

(a) Use and disclose PHI only as permitted or required by this Agreement or as required by law;

(b) Use PHI for the proper management and administration of Business Associate or to carry out its legal responsibilities, provided that any disclosure is required by law or Business Associate obtains reasonable assurances that the PHI will be held confidentially;

(c) Use PHI to provide Data Aggregation services to Covered Entity as permitted by 45 C.F.R. § 164.504(e)(2)(i)(B);

(d) De-identify PHI in accordance with 45 C.F.R. § 164.514(a)-(c).

**2.2 Safeguards**

Business Associate agrees to:

(a) Implement administrative, physical, and technical safeguards that reasonably and appropriately protect the confidentiality, integrity, and availability of ePHI;

(b) Ensure that any agent, including a subcontractor, to whom Business Associate provides PHI agrees to the same restrictions and conditions that apply to Business Associate;

(c) Report to Covered Entity any use or disclosure of PHI not provided for by this Agreement of which Business Associate becomes aware, including any Security Incident or Breach;

(d) Make available PHI in accordance with 45 C.F.R. § 164.524 to enable Covered Entity to fulfill its access obligations;

(e) Make available PHI for amendment and incorporate any amendments to PHI in accordance with 45 C.F.R. § 164.526;

(f) Make available the information required to provide an accounting of disclosures in accordance with 45 C.F.R. § 164.528;

(g) Make its internal practices, books, and records relating to the use and disclosure of PHI available to the Secretary of Health and Human Services for purposes of determining Covered Entity's compliance with the HIPAA Rules.

**2.3 Security Requirements**

Business Associate shall implement the following security measures:

(a) **Encryption:** AES-256-GCM encryption for data at rest using HSM-backed key management (AWS KMS, Google Cloud KMS, or Azure Key Vault);

(b) **Access Control:** Role-based access control with unique user identification, automatic session timeout, and multi-factor authentication support;

(c) **Audit Logging:** Tamper-proof audit logging with cryptographic hash chain verification;

(d) **Transmission Security:** TLS 1.3 encryption for all data in transit;

(e) **Data Isolation:** Multi-tenant architecture with strict organizational data isolation.

---

## ARTICLE 3: OBLIGATIONS OF COVERED ENTITY

**3.1** Covered Entity agrees to:

(a) Notify Business Associate of any limitations in the Notice of Privacy Practices that may affect Business Associate's use or disclosure of PHI;

(b) Notify Business Associate of any changes in, or revocation of, authorization by an individual to use or disclose PHI;

(c) Notify Business Associate of any restriction on the use or disclosure of PHI that Covered Entity has agreed to in accordance with 45 C.F.R. § 164.522;

(d) Not request Business Associate to use or disclose PHI in any manner that would not be permissible under the HIPAA Rules if done by Covered Entity.

---

## ARTICLE 4: BREACH NOTIFICATION

**4.1 Discovery and Notification**

(a) Business Associate shall report to Covered Entity any Breach of Unsecured PHI within thirty (30) calendar days of discovery;

(b) Business Associate shall provide Covered Entity with the following information regarding any Breach:
   - The nature of the PHI involved
   - The unauthorized persons who used the PHI or to whom the disclosure was made
   - Whether the PHI was actually acquired or viewed
   - The extent to which the risk of harm has been mitigated

**4.2 Documentation**

Business Associate shall maintain documentation of any Breach for a period of six (6) years.

---

## ARTICLE 5: TERM AND TERMINATION

**5.1 Term**

This Agreement shall be effective as of the Effective Date and shall remain in effect until all PHI provided by Covered Entity to Business Associate is destroyed or returned to Covered Entity.

**5.2 Termination for Cause**

Either Party may terminate this Agreement if the other Party has materially breached this Agreement and fails to cure such breach within thirty (30) days of receiving written notice.

**5.3 Effect of Termination**

Upon termination of this Agreement:

(a) Business Associate shall return or destroy all PHI received from Covered Entity, or created or received by Business Associate on behalf of Covered Entity, within sixty (60) days;

(b) Business Associate shall retain no copies of the PHI except as necessary for proper management and administration or to carry out legal responsibilities;

(c) Business Associate shall extend protections of this Agreement to any PHI retained and limit further uses and disclosures to those purposes that make the return or destruction of the PHI infeasible.

---

## ARTICLE 6: MISCELLANEOUS

**6.1 Amendment**

This Agreement may not be amended except by mutual written agreement of the Parties.

**6.2 Survival**

The obligations of Business Associate under Article 5.3 shall survive the termination of this Agreement.

**6.3 Interpretation**

Any ambiguity in this Agreement shall be resolved in favor of a meaning that permits the Parties to comply with the HIPAA Rules.

**6.4 Governing Law**

This Agreement shall be governed by and construed in accordance with the laws of the State of _____________, without regard to its conflicts of law principles.

**6.5 Entire Agreement**

This Agreement constitutes the entire agreement between the Parties with respect to the subject matter hereof and supersedes all prior agreements and understandings, whether written or oral.

---

## SIGNATURES

**COVERED ENTITY:**

By: _________________________________

Name: _______________________________

Title: _______________________________

Date: _______________________________

**BUSINESS ASSOCIATE (EPI-Q Technologies, Inc.):**

By: _________________________________

Name: _______________________________

Title: _______________________________

Date: _______________________________

---

## EXHIBIT A: DESCRIPTION OF SERVICES

Business Associate provides the following services to Covered Entity:

1. **Process Mining Platform:** Cloud-based analytics platform for operational process analysis
2. **Data Processing:** Processing of operational event logs which may contain PHI
3. **Analytics Services:** Anomaly detection, forecasting, and process optimization
4. **Reporting:** Generation of process analytics reports
5. **Data Storage:** Secure storage of uploaded data and generated insights

---

## EXHIBIT B: SECURITY CONTROLS SUMMARY

| Control Category | Implementation |
|-----------------|----------------|
| Encryption at Rest | AES-256-GCM with HSM-backed keys |
| Encryption in Transit | TLS 1.3 |
| Access Control | Role-based with MFA support |
| Audit Logging | Tamper-proof with hash chain |
| Data Isolation | Multi-tenant with organization separation |
| Incident Response | 24/7 monitoring with defined SLAs |
| Disaster Recovery | RTO 4 hours, RPO 1 hour |

---

*This template is provided for informational purposes. Legal counsel should review and customize this agreement before execution.*

---

# DATA PROCESSING AGREEMENT (DPA)

## For GDPR Compliance

---

## PARTIES

**Data Controller:** ___________________________________ ("Controller")

**Data Processor:** EPI-Q Technologies, Inc. ("Processor")

---

## 1. DEFINITIONS

**1.1** "Personal Data" means any information relating to an identified or identifiable natural person.

**1.2** "Processing" means any operation performed on Personal Data, including collection, storage, alteration, retrieval, consultation, use, disclosure, or erasure.

**1.3** "GDPR" means the General Data Protection Regulation (EU) 2016/679.

---

## 2. PROCESSING DETAILS

| Element | Description |
|---------|-------------|
| Subject Matter | Process mining and analytics services |
| Duration | Duration of the service agreement |
| Nature of Processing | Collection, storage, analysis, reporting |
| Purpose | Operational process optimization and insights |
| Personal Data Types | Employee names, timestamps, resource identifiers |
| Data Subject Categories | Controller's employees and business process participants |

---

## 3. PROCESSOR OBLIGATIONS

**3.1** Processor shall:

(a) Process Personal Data only on documented instructions from Controller;

(b) Ensure that persons authorized to process Personal Data have committed to confidentiality;

(c) Implement appropriate technical and organizational security measures;

(d) Engage sub-processors only with prior written authorization;

(e) Assist Controller in responding to data subject requests;

(f) Delete or return all Personal Data upon termination;

(g) Make available information necessary to demonstrate compliance;

(h) Allow and contribute to audits and inspections.

---

## 4. SECURITY MEASURES

Processor implements the following measures:

| Measure | Implementation |
|---------|----------------|
| Encryption | AES-256-GCM at rest, TLS 1.3 in transit |
| Access Control | RBAC with MFA, least privilege |
| Audit Logging | Tamper-proof with 7-year retention |
| Incident Response | 72-hour breach notification |
| Data Backup | Daily backups with tested recovery |

---

## 5. SUB-PROCESSORS

Processor uses the following sub-processors:

| Sub-Processor | Location | Purpose |
|---------------|----------|---------|
| Neon | USA/EU | Database hosting |
| Railway/Replit | USA | Application hosting |
| AWS/GCP/Azure | USA/EU | Key management (optional) |

---

## 6. DATA TRANSFERS

For transfers outside the EEA, Processor relies on:

- Standard Contractual Clauses (SCCs)
- Adequacy decisions where applicable
- Additional safeguards including encryption

---

## 7. DATA SUBJECT RIGHTS

Processor shall assist Controller with:

- Right of access (Article 15)
- Right to rectification (Article 16)
- Right to erasure (Article 17)
- Right to restriction (Article 18)
- Right to data portability (Article 20)
- Right to object (Article 21)

---

## 8. BREACH NOTIFICATION

Processor shall notify Controller of any Personal Data breach within 72 hours of becoming aware.

---

## SIGNATURES

**CONTROLLER:**

By: _________________________________

Date: _______________________________

**PROCESSOR (EPI-Q Technologies, Inc.):**

By: _________________________________

Date: _______________________________

---

*This template is provided for informational purposes. Legal counsel should review and customize this agreement before execution.*
