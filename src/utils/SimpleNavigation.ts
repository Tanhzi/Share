// Simple global navigation for web
type ScreenName = string;
type Params = Record<string, any>;

let onNavigateRef: ((screen: ScreenName, params?: Params) => void) | null = null;
let pendingNavigation: ScreenName | null = null;
let pendingParams: Params | null = null;
let currentParams: Params = {};

// Create a single mutable navigation object
const navigationObject: any = {
  navigate: (screen: any, params?: any) => {
    const target = typeof screen === 'string' ? screen : screen?.name || 'MainApp';
    const resolvedParams = params || (typeof screen === 'object' ? screen?.params : undefined);
    console.log('[Navigation] navigate:', target, resolvedParams);
    if (onNavigateRef) {
      console.log('[Navigation] Executing:', target);
      currentParams = resolvedParams || {};
      onNavigateRef(target, currentParams);
    } else {
      pendingNavigation = target;
      pendingParams = resolvedParams || null;
      console.log('[Navigation] queued:', target);
    }
  },
  goBack: () => {
    console.log('[Navigation] goBack');
    if (onNavigateRef) {
      onNavigateRef('MainApp');
    }
  },
  replace: (screen: any) => {
    const target = typeof screen === 'string' ? screen : screen?.name || 'MainApp';
    const resolvedParams = typeof screen === 'object' ? screen?.params : undefined;
    if (onNavigateRef) {
      currentParams = resolvedParams || {};
      onNavigateRef(target, currentParams);
    }
  },
  push: (screen: any) => {
    const target = typeof screen === 'string' ? screen : screen?.name || 'MainApp';
    const resolvedParams = typeof screen === 'object' ? screen?.params : undefined;
    if (onNavigateRef) {
      currentParams = resolvedParams || {};
      onNavigateRef(target, currentParams);
    }
  },
  pop: () => {
    if (onNavigateRef) {
      onNavigateRef('MainApp');
    }
  },
  setParams: (params: Params) => {
    currentParams = { ...currentParams, ...params };
  },
  addListener: () => () => {},
  isFocused: () => true,
  getParent: () => undefined,
  getState: () => undefined,
  reset: () => {},
  dispatch: () => {},
  canGoBack: () => true,
};

// Expose params for screens to read
export const getParams = () => currentParams;

export const setNavigation = (callback: (screen: ScreenName, params?: Params) => void) => {
  onNavigateRef = callback;
  console.log('[Navigation] setNavigation called');

  // Flush any pending navigation
  if (pendingNavigation) {
    console.log('[Navigation] Flushing queued:', pendingNavigation);
    const queued = pendingNavigation;
    const params = pendingParams;
    pendingNavigation = null;
    pendingParams = null;
    currentParams = params || {};
    onNavigateRef(queued, currentParams);
  }
};

export const navigate = (screen: ScreenName, params?: Params) => {
  navigationObject.navigate(screen, params);
};

export const goBack = () => {
  navigationObject.goBack();
};

// Export the single navigation object
export const navigationRef = navigationObject;
export const navigationMock = navigationObject;
export const createNavigationMock = () => navigationObject;

export default {
  navigate,
  goBack,
  setNavigation,
  navigationRef,
  navigationMock,
  createNavigationMock,
};
