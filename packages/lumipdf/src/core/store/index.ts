import { create } from 'zustand';
import {
  createJSONStorage,
  devtools,
  persist,
  subscribeWithSelector,
} from 'zustand/middleware';
import { createDocumentSlice, type DocumentSlice } from './document';
import { createNavigationSlice, type NavigationSlice } from './navigation';
import { createViewportSlice, type ViewportSlice } from './viewport';
import { createSearchSlice, type SearchSlice } from './search';
import {
  createAnnotationSlice,
  type AnnotationSlice,
} from './annotation';
import { createUiSlice, type UiSlice } from './ui';

export type { DocumentSlice, LoadState } from './document';
export type { NavigationSlice } from './navigation';
export type { ViewportSlice } from './viewport';
export type { SearchSlice, SearchState } from './search';
export type { AnnotationSlice } from './annotation';
export type { UiSlice, ToolbarDensity } from './ui';

export type ViewerStore = DocumentSlice &
  NavigationSlice &
  ViewportSlice &
  SearchSlice &
  AnnotationSlice &
  UiSlice;

const noopStorage = {
  getItem: () => null,
  setItem: () => {},
  removeItem: () => {},
};
const safeStorage = createJSONStorage(() =>
  typeof window !== 'undefined' ? window.localStorage : noopStorage,
);

export interface CreateViewerStoreOptions {
  persistKey?: string | undefined;
}

export const createViewerStore = (options?: CreateViewerStoreOptions) => {
  const persistKey = options?.persistKey ?? 'doc-viewer-prefs';
  return create<ViewerStore>()(
    subscribeWithSelector(
      devtools(
        persist(
          (...a) => ({
            ...createDocumentSlice(...a),
            ...createNavigationSlice(...a),
            ...createViewportSlice(...a),
            ...createSearchSlice(...a),
            ...createAnnotationSlice(...a),
            ...createUiSlice(...a),
          }),
          {
            name: persistKey,
            storage: safeStorage,
            partialize: (state) => ({
              zoom: state.zoom,
              fitMode: state.fitMode,
              theme: state.theme,
              sidebarOpen: state.sidebarOpen,
              sidebarView: state.sidebarView,
              sidebarWidth: state.sidebarWidth,
              toolbarDensity: state.toolbarDensity,
              locale: state.locale,
              recentFiles: state.recentFiles,
            }),
          },
        ),
        { name: persistKey },
      ),
    ),
  );
};