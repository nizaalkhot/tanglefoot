# Tanglefoot: The Adversarial Agent Benchmark Suite

**Tanglefoot** is a rigorous, framework-agnostic public benchmark designed to evaluate LLM-based agentic systems on long-horizon, multi-step tasks under intentional, real-world adversarial stress. 

By exposing agents to calculated stressors—such as flaky endpoints (HTTP 429 rate-limiting, 500 server crashes), lying tools, high-latency scraper delay, contradictory sources, and circular redirection loops—Tanglefoot uncovers the architectural limits of popular frameworks like **LangGraph, CrewAI, Microsoft AutoGen, and LlamaIndex Workflows**.

---

## 🏗️ Repository Architecture

The project is split into two cleanly isolated, production-grade components:

```
tanglefoot/
├── benchmark/                    # Core Python Evaluation Harness
│   ├── tools/
│   │   └── adversarial_api.py    # FastAPI server supplying stressed REST endpoints
│   ├── tasks.py                  # Python task specifications & grading scoring math
│   └── run_benchmark.py          # CLI runner & reference resilient agent implementations
│
└── dashboard/                    # Premium React SPA Diagnostic Dashboard
    ├── src/
    │   ├── components/           # UI Views: Leaderboard, Stress Arena, Codex, CLI Guide
    │   ├── data/
    │   │   └── benchmark_results.json # Execution traces and multi-framework score matrices
    │   ├── App.jsx               # Application shell and theme class routers
    │   └── index.css             # Vanilla CSS design system (glassmorphism, dark/light swap)
    └── index.html                # Entry HTML with Outfit/Inter web typography
```

---

## ⚡ Quickstart Guide

Get the complete evaluation environment up and running on your local machine in under three minutes.

### 1. Boot up the Adversarial REST Server
The mock API tools are served via a local FastAPI app, simulating flaky, lying, and circular third-party integrations:
```bash
# Move to benchmark directory and launch Uvicorn
pip install fastapi uvicorn requests pydantic
uvicorn benchmark.tools.adversarial_api:app --reload --port 8000
```
Verify the server is running by visiting `http://localhost:8000/`.

### 2. Deploy and Evaluate the Resilient Agent CLI
Run the real-time python evaluator against all tasks (or specify a single task using `--task task_1`):
```bash
# Run the complete stress test suite using our reference resilient agent
python benchmark/run_benchmark.py --agent resilient_baseline --task all

# Sync the fresh results and logs directly to your dashboard files
python benchmark/run_benchmark.py --agent resilient_baseline --task all --sync-dashboard
```

### 3. Launch the Premium Diagnostic Dashboard
Experience the interactive leaderboard and watch the step-by-step developer console log replays:
```bash
# Navigate to the dashboard directory
cd dashboard

# Install packages (including lucide-react) and launch dev server
npm install
npm run dev
```
Open `http://localhost:5173/` in your browser.

---

## 🪤 The 5 Adversarial Stressors

| Stressor | Target Endpoint | Description | Resilient Mitigation Strategy |
| :--- | :--- | :--- | :--- |
| **1. Flaky & Rate Limits** | `/api/broken-tool` | Random HTTP 500s, HTTP 429s with `Retry-After: 3`, or silent empty payloads. | Exponential backoff, header-driven delays, and non-empty schema validations. |
| **2. Lying & Omission** | `/api/lying-tool` | Returns swapped parameters (lat/long) or reports user-not-found false negatives. | Multi-hop cross-referencing (verifying directories by pulling direct invoice logs). |
| **3. Slow Scrapers** | `/api/slow-tool` | Hardcoded 12.0s block delay to lock sequential execution threads. | Asynchronous concurrent loops and non-blocking background workers. |
| **4. Contradictions** | `/api/contradictory-a` | Mismatched active CEO details between Wikipedia and directory logs. | Parsing outputs for semantic mismatch and routing to primary SEC filing. |
| **5. Redirect Loops** | `/api/redirect-loop` | Circular redirections instructing the agent to cycle between identical endpoints. | Cycle-detection loop guards to break infinite token loops and fallback to registries. |

---

## 📊 Standard Scoring Matrix

Frameworks are programmatically evaluated using a blended formula:
$$\text{Robustness Index} = 40\% \times \text{Completeness} + 40\% \times \text{Resilience} + 20\% \times \text{Step Efficiency}$$

*   **Completeness**: Did the agent correctly bypass traps to deliver exact factual results (e.g. Richard Roe as CEO)?
*   **Resilience**: How many stressors did the agent successfully identify, isolate, and recover from?
*   **Step Efficiency**: The ratio of optimal API steps required to complete the task vs. actual steps consumed (penalizing circular loop retries and duplicate conversational calls).
