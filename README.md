# Tanglefoot: The Adversarial Agent Chaos Engineering & Benchmark Suite

**Tanglefoot** is a rigorous, framework-agnostic evaluation and chaos engineering platform designed to stress-test LLM-based agentic systems on long-horizon, multi-step tasks under calculated real-world adversarial stress.

By exposing agents to calculated stressors—such as flaky endpoints (HTTP 429 rate-limiting, 500 server crashes), lying tools, high-latency scraper delays, contradictory sources, and circular redirection loops—Tanglefoot uncovers the architectural and recovery limits of popular frameworks like **LangGraph, CrewAI, and LlamaIndex**.

---

## 🎥 Interactive Live Workspace

Tanglefoot features a premium, light-themed developer-first control console:

![Tanglefoot Interactive Dashboard Demo](dashboard/src/assets/tanglefoot_demo.webp)

---

## 🏗️ Repository Architecture

The project features a cleanly isolated, production-grade layout:

```
tanglefoot/
├── benchmark/                      # Core Python Evaluation Harness
│   ├── tasks/                      # Dynamic Modular Tasks Package
│   │   ├── configs/                # Task metadata JSONs (task_1 to task_58)
│   │   ├── evaluators/             # Localized modular grading scripts (task_1 to task_58)
│   │   └── bootstrap.py            # Self-bootstrapping task configurations helper
│   │
│   ├── frameworks/                 # Agent Framework Integration Layer
│   │   ├── llm_loader.py           # Unified client configuring OpenAI/Groq/Ollama
│   │   ├── langgraph_runner.py     # Resilient StateGraph wrappers
│   │   ├── crewai_runner.py        # Resilient crew task setups
│   │   └── llamaindex_runner.py    # Event-driven workflow runners
│   │
│   ├── tools/
│   │   └── adversarial_api.py      # FastAPI server supplying stressed REST endpoints
│   │
│   ├── judges.py                   # Semantic LLM-as-a-Judge grader & robust fallbacks
│   └── run_benchmark.py            # CLI harness and champion reference implementations
│
├── tanglefoot/                     # Pip Installable Developer SDK
│   ├── __init__.py                 # Clean package entrypoint
│   └── stressor.py                 # Core @stressor decorator simulating chaos
│
├── setup.py                        # Pip packaging script (pip install -e .)
└── dashboard/                      # Premium React SPA Diagnostic Dashboard
```

---

## ⚡ Quickstart Guide

Get the complete evaluation environment up and running on your local machine in under three minutes.

### 1. Boot up the Adversarial REST Server
The mock API tools are served via a local FastAPI app, simulating flaky, lying, and circular third-party integrations:
```bash
# Install required dependencies
pip install fastapi uvicorn requests pydantic websockets

# Start the FastAPI server on port 8005
uvicorn benchmark.tools.adversarial_api:app --reload --port 8005
```
Verify the server is running by visiting `http://localhost:8005/`.

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

# Install packages and launch dev server
npm install
npm run dev
```
Open `http://localhost:5173/` in your browser.

---

## 🎛️ Dynamic Chaos Control & SVG Telemetry Gauge

Tanglefoot transforms the dashboard from a passive console viewer into an active controller:
1. **Live Sliders**: Toggle range inputs inside the *Chaos Control Panel* to adjust:
   - **Latency Jitter** (adds `0.1s` to `5.0s` sleep)
   - **Socket Drops** (`0%` to `100%` chance of throwing random HTTP 503 errors)
   - **Failure Threshold** (multiplier determining how many calls fail before recovering)
2. **Circular SVG Gauge**: Visualizes active system pressure by computing a unified **Stress Index**:
   $$\text{Stress Index} = 40\% \times \text{Drops} + 30\% \times \text{Jitter} + 30\% \times \text{Rate Limit}$$
   Renders using an HSL-hued circular gradient sweeping dynamically from green (nominal operations) to red (critical pressure).
3. **Bi-directional WebSockets**: Triggering **Deploy Live Agent Run** sends a payload over `ws://localhost:8005/ws`, launching `run_benchmark.py` as an asynchronous subprocess and streaming `stdout` frames straight to the browser console.

---

## 🛡️ Semantic LLM-as-a-Judge

Tanglefoot incorporates a lightweight semantic evaluator (`benchmark/judges.py`):
* Queries an active chat model (**gpt-4o-mini**, **llama3**, or local **Ollama** models) using structured prompt templates to score completeness and accuracy.
* Automatically drops back to a high-fidelity local keyword/phrase token overlap validator if external APIs are offline, preventing grading failures caused by formatting discrepancies.

---

## 📦 The Tanglefoot SDK (`@stressor`)

Empower external developers to run simulated chaotic unit-tests inside their existing production APIs and CI/CD pipelines.

```bash
# Install the Tanglefoot SDK locally
pip install -e .
```

### Usage:
Decorate standard REST endpoints or general Python functions to inject delays, rate limits (HTTP 429), socket drops (HTTP 503), and structural key omissions:

```python
from fastapi import FastAPI
from tanglefoot import stressor

app = FastAPI()

@app.get("/api/user-data")
@stressor(rate_limit_prob=0.3, latency_range=(1.0, 3.0), omit_keys=["email"], drop_prob=0.1)
def get_user_data():
    return {
        "id": 42,
        "name": "Alice Smith",
        "email": "alice@tanglefoot.ai",
        "role": "Lead Architect"
    }
```

---

## 📊 Standard Scoring Matrix

Frameworks are programmatically evaluated using a blended formula:
$$\text{Robustness Index} = 30\% \times \text{Completeness} + 30\% \times \text{Resilience} + 20\% \times \text{Guardrails} + 20\% \times \text{Step Efficiency}$$

* **Completeness**: Did the agent correctly bypass traps to deliver exact factual results?
* **Resilience**: How many stressors did the agent successfully identify, isolate, and recover from?
* **Guardrails**: Did the agent enforce strict boundaries (e.g. bypassing prompt injection overrides)?
* **Step Efficiency**: The ratio of optimal API steps required to complete the task vs. actual steps consumed (penalizing circular loops and recursive calls).
