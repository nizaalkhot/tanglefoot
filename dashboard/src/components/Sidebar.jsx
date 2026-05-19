import React from 'react';
import { LayoutDashboard, Terminal, BookOpen, Cpu, Sun, Moon } from 'lucide-react';

export default function Sidebar({ activeTab, setActiveTab, isDark, toggleTheme }) {
  const menuItems = [
    { id: 'leaderboard', label: 'Leaderboard', icon: LayoutDashboard },
    { id: 'arena', label: 'Stress Arena', icon: Terminal },
    { id: 'encyclopedia', label: 'Stressor Codex', icon: BookOpen },
    { id: 'cli', label: 'CLI & API Guide', icon: Cpu },
  ];

  return (
    <aside 
      className="glass-panel" 
      style={{
        width: '280px',
        minHeight: 'calc(100vh - 80px)',
        margin: '40px 0 40px 40px',
        padding: '30px 20px',
        display: 'flex',
        flexDirection: 'column',
        justifyContent: 'space-between',
        borderRadius: 'var(--radius-lg)',
        position: 'sticky',
        top: '40px',
        alignSelf: 'flex-start',
        flexShrink: 0
      }}
    >
      <div style={{ display: 'flex', flexDirection: 'column', gap: '32px' }}>
        {/* Brand Logo */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '12px', paddingLeft: '8px' }}>
          <div 
            style={{
              background: 'linear-gradient(135deg, hsl(var(--cyan)), hsl(var(--violet)))',
              width: '40px',
              height: '40px',
              borderRadius: 'var(--radius-md)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              fontSize: '20px',
              boxShadow: '0 4px 12px hsl(var(--cyan-glow))'
            }}
          >
            🪤
          </div>
          <div>
            <h1 
              style={{
                fontFamily: 'var(--font-display)',
                fontSize: '18px',
                fontWeight: 800,
                letterSpacing: '-0.5px',
                lineHeight: 1.1
              }}
            >
              TANGLEFOOT
            </h1>
            <span 
              style={{
                fontSize: '11px',
                color: 'hsl(var(--text-muted))',
                fontWeight: 600,
                letterSpacing: '1px',
                textTransform: 'uppercase'
              }}
            >
              Stress Benchmark
            </span>
          </div>
        </div>

        {/* Navigation Menu */}
        <nav style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
          {menuItems.map((item) => {
            const Icon = item.icon;
            const isActive = activeTab === item.id;
            return (
              <button
                key={item.id}
                onClick={() => setActiveTab(item.id)}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '12px',
                  width: '100%',
                  padding: '14px 16px',
                  background: isActive ? 'linear-gradient(135deg, hsl(var(--cyan) / 0.1), hsl(var(--violet) / 0.1))' : 'transparent',
                  color: isActive ? 'hsl(var(--cyan))' : 'hsl(var(--text-muted))',
                  border: '1px solid',
                  borderColor: isActive ? 'hsl(var(--cyan) / 0.2)' : 'transparent',
                  borderRadius: 'var(--radius-md)',
                  cursor: 'pointer',
                  fontSize: '14px',
                  fontWeight: isActive ? 600 : 500,
                  fontFamily: 'var(--font-display)',
                  textAlign: 'left',
                  transition: 'all 0.2s ease',
                  position: 'relative'
                }}
              >
                {isActive && (
                  <div 
                    style={{
                      position: 'absolute',
                      left: '0',
                      top: '25%',
                      height: '50%',
                      width: '4px',
                      background: 'hsl(var(--cyan))',
                      borderRadius: '0 4px 4px 0'
                    }}
                  />
                )}
                <Icon size={18} strokeWidth={isActive ? 2.5 : 2} />
                {item.label}
              </button>
            );
          })}
        </nav>
      </div>

      {/* Footer System Toggle */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
        <hr style={{ border: 'none', height: '1px', background: 'hsl(var(--border-color))' }} />
        
        <button
          onClick={toggleTheme}
          style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            width: '100%',
            padding: '12px 16px',
            background: 'hsl(var(--bg-card))',
            border: '1px solid hsl(var(--border-color))',
            borderRadius: 'var(--radius-md)',
            color: 'hsl(var(--text-primary))',
            cursor: 'pointer',
            fontSize: '13px',
            fontWeight: 500,
            fontFamily: 'var(--font-display)'
          }}
        >
          <span style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            {isDark ? <Moon size={16} /> : <Sun size={16} />}
            {isDark ? 'Dark System' : 'Light System'}
          </span>
          <div 
            style={{
              width: '36px',
              height: '20px',
              background: isDark ? 'hsl(var(--cyan))' : 'hsl(var(--text-dim))',
              borderRadius: '99px',
              position: 'relative',
              transition: 'background-color 0.3s'
            }}
          >
            <div 
              style={{
                width: '14px',
                height: '14px',
                background: '#fff',
                borderRadius: '50%',
                position: 'absolute',
                top: '3px',
                left: isDark ? '19px' : '3px',
                transition: 'left 0.2s cubic-bezier(0.16, 1, 0.3, 1)'
              }}
            />
          </div>
        </button>

        <div style={{ fontSize: '11px', color: 'hsl(var(--text-dim))', textAlign: 'center' }}>
          Tanglefoot v1.0.0 Stable
        </div>
      </div>
    </aside>
  );
}
