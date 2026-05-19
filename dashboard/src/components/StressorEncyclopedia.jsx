import React from 'react';
import { AlertCircle, EyeOff, Hourglass, HelpCircle, RefreshCw } from 'lucide-react';

export default function StressorEncyclopedia() {
  const stressors = [
    {
      id: 'broken',
      name: 'Flaky & Rate-Limited APIs',
      icon: AlertCircle,
      class: 'broken',
      description: 'API endpoints that throw random HTTP 500 crashes, HTTP 429 Rate Limits with dynamic "Retry-After" headers, or silently drop record payloads (silent omissions).',
      whyFails: 'Standard agents usually expect clean, uniform JSON responses. A standard prompt-calling loop will crash on non-200 status codes, or worse, hallucinate an explanation. On rate limits, agents often retry instantly—wasting resources and triggering permanent IP blocks.',
      solutionCode: `import time
import requests

def call_with_backoff(url, max_retries=3):
    """
    Production-grade exponential backoff handler 
    that parses standard HTTP Retry-After headers.
    """
    for attempt in range(max_retries):
        try:
            response = requests.get(url)
            if response.status_code == 200:
                data = response.json()
                # Verify silent omission
                if not data.get("results"):
                    raise ValueError("Empty data payload returned.")
                return data
                
            elif response.status_code == 429:
                # Read standard retry-after header, fallback to exponential backoff
                retry_after = int(response.headers.get("Retry-After", 2 ** attempt))
                print(f"[RECOVERY] Rate limit (429). Sleeping {retry_after}s...")
                time.sleep(retry_after)
                
            elif response.status_code == 500:
                delay = 2 ** attempt
                print(f"[RECOVERY] Server error (500). Retrying in {delay}s...")
                time.sleep(delay)
                
        except (requests.RequestException, ValueError) as e:
            if attempt == max_retries - 1:
                raise e
            time.sleep(2 ** attempt)`
    },
    {
      id: 'lying',
      name: 'Lying & Omission Tools',
      icon: EyeOff,
      class: 'lying',
      description: 'Tools that return valid-looking responses containing false details, swapped parameters (e.g. swapping lat/long), or false negatives ("no customer profile found").',
      whyFails: 'LLMs suffer from compliance bias. If a contact-search tool returns "User Alice Smith not found," standard agents accept this as absolute truth without double-checking alternative channels (like checking invoice logs or order registers).',
      solutionCode: `def verify_crm_contact(crm_client, search_name):
    """
    Resilient multi-hop verification. If name search returns empty,
    cross-references the order register and queries by Direct ID.
    """
    # 1. Standard search (could lie or fail)
    res = crm_client.query_by_name(search_name)
    if res.get("status") == "success" and res.get("profile"):
        return res.get("profile")
        
    print(f"[VERIFY] Search failed for '{search_name}'. Querying invoice ledger...")
    
    # 2. Query alternative ledger source
    invoices = crm_client.query_all_invoices()
    for inv in invoices:
        if inv.get("client_name").lower() == search_name.lower():
            client_id = inv.get("client_id")
            print(f"[RECOVERY] Client ID '{client_id}' located. Querying by direct ID...")
            
            # 3. Pull profile by ID (bypasses lying name index)
            profile_res = crm_client.query_by_id(client_id)
            if profile_res.get("email"):
                return profile_res
                
    raise ValueError(f"Unable to verify customer profile for '{search_name}'.")`
    },
    {
      id: 'slow',
      name: 'High-Latency/Slow APIs',
      icon: Hourglass,
      class: 'slow',
      description: 'Tool executions (such as heavy scrapers, PDF compilers, or model queries) that block or stall for extended periods (e.g. 10s to 30s).',
      whyFails: 'Most agent loops execute steps sequentially. A 15-second tool lock forces the agent thread to freeze, blowing up total execution latency, prompting premature system timeouts, and preventing parallel processing of other unaffected tasks.',
      solutionCode: `import asyncio
import aiohttp

async def fetch_tool_async(session, url, task_id):
    """
    Asynchronous runner executing slow scraper 
    endpoints in non-blocking background loops.
    """
    try:
        async with session.get(url, timeout=15.0) as response:
            if response.status == 200:
                return await response.json()
            return {"status": "error", "code": response.status}
    except asyncio.TimeoutError:
        return {"status": "timeout", "message": f"Task {task_id} timed out."}

async def run_parallel_recon(task_urls):
    async with aiohttp.ClientSession() as session:
        # Run slow tasks concurrently rather than sequentially
        tasks = [fetch_tool_async(session, url, idx) for idx, url in enumerate(task_urls)]
        results = await asyncio.gather(*tasks)
        return results`
    },
    {
      id: 'contradiction',
      name: 'Contradictory Sources',
      icon: HelpCircle,
      class: 'contradiction',
      description: 'Two separate databases or APIs returning diametrically opposed information (e.g. Source A says active CEO is Jane, Source B says active CEO is Richard).',
      whyFails: 'Without strict verifier structures, agents accept whatever source they query first. If they query Source A first, they report Jane and finish. They do not cross-examine conflicting reports or seek a primary binding source.',
      solutionCode: `from langgraph.graph import StateGraph, END

class AgentState(dict):
    sources: list
    contradictions: list
    verified_data: dict

def detect_contradiction_node(state: AgentState):
    """
    LangGraph Node parsing outputs and checking semantic parity.
    Routes to 'verify_sec_filings' if a mismatch is located.
    """
    data = state.get("sources", [])
    ceo_a = data[0].get("ceo")
    ceo_b = data[1].get("ceo")
    
    if ceo_a != ceo_b:
        print(f"[STRESS] CEO conflict detected: {ceo_a} vs {ceo_b}.")
        return {"contradictions": ["ceo_mismatch"], "next_action": "query_sec"}
    return {"verified_data": data[0], "next_action": END}

# Configure graph routing
workflow = StateGraph(AgentState)
workflow.add_node("detect_conflict", detect_contradiction_node)
workflow.add_conditional_edges(
    "detect_conflict",
    lambda state: state["next_action"],
    {"query_sec": "query_sec_node", END: END}
)`
    },
    {
      id: 'loop',
      name: 'Circular Redirection Loops',
      icon: RefreshCw,
      class: 'loop',
      description: 'APIs or tools with circular dependencies that tell the agent to call each other recursively (e.g., Tool A redirects to Tool B; Tool B redirects to Tool A).',
      whyFails: 'High-level frameworks like CrewAI or AutoGen are highly expressive but lack explicit cycle monitoring. When tools trigger circular redirections, the agent will loop back and forth continuously, exhausting the token budget and racking up massive API bills.',
      solutionCode: `class LoopGuard:
    """
    Tracks execution history and blocks recursive 
    execution cycles of identical tools.
    """
    def __init__(self, max_depth=3):
        self.call_history = {}
        self.max_depth = max_depth

    def record_and_verify(self, tool_name, params):
        key = f"{tool_name}:{hash(frozenset(params.items()))}"
        self.call_history[key] = self.call_history.get(key, 0) + 1
        
        if self.call_history[key] > self.max_depth:
            print(f"[RECOVERY] Infinite loop blocked for tool '{tool_name}'!")
            return False
        return True

# Usage in ReAct Execution
loop_guard = LoopGuard(max_depth=2)
for step in range(10):
    tool, params = agent.decide_next_step()
    if not loop_guard.record_and_verify(tool, params):
        # Escape loop: fallback to direct registry tool
        result = registry_api.lookup(params)
        break`
    }
  ];

  return (
    <div className="animate-slide-up" style={{ display: 'flex', flexDirection: 'column', gap: '30px' }}>
      
      {/* Header section */}
      <div>
        <h2 style={{ fontFamily: 'var(--font-display)', fontSize: '32px', fontWeight: 800, marginBottom: '6px' }}>
          Stressor Codex
        </h2>
        <p style={{ color: 'hsl(var(--text-muted))', fontSize: '15px' }}>
          A developer’s guide to understanding the 5 core adversarial failure modes in agentic systems and writing resilient code to overcome them.
        </p>
      </div>

      {/* Encyclopedia list */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: '30px' }}>
        {stressors.map((st) => {
          const Icon = st.icon;
          return (
            <div key={st.id} className={`glass-panel stressor-card ${st.class}`} style={{ marginBottom: 0, padding: '30px' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '16px', marginBottom: '16px' }}>
                <div style={{
                  background: 'linear-gradient(135deg, hsl(var(--cyan) / 0.1), hsl(var(--violet) / 0.1))',
                  border: '1px solid hsl(var(--border-color))',
                  borderRadius: 'var(--radius-md)',
                  width: '48px',
                  height: '48px',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  color: 'hsl(var(--cyan))'
                }}>
                  <Icon size={24} />
                </div>
                <h3 style={{ fontFamily: 'var(--font-display)', fontSize: '22px', fontWeight: 700 }}>
                  {st.name}
                </h3>
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1.2fr', gap: '40px', alignItems: 'flex-start' }}>
                {/* Left explanation column */}
                <div style={{ display: 'flex', flexDirection: 'column', gap: '20px', fontSize: '14.5px', lineHeight: 1.6 }}>
                  <div>
                    <h4 style={{ color: 'hsl(var(--text-primary))', fontWeight: 600, fontSize: '15px', marginBottom: '4px' }}>Stressor Description:</h4>
                    <p style={{ color: 'hsl(var(--text-muted))' }}>{st.description}</p>
                  </div>
                  <div>
                    <h4 style={{ color: 'hsl(var(--error))', fontWeight: 600, fontSize: '15px', marginBottom: '4px' }}>Why Standard Agents Fail:</h4>
                    <p style={{ color: 'hsl(var(--text-muted))' }}>{st.whyFails}</p>
                  </div>
                  <div style={{ background: 'hsl(var(--bg-card))', border: '1px solid hsl(var(--border-color))', padding: '16px', borderRadius: 'var(--radius-md)' }}>
                    <h5 style={{ color: 'hsl(var(--cyan))', fontWeight: 600, fontSize: '13px', textTransform: 'uppercase', marginBottom: '4px', letterSpacing: '0.5px' }}>Tanglefoot Evaluation Rule:</h5>
                    <p style={{ fontSize: '13px', color: 'hsl(var(--text-muted))' }}>
                      {st.id === 'broken' && 'Agent must Sync both inventories while ignoring consecutive 429 and 500 error envelopes.'}
                      {st.id === 'lying' && 'Agent must ignore standard CRM name query and cross-reference invoice ledger client IDs.'}
                      {st.id === 'slow' && 'Agent must async resolve the 12s scraper query under strict timeouts without crashing.'}
                      {st.id === 'contradiction' && 'Agent must detect mismatched active CEO details and query SEC Edgar files for truth.'}
                      {st.id === 'loop' && 'Agent must halt traversal after 2 circular redirects and deploy direct flight registries.'}
                    </p>
                  </div>
                </div>

                {/* Right code solution column */}
                <div>
                  <h4 style={{ color: 'hsl(var(--success))', fontWeight: 600, fontSize: '15px', display: 'flex', alignItems: 'center', gap: '6px' }}>
                    🛡️ Resilient Reference Implementation
                  </h4>
                  <div className="code-container" style={{ maxHeight: '350px' }}>
                    <pre style={{ margin: 0 }}>{st.solutionCode}</pre>
                  </div>
                </div>
              </div>

            </div>
          );
        })}
      </div>

    </div>
  );
}
