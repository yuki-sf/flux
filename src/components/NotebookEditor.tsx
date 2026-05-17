import React, { useState, useEffect, useRef } from 'react';
import type { NotebookCell, SupportedLanguage, VirtualFile } from '../types';
import { saveLocalWorkspace, loadLocalWorkspace } from '../services/wasmRunner';
import { Play, Plus, Trash2, BookOpen, Edit3, Check, UploadCloud, FileText } from 'lucide-react';

interface NotebookEditorProps {
  videoId: string;
  initialCells?: NotebookCell[];
  onRunCell: (code: string, language: SupportedLanguage, cellId: string, files?: VirtualFile[]) => void;
  cellOutputs: Record<string, { stdout: string; stderr: string; error?: boolean; plots?: string[] }>;
  runningCellId: string | null;
}

const DEFAULT_NOTEBOOK_CELLS: NotebookCell[] = [
  {
    id: 'cell_md_1',
    type: 'markdown',
    content: '### Scratch Pad\nUse this notebook to follow along with the video.'
  },
  {
    id: 'cell_code_1',
    type: 'code',
    content: '# Try running this cell\nfor i in range(5):\n    print(f"Step {i + 1}")'
  }
];

export const NotebookEditor: React.FC<NotebookEditorProps> = ({
  videoId,
  initialCells,
  onRunCell,
  cellOutputs,
  runningCellId
}) => {
  const [cells, setCells] = useState<NotebookCell[]>([]);
  const [editingMdId, setEditingMdId] = useState<string | null>(null);
  
  // File upload state integration tracking user virtual accessible data inputs
  const [uploadedFiles, setUploadedFiles] = useState<VirtualFile[]>([]);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Load persistence cache
  useEffect(() => {
    const storageKey = `notebook_${videoId}`;
    const loaded = loadLocalWorkspace(storageKey);

    if (loaded) {
      try {
        const parsed = JSON.parse(loaded);
        if (Array.isArray(parsed) && parsed.length > 0) {
          setCells(parsed);
          return;
        }
      } catch (e) {
        console.error('Failed parsing saved notebook data', e);
      }
    }

    setCells(initialCells || DEFAULT_NOTEBOOK_CELLS);
  }, [videoId, initialCells]);

  // Synchronize state saving
  const updateCellsState = (nextCells: NotebookCell[]) => {
    setCells(nextCells);
    saveLocalWorkspace(`notebook_${videoId}`, JSON.stringify(nextCells));
  };

  const handleCellContentChange = (id: string, newContent: string) => {
    const nextCells = cells.map((c) => c.id === id ? { ...c, content: newContent } : c);
    updateCellsState(nextCells);
  };

  const addCell = (type: 'code' | 'markdown') => {
    const newCell: NotebookCell = {
      id: `cell_${Date.now()}_${Math.random().toString(36).substr(2, 4)}`,
      type,
      content: type === 'code' ? '# Write evaluation logic here...\n' : '### Custom Notes Header\nType descriptive markdown text here.'
    };
    updateCellsState([...cells, newCell]);
    if (type === 'markdown') {
      setEditingMdId(newCell.id);
    }
  };

  const deleteCell = (id: string) => {
    const nextCells = cells.filter((c) => c.id !== id);
    updateCellsState(nextCells);
  };

  // Process selected file blobs transcoding specialized AVIF/WEBP image formats natively into universal PNG file streams avoiding PIL unrecognized magic errors
  const handleFileUploadSelection = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files || files.length === 0) return;

    const newlyMounted: VirtualFile[] = [];

    for (let i = 0; i < files.length; i++) {
      const file = files[i];
      try {
        const rawBuffer = await file.arrayBuffer();
        let data = new Uint8Array(rawBuffer);
        const originalFileName = file.name;

        // Determine if file represents modern specialized compression structures lacking default compiled underlying codecs in standalone virtual environments
        const isModernImageFormat = /\.(avif|webp|heic|heif)$/i.test(file.name) || file.type.includes('avif') || file.type.includes('webp');

        if (isModernImageFormat) {
          try {
            // Draw via browser offline 2D canvas decoding transcode seamlessly
            const objectUrl = URL.createObjectURL(file);
            const imgObj = new Image();
            imgObj.src = objectUrl;

            await new Promise((resolve, reject) => {
              imgObj.onload = resolve;
              imgObj.onerror = reject;
            });

            const canvas = document.createElement('canvas');
            canvas.width = imgObj.width || 800;
            canvas.height = imgObj.height || 600;
            const ctx = canvas.getContext('2d');
            
            if (ctx) {
              ctx.drawImage(imgObj, 0, 0);
              const blobRes = await new Promise<Blob | null>(resolve => canvas.toBlob(resolve, 'image/png'));
              if (blobRes) {
                const transcodedBuffer = await blobRes.arrayBuffer();
                data = new Uint8Array(transcodedBuffer); // Overwrites buffer with pure standard PNG magic signature bytes!
                
                // Mount explicit .png mirror companion
                const strippedBase = file.name.replace(/\.(avif|webp|heic|heif)$/i, '');
                newlyMounted.push({
                  name: `${strippedBase}.png`,
                  data,
                  sizeFormatted: `${Math.round(data.length / 1024)} KB`
                });
              }
            }
            URL.revokeObjectURL(objectUrl);
          } catch (canvasErr) {
            console.error('Bypassing local browser media format decode pipeline fallbacks', canvasErr);
          }
        }

        // Format final payload size metric
        const kb = data.length / 1024;
        const sizeStr = kb > 1024 ? `${(kb / 1024).toFixed(1)} MB` : `${Math.round(kb)} KB`;

        newlyMounted.push({
          name: originalFileName, // Mounted beautifully with standard universally compatible byte signature structures!
          data,
          sizeFormatted: sizeStr
        });
      } catch (err) {
        console.error('Error reading workspace load attachment', err);
      }
    }

    // Merge uploaded entities matching previous list items deduplicated by name
    setUploadedFiles((prev) => {
      const merged = [...prev];
      newlyMounted.forEach((newFile) => {
        const existingIdx = merged.findIndex(f => f.name === newFile.name);
        if (existingIdx !== -1) {
          merged[existingIdx] = newFile;
        } else {
          merged.push(newFile);
        }
      });
      return merged;
    });

    // Reset html input trigger
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  const removeUploadedFile = (fileName: string) => {
    setUploadedFiles((prev) => prev.filter(f => f.name !== fileName));
  };

  // Render minimal text layout markdown logic
  const renderMarkdownText = (text: string) => {
    return text.split('\n').map((line, index) => {
      if (line.startsWith('### ')) {
        return <h4 key={index} style={{ color: '#c084fc', margin: '8px 0 4px', fontSize: '15px' }}>{line.replace('### ', '')}</h4>;
      }
      if (line.startsWith('## ')) {
        return <h3 key={index} style={{ color: '#a855f7', margin: '10px 0 6px', fontSize: '17px' }}>{line.replace('## ', '')}</h3>;
      }
      if (line.startsWith('# ')) {
        return <h2 key={index} style={{ color: '#8b5cf6', margin: '12px 0 8px', fontSize: '20px' }}>{line.replace('# ', '')}</h2>;
      }
      return <p key={index} style={{ margin: '4px 0', fontSize: '13px', color: '#e5e7eb', lineHeight: 1.5, whiteSpace: 'pre-wrap', wordBreak: 'break-word' }}>{line}</p>;
    });
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
      {/* Hidden system input handle targeting client local drives */}
      <input 
        ref={fileInputRef}
        type="file" 
        multiple 
        onChange={handleFileUploadSelection} 
        style={{ display: 'none' }} 
      />

      {/* Actionbar */}
      <div 
        style={{
          padding: '10px 16px',
          backgroundColor: '#0d1321',
          borderBottom: '1px solid var(--border-color)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          flexWrap: 'wrap',
          gap: '8px',
          flexShrink: 0
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px', color: '#c084fc' }}>
          <BookOpen size={16} />
          <span style={{ fontSize: '13px', fontWeight: 700 }}>Python Workspace Notebook</span>
          <span style={{ fontSize: '11px', color: 'var(--text-muted)', background: 'rgba(255,255,255,0.05)', padding: '2px 6px', borderRadius: '4px' }}>
            Supports !pip & File Storage
          </span>
        </div>

        {/* Global Action triggers including File Upload feature requested */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '6px', flexWrap: 'wrap' }}>
          <button
            onClick={() => fileInputRef.current?.click()}
            title="Upload CSVs, images (AVIF/WEBP mapping supported), data files accessible directly to Python code"
            style={{
              background: 'rgba(59, 130, 246, 0.15)',
              border: '1px solid rgba(59, 130, 246, 0.3)',
              color: '#60a5fa',
              padding: '4px 10px',
              borderRadius: '6px',
              fontSize: '11px',
              fontWeight: 600,
              display: 'flex',
              alignItems: 'center',
              gap: '4px'
            }}
          >
            <UploadCloud size={12} />
            <span>📁 Upload Files</span>
          </button>

          <button
            onClick={() => addCell('code')}
            style={{
              background: 'rgba(139, 92, 246, 0.2)',
              border: '1px solid rgba(139, 92, 246, 0.4)',
              color: '#c084fc',
              padding: '4px 10px',
              borderRadius: '6px',
              fontSize: '11px',
              fontWeight: 600,
              display: 'flex',
              alignItems: 'center',
              gap: '4px'
            }}
          >
            <Plus size={12} />
            <span>+ Code Cell</span>
          </button>

          <button
            onClick={() => addCell('markdown')}
            style={{
              background: 'rgba(16, 185, 129, 0.15)',
              border: '1px solid rgba(16, 185, 129, 0.3)',
              color: '#34d399',
              padding: '4px 10px',
              borderRadius: '6px',
              fontSize: '11px',
              fontWeight: 600,
              display: 'flex',
              alignItems: 'center',
              gap: '4px'
            }}
          >
            <Plus size={12} />
            <span>+ Markdown Notes</span>
          </button>
        </div>
      </div>

      {/* Render dynamically uploaded files drawer tracking context files */}
      {uploadedFiles.length > 0 && (
        <div 
          style={{ 
            background: '#0a0e17', 
            padding: '8px 16px', 
            borderBottom: '1px solid var(--border-color)', 
            display: 'flex', 
            alignItems: 'center', 
            gap: '8px', 
            flexWrap: 'wrap',
            flexShrink: 0 
          }}
        >
          <span style={{ fontSize: '11px', color: 'var(--text-muted)', fontWeight: 600, display: 'flex', alignItems: 'center', gap: '4px' }}>
            <FileText size={12} />
            <span>Mounted FS Files:</span>
          </span>

          {uploadedFiles.map((file) => (
            <span
              key={file.name}
              style={{
                fontSize: '11px',
                background: 'rgba(255,255,255,0.06)',
                color: '#e5e7eb',
                padding: '2px 8px',
                borderRadius: '12px',
                display: 'flex',
                alignItems: 'center',
                gap: '6px',
                border: '1px solid rgba(255,255,255,0.1)'
              }}
            >
              <span style={{ fontFamily: 'var(--font-mono)', color: '#60a5fa' }}>{file.name}</span>
              <span style={{ color: 'var(--text-muted)', fontSize: '9px' }}>({file.sizeFormatted})</span>
              <button
                onClick={() => removeUploadedFile(file.name)}
                title="Remove uploaded document"
                style={{ background: 'transparent', border: 'none', color: '#9ca3af', padding: 0, marginLeft: '2px', cursor: 'pointer' }}
              >
                ✕
              </button>
            </span>
          ))}
        </div>
      )}

      {/* Cells buffer loop stack list - explicitly overflowY auto and elements flexShrink 0 */}
      <div 
        style={{ 
          flex: 1, 
          overflowY: 'auto', 
          padding: '16px', 
          display: 'flex', 
          flexDirection: 'column', 
          gap: '20px', 
          background: '#090d16' 
        }}
      >
        {cells.map((cell, index) => {
          const isCellRunning = runningCellId === cell.id;
          const outputData = cellOutputs[cell.id];
          const lineCount = cell.content ? cell.content.split('\n').length : 2;
          const dynamicHeight = Math.max(80, lineCount * 21 + 24);

          return (
            <div
              key={cell.id}
              style={{
                background: 'var(--bg-surface)',
                borderRadius: '8px',
                border: `1px solid ${cell.type === 'code' ? 'var(--border-highlight)' : 'rgba(16, 185, 129, 0.2)'}`,
                overflow: 'hidden',
                position: 'relative',
                flexShrink: 0, // Guarantees adding multiple cells never compresses/squishes individual cells
                boxShadow: '0 4px 12px rgba(0,0,0,0.2)'
              }}
            >
              {/* Cell Header Strip */}
              <div 
                style={{ 
                  background: cell.type === 'code' ? 'rgba(0,0,0,0.2)' : 'rgba(16, 185, 129, 0.05)',
                  padding: '4px 12px',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                  borderBottom: '1px solid var(--border-color)',
                  fontSize: '11px',
                  color: 'var(--text-muted)'
                }}
              >
                <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                  <span style={{ fontWeight: 700, color: cell.type === 'code' ? '#a78bfa' : '#34d399' }}>
                    [{index + 1}] {cell.type.toUpperCase()}
                  </span>
                </div>

                <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                  {cell.type === 'markdown' && (
                    <button
                      onClick={() => setEditingMdId(editingMdId === cell.id ? null : cell.id)}
                      style={{ background: 'transparent', color: 'var(--text-muted)', border: 'none', padding: '2px 6px', display: 'flex', alignItems: 'center', gap: '4px', fontSize: '10px' }}
                    >
                      {editingMdId === cell.id ? <Check size={11} color="var(--success)" /> : <Edit3 size={11} />}
                      <span>{editingMdId === cell.id ? 'Save View' : 'Edit Text'}</span>
                    </button>
                  )}

                  <button
                    onClick={() => deleteCell(cell.id)}
                    title="Remove block"
                    style={{ background: 'transparent', color: 'var(--text-muted)', border: 'none', padding: '2px 4px' }}
                    onMouseEnter={(e) => e.currentTarget.style.color = 'var(--danger)'}
                    onMouseLeave={(e) => e.currentTarget.style.color = 'var(--text-muted)'}
                  >
                    <Trash2 size={12} />
                  </button>
                </div>
              </div>

              {/* Cell Body layout */}
              {cell.type === 'markdown' ? (
                <div style={{ padding: '12px 16px' }}>
                  {editingMdId === cell.id ? (
                    <textarea
                      value={cell.content}
                      onChange={(e) => handleCellContentChange(cell.id, e.target.value)}
                      style={{
                        width: '100%',
                        height: `${dynamicHeight}px`,
                        background: '#070a12',
                        border: '1px solid var(--border-highlight)',
                        borderRadius: '6px',
                        color: '#f3f4f6',
                        padding: '10px',
                        fontSize: '13px',
                        fontFamily: 'var(--font-mono)',
                        outline: 'none',
                        resize: 'vertical',
                        whiteSpace: 'pre-wrap', // Enforce wrapping cleanly
                        wordBreak: 'break-word'
                      }}
                      placeholder="Enter Markdown notes logic..."
                      autoFocus
                    />
                  ) : (
                    <div 
                      onDoubleClick={() => setEditingMdId(cell.id)}
                      style={{ cursor: 'pointer', minHeight: '40px', wordBreak: 'break-word' }}
                      title="Double click to edit markdown notes"
                    >
                      {renderMarkdownText(cell.content || '*Empty notes container*')}
                    </div>
                  )}
                </div>
              ) : (
                /* Code Layout block with fully word-wrapped and scaled input */
                <div style={{ display: 'flex', flexDirection: 'column' }}>
                  <div style={{ display: 'flex', background: '#05070d' }}>
                    <textarea
                      value={cell.content}
                      onChange={(e) => handleCellContentChange(cell.id, e.target.value)}
                      spellCheck={false}
                      style={{
                        flex: 1,
                        background: 'transparent',
                        border: 'none',
                        color: '#f3f4f6',
                        fontFamily: 'var(--font-mono)',
                        fontSize: '13px',
                        lineHeight: '21px',
                        padding: '12px',
                        height: `${dynamicHeight}px`,
                        resize: 'vertical',
                        outline: 'none',
                        overflowY: 'hidden',
                        whiteSpace: 'pre-wrap', // Explicitly wrap code so users never have to scroll horizontally inside notebook cells
                        wordBreak: 'break-word'
                      }}
                      placeholder="Type Python snippet logic..."
                    />

                    {/* Execute action strip trigger passing user-attached data files array */}
                    <div style={{ padding: '8px', display: 'flex', alignItems: 'flex-start' }}>
                      <button
                        onClick={() => onRunCell(cell.content, 'python', cell.id, uploadedFiles)}
                        disabled={isCellRunning}
                        title="Evaluate cell via Pyodide"
                        style={{
                          background: isCellRunning ? 'transparent' : 'var(--accent-primary)',
                          border: isCellRunning ? '1px solid var(--accent-primary)' : 'none',
                          color: '#fff',
                          width: '28px',
                          height: '28px',
                          borderRadius: '6px',
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center'
                        }}
                      >
                        {isCellRunning ? (
                          <div style={{ width: '12px', height: '12px', borderRadius: '50%', border: '2px solid #a855f7', borderTopColor: 'transparent', animation: 'spin 1s linear infinite' }} />
                        ) : (
                          <Play size={13} fill="#fff" />
                        )}
                      </button>
                    </div>
                  </div>

                  {/* Dynamic Cell Stream Logs & Graphical Plot Renders block */}
                  {(outputData?.stdout || outputData?.stderr || (outputData?.plots && outputData.plots.length > 0)) && (
                    <div 
                      style={{ 
                        borderTop: '1px solid var(--border-color)', 
                        padding: '10px 12px',
                        background: '#020408',
                        fontFamily: 'var(--font-mono)',
                        fontSize: '12px',
                        maxHeight: '400px',
                        overflowY: 'auto',
                        whiteSpace: 'pre-wrap',
                        wordBreak: 'break-word',
                        lineHeight: 1.5
                      }}
                    >
                      {outputData.stdout && <div style={{ color: '#d1d5db' }}>{outputData.stdout}</div>}
                      {outputData.stderr && <div style={{ color: 'var(--danger)', marginTop: outputData.stdout ? '4px' : 0 }}>{outputData.stderr}</div>}
                      
                      {/* Render unclosed visual inline charts exported directly from active Matplotlib engines */}
                      {outputData.plots && outputData.plots.map((base64Url, pIdx) => (
                        <div key={pIdx} style={{ marginTop: '8px', textAlign: 'center', background: '#fff', padding: '6px', borderRadius: '4px' }}>
                          <img src={base64Url} alt={`Matplotlib analytical export ${pIdx + 1}`} style={{ maxWidth: '100%', borderRadius: '3px', display: 'block', margin: '0 auto' }} />
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              )}
            </div>
          );
        })}

        {/* Global End Actions */}
        <div style={{ display: 'flex', justifyContent: 'center', gap: '12px', marginTop: '8px', flexShrink: 0 }}>
          <button
            onClick={() => addCell('code')}
            style={{ background: 'var(--bg-surface)', border: '1px dashed var(--border-highlight)', color: 'var(--text-muted)', padding: '6px 16px', borderRadius: '8px', fontSize: '12px' }}
            onMouseEnter={(e) => { e.currentTarget.style.color = '#c084fc'; e.currentTarget.style.borderColor = '#c084fc'; }}
            onMouseLeave={(e) => { e.currentTarget.style.color = 'var(--text-muted)'; e.currentTarget.style.borderColor = 'var(--border-highlight)'; }}
          >
            + Append Code Block
          </button>
        </div>
      </div>
    </div>
  );
};
