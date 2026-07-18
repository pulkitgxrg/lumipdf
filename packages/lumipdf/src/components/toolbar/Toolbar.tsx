import { useState, useCallback, useRef, useEffect } from 'react';
import { useViewerStore } from '../../hooks/useDocumentViewer';
import type { AdapterFeatures, AnnotationTool, SpreadMode } from '../../core/types';
import { useStrings, formatString } from '../../constants/strings';
import { AnnotationStyleModal } from './AnnotationStyleModal';

interface ToolbarProps {
  features?: AdapterFeatures | undefined;
}

const ANNOTATION_TOOLS: ReadonlyArray<{
  tool: AnnotationTool;
  label: string;
  path: string;
}> = [
  {
    tool: 'highlight',
    label: 'Highlight',
    path: 'M3 11l6-6 4 4-6 6H3v-4zm0 6h14v-1H3v1z',
  },
  {
    tool: 'ink',
    label: 'Draw',
    path: 'M2 14l1-3 7-7 2 2-7 7-3 1zm9-10l1.5-1.5 2 2L13 6l-2-2z',
  },
  {
    tool: 'rectangle',
    label: 'Rectangle',
    path: 'M2 3h12v10H2V3zm1.5 1.5v7h9v-7h-9z',
  },
  {
    tool: 'ellipse',
    label: 'Ellipse',
    path: 'M8 3c3.6 0 6.5 2.2 6.5 5S11.6 13 8 13 1.5 10.8 1.5 8 4.4 3 8 3zm0 1.5C5.2 4.5 3 6.1 3 8s2.2 3.5 5 3.5 5-1.6 5-3.5-2.2-3.5-5-3.5z',
  },
  {
    tool: 'line',
    label: 'Line',
    path: 'M2.8 12.6l-1-1L12.2 1.2l1 1L2.8 12.6z',
  },
  {
    tool: 'arrow',
    label: 'Arrow',
    path: 'M2.8 12.6l-1-1L10 3.4H6V2h6.5v6.5H11v-4l-8.2 8.1z',
  },
  {
    tool: 'free-text',
    label: 'Text',
    path: 'M2 2h12v3h-1.5V3.5H8.75v9H10V14H6v-1.5h1.25v-9H3.5V5H2V2z',
  },
];

