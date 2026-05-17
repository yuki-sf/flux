import React, { useState, useEffect } from 'react';
import type { SupportedLanguage } from '../types';
import { saveLocalWorkspace, loadLocalWorkspace } from '../services/wasmRunner';
import { Play, Save, FileCode } from 'lucide-react';

interface CodeEditorProps {
  videoId: string;
  defaultLanguage: SupportedLanguage;
  initialCode?: string;
  onRunCode: (code: string, language: SupportedLanguage) => void;
  isRunning: boolean;
}

const LANGUAGE_LABELS: Record<SupportedLanguage, string> = {
  python: 'Python',
  sql: 'SQL',
  javascript: 'JavaScript',
  html: 'HTML / CSS / JS',
  ruby: 'Ruby',
  cpp: 'C++',
  r: 'R'
};

const STARTER_TEMPLATES: Record<SupportedLanguage, string> = {
  python: `# Try it out\nname = "flux"\nprint(f"Welcome to {name}!")`,
  sql: `-- Create a table and query it\nCREATE TABLE tasks (id INTEGER PRIMARY KEY, title TEXT, done BOOLEAN);\nINSERT INTO tasks VALUES (1, 'Watch lecture', 1);\nINSERT INTO tasks VALUES (2, 'Practice coding', 0);\nSELECT * FROM tasks;`,
  javascript: `// Quick example\nconst greeting = "Hello from flux!";\nconsole.log(greeting);`,
  html: `<div style="font-family: system-ui; padding: 2rem; text-align: center;">\n  <h2 style="color: #22d3ee;">Hello \u{1f44b}</h2>\n  <p>Edit this code and hit Run to see changes.</p>\n</div>`,
  ruby: `# Simple example\n3.times { |i| puts "Step #{i + 1}" }`,
  cpp: `#include <iostream>\n\nint main() {\n    std::cout << "Hello from flux!" << std::endl;\n    return 0;\n}`,
  r: `# Quick stats\nscores <- c(85, 92, 78, 95, 88)\nprint(paste("Average:", mean(scores)))`
};

