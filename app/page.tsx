
"use client";

import {useEffect,useRef,useState} from "react";
import {
  createLedgerFinding,
  getLedgerCounts,
  getAcceptedImpact,
  updateLedgerStatus,
  type LedgerFinding,
  type LedgerStatus,
} from "../lib/ledger";


type Finding = {
  request: string;
  classification:
    | "already_included"
    | "potential_addition"
    | "needs_clarification";
  evidence: string;
  reason: string;
  needsHumanReview: boolean;
};

type Analysis = {
  projectName: string;
  summary: string;
  findings: Finding[];
};

const labels: Record<Finding["classification"], string> = {
  already_included: "Already in scope",
  potential_addition: "Potential addition",
  needs_clarification: "Needs clarification",
};

export default function Home() {
  const [projectName, setProjectName] = useState(
    "The little website project"
  );
  const [scope, setScope] = useState("");
  const [request, setRequest] = useState("");
  
const [analysis, setAnalysis] = useState<Analysis | null>(null);
const analysisRef = useRef<HTMLElement | null>(null);
const [clientReplies, setClientReplies] = useState<Record<number, string>>({});
const [error, setError] = useState("");
const [loading, setLoading] = useState(false);

const [ledger, setLedger] = useState<LedgerFinding[]>([]);
const [ledgerLoaded, setLedgerLoaded] = useState(false);

useEffect(() => {
  try {
    const savedLedger = localStorage.getItem("scopeshield-ledger");

    if (savedLedger) {
      const parsed: unknown = JSON.parse(savedLedger);

      if (Array.isArray(parsed)) {
        setLedger(parsed as LedgerFinding[]);
      }
    }
  } catch {
    console.error("Could not load the saved ScopeShield ledger.");
  } finally {
    setLedgerLoaded(true);
  }
}, []);

useEffect(() => {
  if (ledgerLoaded) {
    localStorage.setItem("scopeshield-ledger", JSON.stringify(ledger));
  }
}, [ledger, ledgerLoaded]);

useEffect(() => {
  if (analysis) {
    analysisRef.current?.scrollIntoView({
      behavior: "smooth",
      block: "start",
    });
  }
}, [analysis]);


function addAnalysisToLedger(result: Analysis) {
  const newFindings = result.findings.map((finding) =>
    createLedgerFinding({
      projectName: result.projectName,
      request: finding.request,
      classification: finding.classification,
      evidence: finding.evidence,
      reason: finding.reason,
      needsHumanReview: finding.needsHumanReview,
    })
  );

  setLedger((current) => [...newFindings, ...current]);
}

function changeLedgerStatus(id: string, status: LedgerStatus) {
  setLedger((current) => updateLedgerStatus(current, id, status));
}

const ledgerCounts = getLedgerCounts(ledger);
const acceptedImpact = getAcceptedImpact(ledger);


  async function handleAnalyze(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setLoading(true);
    setError("");
    setAnalysis(null);

    try {
      const response = await fetch("/api/analyze", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ projectName, scope, clientRequest: request }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || "Analysis failed. Please try again.");
      }

      
setAnalysis(data as Analysis);
addAnalysisToLedger(data as Analysis);

    } catch (err) {
      setError(
        err instanceof Error
          ? err.message
          : "Something went wrong. Please try again."
      );
    } finally {
      setLoading(false);
    }
  }

  return (
    <main className="min-h-screen bg-[#f7f2e8] text-[#27251f]">
      <header className="border-b border-[#27251f]/20">
        <div className="mx-auto flex max-w-7xl items-center justify-between px-5 py-5 sm:px-8">
          <a href="#" className="flex items-center gap-3">
            <div className="flex h-11 w-11 rotate-[-5deg] items-center justify-center border-2 border-[#27251f] bg-[#c45c3b] text-2xl font-black text-[#fff9ed]">
              S
            </div>
            <div>
              <p className="text-xl font-black tracking-[-0.07em]">
                scopeshield<span className="text-[#c45c3b]">.</span>
              </p>
              <p className="text-[10px] font-bold uppercase tracking-[0.18em] text-[#777166]">
                A freelancer&apos;s second opinion
              </p>
            </div>
          </a>
          <div className="hidden items-center gap-2 text-xs font-semibold sm:flex">
            <span className="h-2 w-2 rounded-full bg-[#64845a]" />
            LOCAL AI · GEMMA 3
          </div>
          <span className="text-xs font-bold sm:hidden">01 / TOOLKIT</span>
        </div>
      </header>

      <section className="mx-auto max-w-7xl px-5 pb-12 pt-12 sm:px-8 sm:pt-20">
        <div className="grid items-end gap-8 lg:grid-cols-[1.3fr_0.7fr]">
          <div>
            <p className="mb-5 inline-block -rotate-1 bg-[#e8d8bc] px-3 py-1.5 text-xs font-bold uppercase tracking-[0.14em]">
              The unofficial freelancer survival kit
            </p>
            <h1 className="max-w-3xl text-5xl font-black leading-[0.98] tracking-[-0.075em] sm:text-7xl lg:text-[88px]">
              A quick favour
              <br />
              <span className="font-serif font-normal italic text-[#c45c3b]">
                isn&apos;t always
              </span>
              <br />
              a small one.
            </h1>
            <p className="mt-7 max-w-lg text-base leading-7 text-[#625d52] sm:text-lg">
              The brief said five pages. The latest email says, “Could we just
              add a dashboard?” Let&apos;s figure out what&apos;s changed before you say
              yes.
            </p>
          </div>

          <aside className="relative mb-2 ml-auto w-full max-w-sm rotate-[1deg] border border-[#27251f]/30 bg-[#fffaf1] p-6 shadow-[5px_6px_0px_#d9cbb5]">
            <div className="absolute -top-3 left-8 h-6 w-16 rotate-[-5deg] bg-[#d6a46c]/70" />
            <p className="text-xs font-bold uppercase tracking-[0.16em] text-[#777166]">
              A note to self
            </p>
            <p className="mt-4 font-serif text-2xl leading-snug">
              Being easy to work with doesn&apos;t mean saying yes to everything.
            </p>
            <div className="mt-5 flex items-center justify-between border-t border-dashed border-[#27251f]/25 pt-4 text-xs text-[#777166]">
              <span>KEEP THIS HANDY</span>
              <span className="text-lg text-[#c45c3b]">✳</span>
            </div>
          </aside>
        </div>
      </section>

      <section className="mx-auto max-w-7xl px-5 pb-16 sm:px-8">
        <div className="grid gap-10 lg:grid-cols-[minmax(0,1fr)_310px]">
          <div className="border-t-2 border-[#27251f] pt-5">
            <div className="mb-8 flex items-start justify-between gap-4">
              <div>
                <p className="text-xs font-bold uppercase tracking-[0.16em] text-[#c45c3b]">
                  Your workspace / 001
                </p>
                <h2 className="mt-2 text-3xl font-black tracking-[-0.06em] sm:text-4xl">
                  Let&apos;s look at the brief.
                </h2>
                <p className="mt-2 max-w-xl text-sm leading-6 text-[#777166]">
                  Two things in, a clearer picture out. Use the actual agreement
                  and the client&apos;s latest message.
                </p>
              </div>
              <span className="hidden border border-[#27251f]/30 px-3 py-2 text-xs font-bold sm:block">
                STEP 01—02
              </span>
            </div>

            <form onSubmit={handleAnalyze} className="space-y-7">
              <div>
                <label htmlFor="projectName" className="mb-2 block text-sm font-bold">
                  01. Give this project a name
                </label>
                <input
                  id="projectName"
                  value={projectName}
                  onChange={(event) => setProjectName(event.target.value)}
                  placeholder="e.g. The bakery website"
                  className="w-full border border-[#27251f]/30 bg-[#fffaf1] px-4 py-3.5 text-sm outline-none transition focus:border-[#c45c3b] focus:ring-2 focus:ring-[#c45c3b]/15"
                />
              </div>

              <div>
                <div className="mb-2 flex flex-wrap items-baseline justify-between gap-2">
                  <label htmlFor="scope" className="text-sm font-bold">
                    02. What did you originally agree to?
                  </label>
                  <span className="text-xs text-[#898173]">THE ORIGINAL BRIEF</span>
                </div>
                <textarea
                  id="scope"
                  required
                  value={scope}
                  onChange={(event) => setScope(event.target.value)}
                  placeholder="A five-page website: home, about, services, contact and a responsive mobile layout. Two rounds of revisions included..."
                  rows={6}
                  className="w-full resize-y border border-[#27251f]/30 bg-[#fffaf1] px-4 py-4 text-sm leading-7 outline-none transition placeholder:text-[#aaa092] focus:border-[#c45c3b] focus:ring-2 focus:ring-[#c45c3b]/15"
                />
                <p className="mt-2 text-xs text-[#898173]">
                  Tip: paste the relevant agreement wording, not just a summary.
                </p>
              </div>

              <div>
                <div className="mb-2 flex flex-wrap items-baseline justify-between gap-2">
                  <label htmlFor="request" className="text-sm font-bold">
                    03. What are they asking for now?
                  </label>
                  <span className="text-xs text-[#898173]">THE NEW MESSAGE</span>
                </div>
                <textarea
                  id="request"
                  required
                  value={request}
                  onChange={(event) => setRequest(event.target.value)}
                  placeholder={'"One more thing — could we add client login and a dashboard before launch?"'}
                  rows={5}
                  className="w-full resize-y border border-[#27251f]/30 bg-[#fffaf1] px-4 py-4 text-sm leading-7 outline-none transition placeholder:text-[#aaa092] focus:border-[#c45c3b] focus:ring-2 focus:ring-[#c45c3b]/15"
                />
              </div>

              <button
                type="submit"
                disabled={loading}
                className="group flex w-full items-center justify-between bg-[#c45c3b] px-5 py-4 text-left font-bold text-[#fffaf1] transition hover:bg-[#a9482d] disabled:cursor-wait disabled:opacity-60 sm:w-auto sm:min-w-[280px]"
              >
                <span>{loading ? "Reading the brief..." : "Compare the two"}</span>
                <span className="text-xl">{loading ? "…" : "→"}</span>
              </button>

              <p className="text-xs leading-5 text-[#898173]">
                Local AI can make mistakes. Review every finding before acting on it.
              </p>
            </form>

            <div className="mt-6 border-2 border-[#27251f] bg-[#27251f] p-5 text-[#f7f2e8]">
  <p className="text-xs font-bold uppercase tracking-[0.16em] text-[#d99a7e]">
    Accepted changes · Cumulative impact
  </p>

  <div className="mt-4 grid gap-4 sm:grid-cols-3">
    <div>
      <p className="text-3xl font-black">
        {acceptedImpact.totalHours}
      </p>
      <p className="mt-1 text-sm text-[#d0c8bb]">
        Extra hours
      </p>
    </div>

    <div>
      <p className="text-3xl font-black">
        {acceptedImpact.totalCost.toLocaleString("en-IN")}
      </p>
      <p className="mt-1 text-sm text-[#d0c8bb]">
        Proposed cost
      </p>
    </div>

    <div>
      <p className="text-3xl font-black">
        {acceptedImpact.totalDeadlineDays}
      </p>
      <p className="mt-1 text-sm text-[#d0c8bb]">
        Extra deadline days
      </p>
    </div>
  </div>

  <p className="mt-4 text-xs leading-5 text-[#d0c8bb]">
    Totals include accepted changes only. These are freelancer-entered
    estimates, not AI-generated prices or contractual commitments.
  </p>
</div>

            
<section className="mt-10 border-t-2 border-[#27251f] pt-6">
  <div className="flex flex-wrap items-end justify-between gap-4">
    <div>
      <p className="text-xs font-bold uppercase tracking-[0.16em] text-[#c45c3b]">
        Your project history
      </p>
      <h3 className="mt-2 text-3xl font-black tracking-[-0.06em]">
        The scope ledger.
      </h3>
      <p className="mt-2 text-sm leading-6 text-[#777166]">
        Review every finding and decide what happens next.
      </p>
    </div>
    <span className="text-xs font-bold text-[#777166]">
      {ledgerCounts.total} ENTRIES
    </span>
  </div>

  <div className="mt-5 grid grid-cols-3 gap-3">
    <div className="border border-[#27251f]/20 bg-[#fffaf1] p-3">
      <p className="text-2xl font-black">{ledgerCounts.unresolved}</p>
      <p className="mt-1 text-xs text-[#777166]">Unresolved</p>
    </div>
    <div className="border border-[#27251f]/20 bg-[#edf0e5] p-3">
      <p className="text-2xl font-black">{ledgerCounts.accepted}</p>
      <p className="mt-1 text-xs text-[#526a49]">Accepted</p>
    </div>
    <div className="border border-[#27251f]/20 bg-[#f6dfd7] p-3">
      <p className="text-2xl font-black">{ledgerCounts.rejected}</p>
      <p className="mt-1 text-xs text-[#a34b30]">Rejected</p>
    </div>
  </div>

  <div className="mt-5 space-y-4">
    {!ledgerLoaded ? (
      <p className="text-sm text-[#777166]">Loading saved entries...</p>
    ) : ledger.length === 0 ? (
      <div className="border border-dashed border-[#27251f]/30 p-6 text-center">
        <p className="font-bold">Nothing in the ledger yet.</p>
        <p className="mt-2 text-sm text-[#777166]">
          Analyze a client request to save your first finding here.
        </p>
      </div>
    ) : (
      ledger.map((item) => (
        <article
          key={item.id}
          className="border border-[#27251f]/25 bg-[#fffaf1] p-5"
        >
          <div className="flex flex-wrap items-start justify-between gap-3">
            <div>
              <p className="text-xs font-bold uppercase tracking-wider text-[#c45c3b]">
                {item.projectName}
              </p>
              <h4 className="mt-2 font-bold leading-6">{item.request}</h4>
            </div>
            <span className="border border-[#27251f]/20 bg-[#efe7d9] px-2.5 py-1 text-xs font-bold">
              {item.classification.replaceAll("_", " ")}
            </span>
          </div>

          {item.evidence && (
            <blockquote className="mt-4 border-l-2 border-[#64845a] bg-[#edf0e5] px-4 py-3 text-sm leading-6">
              “{item.evidence}”
            </blockquote>
          )}

          <p className="mt-3 text-sm leading-6 text-[#625d52]">{item.reason}</p>

          <div className="mt-5 grid gap-3 sm:grid-cols-3">
  <label className="flex flex-col gap-2 text-sm font-semibold">
    Estimated extra hours
    <input
      type="number"
      min="0"
      step="0.5"
      value={item.estimatedHours ?? ""}
      onChange={(event) => {
        const value = event.target.value;
        const hours = value === "" ? null : Number(value);

        setLedger((current) =>
          current.map((finding) =>
            finding.id === item.id
              ? { ...finding, estimatedHours: hours }
              : finding
          )
        );
      }}
      placeholder="e.g. 4"
      className="w-full border border-[#27251f]/30 bg-[#f7f2e8] px-3 py-2 font-normal"
    />
  </label>

  <label className="flex flex-col gap-2 text-sm font-semibold">
    Proposed cost
    <input
      type="number"
      min="0"
      step="100"
      value={item.proposedCost ?? ""}
      onChange={(event) => {
        const value = event.target.value;
        const cost = value === "" ? null : Number(value);

        setLedger((current) =>
          current.map((finding) =>
            finding.id === item.id
              ? { ...finding, proposedCost: cost }
              : finding
          )
        );
      }}
      placeholder="e.g. 2000"
      className="w-full border border-[#27251f]/30 bg-[#f7f2e8] px-3 py-2 font-normal"
    />
  </label>

  <label className="flex flex-col gap-2 text-sm font-semibold">
    Extra deadline days
    <input
      type="number"
      min="0"
      step="1"
      value={item.deadlineImpactDays ?? ""}
      onChange={(event) => {
        const value = event.target.value;
        const days = value === "" ? null : Number(value);

        setLedger((current) =>
          current.map((finding) =>
            finding.id === item.id
              ? { ...finding, deadlineImpactDays: days }
              : finding
          )
        );
      }}
      placeholder="e.g. 2"
      className="w-full border border-[#27251f]/30 bg-[#f7f2e8] px-3 py-2 font-normal"
    />
  </label>
</div>

          {item.needsHumanReview && (
            <p className="mt-3 text-xs font-semibold text-[#a34b30]">
              Human review recommended
            </p>
          )}

          <div className="mt-5 flex flex-wrap items-center justify-between gap-3 border-t border-[#27251f]/15 pt-4">
            <span className="text-xs text-[#777166]">
              {new Date(item.createdAt).toLocaleString()}
            </span>
            <label className="flex items-center gap-2 text-sm font-semibold">
              Status
              <select
                value={item.status}
                onChange={(event) =>
                  changeLedgerStatus(item.id, event.target.value as LedgerStatus)
                }
                className="border border-[#27251f]/30 bg-[#f7f2e8] px-3 py-2 text-sm"
              >
                <option value="unresolved">Unresolved</option>
                <option value="accepted">Accepted</option>
                <option value="rejected">Rejected</option>
              </select>
            </label>
          </div>
        </article>
      ))
    )}
  </div>
</section>


            {error && (
              <div
                role="alert"
                className="mt-8 border-l-4 border-[#b33d2e] bg-[#f6dfd7] p-4 text-sm leading-6 text-[#742b20]"
              >
                <p className="font-bold">We couldn&apos;t finish the analysis.</p>
                <p className="mt-1">{error}</p>
              </div>
            )}

            {analysis && (
              <section
                  ref={analysisRef}
                  aria-live="polite"
                  className="mt-10 border-t-2 border-[#27251f] pt-6"
              >   
                <p className="text-xs font-bold uppercase tracking-[0.16em] text-[#c45c3b]">
                  The first read · {analysis.findings.length} finding(s)
                </p>
                <h3 className="mt-2 text-3xl font-black tracking-[-0.06em]">
                  Here&apos;s what stood out.
                </h3>
                <p className="mt-3 text-sm leading-7 text-[#625d52]">
                  {analysis.summary}
                </p>

                <div className="mt-6 space-y-4">
                  {analysis.findings.map((finding, index) => (
                    <article
                      key={`${finding.request}-${index}`}
                      className="border border-[#27251f]/25 bg-[#fffaf1] p-5"
                    >
                      <div className="flex flex-wrap items-start justify-between gap-3">
                        <h4 className="font-bold leading-6">{finding.request}</h4>
                        <span className="border border-[#27251f]/20 bg-[#efe7d9] px-2.5 py-1 text-xs font-bold">
                          {labels[finding.classification] ?? labels.needs_clarification}
                        </span>
                      </div>

                      <p className="mt-3 text-sm leading-6 text-[#625d52]">
                        {finding.reason}
                      </p>

                      {finding.evidence && (
                        <blockquote className="mt-4 border-l-2 border-[#64845a] bg-[#edf0e5] px-4 py-3 text-sm leading-6">
                          <p className="mb-1 text-xs font-bold uppercase tracking-wider text-[#526a49]">
                            From your original scope
                          </p>
                          “{finding.evidence}”
                        </blockquote>
                      )}

                      {finding.needsHumanReview && (
                        <p className="mt-4 text-xs font-semibold leading-5 text-[#a34b30]">
                          ↳ Human review needed. Check the agreement and clarify
                          the request before deciding.
                        </p>
                      )}
                     <div className="mt-5 border-t border-[#27251f]/15 pt-4">
  <button
    type="button"
    onClick={async () => {
  setClientReplies((previous) => ({
    ...previous,
    [index]: "Drafting reply...",
  }));

  try {
    const response = await fetch("/api/reply", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        projectName,
        scope,
        finding,
      }),
    });

    const data = await response.json();

    if (!response.ok) {
      throw new Error(
        data.error || "Could not draft the reply."
      );
    }

    setClientReplies((previous) => ({
      ...previous,
      [index]: data.reply,
    }));
  } catch (error) {
    setClientReplies((previous) => ({
      ...previous,
      [index]:
        error instanceof Error
          ? error.message
          : "Could not draft the reply. Please try again.",
    }));
  }
}}
    className="border border-[#27251f] bg-[#27251f] px-4 py-2 text-sm font-bold text-[#fffaf1] hover:bg-[#c45c3b]"
  >
    Draft a polite client reply
  </button>

  {clientReplies[index] !== undefined && (
    <div className="mt-4">
      <label className="mb-2 block text-xs font-bold uppercase tracking-wider text-[#777166]">
        Your reply draft
      </label>
      <textarea
        value={clientReplies[index]}
        onChange={(event) =>
          setClientReplies((previous) => ({
            ...previous,
            [index]: event.target.value,
          }))
        }
        rows={5}
        placeholder="Your reply will appear here..."
        className="w-full border border-[#27251f]/25 bg-[#fffaf1] p-3 text-sm leading-6 outline-none focus:border-[#c45c3b]"
      />
    </div>
  )}
</div>
                    </article>
                  ))}

                  {analysis.findings.length === 0 && (
                    <p className="border border-dashed border-[#27251f]/30 p-5 text-sm leading-6 text-[#777166]">
                      No specific findings were returned. Try adding more detail
                      to the original scope or the client&apos;s message.
                    </p>
                  )}
                </div>
              </section>
            )}
          </div>

          <aside className="space-y-8">
            <section className="border-t-2 border-[#27251f] pt-5">
              <div className="flex items-baseline justify-between gap-2">
                <h3 className="text-xl font-black tracking-[-0.04em]">
                  The running tally
                </h3>
                <span className="text-xs text-[#898173]">YOUR LEDGER</span>
              </div>
              <div className="mt-5 border border-dashed border-[#27251f]/30 bg-[#efe7d9] p-5">
  <p className="text-4xl font-black tracking-[-0.07em]">
    {acceptedImpact.totalHours} hrs
  </p>
  <p className="mt-1 text-sm text-[#777166]">
    Accepted extra time
  </p>

  <div className="my-5 border-t border-[#27251f]/15" />

  <p className="text-3xl font-black tracking-[-0.06em]">
    ₹ {acceptedImpact.totalCost.toLocaleString("en-IN")}
  </p>
  <p className="mt-1 text-sm text-[#777166]">
    Accepted proposed cost
  </p>

  <div className="my-5 border-t border-[#27251f]/15" />

  <p className="text-3xl font-black tracking-[-0.06em]">
    {acceptedImpact.totalDeadlineDays} days
  </p>
  <p className="mt-1 text-sm text-[#777166]">
    Accepted deadline impact
  </p>

  <p className="mt-4 text-xs leading-5 text-[#898173]">
    Totals reflect only changes marked Accepted in your scope ledger.
  </p>
