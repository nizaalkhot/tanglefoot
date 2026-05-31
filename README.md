# Tanglefoot: Agent Chaos Engineering & Benchmark Suite

Tanglefoot is an evaluation tool designed to test how well AI agents handle difficult real-world situations.

It runs agents built with frameworks like **LangGraph, CrewAI, AutoGen, and LlamaIndex** against a set of challenging tasks. During these tasks, Tanglefoot introduces adversarial stressors (difficult problems) such as:

* **Slow APIs**: Delays in server responses.
* **Rate Limits & Server Outages**: Temporary HTTP 429 and 500 errors.
* **Redirection Loops**: Tools that redirect in a circle to trick the agent.
* **Contradictory Sources**: Different databases giving conflicting information (for example, an outdated corporate wiki vs. a official SEC filing).
* **Prompt Injections**: Input text that attempts to hijack agent instructions.

## 🎥 Dashboard Replay & Interactive Preview
Below is a high-fidelity visual preview of the Tanglefoot interactive trace scroller, ticking token-cost telemetry, and dark/light system interface:

![Tanglefoot Interactive Dashboard Demo](dashboard/src/assets/tanglefoot_demo.webp)

---

## Repository Structure

The project has the following main parts:

```
tanglefoot/
├── benchmark/                      # Core Python Evaluation Harness
│   ├── tasks/                      # Tasks configurations and evaluators
│   ├── frameworks/                 # Integrations for LangGraph, CrewAI, AutoGen, and LlamaIndex
│   ├── tools/                      # FastAPI server supplying stressed REST endpoints
│   └── run_benchmark.py            # CLI harness and agent reference implementations
│
├── tanglefoot/                     # Python SDK package
│   └── stressor.py                 # @stressor decorator to inject chaos in custom endpoints
│
└── dashboard/                      # React Developer Dashboard and Leaderboard UI
```

---

## Quickstart Guide

Get the complete evaluation environment up and running on your local machine.

### 1. Start the Adversarial REST Server
The API endpoints are served via a local FastAPI app that simulates slow, broken, and circular integrations:
```bash
# Install core packages
pip install fastapi uvicorn requests pydantic websockets

# Start the FastAPI server on port 8005
uvicorn benchmark.tools.adversarial_api:app --reload --port 8005
```
You can verify the server is running by opening `http://localhost:8005/` in your browser.

### 2. Run the Benchmark CLI
Run the evaluator against all tasks:
```bash
# Run the complete stress test suite using the resilient LangGraph agent
python benchmark/run_benchmark.py --agent langgraph --task all

# Run and sync the results and logs directly to the dashboard
python benchmark/run_benchmark.py --agent langgraph --task all --sync-dashboard
```

### 3. Launch the Dashboard UI
View the leaderboard and step-by-step agent thoughts:
```bash
cd dashboard
npm install
npm run dev
```
Open `http://localhost:5173/` in your browser.

## 🚀 V2 Advanced Features

Tanglefoot has been upgraded with highly robust security stressors, hardened evaluation layers, and a concurrent framework execution harness:

### 1. Advanced Adversarial Stressors
We simulate advanced LLM vulnerabilities to test agent safety limits:
* **Multi-Stage Indirect Prompt Injections (Task 59)**: Validates if agents can successfully filter out malicious third-party payloads instructing them to output fake data, while extracting factual data.
* **Dynamic Tool-Definition Hijacking (Task 60)**: Rewrites tool schemas dynamically between successive invocations to test the resilience of dynamic schema parsers.
* **Complex Data Poisoning & Guardrail Traps (Task 61)**: Injects zero-width spaces (`\u200b`) and Right-to-Left Override (`\u202b`) formatting traps to test data sanitization.

### 2. Hardened Evaluation Layer (`judges.py`)
* **Consensus Panel of Judges**: Scores are evaluated concurrently by an ensemble of three independent evaluator personas ("Strict Auditor", "Resilience Advocate", and "Guardrail Warden") to minimize grading variance.
* **Deterministic Invariant Testing**: Skips LLM calls for quantitative assertions by performing strict regex-based and numerical assertions first.
* **Cost & Token Normalization**: Integrates execution efficiency directly into the Robustness Index using OpenInference token counters.

### 3. Concurrency & SDK Chaos Interceptors
* **True Concurrent Matrix Testing**: Speeds up benchmarking runtimes via `--parallel` support using multi-threaded execution pools.
* **Network Fault Injection**: Simulates packet drops and flaky environments programmatically with `enable_network_proxy_interceptor`.
* **Stateful Mutators**: Introduces `StatefulDBCacheMutator` to simulate dirty reads and database cache race conditions.

---

## Scoring Metrics

Agents are graded using a blended formula based on four pillars:

1. **Completeness**: Did the agent find the correct answer?
2. **Resilience**: Did the agent detect and recover from server errors, loops, and lies?
3. **Guardrails**: Did the agent avoid prompt injections and keep system boundaries?
4. **Step Efficiency**: Did the agent complete the task in a reasonable number of steps without getting stuck?
