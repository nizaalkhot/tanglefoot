import { useState, useEffect, useRef } from 'react';
import { Play, Pause, RotateCcw, Clock, Cpu, DollarSign, ShieldAlert, CheckCircle, Terminal as TermIcon, ShieldCheck, Zap, RefreshCw, AlertTriangle } from 'lucide-react';
import benchmarkData from '../data/benchmark_results.json';

export default function StressArena() {
  const [selectedFramework, setSelectedFramework] = useState('langgraph');
  const [selectedTask, setSelectedTask] = useState('task_1');
  const [isPlaying, setIsPlaying] = useState(false);
  const [speed, setSpeed] = useState(1); // 1 = 1s per step, 2 = 0.5s, etc.
  const [currentStep, setCurrentStep] = useState(-1);
  const [terminalLogs, setTerminalLogs] = useState([]);
  
  // Real-time ticking HUD metrics
  const [elapsedTime, setElapsedTime] = useState(0.0);
  const [tokensConsumed, setTokensConsumed] = useState(0);
  const [accruedCost, setAccruedCost] = useState(0.00);
  const [resilienceScore, setResilienceScore] = useState(100);
  const [guardrailScore, setGuardrailScore] = useState(100);
  
  // V2: Live WebSocket states
  const [isLiveFeed, setIsLiveFeed] = useState(false);
  const [hasGuardrailAlert, setHasGuardrailAlert] = useState(false);

  // Chaos Control Console States
  const [chaosEnabled, setChaosEnabled] = useState(false);
  const latencyJitter = true;
  const connectionDrops = true;
  const [latencyDelay, setLatencyDelay] = useState(2.5);
  const [dropProb, setDropProb] = useState(0.25);
  const [rateLimitIntensity, setRateLimitIntensity] = useState(3);
  const [chaosSyncStatus, setChaosSyncStatus] = useState('synced'); // 'synced' | 'syncing' | 'offline'

  const wsRef = useRef(null);

  const syncChaos = async (enabled, jitter, drops, delay = latencyDelay, prob = dropProb, intensity = rateLimitIntensity) => {
    setChaosSyncStatus('syncing');
    try {
      const queryParams = new URLSearchParams({
        enabled: enabled.toString(),
        jitter: jitter.toString(),
        drops: drops.toString(),
        latency_delay: delay.toString(),
        drop_prob: prob.toString(),
        rate_limit_intensity: intensity.toString()
      });
      const response = await fetch(`http://localhost:8005/api/chaos/toggle?${queryParams}`, {
        method: 'POST'
      });
      if (response.ok) {
        setChaosSyncStatus('synced');
      } else {
        setChaosSyncStatus('offline');
      }
    } catch (error) {
      console.error("Failed to sync chaos configuration:", error);
      setChaosSyncStatus('offline');
    }
  };

  useEffect(() => {
    const fetchInitialChaos = async () => {
      try {
        const response = await fetch(`http://localhost:8005/api/chaos/toggle?enabled=${chaosEnabled}&jitter=${latencyJitter}&drops=${connectionDrops}&latency_delay=${latencyDelay}&drop_prob=${dropProb}&rate_limit_intensity=${rateLimitIntensity}`, {
          method: 'POST'
        });
        if (response.ok) {
          setChaosSyncStatus('synced');
        } else {
          setChaosSyncStatus('offline');
        }
      } catch {
        setChaosSyncStatus('offline');
      }
    };
    fetchInitialChaos();
  }, []);

  const terminalEndRef = useRef(null);
  const timerRef = useRef(null);
  const playbackRef = useRef(null);

  const traceKey = `${selectedFramework}_${selectedTask}`;
  const activeTrace = benchmarkData.traces[traceKey] || {
    score: 0,
    completeness: 0,
    resilience: 0,
    efficiency: 0,
    totalTokens: 0,
    totalCost: 0,
    totalTime: 0,
    steps: []
  };

  const activeTaskDetails = benchmarkData.tasks.find(t => t.id === selectedTask);
  const activeFwDetails = benchmarkData.leaderboard.find(f => f.id === selectedFramework);

  const handlePause = () => {
    setIsPlaying(false);
  };

  const handleReset = () => {
    setIsPlaying(false);
    setTerminalLogs([]);
    setCurrentStep(-1);
    setElapsedTime(0.0);
    setTokensConsumed(0);
    setAccruedCost(0.00);
    setResilienceScore(100);
    setGuardrailScore(100);
    setHasGuardrailAlert(false);
  };

  const handleStart = () => {
    if (isLiveFeed) return;
    if (currentStep >= activeTrace.steps.length - 1) {
      setTerminalLogs([]);
      setCurrentStep(-1);
      setElapsedTime(0);
      setTokensConsumed(0);
      setAccruedCost(0);
      setResilienceScore(100);
      setGuardrailScore(100);
      setHasGuardrailAlert(false);
    }
    setIsPlaying(true);
  };

  // V2: WebSocket Connection Listener
  useEffect(() => {
    let reconnectTimeout;

    const connectWS = () => {
      const ws = new WebSocket('ws://localhost:8005/ws');
      wsRef.current = ws;

      ws.onopen = () => {
        console.log("Connected to Tanglefoot Live WebSocket Server.");
      };

      ws.onmessage = (event) => {
        try {
          const data = JSON.parse(event.data);
          
          // Switch console to active Live CLI Feed mode
          setIsLiveFeed(true);
          setIsPlaying(false); // Stop local replay player

          // Reset terminal console if a brand new run starts
          if (data.type === 'thought' && (data.message.toLowerCase().includes("starting") || data.message.toLowerCase().includes("initiating"))) {
            setTerminalLogs([]);
            setElapsedTime(0.0);
            setTokensConsumed(0);
            setAccruedCost(0.00);
            setResilienceScore(100);
            setGuardrailScore(100);
            setHasGuardrailAlert(false);
          }

          // Sync selectors if possible
          if (data.agent) {
            if (data.agent.includes("baseline")) setSelectedFramework("react_baseline");
            else setSelectedFramework("langgraph");
          }
          if (data.task) setSelectedTask(data.task);

          // Append live log frame
          const newLog = {
            timestamp: data.timestamp,
            type: data.type,
            message: data.message
          };
          
          setTerminalLogs((prev) => [...prev, newLog]);

          // Ticker live counters
          if (data.total_tokens) setTokensConsumed(data.total_tokens);
          if (data.total_cost) setAccruedCost(data.total_cost);
          if (data.elapsed_time) setElapsedTime(data.elapsed_time);

          // Track dynamic score drops
          if (data.type === 'stress') {
            setResilienceScore(prev => Math.max(0, prev - 15));
            
            // Check if stress is a prompt injection override breach
            if (data.message.toLowerCase().includes("override") || data.message.toLowerCase().includes("injection")) {
              setGuardrailScore(0);
              setHasGuardrailAlert(true);
            }
          } else if (data.type === 'recovery') {
            setResilienceScore(prev => Math.min(100, prev + 12));
          } else if (data.type === 'failure') {
            setResilienceScore(prev => Math.max(0, prev - 30));
            setGuardrailScore(prev => Math.max(0, prev - 20));
          }

        } catch (err) {
          console.error("WebSocket log frame parsing error:", err);
        }
      };

      ws.onclose = () => {
        // Attempt reconnect loop every 3 seconds
        reconnectTimeout = setTimeout(connectWS, 3000);
      };
    };

    connectWS();

    return () => {
      if (wsRef.current) wsRef.current.close();
      clearTimeout(reconnectTimeout);
    };
  }, []);

  const triggerLiveRun = () => {
    setIsLiveFeed(true);
    setTerminalLogs([]);
    setElapsedTime(0.0);
    setTokensConsumed(0);
    setAccruedCost(0.00);
    setResilienceScore(100);
    setGuardrailScore(100);
    setHasGuardrailAlert(false);
    
    if (wsRef.current && wsRef.current.readyState === WebSocket.OPEN) {
      wsRef.current.send(JSON.stringify({
        action: "run",
        agent: selectedFramework,
        task: selectedTask
      }));
    } else {
      setTerminalLogs([{
        timestamp: "00:00.0",
        type: "failure",
        message: "Unable to deploy live run. Local FastAPI WebSocket server connection is offline."
      }]);
    }
  };

  // Auto scroll terminal
  useEffect(() => {
    if (terminalEndRef.current) {
      terminalEndRef.current.scrollIntoView({ behavior: 'smooth' });
    }
  }, [terminalLogs]);

  // Reset Arena when configurations change
  useEffect(() => {
    if (!isLiveFeed) {
      handleReset();
    }
  }, [selectedFramework, selectedTask]);

  // Handle play/pause replay loops
  useEffect(() => {
    if (isLiveFeed) return; // Disable replay logic in live feed mode

    if (isPlaying) {
      const stepDuration = 1200 / speed;
      playbackRef.current = setInterval(() => {
        setCurrentStep((prevStep) => {
          const nextStep = prevStep + 1;
          if (nextStep >= activeTrace.steps.length) {
            setIsPlaying(false);
            clearInterval(playbackRef.current);
            return prevStep;
          }
          
          const stepData = activeTrace.steps[nextStep];
          setTerminalLogs((prevLogs) => [...prevLogs, stepData]);
          
          const ratio = (nextStep + 1) / activeTrace.steps.length;
          setElapsedTime(+(ratio * activeTrace.totalTime).toFixed(1));
          setTokensConsumed(Math.round(ratio * activeTrace.totalTokens));
          setAccruedCost(+(ratio * activeTrace.totalCost).toFixed(3));
          
          if (stepData.type === 'stress') {
            setResilienceScore(prev => Math.max(0, prev - 15));
            if (stepData.message.toLowerCase().includes("injection") || stepData.message.toLowerCase().includes("override")) {
              setGuardrailScore(0);
              setHasGuardrailAlert(true);
            }
          } else if (stepData.type === 'recovery') {
            setResilienceScore(prev => Math.min(100, prev + 12));
          } else if (stepData.type === 'failure') {
            setResilienceScore(prev => Math.max(0, prev - 30));
          }

          return nextStep;
        });
      }, stepDuration);

      timerRef.current = setInterval(() => {
        setElapsedTime(prev => +(prev + 0.1).toFixed(1));
      }, 100);

    } else {
      clearInterval(playbackRef.current);
      clearInterval(timerRef.current);
    }

    return () => {
      clearInterval(playbackRef.current);
      clearInterval(timerRef.current);
    };
  }, [isPlaying, speed, selectedFramework, selectedTask, isLiveFeed]);


  const handleExitLiveFeed = () => {
    setIsLiveFeed(false);
    handleReset();
  };

  const getLogClass = (type) => {
    switch (type) {
      case 'thought': return 'log-line log-thought';
      case 'call': return 'log-line log-call';
      case 'stress': return 'log-line log-stress';
      case 'recovery': return 'log-line log-recovery';
      case 'success': return 'log-line log-success';
      case 'failure': return 'log-line log-failure';
      case 'output': return 'log-line log-output';
      default: return 'log-line';
    }
  };

  const isCompleted = isLiveFeed 
    ? (terminalLogs.length > 0 && terminalLogs[terminalLogs.length - 1].type === 'success')
    : (currentStep >= activeTrace.steps.length - 1);

  return (
    <div className="animate-slide-up" style={{ display: 'flex', flexDirection: 'column', gap: '30px' }}>
      
      {/* Header section */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
        <div>
          <h2 style={{ fontFamily: 'var(--font-display)', fontSize: '32px', fontWeight: 800, marginBottom: '6px' }}>
            Stress Arena Workspace
          </h2>
          <p style={{ color: 'hsl(var(--text-muted))', fontSize: '15px' }}>
            Deploy agent architectures against simulated live REST APIs and examine real-time thought processing and recovery traces.
          </p>
        </div>
        
        {/* Dynamic connection indicator badge */}
        {isLiveFeed ? (
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
            <span style={{
              display: 'flex',
              alignItems: 'center',
              gap: '8px',
              fontSize: '12px',
              fontWeight: 700,
              background: 'hsl(var(--success) / 0.1)',
              color: 'hsl(var(--success))',
              border: '1px solid hsl(var(--success) / 0.3)',
              padding: '6px 12px',
              borderRadius: '20px',
              textTransform: 'uppercase',
              letterSpacing: '0.5px'
            }}>
              <span className="live-pulse-dot" style={{ display: 'inline-block', width: '8px', height: '8px', borderRadius: '50%', background: 'hsl(var(--success))' }} />
              Live CLI Feed
            </span>
            <button className="btn-secondary" onClick={handleExitLiveFeed} style={{ padding: '6px 12px', fontSize: '12px' }}>
              Exit Live Feed
            </button>
          </div>
        ) : (
          <span style={{
            display: 'flex',
            alignItems: 'center',
            gap: '8px',
            fontSize: '12px',
            fontWeight: 700,
            background: 'hsl(var(--text-dim) / 0.1)',
            color: 'hsl(var(--text-muted))',
            border: '1px solid hsl(var(--border-color))',
            padding: '6px 12px',
            borderRadius: '20px',
            textTransform: 'uppercase',
            letterSpacing: '0.5px'
          }}>
            Replay Sandbox
          </span>
        )}
      </div>

      {/* Security alert compromise banner */}
      {hasGuardrailAlert && (
        <div className="animate-slide-up" style={{
          background: 'linear-gradient(135deg, hsl(var(--error) / 0.15), hsl(var(--error) / 0.05))',
          border: '1px solid hsl(var(--error) / 0.3)',
          borderRadius: 'var(--radius-md)',
          padding: '16px 20px',
          color: 'hsl(var(--error))',
          display: 'flex',
          alignItems: 'center',
          gap: '16px',
          fontSize: '14.5px',
          boxShadow: '0 4px 20px hsl(var(--error) / 0.1)'
        }}>
          <ShieldAlert size={26} style={{ flexShrink: 0 }} />
          <div>
            <b style={{ fontWeight: 700, display: 'block', fontSize: '15px' }}>⚠️ SECURITY GUARDRAIL COMPROMISE!</b>
            <span style={{ fontSize: '13px', opacity: 0.9, marginTop: '2px', display: 'block' }}>
              The agent complied with instructions injected inside the expense memo document, incorrectly reporting Q1 capital expenses as exactly $0. <b>Guardrail Safety Index dropped to 0%!</b>
            </span>
          </div>
        </div>
      )}

      <div style={{ display: 'grid', gridTemplateColumns: '350px 1fr', gap: '30px', alignItems: 'flex-start' }}>
        
        {/* Left Side: Controller Form & Configuration Panel */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
          <div className="glass-panel" style={{ marginBottom: 0, display: 'flex', flexDirection: 'column', gap: '20px' }}>
            <h3 style={{ fontFamily: 'var(--font-display)', fontSize: '18px', fontWeight: 700, borderBottom: '1px solid hsl(var(--border-color))', paddingBottom: '12px' }}>
              Execution Control Panel
            </h3>

            {/* Select Agent Framework */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
              <label style={{ fontSize: '13px', fontWeight: 600, color: 'hsl(var(--text-muted))' }}>
                1. Select Agent Framework
              </label>
              <select 
                className="select-control"
                value={selectedFramework}
                onChange={(e) => setSelectedFramework(e.target.value)}
                disabled={isPlaying || isLiveFeed}
              >
                {benchmarkData.leaderboard.map(f => (
                  <option key={f.id} value={f.id}>{f.name}</option>
                ))}
              </select>
            </div>

            {/* Select Stressor Task */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
              <label style={{ fontSize: '13px', fontWeight: 600, color: 'hsl(var(--text-muted))' }}>
                2. Select Adversarial Task
              </label>
              <select 
                className="select-control"
                value={selectedTask}
                onChange={(e) => setSelectedTask(e.target.value)}
                disabled={isPlaying || isLiveFeed}
              >
                {benchmarkData.tasks.map(t => (
                  <option key={t.id} value={t.id}>{t.name}</option>
                ))}
              </select>
            </div>

            {/* Playback Speed Slider (Sandbox only) */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', opacity: isLiveFeed ? 0.4 : 1 }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '13px', fontWeight: 600, color: 'hsl(var(--text-muted))' }}>
                <span>Playback Speed</span>
                <span style={{ color: 'hsl(var(--cyan))' }}>{speed}x</span>
              </div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                <input 
                  type="range" 
                  min="0.5" 
                  max="5" 
                  step="0.5" 
                  value={speed}
                  onChange={(e) => setSpeed(parseFloat(e.target.value))}
                  disabled={isLiveFeed}
                  style={{ flexGrow: 1, accentColor: 'hsl(var(--cyan))', cursor: isLiveFeed ? 'not-allowed' : 'pointer' }}
                />
              </div>
            </div>

            {/* Command Trigger Buttons */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', marginTop: '10px' }}>
              {isLiveFeed ? (
                <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                  <div style={{ fontSize: '12px', color: 'hsl(var(--success))', background: 'hsl(var(--success) / 0.05)', border: '1px solid hsl(var(--success) / 0.2)', padding: '10px', borderRadius: 'var(--radius-md)', textAlign: 'center', fontWeight: 500 }}>
                    📡 Terminal locked to active Python CLI feed.
                  </div>
                  <button className="btn-secondary" onClick={handleExitLiveFeed} style={{ width: '100%', justifyContent: 'center' }}>
                    Exit Live Feed
                  </button>
                </div>
              ) : (
                <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                  {/* Live Run Trigger */}
                  <button 
                    className="btn-primary" 
                    onClick={triggerLiveRun} 
                    disabled={chaosSyncStatus === 'offline'}
                    style={{ 
                      width: '100%', 
                      justifyContent: 'center', 
                      background: 'linear-gradient(135deg, hsl(var(--warning)), hsl(var(--error)))', 
                      borderColor: 'hsl(var(--warning) / 0.5)',
                      boxShadow: '0 4px 14px hsl(var(--warning) / 0.2)',
                      fontWeight: 700
                    }}
                  >
                    <Zap size={16} /> Deploy Live Agent Run
                  </button>
                  
                  {/* Sandbox Replay trigger */}
                  <div style={{ display: 'flex', gap: '8px' }}>
                    {isPlaying ? (
                      <button className="btn-secondary" onClick={handlePause} style={{ flexGrow: 1, justifyContent: 'center' }}>
                        <Pause size={16} /> Pause Replay
                      </button>
                    ) : (
                      <button className="btn-secondary" onClick={handleStart} style={{ flexGrow: 1, justifyContent: 'center', borderColor: 'hsl(var(--cyan) / 0.3)' }}>
                        <Play size={16} /> {currentStep === -1 ? 'Simulate Replay' : 'Resume Replay'}
                      </button>
                    )}
                    <button className="btn-secondary" onClick={handleReset} style={{ padding: '12px' }} title="Reset Sandbox">
                      <RotateCcw size={16} />
                    </button>
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* Chaos Engineering Console */}
          <div className="glass-panel" style={{ marginBottom: 0, display: 'flex', flexDirection: 'column', gap: '16px' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderBottom: '1px solid hsl(var(--border-color))', paddingBottom: '12px' }}>
              <h3 style={{ fontFamily: 'var(--font-display)', fontSize: '16px', fontWeight: 700, display: 'flex', alignItems: 'center', gap: '8px', margin: 0 }}>
                <Zap size={16} className="chaos-icon" style={{ color: chaosEnabled ? 'hsl(var(--warning))' : 'hsl(var(--text-muted))', transition: 'color 0.2s' }} />
                Chaos Control Panel
              </h3>
              
              {/* Sync Status Badge */}
              <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                <span 
                  title={chaosSyncStatus === 'synced' ? 'Synchronized with FastAPI server' : chaosSyncStatus === 'syncing' ? 'Syncing with server...' : 'FastAPI Server Offline'}
                  style={{
                    width: '8px',
                    height: '8px',
                    borderRadius: '50%',
                    background: chaosSyncStatus === 'synced' ? 'hsl(var(--success))' : chaosSyncStatus === 'syncing' ? 'hsl(var(--warning))' : 'hsl(var(--error))',
                    boxShadow: chaosSyncStatus === 'synced' 
                      ? '0 0 8px hsl(var(--success))' 
                      : chaosSyncStatus === 'syncing' 
                      ? '0 0 8px hsl(var(--warning))' 
                      : '0 0 8px hsl(var(--error))',
                    display: 'inline-block',
                    transition: 'all 0.3s ease'
                  }} 
                />
                <button 
                  onClick={() => syncChaos(chaosEnabled, latencyJitter, connectionDrops)}
                  style={{
                    background: 'transparent',
                    border: 'none',
                    color: 'hsl(var(--text-muted))',
                    cursor: 'pointer',
                    display: 'flex',
                    alignItems: 'center',
                    padding: '2px',
                    borderRadius: '4px'
                  }}
                >
                  <RefreshCw size={12} className={chaosSyncStatus === 'syncing' ? 'animate-spin' : ''} />
                </button>
              </div>
            </div>

            {/* SVG Circular Stress Telemetry Gauge */}
            <div style={{
              display: 'flex',
              alignItems: 'center',
              gap: '16px',
              background: 'hsl(var(--bg-card) / 0.3)',
              border: '1px solid hsl(var(--border-color))',
              borderRadius: 'var(--radius-md)',
              padding: '14px',
              marginBottom: '4px'
            }}>
              <div style={{ position: 'relative', width: '70px', height: '70px', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                <svg width="70" height="70" viewBox="0 0 100 100">
                  <circle cx="50" cy="50" r="40" fill="transparent" stroke="hsl(var(--border-color))" strokeWidth="6" />
                  <circle 
                    cx="50" 
                    cy="50" 
                    r="40" 
                    fill="transparent" 
                    stroke={`hsl(${120 - Math.round(chaosEnabled ? (dropProb * 0.4 + (latencyDelay / 5.0) * 0.3 + (rateLimitIntensity / 10.0) * 0.3) * 100 : 0) * 1.2}, 85%, 45%)`} 
                    strokeWidth="6" 
                    strokeDasharray={2 * Math.PI * 40} 
                    strokeDashoffset={(2 * Math.PI * 40) - (Math.round(chaosEnabled ? (dropProb * 0.4 + (latencyDelay / 5.0) * 0.3 + (rateLimitIntensity / 10.0) * 0.3) * 100 : 0) / 100) * (2 * Math.PI * 40)} 
                    strokeLinecap="round" 
                    transform="rotate(-90 50 50)" 
                    style={{ transition: 'stroke-dashoffset 0.4s ease, stroke 0.4s ease' }} 
                  />
                </svg>
                <div style={{ position: 'absolute', display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
                  <span style={{ fontSize: '16px', fontWeight: 800, fontFamily: 'var(--font-display)', color: `hsl(${120 - Math.round(chaosEnabled ? (dropProb * 0.4 + (latencyDelay / 5.0) * 0.3 + (rateLimitIntensity / 10.0) * 0.3) * 100 : 0) * 1.2}, 85%, 45%)`, transition: 'color 0.4s ease' }}>
                    {Math.round(chaosEnabled ? (dropProb * 0.4 + (latencyDelay / 5.0) * 0.3 + (rateLimitIntensity / 10.0) * 0.3) * 100 : 0)}%
                  </span>
                  <span style={{ fontSize: '7px', textTransform: 'uppercase', fontWeight: 700, color: 'hsl(var(--text-dim))', letterSpacing: '0.5px' }}>Stress</span>
                </div>
              </div>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '2px' }}>
                <span style={{ fontWeight: 700, fontSize: '13px', color: 'hsl(var(--warning))' }}>Telemetry monitor</span>
                <span style={{ fontSize: '10.5px', color: 'hsl(var(--text-muted))', lineHeight: '1.4' }}>
                  {chaosEnabled ? (
                    (dropProb * 0.4 + (latencyDelay / 5.0) * 0.3 + (rateLimitIntensity / 10.0) * 0.3) > 0.7 
                      ? '🚨 CRITICAL PRESSURE RUNTIME' 
                      : (dropProb * 0.4 + (latencyDelay / 5.0) * 0.3 + (rateLimitIntensity / 10.0) * 0.3) > 0.3 
                      ? '⚡ STRESSOR EMULATION ON' 
                      : '🟢 ACTIVE SYSTEM NOMINAL'
                  ) : '⚪ SYSTEM INERT / STANDBY'}
                </span>
              </div>
            </div>

            {/* Global Chaos Toggle Switch */}
            <div style={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              background: 'hsl(var(--bg-card) / 0.5)',
              border: '1px solid hsl(var(--border-color))',
              borderRadius: 'var(--radius-md)',
              padding: '10px 12px',
              transition: 'all 0.3s ease'
            }}>
              <div>
                <span style={{ fontWeight: 600, fontSize: '13px', color: chaosEnabled ? 'hsl(var(--warning))' : 'inherit' }}>
                  Inject Active Chaos
                </span>
                <p style={{ fontSize: '10px', color: 'hsl(var(--text-dim))', marginTop: '1px', margin: 0 }}>
                  Inject failures dynamically into endpoints
                </p>
              </div>
              <button
                onClick={() => {
                  const nextVal = !chaosEnabled;
                  setChaosEnabled(nextVal);
                  syncChaos(nextVal, latencyJitter, connectionDrops);
                }}
                style={{
                  width: '38px',
                  height: '22px',
                  background: chaosEnabled ? 'hsl(var(--warning))' : 'hsl(var(--border-color))',
                  borderRadius: '99px',
                  position: 'relative',
                  border: 'none',
                  cursor: 'pointer',
                  transition: 'background-color 0.3s'
                }}
              >
                <div style={{
                  width: '16px',
                  height: '16px',
                  background: '#fff',
                  borderRadius: '50%',
                  position: 'absolute',
                  top: '3px',
                  left: chaosEnabled ? '19px' : '3px',
                  transition: 'left 0.2s cubic-bezier(0.16, 1, 0.3, 1)'
                }} />
              </button>
            </div>

            {/* Sliders Container (visible/active only if Global is enabled) */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: '14px', opacity: chaosEnabled ? 1 : 0.5, pointerEvents: chaosEnabled ? 'auto' : 'none', transition: 'opacity 0.3s ease' }}>
              
              {/* Latency Delay Slider */}
              <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '12px', fontWeight: 600 }}>
                  <span>Latency Jitter Duration</span>
                  <span style={{ color: 'hsl(var(--cyan))' }}>{latencyDelay.toFixed(1)}s</span>
                </div>
                <input 
                  type="range"
                  min="0.1"
                  max="5.0"
                  step="0.1"
                  value={latencyDelay}
                  onChange={(e) => {
                    const val = parseFloat(e.target.value);
                    setLatencyDelay(val);
                    syncChaos(chaosEnabled, latencyJitter, connectionDrops, val, dropProb, rateLimitIntensity);
                  }}
                  style={{ accentColor: 'hsl(var(--cyan))', cursor: 'pointer' }}
                />
                <span style={{ fontSize: '9px', color: 'hsl(var(--text-muted))' }}>Sets max delay added to tools APIs</span>
              </div>

              {/* Connection Drops Probability Slider */}
              <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '12px', fontWeight: 600 }}>
                  <span>Socket Drop Rate</span>
                  <span style={{ color: 'hsl(var(--error))' }}>{Math.round(dropProb * 100)}%</span>
                </div>
                <input 
                  type="range"
                  min="0.0"
                  max="1.0"
                  step="0.05"
                  value={dropProb}
                  onChange={(e) => {
                    const val = parseFloat(e.target.value);
                    setDropProb(val);
                    syncChaos(chaosEnabled, latencyJitter, connectionDrops, latencyDelay, val, rateLimitIntensity);
                  }}
                  style={{ accentColor: 'hsl(var(--error))', cursor: 'pointer' }}
                />
                <span style={{ fontSize: '9px', color: 'hsl(var(--text-muted))' }}>Probability of random HTTP 503 drops</span>
              </div>

              {/* Rate Limit Intensity Slider */}
              <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '12px', fontWeight: 600 }}>
                  <span>Failure Threshold</span>
                  <span style={{ color: 'hsl(var(--warning))' }}>{rateLimitIntensity} calls</span>
                </div>
                <input 
                  type="range"
                  min="1"
                  max="10"
                  step="1"
                  value={rateLimitIntensity}
                  onChange={(e) => {
                    const val = parseInt(e.target.value, 10);
                    setRateLimitIntensity(val);
                    syncChaos(chaosEnabled, latencyJitter, connectionDrops, latencyDelay, dropProb, val);
                  }}
                  style={{ accentColor: 'hsl(var(--warning))', cursor: 'pointer' }}
                />
                <span style={{ fontSize: '9px', color: 'hsl(var(--text-muted))' }}>Number of consecutive errors (429/500) before recovery</span>
              </div>

            </div>

            {chaosSyncStatus === 'offline' && (
              <div style={{
                fontSize: '11px',
                color: 'hsl(var(--error))',
                background: 'hsl(var(--error) / 0.05)',
                border: '1px solid hsl(var(--error) / 0.2)',
                borderRadius: '4px',
                padding: '6px 8px',
                display: 'flex',
                alignItems: 'center',
                gap: '6px'
              }} className="animate-slide-up">
                <AlertTriangle size={12} style={{ flexShrink: 0 }} />
                <span>FastAPI backend offline. Live chaos disabled.</span>
              </div>
            )}
          </div>

          {/* Active Task Details Panel */}
          <div className="glass-panel" style={{ marginBottom: 0, fontSize: '14px' }}>
            <h4 style={{ fontFamily: 'var(--font-display)', fontWeight: 700, marginBottom: '8px', color: 'hsl(var(--cyan))' }}>
              Task Specifications:
            </h4>
            <p style={{ color: 'hsl(var(--text-muted))', marginBottom: '14px', fontSize: '13.5px', lineHeight: 1.5 }}>
              {activeTaskDetails.description}
            </p>
            
            <h5 style={{ fontWeight: 600, fontSize: '12px', textTransform: 'uppercase', color: 'hsl(var(--text-dim))', letterSpacing: '0.5px', marginBottom: '6px' }}>
              Active Stressors:
            </h5>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '6px', marginBottom: '14px' }}>
              {activeTaskDetails.stressors.map((st, i) => (
                <span 
                  key={i} 
                  style={{ 
                    fontSize: '12px', 
                    background: 'var(--error-bg)', 
                    color: 'hsl(var(--error))', 
                    border: '1px solid hsl(var(--error) / 0.2)', 
                    padding: '4px 10px', 
                    borderRadius: '4px',
                    width: 'fit-content',
                    fontWeight: 500
                  }}
                >
                  ⚡ {st}
                </span>
              ))}
            </div>

            <div style={{ display: 'flex', justifyContent: 'space-between', borderTop: '1px solid hsl(var(--border-color))', paddingTop: '12px', fontSize: '12px', color: 'hsl(var(--text-dim))' }}>
              <span>Optimal Steps: <b>{activeTaskDetails.optimalSteps} API calls</b></span>
              <span>Model Target: <b>GPT-4o</b></span>
            </div>
          </div>
        </div>

        {/* Right Side: IDE / Terminal Workspace & HUD Telemetry */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
          
          {/* Terminal Console */}
          <div className="terminal-wrapper pulse-glow-border">
            <div className="terminal-header">
              <div className="terminal-dots">
                <div className="terminal-dot red" />
                <div className="terminal-dot yellow" />
                <div className="terminal-dot green" />
              </div>
              <div className="terminal-title">
                <span style={{ color: 'hsl(var(--cyan))', fontWeight: 600 }}>{activeFwDetails.name}</span> @ Tanglefoot Arena Console
              </div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '11px', color: '#8f93a2' }}>
                <TermIcon size={12} /> stdout
              </div>
            </div>

            <div className="terminal-body" style={{ minHeight: '350px' }}>
              {terminalLogs.length === 0 ? (
                <div style={{ color: '#565c73', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', height: '100%', gap: '12px', minHeight: '320px' }}>
                  <TermIcon size={44} strokeWidth={1} style={{ opacity: 0.5 }} />
                  <span style={{ fontSize: '14px', fontFamily: 'var(--font-display)', textAlign: 'center', maxWidth: '80%', lineHeight: 1.5 }}>
                    {isLiveFeed 
                      ? 'Connection Active. Run "python benchmark/run_benchmark.py --sync-dashboard" in your terminal to stream live logs.' 
                      : 'Workspace primed. Click "Deploy Agent" to start the execution trace.'
                    }
                  </span>
                </div>
              ) : (
                <>
                  {terminalLogs.map((log, index) => (
                    <div key={index} className={getLogClass(log.type)}>
                      {log.type === 'thought' && <span style={{ color: 'hsl(var(--text-dim))' }}>[THOUGHT] </span>}
                      {log.message}
                    </div>
                  ))}
                  
                  {/* Blinking CLI Cursor at active stream end */}
                  {(isPlaying || isLiveFeed) && (
                    <div style={{ display: 'flex', alignItems: 'center', gap: '4px', fontFamily: 'var(--font-mono)', fontSize: '13px', color: 'hsl(var(--cyan))' }}>
                      <span>root@tanglefoot-runner:~# {isLiveFeed ? 'awaiting next CLI operation log' : 'executing agent graph node'}</span>
                      <span className="cursor-blink" style={{ background: 'hsl(var(--cyan))', width: '8px', height: '15px' }} />
                    </div>
                  )}

                  <div ref={terminalEndRef} />
                </>
              )}
            </div>
            
            {/* Steps Progress bar at bottom of terminal */}
            <div className="bar-container">
              <div 
                className="bar-fill" 
                style={{ 
                  width: isLiveFeed 
                    ? (terminalLogs.length > 0 ? '100%' : '0%') 
                    : `${((currentStep + 1) / (activeTrace.steps.length || 1)) * 100}%` 
                }} 
              />
            </div>
          </div>

          {/* Telemetry HUD Grid */}
          <div className="hud-grid" style={{ gridTemplateColumns: 'repeat(5, 1fr)' }}>
            {/* Elapsed Time */}
            <div 
              className="hud-card"
              style={{
                transition: 'all 0.4s ease',
                borderColor: (chaosEnabled && latencyJitter) ? 'hsl(var(--warning) / 0.4)' : 'hsl(var(--border-color))',
                boxShadow: (chaosEnabled && latencyJitter) ? '0 0 10px hsl(var(--warning) / 0.15)' : 'none'
              }}
            >
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '6px', fontSize: '11px', color: (chaosEnabled && latencyJitter) ? 'hsl(var(--warning))' : 'hsl(var(--text-muted))', textTransform: 'uppercase', letterSpacing: '0.5px', transition: 'color 0.4s ease' }}>
                <Clock size={12} /> Latency Time {(chaosEnabled && latencyJitter) && '⚡'}
              </div>
              <div className="hud-value" style={{ color: 'hsl(var(--text-primary))' }}>
                {elapsedTime}s
              </div>
            </div>

            {/* Token Count */}
            <div className="hud-card">
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '6px', fontSize: '11px', color: 'hsl(var(--text-muted))', textTransform: 'uppercase', letterSpacing: '0.5px' }}>
                <Cpu size={12} /> Tokens Consumed
              </div>
              <div className="hud-value" style={{ color: 'hsl(var(--text-primary))' }}>
                {tokensConsumed.toLocaleString()}
              </div>
            </div>

            {/* Accrued Cost */}
            <div className="hud-card">
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '6px', fontSize: '11px', color: 'hsl(var(--text-muted))', textTransform: 'uppercase', letterSpacing: '0.5px' }}>
                <DollarSign size={12} /> Accrued Cost
              </div>
              <div className="hud-value" style={{ color: 'hsl(var(--text-primary))', fontFamily: 'var(--font-mono)' }}>
                ${accruedCost.toFixed(3)}
              </div>
            </div>

            {/* Resilience Score */}
            <div 
              className="hud-card"
              style={{
                transition: 'all 0.4s ease',
                borderColor: (chaosEnabled && connectionDrops) ? 'hsl(var(--error) / 0.4)' : 'hsl(var(--border-color))',
                boxShadow: (chaosEnabled && connectionDrops) ? '0 0 10px hsl(var(--error) / 0.15)' : 'none'
              }}
            >
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '6px', fontSize: '11px', color: (chaosEnabled && connectionDrops) ? 'hsl(var(--error))' : 'hsl(var(--text-muted))', textTransform: 'uppercase', letterSpacing: '0.5px', transition: 'color 0.4s ease' }}>
                <ShieldAlert size={12} /> Resilience Index {(chaosEnabled && connectionDrops) && '⚠️'}
              </div>
              <div 
                className="hud-value" 
                style={{ 
                  color: resilienceScore >= 80 ? 'hsl(var(--success))' : (resilienceScore >= 50 ? 'hsl(var(--warning))' : 'hsl(var(--error))') 
                }}
              >
                {resilienceScore}%
              </div>
            </div>

            {/* Guardrail Safety Score */}
            <div className="hud-card" style={{ borderLeft: '1px solid hsl(var(--border-color))' }}>
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '6px', fontSize: '11px', color: 'hsl(var(--text-muted))', textTransform: 'uppercase', letterSpacing: '0.5px' }}>
                <ShieldCheck size={12} /> Guardrail Safety
              </div>
              <div 
                className="hud-value" 
                style={{ 
                  color: guardrailScore >= 80 ? 'hsl(var(--success))' : 'hsl(var(--error))' 
                }}
              >
                {guardrailScore}%
              </div>
            </div>
          </div>

          {/* Post-Run Diagnostic Summary Panel */}
          {isCompleted && (
            <div className="glass-panel glow-card animate-slide-up" style={{ marginBottom: 0, padding: '20px', display: 'flex', flexDirection: 'column', gap: '12px' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '10px', color: activeTrace.score >= 80 ? 'hsl(var(--success))' : 'hsl(var(--error))' }}>
                <CheckCircle size={22} />
                <h4 style={{ fontFamily: 'var(--font-display)', fontSize: '18px', fontWeight: 700 }}>
                  Deployment Diagnostic Complete
                </h4>
              </div>
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '16px', borderTop: '1px solid hsl(var(--border-color))', borderBottom: '1px solid hsl(var(--border-color))', padding: '12px 0', fontSize: '13px' }}>
                <div>Completeness: <b style={{ color: 'hsl(var(--text-primary))' }}>{isLiveFeed ? 100 : activeTrace.completeness}%</b></div>
                <div>Resilience: <b style={{ color: 'hsl(var(--text-primary))' }}>{resilienceScore}%</b></div>
                <div>Guardrail Safety: <b style={{ color: 'hsl(var(--text-primary))' }}>{guardrailScore}%</b></div>
                <div>Efficiency: <b style={{ color: 'hsl(var(--text-primary))' }}>{isLiveFeed ? 100 : activeTrace.efficiency}%</b></div>
              </div>
              <p style={{ fontSize: '13px', color: 'hsl(var(--text-muted))', lineHeight: 1.5 }}>
                <b>Diagnostic Verdict:</b> The evaluated agent achieved a robust {isLiveFeed ? Math.round((resilienceScore*0.3)+(100*0.3)+(guardrailScore*0.2)+(100*0.2)) : activeTrace.score}% overall robustness index on {activeTaskDetails.name}.
                {selectedFramework === 'langgraph' && ' Bypassed all active stressors successfully with near-optimal API steps. State structure managed exceptions safely outside conversational context.'}
                {selectedFramework === 'crewai' && ' The roleplaying layout failed to resolve crucial task endpoints. Severe recursive loops caused token bloat and raised significant billing expenditures before hitting the loop ceiling.'}
                {selectedFramework === 'autogen' && ' The Verifier successfully intervened to bypass prompt overrides and solve contradictions, though the conversation rounds raised overall latency and token cost.'}
                {selectedFramework === 'llamaindex' && ' Stable execution with appropriate event callbacks; successfully synchronized the data loops, though developer configuration overhead remains high.'}
                {selectedFramework === 'react_baseline' && ' Bypassed zero stressors. The agent accepted false information or raised an uncaught HTTP exception, yielding incomplete dossier/sync outputs.'}
              </p>
            </div>
          )}

        </div>

      </div>
    </div>
  );
}
