import React from 'react';
import type { CourseVideo } from '../types';
import { PlayCircle, CheckCircle2, ListVideo } from 'lucide-react';

interface PlaylistSidebarProps {
  videos: CourseVideo[];
  activeVideoId: string;
  completedVideoIds: Set<string>;
  onSelectVideo: (video: CourseVideo) => void;
}

export const PlaylistSidebar: React.FC<PlaylistSidebarProps> = ({
  videos,
  activeVideoId,
  completedVideoIds,
  onSelectVideo
}) => {
  return (
    <div 
      style={{
        width: '320px',
        height: '100%',
        backgroundColor: 'var(--bg-surface)',
        borderRight: '1px solid var(--border-color)',
        display: 'flex',
        flexDirection: 'column',
        overflow: 'hidden'
      }}
    >
      {/* Header section */}
      <div 
        style={{
          padding: '16px 20px',
          borderBottom: '1px solid var(--border-color)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          background: 'rgba(0,0,0,0.2)'
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
          <ListVideo size={18} color="var(--accent-primary)" />
          <span style={{ fontWeight: 600, fontSize: '14px', color: '#e5e7eb' }}>Course Modules</span>
        </div>
        <div 
          style={{ 
            fontSize: '12px', 
            background: 'var(--border-highlight)', 
            padding: '2px 8px', 
            borderRadius: '12px',
            color: 'var(--text-muted)' 
          }}
        >
          {completedVideoIds.size}/{videos.length} Done
        </div>
      </div>

      {/* Scrollable Curriculum List */}
      <div style={{ flex: 1, overflowY: 'auto', padding: '12px 8px', display: 'flex', flexDirection: 'column', gap: '6px' }}>
        {videos.map((vid, index) => {
          const isActive = vid.id === activeVideoId;
          const isDone = completedVideoIds.has(vid.id);

          return (
            <button
              key={vid.id}
              onClick={() => onSelectVideo(vid)}
              style={{
                width: '100%',
                display: 'flex',
                alignItems: 'flex-start',
                gap: '12px',
                padding: '12px',
                borderRadius: '8px',
                background: isActive ? 'var(--bg-surface-hover)' : 'transparent',
                border: `1px solid ${isActive ? 'var(--border-highlight)' : 'transparent'}`,
                textAlign: 'left',
                transition: 'all 0.2s'
              }}
              onMouseEnter={(e) => {
                if (!isActive) e.currentTarget.style.background = 'rgba(255,255,255,0.03)';
              }}
              onMouseLeave={(e) => {
                if (!isActive) e.currentTarget.style.background = 'transparent';
              }}
            >
              <div style={{ marginTop: '2px' }}>
                {isDone ? (
                  <CheckCircle2 size={16} color="var(--success)" />
                ) : isActive ? (
                  <PlayCircle size={16} color="var(--accent-primary)" className="animate-pulse-slow" />
                ) : (
                  <div 
                    style={{ 
                      width: '16px', 
                      height: '16px', 
                      borderRadius: '50%', 
                      border: '2px solid var(--border-highlight)',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      fontSize: '9px',
                      color: 'var(--text-muted)'
                    }}
                  >
                    {index + 1}
                  </div>
                )}
              </div>

              <div style={{ flex: 1, minWidth: 0 }}>
                <div 
                  style={{ 
                    fontSize: '13px', 
                    fontWeight: isActive ? 600 : 400,
                    color: isActive ? '#fff' : isDone ? 'var(--text-muted)' : '#d1d5db',
                    whiteSpace: 'nowrap',
                    overflow: 'hidden',
                    textOverflow: 'ellipsis'
                  }}
                >
                  {vid.title}
                </div>
                <div style={{ fontSize: '11px', color: 'var(--text-muted)', marginTop: '2px' }}>
                  Duration: {vid.durationFormatted}
                </div>
              </div>
            </button>
          );
        })}
      </div>
    </div>
  );
};
