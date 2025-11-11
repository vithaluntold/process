# Pricing Model Revision - Realistic Cost Analysis

**Date**: November 2024  
**Reason**: Account for actual operational costs (AI, infrastructure, payments, support)

---

## 🔄 What Changed

### ❌ Old Pricing (Unsustainable)
- Starter: $99/month
- Professional: $299/month
- Enterprise: $499/month
- **Problem**: Didn't account for AI token costs, infrastructure, payment fees

### ✅ New Pricing (Sustainable)
- Starter: $178/month (includes infrastructure + AI limits)
- Professional: $478/month
- Enterprise: $958/month
- **Plus**: Usage-based AI overage charges

---

## 💰 Why the Increase?

### Real Costs Per Customer (Monthly)

#### Infrastructure Costs (Previously Ignored)
| Service | Monthly Cost | Why It's Needed |
|---------|-------------|-----------------|
| **Neon PostgreSQL** | $15-$50 | Database hosting, scales with data |
| **Replit Deployments** | $20-$40 | Cloud infrastructure for autoscale |
| **OpenAI API (GPT-4o)** | $30-$200 | AI Assistant queries + email parsing |
| **Object Storage** | $5-$15 | File uploads, reports, backups |
| **Security & SSL** | $5-$10 | Certificates, monitoring |
| **Backups** | $5-$10 | Daily backups, disaster recovery |
| **TOTAL** | **$90-$365/mo** | Per customer infrastructure |

#### Transaction Costs (Passed to Customer)
| Service | Fee | Applied To |
|---------|-----|------------|
| Payment gateways | 2-3% + fixed | Customer's invoice |
| GST (India) | 18% | Customer's invoice |
| Taxes (US/EU) | Varies | Customer's invoice |

#### Customer Success (Amortized)
| Service | Cost/Customer | Notes |
|---------|---------------|-------|
| Email support | $2-$5 | Shared support team |
| Video tutorials | $1-$2 | One-time creation, amortized |
| Documentation | $1 | Ongoing maintenance |
| **TOTAL** | **$5-$9/mo** | Per active customer |

---

## 📊 Gross Margin Analysis

### Starter Tier ($178/month)
```
Revenue:              $178
Infrastructure:       -$90
Customer Success:     -$5
------------------------
Gross Margin:         $83 (46.6%)
Operating Margin:     25-30% (after sales, marketing, R&D)
```

**Verdict**: ✅ Profitable but lean

### Professional Tier ($478/month)
```
Revenue:              $478
Infrastructure:       -$180
Customer Success:     -$7
------------------------
Gross Margin:         $291 (60.9%)
Operating Margin:     35-40%
```

**Verdict**: ✅ Healthy margins

### Enterprise Tier ($958/month)
```
Revenue:              $958
Infrastructure:       -$365
Customer Success:     -$9
------------------------
Gross Margin:         $584 (61.0%)
Operating Margin:     40-45%
```

**Verdict**: ✅ Strong margins, scalable

---

## 🎯 Usage-Based AI Pricing (Prevents Runaway Costs)

### Why This Is Critical

**Problem**: If we offered "unlimited AI queries" at $499/month:
- A single customer could rack up $500-$1,000 in OpenAI API costs
- We'd lose $1-$501 per customer per month
- Business model collapses

**Solution**: Usage limits + overage pricing

| Tier | AI Queries Included | Overage Cost |
|------|---------------------|--------------|
| Starter | 1,000/month | $0.05 per query |
| Professional | 5,000/month | $0.05 per query |
| Enterprise | 20,000/month | $0.05 per query |

**Cost Basis**:
- GPT-4o costs ~$0.03-$0.04 per query (depending on length)
- We charge $0.05 (25-66% markup for platform value)
- Customers can monitor usage and control costs

### Email Workflow Parser Pricing

| Tier | Emails Included | Overage Cost | Reason |
|------|-----------------|--------------|--------|
| All | 100/month | $0.20/email | Each email uses ~4-5K tokens |

**Cost Basis**:
- Email parsing uses 4,000-6,000 tokens avg
- OpenAI cost: ~$0.12-$0.18 per email
- We charge $0.20 (11-66% markup)