export function Toolbar({ features }: ToolbarProps) {
  const strings = useStrings();
  const sidebarOpen = useViewerStore((s) => s.sidebarOpen);
  const toggleSidebar = useViewerStore((s) => s.toggleSidebar);
  const zoom = useViewerStore((s) => s.zoom);
  const setZoom = useViewerStore((s) => s.setZoom);
  const fitMode = useViewerStore((s) => s.fitMode);
  const setFitMode = useViewerStore((s) => s.setFitMode);
  const spreadMode = useViewerStore((s) => s.spreadMode);
  const setSpreadMode = useViewerStore((s) => s.setSpreadMode);
  const cursorMode = useViewerStore((s) => s.cursorMode);
  const setCursorMode = useViewerStore((s) => s.setCursorMode);
  const rotateClockwise = useViewerStore((s) => s.rotateClockwise);
  const rotateCounterClockwise = useViewerStore((s) => s.rotateCounterClockwise);
  const pageCount = useViewerStore((s) => s.document?.pageCount ?? 0);
  const search = useViewerStore((s) => s.search);
  const clearSearch = useViewerStore((s) => s.clearSearch);
  const nextMatch = useViewerStore((s) => s.nextMatch);
  const prevMatch = useViewerStore((s) => s.prevMatch);
  const searchState = useViewerStore((s) => s.searchState);
  const searchResult = useViewerStore((s) => s.searchResult);
  const currentMatchIndex = useViewerStore((s) => s.currentMatchIndex);
  const activeTool = useViewerStore((s) => s.activeAnnotationTool);
  const setActiveTool = useViewerStore((s) => s.setActiveTool);
  const annotations = useViewerStore((s) => s.annotations);
  const clearAnnotations = useViewerStore((s) => s.clearAnnotations);
  const downloadDocument = useViewerStore((s) => s.downloadDocument);
  const printDocument = useViewerStore((s) => s.printDocument);
  const toggleFullscreen = useViewerStore((s) => s.toggleFullscreen);
  const isFullscreen = useViewerStore((s) => s.isFullscreen);
  const setPropertiesOpen = useViewerStore((s) => s.setPropertiesOpen);
  const hasDocument = useViewerStore((s) => s.document !== null);
  const searchOpen = useViewerStore((s) => s.searchOpen);
  const setSearchOpen = useViewerStore((s) => s.setSearchOpen);

  const [searchText, setSearchText] = useState('');
  const [moreOpen, setMoreOpen] = useState(false);
  const searchInputRef = useRef<HTMLInputElement>(null);
  const moreMenuRef = useRef<HTMLDivElement>(null);
  const searchTimer = useRef<ReturnType<typeof setTimeout> | undefined>(undefined);

  useEffect(() => {
    if (searchOpen) {
      searchInputRef.current?.focus();
    } else {
      if (searchTimer.current) clearTimeout(searchTimer.current);
      setSearchText('');
      clearSearch();
    }
  }, [searchOpen, clearSearch]);

  useEffect(() => () => {
    if (searchTimer.current) clearTimeout(searchTimer.current);
  }, []);

  useEffect(() => {
    if (!moreOpen) return;
    const close = (event: MouseEvent) => {
      if (!moreMenuRef.current?.contains(event.target as Node)) setMoreOpen(false);
    };
    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') setMoreOpen(false);
    };
    window.addEventListener('mousedown', close);
    window.addEventListener('keydown', onKeyDown);
    return () => {
      window.removeEventListener('mousedown', close);
      window.removeEventListener('keydown', onKeyDown);
    };
  }, [moreOpen]);

  const handleSearch = useCallback(
    (text: string) => {
      setSearchText(text);
      if (searchTimer.current) clearTimeout(searchTimer.current);
      if (text.trim()) {
        searchTimer.current = setTimeout(() => {
          search({
            text,
            caseSensitive: false,
            wholeWord: false,
            regex: false,
            diacritics: false,
          });
        }, 180);
      } else {
        clearSearch();
      }
    },
    [search, clearSearch],
  );

  const handleCloseSearch = useCallback(() => {
    setSearchOpen(false);
  }, [setSearchOpen]);

  const ZOOM_PRESETS = [0.5, 0.75, 1, 1.25, 1.5, 2, 3, 5];
  const zoomPct = Math.round(zoom * 100);
  const matchedPreset = ZOOM_PRESETS.find((p) => Math.abs(p - zoom) < 0.005);
  const zoomValue =
    fitMode === 'page-fit'
      ? 'fit-page'
      : fitMode === 'page-width'
        ? 'fit-width'
        : fitMode === 'actual-size'
          ? 'actual'
          : matchedPreset !== undefined
            ? String(matchedPreset)
            : 'live';

  const handleZoomSelect = useCallback(
    (value: string) => {
      if (value === 'fit-page') setFitMode('page-fit');
      else if (value === 'fit-width') setFitMode('page-width');
      else if (value === 'actual') setFitMode('actual-size');
      else if (value === 'live') {
        /* display-only */
      } else setZoom(parseFloat(value));
    },
    [setFitMode, setZoom],
  );

  const matchCount = searchResult?.matches.length ?? 0;

  return (
    <>
      <div className="dv-toolbar" role="toolbar" aria-label="Document viewer toolbar">
        <div className="dv-toolbar-group">
          <button
            className="dv-tool-btn"
            onClick={toggleSidebar}
            aria-expanded={sidebarOpen}
            aria-label={strings.toolbar.sidebarToggle}
            title={strings.toolbar.sidebarToggle}
            data-toggled={sidebarOpen}
          >
            <svg viewBox="0 0 16 16" fill="currentColor">
              <path d="M2 2h4v12H2V2zm5 0h7v12H7V2z" />
            </svg>
          </button>
        </div>

        <div className="dv-toolbar-spacer" />

        <div className="dv-toolbar-center">
          <div className="dv-tool-cluster">
            <button
              type="button"
              className="dv-tool-btn"
              data-toggled={cursorMode === 'hand'}
              aria-pressed={cursorMode === 'hand'}
              title="Hand tool"
              aria-label="Hand tool"
              onClick={() => {
                setCursorMode(cursorMode === 'hand' ? 'select' : 'hand');
                setActiveTool(null);
              }}
            >
              <svg viewBox="0 0 16 16" fill="currentColor">
                <path d="M6.5 1.5a1 1 0 0 1 1 1V7h.5V3a1 1 0 1 1 2 0v4h.5V3.75a1 1 0 1 1 2 0V9h.25a2.25 2.25 0 0 1 2.25 2.25v.5A3.25 3.25 0 0 1 11.75 15H7.1A3.1 3.1 0 0 1 4 11.9V6.5a1 1 0 0 1 2 0V7h.5V2.5a1 1 0 0 1 1-1z" />
              </svg>
            </button>
            <button
              type="button"
              className="dv-tool-btn"
              data-toggled={cursorMode === 'select' && !activeTool}
              aria-pressed={cursorMode === 'select' && !activeTool}
              title="Select"
              aria-label="Select"
              onClick={() => {
                setCursorMode('select');
                setActiveTool(null);
              }}
            >
              <svg viewBox="0 0 16 16" fill="currentColor">
                <path d="M3.5 2.2l8.8 5.3-3.6.7 1.7 4.1-1.6.7-1.7-4.1-2.4 2.6V2.2z" />
              </svg>
            </button>
          </div>

          {features?.annotations && (
            <div className="dv-tool-cluster" role="radiogroup" aria-label="Annotation tools">
              {ANNOTATION_TOOLS.map(({ tool, label, path }) => {
                const isActive = activeTool === tool;
                return (
                  <button
                    key={tool}
                    type="button"
                    className="dv-tool-btn"
                    role="radio"
                    aria-checked={isActive}
                    data-toggled={isActive}
                    aria-label={label}
                    title={label}
                    onClick={() => {
                      setCursorMode('select');
                      setActiveTool(isActive ? null : tool);
                    }}
                  >
                    <svg viewBox="0 0 16 16" fill="currentColor">
                      <path d={path} />
                    </svg>
                  </button>
                );
              })}
            </div>
          )}

          {features?.rotation && (
            <div className="dv-tool-cluster">
              <button
                type="button"
                className="dv-tool-btn"
                onClick={rotateCounterClockwise}
                aria-label={strings.toolbar.rotateCounterClockwise}
                title={strings.toolbar.rotateCounterClockwise}
              >
                <svg viewBox="0 0 16 16" fill="currentColor">
                  <path d="M8 3a5 5 0 1 1-5 5H1a7 7 0 1 0 7-7V0L4 2l4 2V3z" />
                </svg>
              </button>
              <button
                type="button"
                className="dv-tool-btn"
                onClick={rotateClockwise}
                aria-label={strings.toolbar.rotateClockwise}
                title={strings.toolbar.rotateClockwise}
              >
                <svg viewBox="0 0 16 16" fill="currentColor">
                  <path d="M8 3a5 5 0 1 0 5 5h2A7 7 0 1 1 8 1V0l4 2-4 2V3z" />
                </svg>
              </button>
            </div>
          )}
        </div>

        <div className="dv-toolbar-spacer" />

        <div className="dv-toolbar-group dv-toolbar-end">
          {features?.zoom !== false && (
            <select
              className="dv-zoom-select"
              value={zoomValue}
              onChange={(e) => handleZoomSelect(e.target.value)}
              aria-label="Zoom level"
            >
              {zoomValue === 'live' && <option value="live">{zoomPct}%</option>}
              <optgroup label="Fit">
                <option value="fit-page">Fit page</option>
                <option value="fit-width">Fit width</option>
                <option value="actual">Actual size</option>
              </optgroup>
              <option value="0.5">50%</option>
              <option value="0.75">75%</option>
              <option value="1">100%</option>
              <option value="1.25">125%</option>
              <option value="1.5">150%</option>
              <option value="2">200%</option>
              <option value="3">300%</option>
              <option value="5">500%</option>
            </select>
          )}

          {features?.search && (
            <button
              className="dv-tool-btn"
              onClick={() => setSearchOpen(!searchOpen)}
              aria-expanded={searchOpen}
              aria-label={strings.toolbar.searchToggle}
              title={strings.toolbar.searchToggle}
              data-toggled={searchOpen}
            >
              <svg viewBox="0 0 16 16" fill="currentColor">
                <path d="M6 1a5 5 0 1 0 3.09 8.95l4.48 4.49 1.42-1.42-4.49-4.48A5 5 0 0 0 6 1zm0 2a3 3 0 1 1 0 6 3 3 0 0 1 0-6z" />
              </svg>
            </button>
          )}

          {features?.download && (
            <button
              className="dv-tool-btn"
              onClick={() => downloadDocument()}
              aria-label={strings.toolbar.download}
              title={`${strings.toolbar.download} (original PDF, no annotations)`}
            >
              <svg viewBox="0 0 16 16" fill="currentColor">
                <path d="M7 1h2v6h3l-4 4-4-4h3V1zM3 13h10v2H3v-2z" />
              </svg>
            </button>
          )}

          <div className="dv-toolbar-overflow" ref={moreMenuRef}>
            <button
              className="dv-tool-btn dv-toolbar-more-button"
              onClick={() => setMoreOpen((open) => !open)}
              aria-expanded={moreOpen}
              aria-haspopup="menu"
              aria-label="More tools"
              title="More tools"
            >
              <svg viewBox="0 0 16 16" fill="currentColor">
                <path d="M3 6.5a1.5 1.5 0 1 0 0 3 1.5 1.5 0 0 0 0-3zm5 0a1.5 1.5 0 1 0 0 3 1.5 1.5 0 0 0 0-3zm5 0a1.5 1.5 0 1 0 0 3 1.5 1.5 0 0 0 0-3z" />
              </svg>
            </button>
            {moreOpen && (
              <div className="dv-toolbar-more-menu" role="menu" aria-label="More tools">
                {features?.zoom !== false && (
                  <button
                    className="dv-toolbar-menu-item"
                    role="menuitem"
                    onClick={() => {
                      setCursorMode(cursorMode === 'marquee' ? 'select' : 'marquee');
                      setMoreOpen(false);
                    }}
                    aria-pressed={cursorMode === 'marquee'}
                  >
                    Marquee zoom
                  </button>
                )}
                {pageCount > 1 && (
                  <label className="dv-toolbar-menu-field">
                    Page layout
                    <select
                      value={spreadMode}
                      onChange={(e) => setSpreadMode(e.target.value as SpreadMode)}
                      aria-label="Page layout"
                    >
                      <option value="none">Single page</option>
                      <option value="even">Two pages</option>
                      <option value="odd">Two pages (cover)</option>
                    </select>
                  </label>
                )}
                {(features?.print || features?.fullscreen || hasDocument) && (
                  <div className="dv-toolbar-menu-row">
                    {features?.print && (
                      <button
                        className="dv-toolbar-menu-item"
                        role="menuitem"
                        onClick={() => {
                          printDocument();
                          setMoreOpen(false);
                        }}
                      >
                        Print
                      </button>
                    )}
                    {features?.fullscreen && (
                      <button
                        className="dv-toolbar-menu-item"
                        role="menuitem"
                        onClick={() => {
                          toggleFullscreen();
                          setMoreOpen(false);
                        }}
                      >
                        {isFullscreen ? 'Exit fullscreen' : 'Fullscreen'}
                      </button>
                    )}
                    {hasDocument && (
                      <button
                        className="dv-toolbar-menu-item"
                        role="menuitem"
                        onClick={() => {
                          setPropertiesOpen(true);
                          setMoreOpen(false);
                        }}
                      >
                        Properties
                      </button>
                    )}
                  </div>
                )}
                {features?.annotations && annotations.length > 0 && (
                  <div className="dv-toolbar-menu-section">
                    <span className="dv-toolbar-menu-heading">Annotations</span>
                    <button
                      className="dv-toolbar-menu-item"
                      type="button"
                      onClick={() => {
                        clearAnnotations();
                        setMoreOpen(false);
                      }}
                    >
                      Clear all annotations
                    </button>
                  </div>
                )}
              </div>
            )}
          </div>
        </div>
      </div>

      {features?.annotations && <AnnotationStyleModal />}

      {searchOpen && features?.search && (
        <div className="dv-search-bar" role="search">
          <input
            ref={searchInputRef}
            type="text"
            className="dv-search-input"
            placeholder={strings.search.placeholder}
            value={searchText}
            onChange={(e) => handleSearch(e.target.value)}
            aria-label={strings.search.placeholder}
          />
          <span className="dv-search-count" aria-live="polite">
            {searchState === 'searching'
              ? '…'
              : matchCount > 0
                ? formatString(
                    strings.search.resultsCount,
                    currentMatchIndex + 1,
                    matchCount,
                  )
                : searchText
                  ? strings.search.noResults
                  : ''}
          </span>
          <button
            className="dv-button"
            onClick={prevMatch}
            disabled={matchCount === 0}
            aria-label={strings.search.prevMatch}
            title={strings.search.prevMatch}
          >
            <svg viewBox="0 0 16 16" fill="currentColor">
              <path d="M10 4L6 8l4 4V4z" />
            </svg>
          </button>
          <button
            className="dv-button"
            onClick={nextMatch}
            disabled={matchCount === 0}
            aria-label={strings.search.nextMatch}
            title={strings.search.nextMatch}
          >
            <svg viewBox="0 0 16 16" fill="currentColor">
              <path d="M6 4l4 4-4 4V4z" />
            </svg>
          </button>
          <button
            className="dv-button"
            onClick={handleCloseSearch}
            aria-label={strings.search.close}
            title={strings.search.close}
          >
            <svg viewBox="0 0 16 16" fill="currentColor">
              <path d="M4 4l8 8M12 4l-8 8" stroke="currentColor" strokeWidth="1.5" fill="none" />
            </svg>
          </button>
        </div>
      )}
    </>
  );
}
