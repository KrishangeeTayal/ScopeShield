import { NextResponse } from "next/server";

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { projectName, scope, finding } = body;

    if (
      typeof scope !== "string" ||
      !scope.trim() ||
      !finding ||
      typeof finding.request !== "string"
    ) {
      return NextResponse.json(
        { error: "Please provide the original scope and a specific finding." },
        { status: 400 }
      );
    }

    const prompt = `
You are ScopeShield, helping a freelancer write a polite,
professional reply to a client about a project request.

PROJECT:
${String(projectName || "Untitled project")}

ORIGINAL AGREED SCOPE:
<original_scope>
${scope}
</original_scope>

CLIENT'S SPECIFIC REQUEST:
<client_request>
${finding.request}
</client_request>

SCOPESHIELD'S FINDING:
Classification: ${String(finding.classification || "needs_clarification")}
Evidence: ${String(finding.evidence || "No verified scope excerpt")}
Reason: ${String(finding.reason || "The request needs review")}

Write one concise, friendly client reply that:
- Acknowledges the client's request positively.
- Uses the original scope and finding as context.
- If the request may be additional work or needs clarification,
  suggests discussing the work, timeline, or estimate before proceeding.
- If the request appears included in scope, says so politely
  without implying extra charges.
- Does not invent prices, hours, deadlines, or contract terms.
- Does not claim that something is legally billable or definitely
  outside the contract.
- Does not mention AI, ScopeShield, classifications, or internal analysis.
- Is ready for the freelancer to edit before sending.
Be specific about the scope boundary. If the agreement
explicitly excludes the requested work, politely
mention the exact excluded items and explain that
they were not included in the original agreement.

Suggest discussing the requirements, timeline, and
estimate before proceeding. Do not assume the work
is automatically billable or make legal conclusions.

Return only the reply text. Do not include quotation marks,
a heading, or Markdown formatting.
`;

    const ollamaResponse = await fetch(
      "http://127.0.0.1:11434/api/generate",
      {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          model: "gemma3:4b",
          prompt,
          stream: false,
          options: { temperature: 0.2 },
        }),
        signal: AbortSignal.timeout(120000),
      }
    );

    if (!ollamaResponse.ok) {
      return NextResponse.json(
        { error: "Ollama could not draft the reply. Check that it is running." },
        { status: 502 }
      );
    }

    const ollamaData = await ollamaResponse.json();
    const reply =
      typeof ollamaData.response === "string"
        ? ollamaData.response.trim()
        : "";

    if (!reply) {
      return NextResponse.json(
        { error: "The AI returned an empty reply. Please try again." },
        { status: 502 }
      );
    }

    return NextResponse.json({ reply });
  } catch (error) {
    console.error("ScopeShield reply error:", error);

    const timedOut =
      error instanceof Error && error.name === "TimeoutError";

    return NextResponse.json(
      {
        error: timedOut
          ? "The AI took too long to draft the reply. Please try again."
          : "Could not reach the local AI. Check that Ollama is running.",
      },
      { status: 500 }
    );
  }
}