### Digital Twin Simulations

| Tier | Simulations Included | Overage Cost | Reason |
|------|---------------------|--------------|--------|
| All | 50/month | $2.00/simulation | Compute-intensive process |

**Cost Basis**:
- Simulations run discrete-event algorithms (CPU intensive)
- Avg simulation: 10-30 seconds of compute
- Infrastructure cost: ~$0.50-$1.00
- We charge $2.00 (100-300% markup for value)

---

## 💳 Payment Gateway & Tax Handling

### Gateway Options by Region

**India** (Primary Market):
- **Razorpay**: 2% + GST (18%) - Most popular
- **Cashfree**: 1.99% + GST - Competitive pricing
- **PayU**: 2.5% + taxes
- **Stripe**: 2.9% + ₹2.50 - International cards

**Global**:
- **Stripe**: 2.9% + $0.30 - Standard worldwide

### How Fees Are Applied

**Customer Invoice Example (India - Enterprise Tier)**:
```
Subscription:                ₹78,400
GST (18%):                   ₹14,112
------------------------
Subtotal:                    ₹92,512
Payment Gateway (2%):        ₹1,850
------------------------
TOTAL CHARGED:               ₹94,362/month
```

**What Customer Sees**:
- Base price clearly shown
- GST itemized separately
- Gateway fee transparent
- No hidden charges

---

## 🌏 India-Specific Pricing (INR)

### Localized Pricing Table

| Tier | USD Base | GST (18%) | Total USD | INR Total* |
|------|----------|-----------|-----------|------------|
| Starter | $149 | $27 | $178 | ₹14,800 |
| Professional | $399 | $72 | $478 | ₹39,700 |
| Enterprise | $799 | $144 | $958 | ₹79,500 |

_*Based on ₹83/USD exchange rate. Pricing dynamically adjusted._

### Benefits for Indian Market
✅ Bill in INR (no forex uncertainty)  
✅ Local payment gateways (UPI, cards, net banking)  
✅ GST-compliant invoicing  
✅ Same-day INR settlement (Razorpay/Cashfree)  

---

## 📈 Competitive Position After Revision

### Still 70-95% Cheaper Than Competitors

| Provider | 3-Year TCO | EPI X-Ray Savings |
|----------|-----------|-------------------|
| **EPI X-Ray** | **$39,088** | — |
| Celonis | $742,000 | **$702,912 (95%)** |
| UiPath PM | $130,500 | **$91,412 (70%)** |

**Key Insight**: Even after doubling our prices, we're still 70-95% cheaper than enterprise competitors while maintaining healthy margins.

---

## 🎯 Positioning & Messaging

### How to Explain the Price Increase

**To Prospects**:
> "Our pricing reflects the true value we deliver. Unlike competitors who hide costs in 'implementation fees' ($50K-$100K), we're transparent: $178-$958/month includes hosting, AI, security, support, and updates. You're still saving 70-95% vs. enterprise solutions."

**To Investors**:
> "We've built a sustainable SaaS model with 46-61% gross margins. Unit economics are healthy: $90-$365 COGS for $178-$958 revenue. Path to profitability is clear."

**To Users** (If Asked About Old Pricing):
> "We refined our pricing to ensure long-term sustainability and include all infrastructure costs upfront. No hidden fees, no surprise bills. What you see is what you pay."

---

## ✅ What's Still Included (No Extra Charge)

Even at higher pricing, we include:

✅ **Process Mining Core**: Discovery, conformance, analytics  
✅ **Integrations**: Unlimited system connectors  
✅ **Exports**: PDF, Excel, PowerPoint reports  
✅ **Security**: SSL, encryption, backups  
✅ **Support**: Email support, knowledge base  
✅ **Updates**: Platform improvements, no upgrade fees  
✅ **Training**: Video tutorials, webinars  

**Unlike competitors** who charge for:
- Per-connector fees ($5K-$10K each)
- Support contracts ($15K/year)
- Training sessions ($8K-$15K)
- Annual upgrades ($10K-$25K)

---

## 🔢 Sample Customer Scenarios

