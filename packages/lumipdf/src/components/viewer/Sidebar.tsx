import { useState, useCallback, useRef, useEffect } from 'react';
import { useViewerStore } from '../../hooks/useDocumentViewer';
import { ThumbnailRenderer } from './ThumbnailRenderer';
import { Icon } from '../common/Icon';
import type { OutlineNode, AttachmentRef } from '../../core/types';

export function Sidebar() {
  const document = useViewerStore((s) => s.document);
  const sidebarView = useViewerStore((s) => s.sidebarView);
  const setSidebarView = useViewerStore((s) => s.setSidebarView);
  const sidebarWidth = useViewerStore((s) => s.sidebarWidth);
  const setSidebarWidth = useViewerStore((s) => s.setSidebarWidth);
  const currentPage = useViewerStore((s) => s.currentPage);
  const goToPage = useViewerStore((s) => s.goToPage);

  const resizerRef = useRef<HTMLDivElement>(null);
  const contentRef = useRef<HTMLDivElement>(null);
  const thumbnailRefs = useRef(new Map<number, HTMLDivElement>());
  const [isDragging, setIsDragging] = useState(false);

  useEffect(() => {
    if (sidebarView !== 'thumbnails') return;
    const container = contentRef.current;
    const thumbnail = thumbnailRefs.current.get(currentPage);
    if (!container || !thumbnail) return;

    const top =
      container.scrollTop +
      thumbnail.getBoundingClientRect().top -
      container.getBoundingClientRect().top;
    const bottom = top + thumbnail.offsetHeight;
    const visibleTop = container.scrollTop;
    const visibleBottom = visibleTop + container.clientHeight;
    if (top >= visibleTop && bottom <= visibleBottom) return;

    container.scrollTo({
      top: Math.max(0, top - (container.clientHeight - thumbnail.offsetHeight) / 2),
      behavior: 'smooth',
    });
  }, [currentPage, sidebarView]);

  const handleMouseDown = useCallback((e: React.MouseEvent) => {
    e.preventDefault();
    setIsDragging(true);
  }, []);

  useEffect(() => {
    if (!isDragging) return;

    const handleMouseMove = (e: MouseEvent) => {
      const nextWidth = e.clientX;
      setSidebarWidth(nextWidth);
    };

    const handleMouseUp = () => {
      setIsDragging(false);
    };

    window.addEventListener('mousemove', handleMouseMove);
    window.addEventListener('mouseup', handleMouseUp);
    return () => {
      window.removeEventListener('mousemove', handleMouseMove);
      window.removeEventListener('mouseup', handleMouseUp);
    };
  }, [isDragging, setSidebarWidth]);

  const handleDownloadAttachment = async (attachment: AttachmentRef) => {
    try {
      const blob = await attachment.getData();
      const url = URL.createObjectURL(blob);
      const link = window.document.createElement('a');
      link.href = url;
      link.download = attachment.name;
      link.click();
      URL.revokeObjectURL(url);
    } catch (err) {
      console.error('Failed to download attachment', err);
    }
  };

  if (!document) return null;

  return (
    <div
      className="dv-sidebar"
      style={{ width: `${sidebarWidth}px` }}
    >
      <div className="dv-sidebar-tabs">
        <button
          className="dv-sidebar-tab"
          data-active={sidebarView === 'thumbnails'}
          onClick={() => setSidebarView('thumbnails')}
        >
          Thumbnails
        </button>
        <button
          className="dv-sidebar-tab"
          data-active={sidebarView === 'outline'}
          onClick={() => setSidebarView('outline')}
        >
          Bookmarks
        </button>
        <button
          className="dv-sidebar-tab"
          data-active={sidebarView === 'attachments'}
          onClick={() => setSidebarView('attachments')}
        >
          Attachments
        </button>
      </div>

      <div ref={contentRef} className="dv-sidebar-content">
        {sidebarView === 'thumbnails' && (
          <div className="dv-sidebar-thumbnails">
            {document.pages.map((_, idx) => (
              <div
                key={idx}
                ref={(element) => {
                  if (element) thumbnailRefs.current.set(idx, element);
                  else thumbnailRefs.current.delete(idx);
                }}
                className="dv-sidebar-thumbnail-item"
                data-active={currentPage === idx}
                onClick={() => goToPage(idx)}
              >
                <div className="dv-sidebar-thumbnail-container">
                  <ThumbnailRenderer pageIndex={idx} />
                </div>
                <span className="dv-sidebar-thumbnail-label">{idx + 1}</span>
              </div>
            ))}
          </div>
        )}

        {sidebarView === 'outline' && (
          <div className="dv-sidebar-outline">
            {document.outline && document.outline.length > 0 ? (
              <OutlineTree nodes={document.outline} onSelectNode={(dest) => {
                if (typeof dest === 'object' && dest !== null && 'pageIndex' in dest) {
                  goToPage(dest.pageIndex);
                }
              }} />
            ) : (
              <div style={{ padding: '8px', fontSize: '13px', opacity: 0.6 }}>No bookmarks</div>
            )}
          </div>
        )}

        {sidebarView === 'attachments' && (
          <div className="dv-sidebar-attachments">
            {document.attachments && document.attachments.length > 0 ? (
              document.attachments.map((att) => (
                <div
                  key={att.id}
                  className="dv-sidebar-attachment-item"
                  onClick={() => handleDownloadAttachment(att)}
                >
                  <div className="dv-sidebar-attachment-info">
                    <Icon name="file" className="dv-sidebar-attachment-icon" />
                    <div>
                      <div className="dv-sidebar-attachment-name" title={att.name}>{att.name}</div>
                      <div className="dv-sidebar-attachment-size">
                        {(att.size / 1024).toFixed(1)} KB
                      </div>
                    </div>
                  </div>
                </div>
              ))
            ) : (
              <div style={{ padding: '8px', fontSize: '13px', opacity: 0.6 }}>No attachments</div>
            )}
          </div>
        )}
      </div>

      <div
        ref={resizerRef}
        className="dv-sidebar-resizer"
        data-dragging={isDragging || undefined}
        onMouseDown={handleMouseDown}
      />
    </div>
  );
}

