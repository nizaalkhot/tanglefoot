import React from 'react';
import { Terminal, Download, Play, ShieldCheck, GitFork } from 'lucide-react';

export default function CLIIntegration() {
  const steps = [
    {
      title: 'Clone & Install Dependencies',
      icon: Download,
      description: 'Clone the repository and install the standard python libraries. (We use FastAPI to serve tools and Uvicorn as the HTTP server).',
      code: `# Clone the benchmark repository
git clone https://github.com/yourcommunity/tanglefoot.git
cd tanglefoot

# Create and activate virtual environment
python -m venv venv
source venv/bin/activate  # On Windows: venv\\Scripts\\activate

# Install required core packages
pip install fastapi uvicorn requests pydantic openai`
    },
    {
      title: 'Launch the Adversarial Tools Server',
      icon: Terminal,
      description: 'Start the mock REST API server containing the lying, slow, broken, and circular redirection endpoints. The server runs locally on port 8000.',
      code: `# Boot the tools server in the background
uvicorn benchmark.tools.adversarial_api:app --reload --port 8000

# Verify active server connection (should return status: active)
curl http://localhost:8000/`
    },
    {
      title: 'Plug In A Custom Agent Framework',
      icon: GitFork,
      description: 'Implement a direct connector class inside the benchmark folder. Custom agents query the FastAPI endpoints and must successfully return the expected data to earn full points.',
      code: `import requests
from openai import OpenAI

class MyCustomAgent:
    """
    To register in the Tanglefoot CLI, implement this interface.
    The agent receives a task query and has access to local API tools.
    """
    def __init__(self):
        self.client = OpenAI()
        self.api_base = "http://localhost:8000/api"
        
    def execute(self, task_query: str) -> dict:
        # 1. Initialize step counters and log trace arrays
        logs = []
        
        # 2. ReAct reasoning loop calling Tanglefoot API endpoints
        # Example API Tool Call:
        try:
            res = requests.get(f"{self.api_base}/broken-tool")
            logs.append({
                "api_call": "/api/broken-tool", 
                "status_code": res.status_code,
                "response": res.text
            })
        except requests.RequestException as e:
            logs.append({"api_call": "/api/broken-tool", "error": str(e)})
            
        # 3. Formulate final semantic output matching task criteria
        final_answer = "Dossier details..."
        
        return {
            "output": final_answer,
            "logs": logs,
            "total_tokens": 4200,
            "total_cost": 0.063
        }`
    },
    {
      title: 'Run Evaluator and Sync Scores',
      icon: Play,
      description: 'Run the core benchmark harness against a specific task (or evaluate all 5 tasks sequentially) and log the output traces directly into a JSON result payload.',
      code: `# Run custom agent on Task 1 (Corporate Dossier)
python benchmark/run_benchmark.py --agent my_custom_agent --task task_1

# Run the complete stress test suite on all 5 tasks
python benchmark/run_benchmark.py --agent my_custom_agent --all

# View performance metrics in terminal or sync results to dashboard
python benchmark/run_benchmark.py --sync-dashboard`
    }
  ];

  return (
    <div className="animate-slide-up" style={{ display: 'flex', flexDirection: 'column', gap: '30px' }}>
      
      {/* Header section */}
      <div>
        <h2 style={{ fontFamily: 'var(--font-display)', fontSize: '32px', fontWeight: 800, marginBottom: '6px' }}>
          Developer Quickstart
        </h2>
        <p style={{ color: 'hsl(var(--text-muted))', fontSize: '15px' }}>
          Integrate, run, and score your own agent architectures against the Tanglefoot Benchmark Suite locally in minutes.
        </p>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '1.2fr 1fr', gap: '40px', alignItems: 'flex-start' }}>
        
        {/* Left Column: Sequential step guide */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
          {steps.map((step, idx) => {
            const Icon = step.icon;
            return (
              <div key={idx} className="glass-panel" style={{ marginBottom: 0, padding: '24px' }}>
                <div style={{ display: 'flex', gap: '16px' }}>
                  <div style={{
                    background: 'linear-gradient(135deg, hsl(var(--cyan) / 0.1), hsl(var(--violet) / 0.1))',
                    border: '1px solid hsl(var(--cyan) / 0.2)',
                    borderRadius: 'var(--radius-md)',
                    width: '36px',
                    height: '36px',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    color: 'hsl(var(--cyan))',
                    flexShrink: 0
                  }}>
                    <Icon size={18} />
                  </div>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', width: '100%' }}>
                    <h3 style={{ fontFamily: 'var(--font-display)', fontSize: '16px', fontWeight: 700 }}>
                      Step {idx + 1}: {step.title}
                    </h3>
                    <p style={{ fontSize: '13.5px', color: 'hsl(var(--text-muted))', lineHeight: 1.5 }}>
                      {step.description}
                    </p>
                    <div className="code-container" style={{ margin: '10px 0 0 0' }}>
                      <pre style={{ margin: 0 }}>{step.code}</pre>
                    </div>
                  </div>
                </div>
              </div>
            );
          })}
        </div>

        {/* Right Column: Submission and leaderboards rules */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '24px', position: 'sticky', top: '40px' }}>
          
          {/* Rules panel */}
          <div className="glass-panel" style={{ marginBottom: 0 }}>
            <h3 style={{ fontFamily: 'var(--font-display)', fontSize: '18px', fontWeight: 700, marginBottom: '16px', display: 'flex', alignItems: 'center', gap: '8px' }}>
              <ShieldCheck size={20} color="hsl(var(--success))" /> Official Evaluation Rules
            </h3>
            <ul style={{ fontSize: '13.5px', color: 'hsl(var(--text-muted))', display: 'flex', flexDirection: 'column', gap: '12px', paddingLeft: '16px' }}>
              <li>
                <b>No Hardcoding</b>: Agent must dynamically reason and select tools using natural language or code schemas. Swapping api endpoints is blocked.
              </li>
              <li>
                <b>Single Model Weights</b>: Evaluations must select a single backing model (e.g. <code>gpt-4o</code>) for all agents in a specific comparative run.
              </li>
              <li>
                <b>Timeout Restrictions</b>: Any execution block taking longer than 45.0 seconds automatically scores 0 points in efficiency.
              </li>
              <li>
                <b>Deterministic Seeds</b>: API parameters are dynamic but predictable. Attempts to bypass verify steps by caching answers will trigger audit failure.
              </li>
            </ul>
          </div>

          {/* Leaderboard Submission Info */}
          <div className="glass-panel glow-card" style={{ marginBottom: 0 }}>
            <span style={{ fontSize: '10px', color: 'hsl(var(--cyan))', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '1px' }}>
              Community Benchmarking
            </span>
            <h3 style={{ fontFamily: 'var(--font-display)', fontSize: '18px', fontWeight: 700, marginTop: '4px', marginBottom: '8px' }}>
              Submit Your Framework
            </h3>
            <p style={{ fontSize: '13px', color: 'hsl(var(--text-muted))', lineHeight: 1.5, marginBottom: '16px' }}>
              Have you built a highly resilient agent architecture that beats LangGraph? Submit your framework connectors and validated JSON run traces to the community leaderboard.
            </p>
            <button className="btn-primary" style={{ fontSize: '13px', padding: '10px 18px' }}>
              Submit Pull Request
            </button>
          </div>

        </div>

      </div>
    </div>
  );
}
