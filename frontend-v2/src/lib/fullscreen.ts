type FullscreenDocument = Document & {
  webkitFullscreenElement?: Element | null;
  mozFullScreenElement?: Element | null;
  msFullscreenElement?: Element | null;
};
type FullscreenRoot = HTMLElement & {
  webkitRequestFullscreen?: () => void | Promise<void>;
  msRequestFullscreen?: () => void | Promise<void>;
};
export const fullscreenEvents = ["fullscreenchange", "webkitfullscreenchange", "mozfullscreenchange", "MSFullscreenChange"] as const;
export function isDocumentFullscreen(): boolean {
  const doc = document as FullscreenDocument;
  return Boolean(doc.fullscreenElement || doc.webkitFullscreenElement || doc.mozFullScreenElement || doc.msFullscreenElement);
}
/** Call directly from a user gesture; never claim success from a resolved promise alone. */
export async function enterDocumentFullscreen(): Promise<void> {
  if (isDocumentFullscreen()) return;
  const root = document.documentElement as FullscreenRoot;
  const request = root.requestFullscreen || root.webkitRequestFullscreen || root.msRequestFullscreen;
  if (!request) throw new Error("Fullscreen is unavailable in this browser. Use a supported desktop browser to take this test.");
  await request.call(root);
  if (!isDocumentFullscreen()) throw new Error("Fullscreen is required. Allow fullscreen and try again.");
}
