/**
 * Client-side navigate — updates the URL without a page reload so the
 * PlayerProvider (and its audio stream) survives across page changes.
 */
export function navigate(to: string): void {
  window.history.pushState(null, "", to);
  window.dispatchEvent(new CustomEvent("spa-navigate"));
  window.scrollTo(0, 0);
}