interface OutlineTreeProps {
  nodes: readonly OutlineNode[];
  onSelectNode: (dest: OutlineNode['dest']) => void;
}

function OutlineTree({ nodes, onSelectNode }: OutlineTreeProps) {
  return (
    <ul className="dv-sidebar-outline">
      {nodes.map((node, i) => (
        <OutlineTreeItem key={i} node={node} onSelectNode={onSelectNode} />
      ))}
    </ul>
  );
}

function OutlineTreeItem({ node, onSelectNode }: { node: OutlineNode; onSelectNode: OutlineTreeProps['onSelectNode'] }) {
  const [isOpen, setIsOpen] = useState(false);
  const hasChildren = node.children && node.children.length > 0;

  return (
    <li className="dv-sidebar-outline-item">
      <div style={{ display: 'flex', alignItems: 'center' }}>
        {hasChildren ? (
          <button
            className="dv-sidebar-outline-toggle"
            data-open={isOpen}
            onClick={() => setIsOpen(!isOpen)}
          >
            <svg viewBox="0 0 16 16" width="12" height="12" fill="currentColor">
              <path d="M6 4l4 4-4 4V4z" />
            </svg>
          </button>
        ) : (
          <div style={{ width: '16px' }} />
        )}
        <a
          href="#"
          className="dv-sidebar-outline-node"
          onClick={(e) => {
            e.preventDefault();
            onSelectNode(node.dest);
          }}
        >
          {node.title}
        </a>
      </div>
      {hasChildren && isOpen && (
        <div className="dv-sidebar-outline-children">
          <OutlineTree nodes={node.children!} onSelectNode={onSelectNode} />
        </div>
      )}
    </li>
  );
}
