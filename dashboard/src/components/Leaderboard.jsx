import React, { useState } from 'react';
import { Trophy, TrendingUp, AlertTriangle, ArrowUpDown, ChevronRight, Activity, DollarSign } from 'lucide-react';
import benchmarkData from '../data/benchmark_results.json';

export default function Leaderboard() {
  const [sortBy, setSortBy] = useState('overallScore');
  const [sortOrder, setSortOrder] = useState('desc');
  const [selectedFramework, setSelectedFramework] = useState(benchmarkData.leaderboard[0].id);

  const handleSort = (field) => {
    if (sortBy === field) {
      setSortOrder(sortOrder === 'desc' ? 'asc' : 'desc');
    } else {
      setSortBy(field);
      setSortOrder('desc');
    }
  };

  const sortedLeaderboard = [...benchmarkData.leaderboard].sort((a, b) => {
    let aVal = a[sortBy];
    let bVal = b[sortBy];
    
    // Sort logic
    if (sortBy === 'avgLatency' || sortBy === 'avgCost') {
      // For latency and cost, lower is better! So default desc is lower is worst, but let's invert standard order
      return sortOrder === 'desc' ? bVal - aVal : aVal - bVal;
    }
    return sortOrder === 'desc' ? bVal - aVal : aVal - bVal;
  });

  const getScoreClass = (score) => {
    if (score >= 80) return 'high';
    if (score >= 50) return 'mid';
    return 'low';
  };

  const activeProfile = benchmarkData.leaderboard.find(f => f.id === selectedFramework);

  return (
    <div className="animate-slide-up" style={{ display: 'flex', flexDirection: 'column', gap: '30px' }}>
      
      {/* Header section */}
      <div>
        <h2 style={{ fontFamily: 'var(--font-display)', fontSize: '32px', fontWeight: 800, marginBottom: '6px' }}>
          Global Leaderboard
        </h2>
        <p style={{ color: 'hsl(var(--text-muted))', fontSize: '15px' }}>
          Rigorous adversarial evaluations grading the top agentic frameworks on long-horizon, multi-step tasks under stress.
        </p>
      </div>

      {/* Highlights Grid */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: '20px' }}>
        {/* Card 1: Champion */}
        <div className="glass-panel glow-card" style={{ display: 'flex', alignItems: 'center', gap: '20px', marginBottom: 0, padding: '20px' }}>
          <div style={{
            background: 'linear-gradient(135deg, hsl(var(--cyan) / 0.15), hsl(var(--violet) / 0.15))',
            border: '1px solid hsl(var(--cyan) / 0.3)',
            borderRadius: 'var(--radius-md)',
            width: '54px',
            height: '54px',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            color: 'hsl(var(--cyan))'
          }}>
            <Trophy size={28} />
          </div>
          <div>
            <span style={{ fontSize: '11px', color: 'hsl(var(--text-dim))', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '1px' }}>
              Benchmark Champion
            </span>
            <h3 style={{ fontFamily: 'var(--font-display)', fontSize: '20px', fontWeight: 700, marginTop: '2px' }}>
              LangGraph
            </h3>
            <span style={{ fontSize: '12px', color: 'hsl(var(--success))', fontWeight: 500 }}>
              Resilience Score: 94.2%
            </span>
          </div>
        </div>

        {/* Card 2: Average success rate */}
        <div className="glass-panel glow-card" style={{ display: 'flex', alignItems: 'center', gap: '20px', marginBottom: 0, padding: '20px' }}>
          <div style={{
            background: 'linear-gradient(135deg, hsl(var(--warning) / 0.15), transparent)',
            border: '1px solid hsl(var(--warning) / 0.3)',
            borderRadius: 'var(--radius-md)',
            width: '54px',
            height: '54px',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            color: 'hsl(var(--warning))'
          }}>
            <AlertTriangle size={28} />
          </div>
          <div>
            <span style={{ fontSize: '11px', color: 'hsl(var(--text-dim))', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '1px' }}>
              Adversarial Cost
            </span>
            <h3 style={{ fontFamily: 'var(--font-display)', fontSize: '20px', fontWeight: 700, marginTop: '2px' }}>
              -54.8% Success Drop
            </h3>
            <span style={{ fontSize: '12px', color: 'hsl(var(--text-muted))' }}>
              Average framework success rate
            </span>
          </div>
        </div>

        {/* Card 3: Economic Leader */}
        <div className="glass-panel glow-card" style={{ display: 'flex', alignItems: 'center', gap: '20px', marginBottom: 0, padding: '20px' }}>
          <div style={{
            background: 'linear-gradient(135deg, hsl(var(--violet) / 0.15), transparent)',
            border: '1px solid hsl(var(--violet) / 0.3)',
            borderRadius: 'var(--radius-md)',
            width: '54px',
            height: '54px',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            color: 'hsl(var(--violet))'
          }}>
            <TrendingUp size={28} />
          </div>
          <div>
            <span style={{ fontSize: '11px', color: 'hsl(var(--text-dim))', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '1px' }}>
              Most Cost Efficient
            </span>
            <h3 style={{ fontFamily: 'var(--font-display)', fontSize: '20px', fontWeight: 700, marginTop: '2px' }}>
              LangGraph
            </h3>
            <span style={{ fontSize: '12px', color: 'hsl(var(--success))', fontWeight: 500 }}>
              $0.06 avg. cost per run
            </span>
          </div>
        </div>
      </div>

      {/* Main Leaderboard Table Panel */}
      <div className="glass-panel" style={{ padding: '8px 24px 24px 24px' }}>
        <div style={{ 
          display: 'flex', 
          justifyContent: 'space-between', 
          alignItems: 'center', 
          padding: '20px 0', 
          borderBottom: '1px solid hsl(var(--border-color))' 
        }}>
          <h3 style={{ fontFamily: 'var(--font-display)', fontSize: '20px', fontWeight: 700 }}>
            Rankings Matrix
          </h3>
          <span style={{ fontSize: '12px', color: 'hsl(var(--text-muted))', display: 'flex', alignItems: 'center', gap: '6px' }}>
            <Activity size={14} /> Click columns to sort rankings
          </span>
        </div>

        <div style={{ overflowX: 'auto' }}>
          <table className="leaderboard-table">
            <thead>
              <tr>
                <th style={{ width: '60px', textAlign: 'center' }}>Rank</th>
                <th>Framework</th>
                <th onClick={() => handleSort('overallScore')} style={{ cursor: 'pointer' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                    Robustness Index <ArrowUpDown size={14} />
                  </div>
                </th>
                <th onClick={() => handleSort('successRate')} style={{ cursor: 'pointer' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                    Success Rate <ArrowUpDown size={14} />
                  </div>
                </th>
                <th onClick={() => handleSort('avgLatency')} style={{ cursor: 'pointer' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                    Avg Latency <ArrowUpDown size={14} />
                  </div>
                </th>
                <th onClick={() => handleSort('avgCost')} style={{ cursor: 'pointer' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                    Avg Cost (USD) <ArrowUpDown size={14} />
                  </div>
                </th>
                <th onClick={() => handleSort('avgTokenEfficiency')} style={{ cursor: 'pointer' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                    Token Efficiency <ArrowUpDown size={14} />
                  </div>
                </th>
              </tr>
            </thead>
            <tbody>
              {sortedLeaderboard.map((fw, index) => {
                const isSelected = selectedFramework === fw.id;
                return (
                  <tr 
                    key={fw.id} 
                    onClick={() => setSelectedFramework(fw.id)}
                    style={{ 
                      cursor: 'pointer',
                      background: isSelected ? 'hsl(var(--cyan) / 0.03)' : 'transparent',
                    }}
                  >
                    <td style={{ textAlign: 'center', fontWeight: 700, color: index === 0 ? 'hsl(var(--cyan))' : 'inherit' }}>
                      #{index + 1}
                    </td>
                    <td>
                      <div style={{ display: 'flex', flexDirection: 'column' }}>
                        <span style={{ fontWeight: 600, color: isSelected ? 'hsl(var(--cyan))' : 'inherit' }}>
                          {fw.name}
                        </span>
                        <span style={{ fontSize: '11px', color: 'hsl(var(--text-dim))' }}>
                          {fw.id === 'react_baseline' ? 'Baseline Loop' : 'Framework'}
                        </span>
                      </div>
                    </td>
                    <td>
                      <span className={`score-badge ${getScoreClass(fw.overallScore)}`}>
                        {fw.overallScore}%
                      </span>
                    </td>
                    <td style={{ fontWeight: 600 }}>{fw.successRate}%</td>
                    <td style={{ color: fw.avgLatency > 15 ? 'hsl(var(--error))' : 'inherit' }}>
                      {fw.avgLatency}s
                    </td>
                    <td style={{ fontFamily: 'var(--font-mono)', fontSize: '14px' }}>
                      ${fw.avgCost.toFixed(2)}
                    </td>
                    <td>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                        <div style={{ width: '60px', height: '6px', background: 'hsl(var(--border-color))', borderRadius: '4px', overflow: 'hidden' }}>
                          <div style={{ width: `${fw.avgTokenEfficiency}%`, height: '100%', background: 'hsl(var(--cyan))' }} />
                        </div>
                        <span style={{ fontSize: '13px' }}>{fw.avgTokenEfficiency}%</span>
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>

      {/* Dynamic Detail Capabilities Grid */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(450px, 1fr))', gap: '24px' }}>
        
        {/* Left Side: Stress Test Dimension Metrics */}
        <div className="glass-panel" style={{ display: 'flex', flexDirection: 'column', gap: '20px', marginBottom: 0 }}>
          <div>
            <span style={{ fontSize: '11px', color: 'hsl(var(--cyan))', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '1px' }}>
              Stress Defense Blueprint
            </span>
            <h3 style={{ fontFamily: 'var(--font-display)', fontSize: '22px', fontWeight: 800, marginTop: '4px' }}>
              {activeProfile.name} Resilience Spectrum
            </h3>
          </div>

          <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
            {/* Dimension 1 */}
            <div>
              <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '13px', marginBottom: '6px' }}>
                <span style={{ fontWeight: 500 }}>Slow API Resilience (Timeouts)</span>
                <span style={{ fontWeight: 600, color: 'hsl(var(--cyan))' }}>{activeProfile.dimensions.timeout}%</span>
              </div>
              <div style={{ width: '100%', height: '8px', background: 'hsl(var(--bg-card))', border: '1px solid hsl(var(--border-color))', borderRadius: '99px', overflow: 'hidden' }}>
                <div style={{ width: `${activeProfile.dimensions.timeout}%`, height: '100%', background: 'linear-gradient(90deg, hsl(var(--cyan)), hsl(var(--violet)))', borderRadius: '99px' }} />
              </div>
            </div>

            {/* Dimension 2 */}
            <div>
              <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '13px', marginBottom: '6px' }}>
                <span style={{ fontWeight: 500 }}>Broken/Flaky APIs (Rate Limits & 500s)</span>
                <span style={{ fontWeight: 600, color: 'hsl(var(--cyan))' }}>{activeProfile.dimensions.rateLimit}%</span>
              </div>
              <div style={{ width: '100%', height: '8px', background: 'hsl(var(--bg-card))', border: '1px solid hsl(var(--border-color))', borderRadius: '99px', overflow: 'hidden' }}>
                <div style={{ width: `${activeProfile.dimensions.rateLimit}%`, height: '100%', background: 'linear-gradient(90deg, hsl(var(--cyan)), hsl(var(--violet)))', borderRadius: '99px' }} />
              </div>
            </div>

            {/* Dimension 3 */}
            <div>
              <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '13px', marginBottom: '6px' }}>
                <span style={{ fontWeight: 500 }}>Lying Tool Defense (Fact Verification)</span>
                <span style={{ fontWeight: 600, color: 'hsl(var(--cyan))' }}>{activeProfile.dimensions.lying}%</span>
              </div>
              <div style={{ width: '100%', height: '8px', background: 'hsl(var(--bg-card))', border: '1px solid hsl(var(--border-color))', borderRadius: '99px', overflow: 'hidden' }}>
                <div style={{ width: `${activeProfile.dimensions.lying}%`, height: '100%', background: 'linear-gradient(90deg, hsl(var(--cyan)), hsl(var(--violet)))', borderRadius: '99px' }} />
              </div>
            </div>

            {/* Dimension 4 */}
            <div>
              <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '13px', marginBottom: '6px' }}>
                <span style={{ fontWeight: 500 }}>Contradictory Source Resolution</span>
                <span style={{ fontWeight: 600, color: 'hsl(var(--cyan))' }}>{activeProfile.dimensions.contradiction}%</span>
              </div>
              <div style={{ width: '100%', height: '8px', background: 'hsl(var(--bg-card))', border: '1px solid hsl(var(--border-color))', borderRadius: '99px', overflow: 'hidden' }}>
                <div style={{ width: `${activeProfile.dimensions.contradiction}%`, height: '100%', background: 'linear-gradient(90deg, hsl(var(--cyan)), hsl(var(--violet)))', borderRadius: '99px' }} />
              </div>
            </div>

            {/* Dimension 5 */}
            <div>
              <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '13px', marginBottom: '6px' }}>
                <span style={{ fontWeight: 500 }}>Data Prompt Injection Resistance</span>
                <span style={{ fontWeight: 600, color: 'hsl(var(--cyan))' }}>{activeProfile.dimensions.injection}%</span>
              </div>
              <div style={{ width: '100%', height: '8px', background: 'hsl(var(--bg-card))', border: '1px solid hsl(var(--border-color))', borderRadius: '99px', overflow: 'hidden' }}>
                <div style={{ width: `${activeProfile.dimensions.injection}%`, height: '100%', background: 'linear-gradient(90deg, hsl(var(--cyan)), hsl(var(--violet)))', borderRadius: '99px' }} />
              </div>
            </div>
          </div>
        </div>

        {/* Right Side: Framework Diagnostic Summary */}
        <div className="glass-panel" style={{ display: 'flex', flexDirection: 'column', gap: '20px', marginBottom: 0 }}>
          <div>
            <span style={{ fontSize: '11px', color: 'hsl(var(--violet))', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '1px' }}>
              Architectural Analysis
            </span>
            <h3 style={{ fontFamily: 'var(--font-display)', fontSize: '22px', fontWeight: 800, marginTop: '4px' }}>
              Diagnostic Report
            </h3>
          </div>

          <div style={{ 
            background: 'hsl(var(--bg-card))', 
            border: '1px solid hsl(var(--border-color))', 
            borderRadius: 'var(--radius-md)', 
            padding: '20px',
            fontSize: '14px',
            lineHeight: '1.6',
            color: 'hsl(var(--text-muted))'
          }}>
            <p style={{ marginBottom: '16px', color: 'hsl(var(--text-primary))', fontWeight: 500 }}>
              {activeProfile.summary}
            </p>
            <p>
              Under stress conditions, the architectural structure of <span style={{ color: 'hsl(var(--cyan))', fontWeight: 600 }}>{activeProfile.name}</span> shows distinct characteristics. 
              {activeProfile.id === 'langgraph' && ' Because LangGraph forces developer-defined transition schemas, rate limits are elegantly isolated inside dedicated node cycles, allowing exponential retry limits to operate outside the core LLM execution loop. Timeout loops are managed by executing tool nodes asynchronously in independent execution threads.'}
              {activeProfile.id === 'crewai' && ' Due to CrewAI\'s reliance on natural language roleplaying prompt instructions, the worker agents are highly vulnerable to conversational loops. When a tool fails or lies, the LLM frequently enters recursive argument nodes, repeating identical API calls multiple times and quickly exhausting the token budget without solving the discrepancy.'}
              {activeProfile.id === 'autogen' && ' AutoGen excels at resolving semantic conflicts since multiple active agents (like a Researcher and a Verifier) can audit each other\'s work. However, this conversational back-and-forth results in extremely high latency and elevated token expenditures per successful task execution.'}
              {activeProfile.id === 'llamaindex' && ' LlamaIndex Workflows perform extremely well by organizing agents into event-driven stream architectures. While highly stable, this model requires manual python event handlers to handle complex retry and data checks, raising developer overhead.'}
              {activeProfile.id === 'react_baseline' && ' The raw ReAct baseline lacks a state architecture entirely. Since it uses a basic prompt loop, any API failure (like a 429 rate limit or 500 connection drop) immediately causes the system to collapse, raise an uncaught exception, or return faulty information without attempting verification.'}
            </p>
          </div>

          <div style={{ display: 'flex', justifyContent: 'flex-end' }}>
            <span style={{ fontSize: '12px', color: 'hsl(var(--text-dim))', display: 'flex', alignItems: 'center', gap: '4px' }}>
              Detailed run records available in the <b>Stress Arena</b> <ChevronRight size={14} />
            </span>
          </div>
        </div>

      </div>
    </div>
  );
}
