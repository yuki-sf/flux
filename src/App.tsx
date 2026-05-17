import React, { useState, useEffect } from 'react';
import type { Course, CourseVideo, ExecutionResult, SupportedLanguage, VirtualFile } from './types';
import { DEFAULT_COURSES } from './services/mockCourses';
import { executeCode } from './services/wasmRunner';
import { YouTubePlayer } from './components/YouTubePlayer';

import { CodeEditor } from './components/CodeEditor';
import { NotebookEditor } from './components/NotebookEditor';
import { ExecutionPanel } from './components/ExecutionPanel';
import { 
  Play, 
  ArrowLeft, 
  Tv, 
  FileCode,
  Notebook,
  Trash2,
  Zap
} from 'lucide-react';

export const App: React.FC = () => {
  // Navigation / Dashboard states
  const [activeCourse, setActiveCourse] = useState<Course | null>(null);
  const [activeVideo, setActiveVideo] = useState<CourseVideo | null>(null);
  
  // Immersive Input field properties
  const [customUrlInput, setCustomUrlInput] = useState<string>('');
  const [customTitleInput, setCustomTitleInput] = useState<string>(''); // Custom Course Title feature requested
  const [customLanguage, setCustomLanguage] = useState<SupportedLanguage>('python');
  const [urlError, setUrlError] = useState<string>('');

  // Custom persistent stored user-added workspaces/courses
  const [customCourses, setCustomCourses] = useState<Course[]>([]);



  // Workspace evaluation states for standard IDE buffer
  const [executionResult, setExecutionResult] = useState<ExecutionResult | null>(null);
  const [isRunning, setIsRunning] = useState<boolean>(false);

  // Notebook partial evaluation buffer states
  const [cellOutputs, setCellOutputs] = useState<Record<string, { stdout: string; stderr: string; error?: boolean }>>({});
  const [runningCellId, setRunningCellId] = useState<string | null>(null);

  // Switcher mode for Python view mapping ('notebook' vs standard 'ide')
  const [editorViewMode, setEditorViewMode] = useState<'notebook' | 'ide'>('notebook');

  // Load custom saved courses collection from localStorage on home mount
  useEffect(() => {
    if (typeof window !== 'undefined') {
      try {
        const stored = localStorage.getItem('codestream_custom_courses');
        if (stored) {
          const parsed = JSON.parse(stored);
          if (Array.isArray(parsed)) {
            setCustomCourses(parsed);
          }
        }
      } catch (e) {
        console.error('Failed loading saved custom workspace streams', e);
      }
    }
  }, []);

  // Save changes to custom saved courses collection mapping
  const updatePersistedCustomCourses = (updatedList: Course[]) => {
    setCustomCourses(updatedList);
    if (typeof window !== 'undefined') {
      try {
        localStorage.setItem('codestream_custom_courses', JSON.stringify(updatedList));
      } catch (e) {
        console.error('Failed storing custom workspace updates', e);
      }
    }
  };

  // Load predefined or custom Course directly into active dashboard mapping
  const handleSelectCourse = (course: Course) => {
    setActiveCourse(course);
    if (course.videos && course.videos.length > 0) {
      setActiveVideo(course.videos[0]);
    } else {
      setActiveVideo({
        id: 'YYXdXT2l-Gg',
        title: course.title,
        durationFormatted: '01:00:00',
        durationSeconds: 3600
      });
    }
    setExecutionResult(null);
    setIsRunning(false);
    setCellOutputs({});
    setEditorViewMode(course.defaultLanguage === 'python' ? 'notebook' : 'ide');
  };

  // Remove a persistent custom created workspace mapping
  const handleDeleteCustomCourse = (e: React.MouseEvent, courseId: string) => {
    e.stopPropagation();
    const nextList = customCourses.filter(c => c.id !== courseId);
    updatePersistedCustomCourses(nextList);
  };

  // Process pasted string URL input supporting optional assigned names and playlist structures
  const handleLoadCustomUrl = (e: React.FormEvent) => {
    e.preventDefault();
    if (!customUrlInput.trim()) return;

    setUrlError('');
    let extractedPlaylistId = '';
    let extractedVideoId = '';

    // Extract optional list query parameter matching playlists
    const listMatch = customUrlInput.match(/[?&]list=([\w-]+)/);
    if (listMatch && listMatch[1]) {
      extractedPlaylistId = listMatch[1];
    }

    // Extract regular individual video targets
    const ytRegex = /(?:youtu\.be\/|youtube\.com\/(?:embed\/|v\/|watch\?v=|watch\?.+&v=))([\w-]{11})/;
    const match = customUrlInput.match(ytRegex);
    if (match && match[1]) {
      extractedVideoId = match[1];
    } else if (/^[\w-]{11}$/.test(customUrlInput.trim())) {
      extractedVideoId = customUrlInput.trim();
    }

    // Validate outcomes
    if (!extractedPlaylistId && !extractedVideoId) {
      setUrlError('Could not identify a valid YouTube Video ID or Playlist link. Please copy directly from your browser bar.');
      return;
    }

    const assignedTitle = customTitleInput.trim() || (extractedPlaylistId ? `Imported Course Series` : `Custom Stream Workspace`);
    const assignedDescription = extractedPlaylistId 
      ? `Continuous multimodule series loaded via YouTube queue parameters mapping identifier: ?list=${extractedPlaylistId}`
      : `Single video streaming target workspace loaded natively for link: ${extractedVideoId}`;

    // Route predefined match or initialize persistent multimodule dynamic list block
    if (extractedPlaylistId) {
      const matchedPredefined = DEFAULT_COURSES.find((c) => c.playlistId === extractedPlaylistId);
      if (matchedPredefined) {
        handleSelectCourse(matchedPredefined);
        return;
      }

      // Populate automated playlist configuration stored securely
      const newCustomPlaylistCourse: Course = {
        id: `playlist_custom_${Date.now()}_${extractedPlaylistId}`,
        title: assignedTitle,
        description: assignedDescription,
        defaultLanguage: customLanguage,
        playlistId: extractedPlaylistId,
        videos: [
          {
            id: extractedVideoId || 'YYXdXT2l-Gg', // primary entry placeholder mapping
            title: assignedTitle,
            durationFormatted: '02:30:00',
            durationSeconds: 9000
          }
        ]
      };

      // Store directly in persistence so new courses are securely saved
      updatePersistedCustomCourses([newCustomPlaylistCourse, ...customCourses]);

      setActiveCourse(newCustomPlaylistCourse);
      setActiveVideo(newCustomPlaylistCourse.videos[0]);
      setExecutionResult(null);
      setIsRunning(false);
      setCellOutputs({});
      setEditorViewMode(customLanguage === 'python' ? 'notebook' : 'ide');
      setCustomUrlInput('');
      setCustomTitleInput('');
      return;
    }

    // Generate standard custom individual video item mapping
    const newCustomCourse: Course = {
      id: `video_custom_${Date.now()}_${extractedVideoId}`,
      title: assignedTitle,
      description: assignedDescription,
      defaultLanguage: customLanguage,
      videos: [
        {
          id: extractedVideoId,
          title: assignedTitle,
          durationFormatted: '01:30:00',
          durationSeconds: 5400
        }
      ]
    };

    // Store custom video entry securely
    updatePersistedCustomCourses([newCustomCourse, ...customCourses]);

    setActiveCourse(newCustomCourse);
    setActiveVideo(newCustomCourse.videos[0]);
    setExecutionResult(null);
    setIsRunning(false);
    setCellOutputs({});
    setEditorViewMode(customLanguage === 'python' ? 'notebook' : 'ide');
    setCustomUrlInput('');
    setCustomTitleInput('');
  };

  // Synchronize dynamic progress metrics tracking storing watched item boundary sets permanently
  const handleVideoProgressUpdate = (_currentTimeSeconds: number, completed: boolean) => {
    if (!activeVideo || !completed) return;

    if (typeof window !== 'undefined') {
      try {
        const stored = localStorage.getItem('codestream_completed_videos');
        const parsed = stored ? JSON.parse(stored) : [];
        const nextSet = new Set(Array.isArray(parsed) ? parsed : []);
        nextSet.add(activeVideo.id);
        localStorage.setItem('codestream_completed_videos', JSON.stringify(Array.from(nextSet)));
      } catch (e) {
        // ignore storage cache tracking exceptions
      }
    }
  };

  // Navigate explicitly left/right through structured multi-video sequences manually
  const handleNextVideoCustom = () => {
    if (activeCourse && activeCourse.videos && activeVideo) {
      const idx = activeCourse.videos.findIndex((v) => v.id === activeVideo.id);
      if (idx !== -1 && idx < activeCourse.videos.length - 1) {
        setActiveVideo(activeCourse.videos[idx + 1]);
        setExecutionResult(null);
      }
    }
  };

  const handlePrevVideoCustom = () => {
    if (activeCourse && activeCourse.videos && activeVideo) {
      const idx = activeCourse.videos.findIndex((v) => v.id === activeVideo.id);
      if (idx > 0) {
        setActiveVideo(activeCourse.videos[idx - 1]);
        setExecutionResult(null);
      }
    }
  };

  // Execute continuous buffer targeting designated WebAssembly stream
  const handleRunCodeIDE = async (code: string, language: SupportedLanguage) => {
    setIsRunning(true);
    setExecutionResult(null);
    
    const result = await executeCode(code, language);
    
    setExecutionResult(result);
    setIsRunning(false);
  };

  // Execute distinct Jupyter client layout cell evaluations supporting File Attachments
  const handleRunNotebookCell = async (code: string, language: SupportedLanguage, cellId: string, files?: VirtualFile[]) => {
    setRunningCellId(cellId);
    const res = await executeCode(code, language, cellId, files);

    setCellOutputs((prev) => ({
      ...prev,
      [cellId]: {
        stdout: res.stdout,
        stderr: res.stderr,
        error: res.error,
        plots: res.plots
      }
    }));
    setRunningCellId(null);
  };

  // Return out to basic catalog
  const handleBackToCatalog = () => {
    setActiveCourse(null);
    setActiveVideo(null);
    setExecutionResult(null);
    setCellOutputs({});
  };

  const isCustomNavEnabled = activeCourse?.videos && activeCourse.videos.length > 1;

  return (
    <div className="app-container">
      {/* Animated background orbs */}
      <div className="bg-anim">
        <div className="bg-orb" />
      </div>

      {/* Universal Top Navbar */}
      <header className="header-bar">
        <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
          <div 
            style={{ 
              background: 'var(--accent-gradient)', 
              padding: '7px', 
              borderRadius: '8px',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center'
            }}
          >
            <Zap size={18} color="#fff" />
          </div>
          <h1 style={{ fontSize: '16px', fontWeight: 700, fontFamily: 'var(--font-display)', margin: 0, letterSpacing: '-0.3px' }}>
            flux
          </h1>
        </div>

        {/* Global Catalog Link Header bar loader widget */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
          {activeCourse ? (
            <button
              onClick={handleBackToCatalog}
              style={{
                background: 'transparent',
                border: '1px solid var(--border-highlight)',
                color: 'var(--text-muted)',
                padding: '6px 14px',
                borderRadius: '8px',
                fontSize: '13px',
                fontWeight: 500,
                display: 'flex',
                alignItems: 'center',
                gap: '6px'
              }}
              onMouseEnter={(e) => { e.currentTarget.style.color = '#fff'; e.currentTarget.style.borderColor = 'var(--accent-primary)'; }}
              onMouseLeave={(e) => { e.currentTarget.style.color = 'var(--text-muted)'; e.currentTarget.style.borderColor = 'var(--border-highlight)'; }}
            >
              <ArrowLeft size={14} />
              <span>Back</span>
            </button>
          ) : (
            <div style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '13px', color: 'var(--text-muted)' }}>
              <span style={{ display: 'inline-block', width: '8px', height: '8px', borderRadius: '50%', background: 'var(--success)' }} />
              <span>Ready</span>
            </div>
          )}
        </div>
      </header>

      {/* Main Responsive Application State Containers */}
      <main className="main-content" style={{ overflowY: activeCourse ? 'hidden' : 'auto' }}>
        {!activeCourse ? (
          /* Catalog Layout & Input Landing Hub */
          <div style={{ width: '100%', maxWidth: '1280px', margin: '0 auto', padding: '32px 24px', display: 'flex', flexDirection: 'column', gap: '40px' }}>
            
            <div style={{ textAlign: 'center', maxWidth: '640px', margin: '0 auto', padding: '40px 0 20px' }}>
              <h2 style={{ fontSize: '32px', fontWeight: 800, fontFamily: 'var(--font-display)', lineHeight: 1.2, marginBottom: '10px', letterSpacing: '-0.5px' }}>
                Watch. Code. <span className="text-gradient">Track.</span>
              </h2>
              
              <p style={{ fontSize: '14px', color: 'var(--text-muted)', margin: '0 auto', maxWidth: '440px', lineHeight: 1.6 }}>
                Your personal learning hub — paste a YouTube course, code alongside it, and pick up right where you left off.
              </p>

              {/* Dynamic URL Link input bar supporting Course Naming */}
              <form 
                onSubmit={handleLoadCustomUrl}
                style={{ 
                  marginTop: '28px', 
                  display: 'flex', 
                  flexDirection: 'column', 
                  gap: '10px',
                  maxWidth: '600px',
                  margin: '28px auto 0',
                  background: 'var(--bg-surface)',
                  padding: '14px',
                  borderRadius: '12px',
                  border: '1px solid var(--border-color)'
                }}
              >
                <div style={{ display: 'flex', alignItems: 'center', gap: '12px', flexWrap: 'wrap' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '8px', flex: 1, minWidth: '240px' }}>
                    <Tv size={18} color="var(--accent-primary)" style={{ flexShrink: 0 }} />
                    <input
                      type="text"
                      value={customUrlInput}
                      onChange={(e) => setCustomUrlInput(e.target.value)}
                      placeholder="YouTube URL or playlist link"
                      className="premium-input"
                      style={{ width: '100%', background: 'var(--bg-base)', border: 'none' }}
                    />
                  </div>

                  <div style={{ display: 'flex', alignItems: 'center', gap: '8px', flex: 0.8, minWidth: '180px' }}>
                    <input
                      type="text"
                      value={customTitleInput}
                      onChange={(e) => setCustomTitleInput(e.target.value)}
                      placeholder="Name (optional)"
                      className="premium-input"
                      style={{ width: '100%', background: 'var(--bg-base)', border: 'none', fontSize: '13px' }}
                    />
                  </div>
                </div>

                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: '12px', borderTop: '1px solid var(--border-color)', paddingTop: '12px' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                    <span style={{ fontSize: '12px', color: 'var(--text-muted)', fontWeight: 500 }}>Language:</span>
                    <select
                      value={customLanguage}
                      onChange={(e) => setCustomLanguage(e.target.value as SupportedLanguage)}
                      style={{
                        background: 'var(--bg-base)',
                        color: 'var(--text-main)',
                        border: '1px solid var(--border-highlight)',
                        padding: '6px 12px',
                        borderRadius: '8px',
                        fontSize: '13px',
                        outline: 'none',
                        cursor: 'pointer'
                      }}
                    >
                      <option value="python">Python</option>
                      <option value="sql">SQL</option>
                      <option value="javascript">JavaScript</option>
                      <option value="html">HTML / CSS / JS</option>
                      <option value="ruby">Ruby</option>
                      <option value="cpp">C++</option>
                      <option value="r">R</option>
                    </select>
                  </div>

                  <button
                    type="submit"
                    style={{
                      background: 'var(--accent-gradient)',
                      color: '#fff',
                      padding: '8px 20px',
                      borderRadius: '8px',
                      fontWeight: 600,
                      fontSize: '13px',
                      display: 'flex',
                      alignItems: 'center',
                      gap: '8px',
                      whiteSpace: 'nowrap'
                    }}
                  >
                    <Play size={14} fill="#fff" />
                    <span>Launch</span>
                  </button>
                </div>

                {urlError && (
                  <div style={{ fontSize: '12px', color: 'var(--danger)', textAlign: 'left', marginTop: '4px' }}>
                    {urlError}
                  </div>
                )}
              </form>
            </div>

            {/* Custom Persistence Saved Workspaces block */}
            {customCourses.length > 0 && (
              <div style={{ borderTop: '1px solid var(--border-color)', paddingTop: '32px' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '16px' }}>
                  <h3 style={{ fontSize: '14px', fontWeight: 600, fontFamily: 'var(--font-display)', margin: 0, color: 'var(--success)', textTransform: 'uppercase', letterSpacing: '0.5px' }}>
                    Saved
                  </h3>
                </div>

                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(320px, 1fr))', gap: '12px' }}>
                  {customCourses.map((storedCourse) => (
                    <div
                      key={storedCourse.id}
                      onClick={() => handleSelectCourse(storedCourse)}
                      style={{
                        background: 'var(--bg-surface)',
                        border: '1px solid var(--border-color)',
                        borderRadius: '10px',
                        padding: '14px 16px',
                        cursor: 'pointer',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'space-between',
                        transition: 'all 0.15s',
                        position: 'relative'
                      }}
                      onMouseEnter={(e) => {
                        e.currentTarget.style.borderColor = 'var(--accent-primary)';
                        e.currentTarget.style.background = 'var(--bg-surface-hover)';
                      }}
                      onMouseLeave={(e) => {
                        e.currentTarget.style.borderColor = 'var(--border-color)';
                        e.currentTarget.style.background = 'var(--bg-surface)';
                      }}
                    >
                      <div style={{ flex: 1, minWidth: 0, paddingRight: '12px' }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '4px' }}>
                          <span style={{ fontSize: '10px', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.5px', color: 'var(--text-accent)' }}>
                            {storedCourse.defaultLanguage}
                          </span>
                        </div>

                        <div style={{ fontSize: '14px', fontWeight: 600, color: 'var(--text-main)', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                          {storedCourse.title}
                        </div>
                        <div style={{ fontSize: '11px', color: 'var(--text-muted)', marginTop: '2px', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                          {storedCourse.playlistId ? 'Playlist' : storedCourse.description}
                        </div>
                      </div>

                      <button
                        onClick={(e) => handleDeleteCustomCourse(e, storedCourse.id)}
                        title="Delete stored record"
                        style={{ background: 'transparent', border: 'none', color: 'var(--text-muted)', padding: '6px' }}
                        onMouseEnter={(e) => e.currentTarget.style.color = 'var(--danger)'}
                        onMouseLeave={(e) => e.currentTarget.style.color = 'var(--text-muted)'}
                      >
                        <Trash2 size={15} />
                      </button>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Quick Launch Courses Collection */}
            <div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '16px' }}>
                <h3 style={{ fontSize: '14px', fontWeight: 600, fontFamily: 'var(--font-display)', margin: 0, textTransform: 'uppercase', letterSpacing: '0.5px', color: 'var(--text-muted)' }}>
                  Explore
                </h3>
              </div>

              <div 
                style={{
                  display: 'grid',
                  gridTemplateColumns: 'repeat(auto-fill, minmax(320px, 1fr))',
                  gap: '12px'
                }}
              >
                {DEFAULT_COURSES.map((course) => {
                  return (
                    <div
                      key={course.id}
                      onClick={() => handleSelectCourse(course)}
                      style={{
                        background: 'var(--bg-surface)',
                        border: '1px solid var(--border-color)',
                        borderRadius: '10px',
                        padding: '14px 16px',
                        cursor: 'pointer',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'space-between',
                        transition: 'all 0.15s',
                        position: 'relative'
                      }}
                      onMouseEnter={(e) => {
                        e.currentTarget.style.borderColor = 'var(--accent-primary)';
                        e.currentTarget.style.background = 'var(--bg-surface-hover)';
                      }}
                      onMouseLeave={(e) => {
                        e.currentTarget.style.borderColor = 'var(--border-color)';
                        e.currentTarget.style.background = 'var(--bg-surface)';
                      }}
                    >
                      <div style={{ flex: 1, minWidth: 0, paddingRight: '12px' }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '4px' }}>
                          <span style={{ fontSize: '10px', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.5px', color: 'var(--text-accent)' }}>
                            {course.defaultLanguage}
                          </span>
                        </div>

                        <div style={{ fontSize: '14px', fontWeight: 600, color: 'var(--text-main)', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                          {course.title}
                        </div>
                        <div style={{ fontSize: '11px', color: 'var(--text-muted)', marginTop: '2px', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                          {course.description}
                        </div>
                      </div>

                      <div style={{ color: 'var(--text-muted)', padding: '6px', display: 'flex', alignItems: 'center' }}>
                        <Play size={14} fill="var(--text-muted)" />
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>



          </div>
        ) : (
          /* Main Split screen layout */
          <div style={{ display: 'flex', width: '100%', height: '100%', overflow: 'hidden' }}>
            


            {/* Middle Container: YouTube View & Output Pane */}
            <div 
              style={{
                flex: 1,
                minWidth: '400px',
                height: '100%',
                display: 'flex',
                flexDirection: 'column',
                padding: '16px',
                gap: '16px',
                overflowY: 'auto',
                backgroundColor: 'var(--bg-base)'
              }}
            >
              {/* Active Player Box */}
              {activeVideo && (
                <div style={{ flexShrink: 0 }}>
                  <YouTubePlayer
                    video={activeVideo}
                    playlistTotal={activeCourse.videos?.length}
                    playlistSeriesId={activeCourse.playlistId}
                    onProgressUpdate={handleVideoProgressUpdate}
                    onNextVideo={isCustomNavEnabled ? handleNextVideoCustom : undefined}
                    onPrevVideo={isCustomNavEnabled ? handlePrevVideoCustom : undefined}
                  />
                </div>
              )}

              {/* Execution Outputs Monitor below video (Active only when Standard IDE stream evaluated) */}
              <div style={{ flex: 1, minHeight: '220px' }}>
                <ExecutionPanel
                  result={executionResult}
                  isRunning={isRunning}
                />
              </div>
            </div>

            {/* Right Container: Multi-language Buffer / Notebook Studio Switcher */}
            <div 
              style={{
                width: '45%',
                minWidth: '440px',
                height: '100%',
                padding: '16px 16px 16px 0',
                display: 'flex',
                flexDirection: 'column',
                gap: '8px'
              }}
            >
              {/* If target engine is Python, display premium layout interface toggle switch */}
              {activeCourse.defaultLanguage === 'python' ? (
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', background: 'var(--bg-surface)', padding: '6px 12px', borderRadius: '8px', border: '1px solid var(--border-color)', flexShrink: 0 }}>

                  <div style={{ display: 'flex', gap: '4px' }}>
                    <button
                      onClick={() => setEditorViewMode('notebook')}
                      style={{
                        background: editorViewMode === 'notebook' ? 'var(--accent-primary)' : 'transparent',
                        color: editorViewMode === 'notebook' ? '#fff' : 'var(--text-muted)',
                        padding: '4px 10px',
                        borderRadius: '6px',
                        fontSize: '12px',
                        fontWeight: 600,
                        display: 'flex',
                        alignItems: 'center',
                        gap: '6px'
                      }}
                    >
                      <Notebook size={13} />
                      <span>Notebook</span>
                    </button>

                    <button
                      onClick={() => setEditorViewMode('ide')}
                      style={{
                        background: editorViewMode === 'ide' ? 'var(--accent-primary)' : 'transparent',
                        color: editorViewMode === 'ide' ? '#fff' : 'var(--text-muted)',
                        padding: '4px 10px',
                        borderRadius: '6px',
                        fontSize: '12px',
                        fontWeight: 600,
                        display: 'flex',
                        alignItems: 'center',
                        gap: '6px'
                      }}
                    >
                      <FileCode size={13} />
                      <span>IDE</span>
                    </button>
                  </div>
                </div>
              ) : null}

              {/* Render Selected View block dynamically */}
              <div style={{ flex: 1, overflow: 'hidden' }}>
                {activeCourse.defaultLanguage === 'python' && editorViewMode === 'notebook' ? (
                  <NotebookEditor
                    videoId={activeVideo?.id || activeCourse.id}
                    initialCells={activeCourse.initialNotebook}
                    onRunCell={handleRunNotebookCell}
                    cellOutputs={cellOutputs}
                    runningCellId={runningCellId}
                  />
                ) : (
                  <CodeEditor
                    videoId={activeVideo?.id || activeCourse.id}
                    defaultLanguage={activeCourse.defaultLanguage}
                    initialCode={activeCourse.initialCode}
                    onRunCode={handleRunCodeIDE}
                    isRunning={isRunning}
                  />
                )}
              </div>
            </div>

          </div>
        )}
      </main>
    </div>
  );
};
export default App;
