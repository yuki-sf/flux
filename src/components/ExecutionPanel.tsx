import React, { useState } from 'react';
import type { ExecutionResult } from '../types';
import { Terminal, Table, Layout, Zap } from 'lucide-react';

interface ExecutionPanelProps {
  result: ExecutionResult | null;
  isRunning: boolean;
}

export const ExecutionPanel: React.FC<ExecutionPanelProps> = ({ result, isRunning }) => {
  const [activeTab, setActiveTab] = useState<'console' | 'table' | 'preview'>('console');

  // If result has specialized views, auto-switch tab mapping when it arrives
  React.useEffect(() => {
    if (result?.sqlResult && result.sqlResult.length > 0) {
      setActiveTab('table');
    } else if (result?.htmlPreview) {
      setActiveTab('preview');
    } else {
      setActiveTab('console');
    }
  }, [result]);

  return (
    <div 
      style={{
        display: 'flex',
        flexDirection: 'column',
        height: '100%',
        backgroundColor: 'var(--bg-base)',
        borderRadius: '10px',
        border: '1px solid var(--border-color)',
        overflow: 'hidden'
      }}
    >
      {/* Top console bar controls */}
      <div 
        style={{
          padding: '6px 12px',
          backgroundColor: 'var(--bg-surface)',
          borderBottom: '1px solid var(--border-color)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between'
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
          <button
            onClick={() => setActiveTab('console')}
            style={{
              background: activeTab === 'console' ? 'rgba(255,255,255,0.08)' : 'transparent',
              color: activeTab === 'console' ? '#fff' : 'var(--text-muted)',
              padding: '4px 10px',
              borderRadius: '6px',
              fontSize: '12px',
              fontWeight: 500,
              display: 'flex',
              alignItems: 'center',
              gap: '6px'
            }}
          >
            <Terminal size={13} />
            <span>Console</span>
          </button>

          {result?.sqlResult && result.sqlResult.length > 0 && (
            <button
              onClick={() => setActiveTab('table')}
              style={{
                background: activeTab === 'table' ? 'var(--accent-glow)' : 'transparent',
                color: activeTab === 'table' ? 'var(--accent-primary)' : 'var(--text-muted)',
                padding: '4px 10px',
                borderRadius: '6px',
                fontSize: '12px',
                fontWeight: 500,
                display: 'flex',
                alignItems: 'center',
                gap: '6px'
              }}
            >
              <Table size={13} />
              <span>Table ({result.sqlResult[0].values.length})</span>
            </button>
          )}

          {result?.htmlPreview && (
            <button
              onClick={() => setActiveTab('preview')}
              style={{
                background: activeTab === 'preview' ? 'var(--accent-glow)' : 'transparent',
                color: activeTab === 'preview' ? 'var(--accent-primary)' : 'var(--text-muted)',
                padding: '4px 10px',
                borderRadius: '6px',
                fontSize: '12px',
                fontWeight: 500,
                display: 'flex',
                alignItems: 'center',
                gap: '6px'
              }}
            >
              <Layout size={13} />
              <span>Preview</span>
            </button>
          )}
        </div>

        {/* Evaluation execution benchmark info */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '6px', color: 'var(--text-muted)', fontSize: '11px' }}>
          <Zap size={11} color={isRunning ? 'var(--warning)' : 'var(--accent-primary)'} />
          <span>{isRunning ? 'Running…' : result ? `${result.executionTimeMs}ms` : 'Idle'}</span>
        </div>
      </div>

      {/* Pane Content body */}
      <div style={{ flex: 1, overflow: 'auto', position: 'relative' }}>
        {isRunning ? (
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: '100%', flexDirection: 'column', gap: '12px' }}>
            <div 
              style={{ 
                width: '24px', 
                height: '24px', 
                borderRadius: '50%', 
                border: '2px solid var(--accent-primary)', 
                borderTopColor: 'transparent',
                animation: 'spin 1s linear infinite'
              }} 
            />
            <span style={{ fontSize: '12px', color: 'var(--text-muted)' }}>Running…</span>
          </div>
        ) : !result ? (
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: '100%', color: '#4b5563', fontSize: '13px', fontStyle: 'italic' }}>
            Run code to see output.
          </div>
        ) : (
          <>
            {/* Standard Terminal display */}
            {activeTab === 'console' && (
              <div style={{ padding: '12px', fontFamily: 'var(--font-mono)', fontSize: '13px', whiteSpace: 'pre-wrap', lineHeight: 1.6 }}>
                {result.stdout && (
                  <div style={{ color: '#d1d5db' }}>{result.stdout}</div>
                )}
                {result.stderr && (
                  <div style={{ color: 'var(--danger)', marginTop: result.stdout ? '8px' : 0, background: 'rgba(239, 68, 68, 0.1)', padding: '8px', borderRadius: '4px' }}>
                    {result.stderr}
                  </div>
                )}
                
                {/* Render any analytics matrix images / plots exported directly from standard IDE run-times */}
                {result.plots && result.plots.map((plotBase64, pIdx) => (
                  <div key={pIdx} style={{ marginTop: '12px', textAlign: 'center', background: '#fff', padding: '8px', borderRadius: '4px' }}>
                    <img src={plotBase64} alt={`Standard IDE chart render ${pIdx + 1}`} style={{ maxWidth: '100%', borderRadius: '3px', display: 'block', margin: '0 auto' }} />
                  </div>
                ))}

                {!result.stdout && !result.stderr && (!result.plots || result.plots.length === 0) && (
                  <div style={{ color: 'var(--text-muted)' }}>No output.</div>
                )}
              </div>
            )}

            {/* Structured Relational Table layout */}
            {activeTab === 'table' && result.sqlResult && result.sqlResult.length > 0 && (
              <div style={{ padding: '12px' }}>
                {result.sqlResult.map((resSet, idx) => (
                  <div key={idx} style={{ marginBottom: '20px', overflowX: 'auto' }}>
                    <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left', fontSize: '12px' }}>
                      <thead>
                        <tr style={{ background: 'var(--bg-surface)', borderBottom: '2px solid var(--border-highlight)' }}>
                          {resSet.columns.map((col) => (
                            <th key={col} style={{ padding: '8px 12px', color: 'var(--accent-primary)', fontWeight: 600 }}>{col}</th>
                          ))}
                        </tr>
                      </thead>
                      <tbody>
                        {resSet.values.map((row, rIdx) => (
                          <tr 
                            key={rIdx} 
                            style={{ 
                              borderBottom: '1px solid var(--border-color)',
                              background: rIdx % 2 === 0 ? 'transparent' : 'rgba(255,255,255,0.01)'
                            }}
                          >
                            {row.map((val, cIdx) => (
                              <td key={cIdx} style={{ padding: '8px 12px', color: '#e5e7eb' }}>
                                {val !== null ? String(val) : <span style={{ color: '#6b7280', fontStyle: 'italic' }}>NULL</span>}
                              </td>
                            ))}
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                ))}
              </div>
            )}

            {/* Live Web Preview rendering */}
            {activeTab === 'preview' && result.htmlPreview && (
              <div style={{ width: '100%', height: '100%', background: '#fff' }}>
                <iframe
                  srcDoc={result.htmlPreview}
                  title="Live Sandbox output"
                  style={{ width: '100%', height: '100%', border: 'none' }}
                  sandbox="allow-scripts allow-modals"
                />
              </div>
            )}
          </>
        )}
      </div>
      
      {/* Inline spin CSS keyframe injector */}
      <style>{`
        @keyframes spin {
          to { transform: rotate(360deg); }
        }
      `}</style>
    </div>
  );
};
