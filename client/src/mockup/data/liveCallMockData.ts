export const liveCallMock = {
  transcript: [
    { 
      id: 1,
      speaker: "Prospect", 
      text: "I'm not sure this fits our current budget constraints.", 
      tag: "objection",
      timestamp: "0:42"
    },
    { 
      id: 2,
      speaker: "Prospect", 
      text: "Can you clarify the ROI we should expect in the first quarter?", 
      tag: "question",
      timestamp: "1:15"
    },
    { 
      id: 3,
      speaker: "Prospect", 
      text: "We are currently evaluating multiple vendors for this solution.", 
      tag: "info",
      timestamp: "2:03"
    },
    { 
      id: 4,
      speaker: "Prospect", 
      text: "If you can meet our Q1 timeline, I'm very interested in moving forward.", 
      tag: "intent",
      timestamp: "3:28"
    },
    { 
      id: 5,
      speaker: "Prospect", 
      text: "Our team needs something that integrates with Salesforce seamlessly.", 
      tag: "requirement",
      timestamp: "4:15"
    }
  ],

  responses: [
    { 
      id: 1,
      type: "Objection Reframe", 
      text: "I completely understand budget is a priority. Many of our clients initially felt the same way, but found that the ROI within the first 90 days more than justified the investment. Would you like me to share some specific examples?",
      why: "Acknowledges concern, provides social proof, and opens dialogue for evidence."
    },
    { 
      id: 2,
      type: "Answer Question", 
      text: "Great question. Based on similar companies in your industry, our clients typically see a 3-4x return within the first quarter through reduced manual work and faster deal velocity.",
      why: "Specific, data-backed response that addresses the exact concern."
    },
    { 
      id: 3,
      type: "Competitive Positioning", 
      text: "That's smart to evaluate options. What sets us apart is our real-time AI guidance during calls – it's not just analytics after the fact, but live support that helps close deals faster.",
      why: "Differentiates without attacking competitors, focuses on unique value."
    },
    { 
      id: 4,
      type: "Push to Close", 
      text: "Perfect! We can definitely meet your Q1 timeline. If I can get you a proposal by end of week, could we schedule a follow-up call with your team lead for Monday?",
      why: "Capitalizes on buying signal with concrete next step and timeline."
    }
  ],

  context: {
    name: "Sarah Mitchell",
    company: "TechVentures Inc.",
    role: "VP of Sales",
    leadScore: 87,
    pastObjections: ["Budget", "Timeline", "Integration"],
    stage: "Decision Maker",
    dealValue: "$85,000",
    callDuration: "4:32",
    previousCalls: 2,
    brandPDF: "TechVentures_Company_Profile.pdf",
    notes: "Interested in Q1 implementation. Has authority to sign. Main concern is Salesforce integration."
  },

  summary: {
    painPoints: ["Budget constraints", "Timeline pressure", "Salesforce integration needs"],
    buyingSignals: ["Asked about ROI specifics", "Mentioned Q1 timeline interest", "Requested integration details"],
    objectionCount: 3,
    intentScore: 85,
    recommendedActions: [
      "Send ROI case study within 24 hours",
      "Schedule technical demo for Salesforce integration",
      "Prepare custom proposal with Q1 timeline"
    ],
    nextSteps: "Schedule follow-up call with technical team for integration demo",
    timeline: "Q1 Implementation",
    budget: "$75,000 - $100,000"
  },

  waveformData: Array.from({ length: 40 }, () => Math.random() * 0.6 + 0.2)
};

export type TranscriptLine = typeof liveCallMock.transcript[0];
export type AIResponse = typeof liveCallMock.responses[0];
export type ProspectContext = typeof liveCallMock.context;
export type CallSummary = typeof liveCallMock.summary;
