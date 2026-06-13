/**
 * WJRN AzuraCast Admin Contextual Notes
 * Paste the entire contents of this file into:
 *   AzuraCast Admin → System Administration → Branding → Custom Javascript
 *
 * Shows dismissible workflow reminder banners on relevant admin pages.
 * Styled to match the WJRN brand (#b5945b gold on dark).
 */
(function () {
  const BANNER_ID = "wjrn-admin-note";

  const NOTES = [
    {
      // Podcast episode list or episode edit
      match: /\/podcast/i,
      title: "PODCAST EPISODE REMINDER",
      message:
        "AzuraCast auto-generates podcast episodes from playlist uploads, but STRIPS all metadata in the process. " +
        "For every new episode shown here, manually fill in: artwork, title, description, and broadcast date. " +
        "The original uploaded file retains its metadata — only the auto-generated podcast episode loses it.",
    },
    {
      // File manager / media upload
      match: /\/files/i,
      title: "UPLOAD WORKFLOW",
      message:
        "After uploading a track here and assigning it to the Tributes playlist, AzuraCast will auto-create a podcast episode — " +
        "but it will be blank (all metadata stripped). " +
        "After uploading, go to Podcasts → Episodes and manually add the artwork, title, description, and broadcast date to the new episode.",
    },
    {
      // Playlist management
      match: /\/playlists/i,
      title: "PLAYLIST → PODCAST REMINDER",
      message:
        "Tracks added to the Tributes playlist will trigger auto-generation of a podcast episode with NO metadata. " +
        "After making changes here, visit Podcasts → Episodes to complete the episode entry (artwork, title, description, broadcast date).",
    },
  ];

  const STYLE = `
    #${BANNER_ID} {
      position: fixed;
      top: 0; left: 0; right: 0;
      z-index: 99999;
      background: #1a0e00;
      border-bottom: 2px solid #b5945b;
      color: #e8c98a;
      font-family: 'JetBrains Mono', 'Courier New', monospace;
      font-size: 12px;
      line-height: 1.5;
      padding: 10px 16px;
      display: flex;
      align-items: flex-start;
      gap: 12px;
      box-shadow: 0 2px 12px rgba(0,0,0,0.6);
    }
    #${BANNER_ID} .wjrn-note-label {
      background: #b5945b;
      color: #000;
      font-weight: 900;
      font-size: 10px;
      letter-spacing: 0.15em;
      text-transform: uppercase;
      padding: 2px 7px;
      border-radius: 3px;
      white-space: nowrap;
      margin-top: 1px;
      flex-shrink: 0;
    }
    #${BANNER_ID} .wjrn-note-text {
      flex: 1;
      opacity: 0.9;
    }
    #${BANNER_ID} .wjrn-note-close {
      background: none;
      border: none;
      color: #b5945b;
      font-size: 20px;
      line-height: 1;
      cursor: pointer;
      padding: 0;
      opacity: 0.7;
      flex-shrink: 0;
    }
    #${BANNER_ID} .wjrn-note-close:hover { opacity: 1; }
  `;

  function getNote() {
    const path = window.location.hash + window.location.pathname;
    for (const note of NOTES) {
      if (note.match.test(path)) return note;
    }
    return null;
  }

  function injectBanner() {
    const existing = document.getElementById(BANNER_ID);
    if (existing) existing.remove();

    const note = getNote();
    if (!note) return;

    // Inject styles once
    if (!document.getElementById("wjrn-note-styles")) {
      const styleEl = document.createElement("style");
      styleEl.id = "wjrn-note-styles";
      styleEl.textContent = STYLE;
      document.head.appendChild(styleEl);
    }

    const banner = document.createElement("div");
    banner.id = BANNER_ID;

    const label = document.createElement("span");
    label.className = "wjrn-note-label";
    label.textContent = "WJRN — " + note.title;

    const text = document.createElement("span");
    text.className = "wjrn-note-text";
    text.textContent = note.message;

    const close = document.createElement("button");
    close.className = "wjrn-note-close";
    close.textContent = "×";
    close.title = "Dismiss";
    close.onclick = () => banner.remove();

    banner.appendChild(label);
    banner.appendChild(text);
    banner.appendChild(close);
    document.body.prepend(banner);
  }

  // Hook into SPA navigation (AzuraCast uses Vue Router with history mode)
  const _push = history.pushState.bind(history);
  history.pushState = function (...args) {
    _push(...args);
    setTimeout(injectBanner, 400);
  };
  const _replace = history.replaceState.bind(history);
  history.replaceState = function (...args) {
    _replace(...args);
    setTimeout(injectBanner, 400);
  };
  window.addEventListener("popstate", () => setTimeout(injectBanner, 400));

  // Initial check once the page is ready
  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", () => setTimeout(injectBanner, 600));
  } else {
    setTimeout(injectBanner, 600);
  }
})();