### Scenario 1: Light User (Starter Tier)
**Profile**: 2-person operations team, pilot program  
**Usage**: 500 AI queries/month, 50 emails parsed  
**Monthly Bill**:
- Base: $149
- Infrastructure included
- AI: Under limit (no overage)
- Email parsing: Under limit
- GST (18%): $27
- Gateway (2%): $3.50
- **Total: $179.50/month**

### Scenario 2: Moderate User (Professional Tier)
**Profile**: 10-person process team, 3 departments  
**Usage**: 7,000 AI queries/month, 150 emails parsed  
**Monthly Bill**:
- Base: $399
- AI overage: 2,000 × $0.05 = $100
- Email overage: 50 × $0.20 = $10
- GST (18%): $91.62
- Gateway (2%): $12
- **Total: $612.62/month**

### Scenario 3: Heavy User (Enterprise Tier)
**Profile**: 50 users, full company deployment  
**Usage**: 25,000 AI queries/month, 200 emails, 75 simulations  
**Monthly Bill**:
- Base: $799
- AI overage: 5,000 × $0.05 = $250
- Email overage: 100 × $0.20 = $20
- Simulation overage: 25 × $2 = $50
- GST (18%): $201.42
- Gateway (2%): $26.40
- **Total: $1,346.82/month**

**Still delivers**: $2.4M annual savings = 14,800% ROI

---

## 🚀 Go-to-Market Strategy

### Phase 1: Soft Launch (Months 1-3)
- Offer early adopter discount (30% off for first 6 months)
- Focus on pilot programs
- Gather usage data to refine limits

### Phase 2: Market Testing (Months 4-6)
- A/B test pricing tiers
- Monitor churn rates
- Adjust AI limits based on actual usage

### Phase 3: Scale (Months 7-12)
- Standardize pricing
- Introduce annual prepay discounts (17%)
- Launch enterprise custom tier

---

## 📊 Success Metrics

### Unit Economics Targets
- **CAC** (Customer Acquisition Cost): < $500
- **LTV** (Lifetime Value): > $5,000 (3-year customer)
- **LTV:CAC Ratio**: 10:1
- **Gross Margin**: 50-60%
- **Monthly Churn**: < 5%

### Pricing Health Indicators
✅ **Gross margin > 50%**: Room for growth investments  
✅ **Overage revenue < 20%**: Limits are appropriately set  
✅ **Gateway costs < 3%**: Acceptable payment fees  
✅ **Infrastructure costs stable**: Predictable COGS  

---

## 🎁 Promotional Pricing (Launch Period)

### Early Adopter Program (First 100 Customers)
- **Discount**: 30% off for first 6 months
- **Starter**: $125/month (instead of $178)
- **Professional**: $335/month (instead of $478)
- **Enterprise**: $671/month (instead of $958)
- **Lock-in**: Pricing guaranteed for 12 months

### Referral Program
- **Refer a customer**: Get 1 month free
- **They sign up**: They get 20% off first 3 months
- **Unlimited referrals**: Build customer base organically

---

## ✅ Implementation Checklist

Before launching new pricing:

- [ ] Update website pricing page
- [ ] Update demo documentation (BERKADIA_DEMO_GUIDE.md)
- [ ] Update presentation slides
- [ ] Configure payment gateways (Razorpay, Stripe, PayU, Cashfree)
- [ ] Set up automated GST calculation
- [ ] Implement usage tracking for AI queries
- [ ] Build overage billing system
- [ ] Create usage dashboard for customers
- [ ] Update sales materials
- [ ] Train support team on new pricing
- [ ] Set up billing alerts for customers approaching limits

---

## 📞 Questions?

**Concerns about competitiveness?**  
We're still 70-95% cheaper than Celonis/UiPath even at doubled prices.

**Worried about customer reaction?**  
We're adding transparency and sustainability, not just raising prices.

**Infrastructure costs seem high?**  
These are real costs from Neon, Replit, OpenAI. We're being honest about them.

**Why not hide costs in implementation fees?**  
Transparency builds trust. We want long-term customer relationships.

---

**Status**: Ready for review and approval  
**Next Step**: Update all customer-facing materials with new pricing  
**Timeline**: 2-week transition period for existing prospects
