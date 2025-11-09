export const DOMAIN_KNOWLEDGE = {
  berkadia: {
    company: {
      name: "Berkadia",
      type: "Joint Venture",
      partners: ["Berkshire Hathaway", "Jefferies"],
      industry: "Commercial Real Estate Services",
    },
    verticals: [
      {
        name: "Mortgage Banking",
        description: "Origination and financing of multifamily and commercial loans",
        systems: ["Fannie Mae", "Freddie Mac", "HUD", "Private Capital"],
      },
      {
        name: "Investment Sales",
        description: "Advisory and brokerage services for buying/selling commercial properties",
        features: ["Proprietary market analytics"],
      },
      {
        name: "Loan Servicing",
        description: "One of the largest non-bank servicing portfolios in the U.S.",
      },
    ],
    painPoints: [
      "Multiple disconnected systems (Salesforce, Excel, mainframes, email)",
      "Manual rework and duplicated effort",
      "Inconsistent reporting and delays",
      "Poor visibility into 'what's happening where'",
      "Limited ability to scale automation",
    ],
    goals: [
      "Do more with less or the same",
      "Increase productivity through AI and workflow optimization",
      "Improve process visibility",
      "Reduce manual handoffs",
      "Scale intelligent automation",
    ],
    systems: {
      salesforce: "Used for loan origination and lead management",
      excel: "Used for underwriting and risk analysis",
      mainframes: "Used for loan servicing and payment processing",
      email: "Internal communication and document requests",
    },
    processSteps: {
      loanOrigination: [
        "Lead capture in Salesforce",
        "Initial screening",
        "Document collection via email",
        "Credit review in Excel",
        "Property appraisal",
        "Underwriting approval",
        "Loan boarding in mainframe",
        "Payment processing setup",
        "Compliance reporting",
      ],
      commonBottlenecks: [
        "Document verification (manual, 3-5 days)",
        "Data entry between systems (duplicate effort)",
        "Credit report retrieval (manual process)",
        "Compliance documentation gathering",
        "Loan boarding data entry (mainframe)",
      ],
    },
    terminology: {
      DSCR: "Debt Service Coverage Ratio - Measures property's cash flow vs. debt obligations",
      LTV: "Loan-to-Value Ratio - Loan amount divided by property value",
      HUD: "U.S. Department of Housing and Urban Development - Government loan program",
      "Fannie Mae": "Federal National Mortgage Association - Government-sponsored enterprise",
      "Freddie Mac": "Federal Home Loan Mortgage Corporation - Government-sponsored enterprise",
      Multifamily: "Residential properties with 5+ units",
      "Loan Boarding": "Process of setting up a new loan in the servicing system",
      Underwriting: "Risk assessment and approval process for loans",
      Appraisal: "Professional valuation of property",
      Servicing: "Ongoing management of loan payments and compliance",
    },
    automationOpportunities: [
      {
        task: "Credit report retrieval",
        currentState: "Manual download and upload",
        automation: "API integration with credit bureaus",
        savings: "12 hours/week per analyst",
        roi: "340%",
      },
      {
        task: "Document verification",
        currentState: "Manual review of PDFs",
        automation: "AI-powered document extraction and validation",
        savings: "3-5 days per loan",
        roi: "280%",
      },
      {
        task: "Data entry across systems",
        currentState: "Manual copy-paste from Salesforce → Excel → Mainframe",
        automation: "Integration layer with automated data sync",
        savings: "8 hours/week per processor",
        roi: "420%",
      },
      {
        task: "Compliance documentation",
        currentState: "Manual gathering and checklist verification",
        automation: "Automated document collection and AI compliance checking",
        savings: "2-3 days per loan",
        roi: "310%",
      },
    ],
    kpis: {
      avgLoanProcessingTime: {
        current: "18.5 days",
        target: "15 days",
        industry: "20-25 days",
      },
      slaCompliance: {
        current: "73%",
        target: "95%",
        industry: "70-80%",
      },
      manualTaskPercentage: {
        current: "58%",
        target: "25%",
        industry: "50-60%",
      },
    },
  },
};

export function getBerkadiaContext(): string {
  const kb = DOMAIN_KNOWLEDGE.berkadia;

  return `
# Berkadia Commercial Real Estate Context

## Company Overview
${kb.company.name} is a ${kb.company.type} between ${kb.company.partners.join(" and ")} specializing in ${kb.company.industry}.

## Business Verticals
${kb.verticals.map((v) => `- **${v.name}**: ${v.description}`).join("\n")}

## Key Pain Points
${kb.painPoints.map((p) => `- ${p}`).join("\n")}

## Strategic Goals
${kb.goals.map((g) => `- ${g}`).join("\n")}

## Technology Systems
${Object.entries(kb.systems).map(([sys, desc]) => `- **${sys}**: ${desc}`).join("\n")}

## Loan Origination Process Steps
${kb.processSteps.loanOrigination.map((step, idx) => `${idx + 1}. ${step}`).join("\n")}

## Common Bottlenecks
${kb.processSteps.commonBottlenecks.map((b) => `- ${b}`).join("\n")}

## Industry Terminology
${Object.entries(kb.terminology).map(([term, def]) => `- **${term}**: ${def}`).join("\n")}

## Top Automation Opportunities
${kb.automationOpportunities.map((opp) => `
### ${opp.task}
- Current: ${opp.currentState}
- Automation: ${opp.automation}
- Savings: ${opp.savings}
- ROI: ${opp.roi}
`).join("\n")}

## Key Performance Indicators
${Object.entries(kb.kpis).map(([metric, data]) => `
- **${metric}**: Current ${data.current}, Target ${data.target}, Industry Average ${data.industry}
`).join("\n")}
`;
}

export function getEnhancedSystemPrompt(basePrompt: string, domain?: "berkadia"): string {
  if (domain === "berkadia") {
    return `${basePrompt}

${getBerkadiaContext()}

When answering questions about processes, prioritize insights relevant to commercial real estate and mortgage loan servicing. Use Berkadia-specific terminology and reference their pain points when making recommendations.
`;
  }
  return basePrompt;
}