export const CodeEditor: React.FC<CodeEditorProps> = ({
  videoId,
  defaultLanguage,
  initialCode,
  onRunCode,
  isRunning
}) => {
  const [activeLanguage, setActiveLanguage] = useState<SupportedLanguage>(defaultLanguage);
  const [codeContent, setCodeContent] = useState<string>('');
  const [saveStatus, setSaveStatus] = useState<string>('');

  // Load from persistence when video changes or switch language mapping
  useEffect(() => {
    setActiveLanguage(defaultLanguage);
    const storageKey = `${videoId}_${defaultLanguage}`;
    const loaded = loadLocalWorkspace(storageKey);

    if (loaded) {
      setCodeContent(loaded);
    } else if (initialCode && defaultLanguage === activeLanguage) {
      setCodeContent(initialCode);
    } else {
      setCodeContent(STARTER_TEMPLATES[defaultLanguage] || '');
    }
  }, [videoId, defaultLanguage]);

  // Handle switching language tab explicitly
  const handleLanguageChange = (lang: SupportedLanguage) => {
    setActiveLanguage(lang);
    const storageKey = `${videoId}_${lang}`;
    const loaded = loadLocalWorkspace(storageKey);
    if (loaded) {
      setCodeContent(loaded);
    } else {
      setCodeContent(STARTER_TEMPLATES[lang] || '');
    }
  };

  // Continuous auto-save trigger on user entry
  const handleCodeChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    const nextCode = e.target.value;
    setCodeContent(nextCode);
    
    // Save state
    const storageKey = `${videoId}_${activeLanguage}`;
    saveLocalWorkspace(storageKey, nextCode);
    
    setSaveStatus('Auto-saved');
    const timer = setTimeout(() => setSaveStatus(''), 2000);
    return () => clearTimeout(timer);
  };

  const handleManualSave = () => {
    const storageKey = `${videoId}_${activeLanguage}`;
    saveLocalWorkspace(storageKey, codeContent);
    setSaveStatus('Saved to browser localStorage!');
    setTimeout(() => setSaveStatus(''), 2500);
  };

  return (
    <div 
      style={{
        display: 'flex',
        flexDirection: 'column',
        height: '100%',
        backgroundColor: 'var(--bg-surface)',
        borderRadius: '12px',
        border: '1px solid var(--border-color)',
        overflow: 'hidden'
      }}
    >
      {/* Editor top Actionbar */}
      <div 
        style={{
          padding: '10px 16px',
          backgroundColor: '#0d1321',
          borderBottom: '1px solid var(--border-color)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          flexWrap: 'wrap',
          gap: '8px'
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '6px', color: 'var(--accent-primary)' }}>
            <FileCode size={16} />
            <span style={{ fontSize: '13px', fontWeight: 600 }}>Editor</span>
          </div>

          {/* Runtime Dropdown picker */}
          <select
            value={activeLanguage}
            onChange={(e) => handleLanguageChange(e.target.value as SupportedLanguage)}
            style={{
              backgroundColor: 'var(--bg-surface)',
              color: '#e5e7eb',
              border: '1px solid var(--border-highlight)',
              padding: '4px 10px',
              borderRadius: '6px',
              fontSize: '12px',
              fontWeight: 500,
              cursor: 'pointer',
              outline: 'none'
            }}
          >
            {(Object.keys(LANGUAGE_LABELS) as SupportedLanguage[]).map((lang) => (
              <option key={lang} value={lang}>
                {LANGUAGE_LABELS[lang]}
              </option>
            ))}
          </select>
        </div>

        {/* Action Button Controls */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
          {saveStatus && (
            <span style={{ fontSize: '11px', color: 'var(--success)', fontStyle: 'italic' }}>
              ✓ {saveStatus}
            </span>
          )}

          <button
            onClick={handleManualSave}
            title="Force save locally"
            style={{
              background: 'transparent',
              border: '1px solid var(--border-highlight)',
              color: 'var(--text-muted)',
              padding: '4px 10px',
              borderRadius: '6px',
              fontSize: '12px',
              display: 'flex',
              alignItems: 'center',
              gap: '4px'
            }}
            onMouseEnter={(e) => e.currentTarget.style.color = '#fff'}
            onMouseLeave={(e) => e.currentTarget.style.color = 'var(--text-muted)'}
          >
            <Save size={13} />
            <span>Save</span>
          </button>

          <button
            onClick={() => onRunCode(codeContent, activeLanguage)}
            disabled={isRunning}
            style={{
              background: 'var(--accent-primary)',
              color: '#fff',
              padding: '6px 14px',
              borderRadius: '6px',
              fontSize: '12px',
              fontWeight: 600,
              display: 'flex',
              alignItems: 'center',
              gap: '6px',
              boxShadow: '0 2px 8px rgba(34, 211, 238, 0.2)'
            }}
          >
            <Play size={13} fill="#fff" />
            <span>{isRunning ? 'Running…' : 'Run'}</span>
          </button>
        </div>
      </div>

      {/* Code Textarea Area with customized Line Indicators feel */}
      <div style={{ flex: 1, overflowY: 'auto', overflowX: 'auto', position: 'relative', display: 'flex', background: '#0c101c' }}>
        {/* Left Side line column marker */}
        <div 
          style={{
            width: '40px',
            paddingTop: '16px',
            textAlign: 'right',
            paddingRight: '12px',
            color: '#374151',
            fontFamily: 'var(--font-mono)',
            fontSize: '13px',
            lineHeight: '21px',
            userSelect: 'none',
            borderRight: '1px solid rgba(255,255,255,0.04)',
            background: '#090d16',
            flexShrink: 0
          }}
        >
          {Array.from({ length: Math.max(15, codeContent.split('\n').length + 2) }).map((_, i) => (
            <div key={i}>{i + 1}</div>
          ))}
        </div>

        <textarea
          value={codeContent}
          onChange={handleCodeChange}
          spellCheck={false}
          style={{
            flex: 1,
            background: 'transparent',
            border: 'none',
            color: '#f3f4f6',
            fontFamily: 'var(--font-mono)',
            fontSize: '13px',
            lineHeight: '21px',
            padding: '16px',
            height: `${Math.max(300, codeContent.split('\n').length * 21 + 40)}px`,
            resize: 'none',
            outline: 'none',
            whiteSpace: 'pre',
            overflowWrap: 'normal',
            overflowX: 'hidden',
            overflowY: 'hidden'
          }}
          placeholder="Start typing…"
        />
      </div>
    </div>
  );
};
