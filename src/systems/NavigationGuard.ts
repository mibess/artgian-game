const guardKey = "artgianActiveGame";

/** Keep accidental Back navigation inside the current game document. */
export class NavigationGuard {
  private abort = new AbortController();

  constructor(onBack: () => void) {
    const { signal } = this.abort;
    const protect = () => {
      // Reuse the entry across retries and level changes instead of growing history.
      if (!window.history.state?.[guardKey]) {
        window.history.pushState({ ...window.history.state, [guardKey]: true }, "", window.location.href);
      }
    };
    protect();
    window.addEventListener("popstate", () => {
      protect();
      onBack();
    }, { signal });
    // Safari can start edge navigation even when overscroll-behavior is disabled.
    document.addEventListener("touchstart", event => {
      const edge = 24;
      const nearEdge = [...event.touches].some(touch =>
        touch.clientX <= edge || touch.clientX >= window.innerWidth - edge);
      if (nearEdge && event.cancelable) event.preventDefault();
    }, { passive: false, signal });
  }

  destroy() {
    // The menu and result screens retain normal browser navigation.
    this.abort.abort();
  }
}
