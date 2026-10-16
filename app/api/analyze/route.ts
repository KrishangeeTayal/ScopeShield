
import { NextResponse } from "next/server";

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { projectName, scope, clientRequest } = body;

    if (
      typeof scope !== "string" ||
      !scope.trim() ||
      typeof clientRequest !== "string" ||
      !clientRequest.trim()
    ) {
      return NextResponse.json(
        { error: "Please provide both the original scope and the client's request." },
        { status: 400 }
      );
    }

    
const prompt = `
You are ScopeShield, an assistant that compares a freelancer's
original project agreement with a new client request.

PROJECT: ${String(projectName || "Untitled project")}

ORIGINAL AGREED SCOPE:
<original_scope>
${scope}
</original_scope>

NEW CLIENT REQUEST:
<client_request>
${clientRequest}
</client_request>

Return ONLY a valid JSON object in this format:
{
  "summary": "A short, cautious summary",
  "findings": [
    {
      "request": "A specific requested change",
      "classification": "needs_clarification",
      "evidence": "An exact excerpt from the original scope",
      "reason": "Explanation of the classification",
      "needsHumanReview": true
    }
  ]
}

Allowed classifications:
- already_included
- potential_addition
- needs_clarification

Follow these rules carefully:

1. Use already_included when the agreement explicitly covers
   the type of work requested, provided no known condition prevents
   inclusion. For example, if the agreement includes text and image
   changes during revision rounds, a request to change a page's
   description and replace its photo is covered by that clause.
   Do not classify explicitly covered work as outside scope merely
   because the request names a specific page or product.

2. Use needs_clarification when the agreement is silent, ambiguous,
   incomplete, or conditional about the requested work. If the
   agreement includes a limited number of revisions but the number
   already used is unknown, explain that the work type is covered
   while the remaining revision allowance needs confirmation.

3. Use potential_addition when the request appears to introduce
   distinct work beyond the described scope. This does not prove
   the work is billable or contractually extra.

4. If the agreement mentions revision limits, do not assume any
   revisions remain available when the number already used is unknown.

5. Treat ongoing maintenance, repeated updates, support, and new
   features carefully. If the agreement does not define them,
   prefer needs_clarification.

6. The absence of a feature from the agreement is not, by itself,
   proof that the work is billable extra.

7. Do not invent prices, hours, deadlines, contract terms, or facts.

8. Identify only requests actually made by the client. Do not invent
   additional features or intentions.

9. Evidence must be an exact excerpt from the original scope.
   If no useful excerpt exists, return an empty evidence string.

10. If evidence is missing or the agreement is ambiguous,
    set needsHumanReview to true.

11. Never make legal or contractual determinations.

12. Return valid JSON only, without Markdown fences.
`;


    const ollamaResponse = await fetch("http://127.0.0.1:11434/api/generate", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        model: "gemma3:4b",
        prompt,
        stream: false,
        format: "json",
        options: { temperature: 0.1 },
      }),
      signal: AbortSignal.timeout(120000),
    });

    if (!ollamaResponse.ok) {
      return NextResponse.json(
        { error: "Ollama could not process the request. Check that Ollama is running." },
        { status: 502 }
      );
    }

    const ollamaData = await ollamaResponse.json();
    let analysis;

    try {
      analysis = JSON.parse(ollamaData.response);
    } catch {
      return NextResponse.json(
        { error: "The AI returned an unreadable response. Please try again." },
        { status: 502 }
      );
    }

    if (
      !analysis ||
      typeof analysis.summary !== "string" ||
      !Array.isArray(analysis.findings)
    ) {
      return NextResponse.json(
        { error: "The AI response did not have the expected structure." },
        { status: 502 }
      );
    }

    const allowedClassifications = [
      "already_included",
      "potential_addition",
      "needs_clarification",
    ];

    

const findings = analysis.findings.map((finding: Record<string, unknown>) => {
  const requestText =
    typeof finding.request === "string"
      ? finding.request
      : "Unclear request";

  const reason =
    typeof finding.reason === "string"
      ? finding.reason
      : "This finding needs a closer look.";

  const evidence =
    typeof finding.evidence === "string" ? finding.evidence : "";

  const allowedClassifications = [
    "already_included",
    "potential_addition",
    "needs_clarification",
  ];

  const modelClassification = allowedClassifications.includes(
    String(finding.classification)
  )
    ? String(finding.classification)
    : "needs_clarification";

  // Check whether the quote appears exactly in the original scope.
  const exactEvidence = evidence.length > 0 && scope.includes(evidence);

  // Check whether the quote contains terms relevant to the request.
  // This is a conservative keyword check, not proof of semantic relevance.
  
const requestWords: string[] =
  requestText.toLowerCase().match(/\b[a-z]{4,}\b/g) ?? [];

const evidenceWords: string[] =
  evidence.toLowerCase().match(/\b[a-z]{4,}\b/g) ?? [];


  const evidenceText = evidence.toLowerCase();

  const topicGroups = [
    ["menu", "menus", "price", "prices", "pricing"],
    ["revision", "revisions", "change", "changes", "edit", "edits"],
    ["dashboard", "login", "account", "accounts", "access"],
    ["maintenance", "support", "update", "updates", "ongoing"],
    ["image", "images", "photo", "photos", "picture", "pictures"],
    ["text", "description", "descriptions", "content", "copy"],
  ];

  const requestTopics = topicGroups.filter((group) =>
    group.some((word) =>
      requestWords.some((requestWord) =>
        requestWord.startsWith(word) || word.startsWith(requestWord)
      )
    )
  );

  const sharedWords = requestWords.filter((word) =>
  evidenceWords.includes(word)
);

// An exact quote from the original agreement is valid evidence.
// The model's classification still needs to be checked separately.
const relevantEvidence = exactEvidence;

  let classification = relevantEvidence
    ? modelClassification
    : "needs_clarification";

  let needsHumanReview =
    !relevantEvidence || finding.needsHumanReview !== false;

  // Conservative safeguard for ongoing work that the agreement
  // explicitly says is unspecified or undefined.
  const scopeSaysUnspecified =
    /\b(not specified|does not specify|doesn't specify|not defined|unspecified|not mentioned)\b/i.test(
      scope
    );

  const requestConcernsOngoingWork =
    /\b(ongoing|maintenance|support|update|updates|updating)\b/i.test(
      requestText
    );

  if (scopeSaysUnspecified && requestConcernsOngoingWork) {
    classification = "needs_clarification";
    needsHumanReview = true;
  }

  return {
    request: requestText,
    classification,
    evidence: relevantEvidence ? evidence : "",
    reason: relevantEvidence
      ? reason
      : "The supplied evidence could not be verified as sufficiently relevant to this request. Review the original agreement and clarify the request.",
    needsHumanReview,
  };
});


    return NextResponse.json({
      projectName: String(projectName || "Untitled project"),
      summary: analysis.summary,
      findings,
    });
  } catch (error) {
    console.error("ScopeShield analysis error:", error);

    const timedOut =
      error instanceof Error && error.name === "TimeoutError";

    return NextResponse.json(
      {
        error: timedOut
          ? "The AI took too long to respond. Please try again."
          : "Could not reach the local AI. Check that Ollama is running and try again.",
      },
      { status: 500 }
    );
  }
}
