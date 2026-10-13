// Simple global navigation for web

type ScreenName = string;

let onNavigate: ((screen: ScreenName) => void) | null = null;
let pendingNavigation: ScreenName | null = null;

export const setNavigation = (callback: (screen: ScreenName) => void) => {
  onNavigate = callback;
  if (pendingNavigation) {
    callback(pendingNavigation);
    pendingNavigation = null;
  }
};

export const navigate = (screen: ScreenName) => {
  console.log('[Navigation] navigate:', screen);
  if (onNavigate) {
    onNavigate(screen);
  } else {
    pendingNavigation = screen;
    console.log('[Navigation] queued:', screen);
  }
};

export const goBack = () => {
  console.log('[Navigation] goBack');
  if (onNavigate) {
    onNavigate('MainApp');
  }
};

export const navigationMock = {
  navigate: (screen: any, _params?: any) => {
    const target = typeof screen === 'string' ? screen : screen?.name || 'MainApp';
    console.log('[Mock Navigation] navigate:', target);
    navigate(target);
  },
  goBack: () => {
    console.log('[Mock Navigation] goBack');
    goBack();
  },
  replace: (screen: any) => {
    const target = typeof screen === 'string' ? screen : screen?.name || 'MainApp';
    navigate(target);
  },
  pop: () => goBack(),
  push: (screen: any) => {
    const target = typeof screen === 'string' ? screen : screen?.name || 'MainApp';
    navigate(target);
  },
  setParams: () => {},
  addListener: () => () => {},
  isFocused: () => true,
  getParent: () => undefined,
  getState: () => undefined,
  reset: () => {},
  dispatch: () => {},
  canGoBack: () => true,
};

export default {
  navigate,
  goBack,
  setNavigation,
  navigationMock,
};