</div>
            </section>

            <section className="border-t-2 border-[#27251f] pt-5">
              <p className="text-xs font-bold uppercase tracking-[0.16em] text-[#c45c3b]">
                Our three rules
              </p>
              <ol className="mt-4">
                <li className="flex gap-4 border-b border-[#27251f]/15 py-4">
                  <span className="font-serif text-2xl italic text-[#c45c3b]">01</span>
                  <div>
                    <p className="font-bold">Evidence over vibes.</p>
                    <p className="mt-1 text-sm leading-6 text-[#777166]">
                      Show which words support each finding.
                    </p>
                  </div>
                </li>
                <li className="flex gap-4 border-b border-[#27251f]/15 py-4">
                  <span className="font-serif text-2xl italic text-[#c45c3b]">02</span>
                  <div>
                    <p className="font-bold">Uncertainty is allowed.</p>
                    <p className="mt-1 text-sm leading-6 text-[#777166]">
                      Some requests need a conversation, not a verdict.
                    </p>
                  </div>
                </li>
                <li className="flex gap-4 py-4">
                  <span className="font-serif text-2xl italic text-[#c45c3b]">03</span>
                  <div>
                    <p className="font-bold">You make the call.</p>
                    <p className="mt-1 text-sm leading-6 text-[#777166]">
                      Review every finding before deciding what to do.
                    </p>
                  </div>
                </li>
              </ol>
            </section>

            <p className="border-l-2 border-[#c45c3b] pl-4 text-xs leading-6 text-[#777166]">
              A missing line in the brief isn&apos;t automatically a billable extra.
              ScopeShield helps you spot questions worth asking; you decide what
              happens next.
            </p>
          </aside>
        </div>
      </section>

      <footer className="border-t border-[#27251f]/25">
        <div className="mx-auto flex max-w-7xl flex-col gap-3 px-5 py-6 text-xs text-[#777166] sm:flex-row sm:items-center sm:justify-between sm:px-8">
          <p>
            <span className="font-black text-[#27251f]">scopesheild.</span>{" "}
            Made for the work behind the work.
          </p>
          <p>Local-first by design · Human judgment stays in the loop</p>
        </div>
      </footer>
    </main>
  );
}
