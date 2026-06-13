/**
 * WJRN AzuraCast Admin — Workflow Notes
 * Appends reminder text to existing AzuraCast info banners on relevant pages.
 * Injected via nginx sub_filter into every AzuraCast HTML response.
 */
(function () {
  const ATTR = "data-wjrn-noted";

  // Each entry finds an existing blue info banner by its text and appends a note.
  const ADDITIONS = [
    {
      // Podcasts > Episodes page — the "synchronized with a playlist" banner
      search: "automatically synchronized with a playlist",
      note:
        "⚠️ WJRN Note: When AzuraCast auto-generates an episode from a new playlist upload, it strips all metadata — artwork, title, description, and broadcast date are all lost. After any new upload, you must manually re-enter those fields for the new episode directly on this screen.",
    },
    {
      // Media / File Upload page — the "upload via SFTP" banner
      search: "upload files in bulk via SFTP",
      note:
        "⚠️ WJRN Note: If this track will feed the Tributes playlist, AzuraCast will auto-create a podcast episode — but it will have no metadata. After uploading here, go to Podcasts → Episodes and manually add artwork, title, description, and broadcast date to the new episode.",
    },
  ];

  let debounce;

  function applyNotes() {
    for (const { search, note } of ADDITIONS) {
      const walker = document.createTreeWalker(
        document.body,
        NodeFilter.SHOW_TEXT,
        null
      );
      let textNode;
      while ((textNode = walker.nextNode())) {
        if (!textNode.textContent.includes(search)) continue;

        // Walk up to the nearest alert/card container
        let container = textNode.parentElement;
        while (container && container !== document.body) {
          const cls = (container.className || "").toLowerCase();
          if (cls.includes("alert") || cls.includes("card-body")) break;
          container = container.parentElement;
        }
        if (!container || container === document.body) continue;
        if (container.hasAttribute(ATTR)) break;

        container.setAttribute(ATTR, "1");
        const p = document.createElement("p");
        p.style.cssText = "margin: 8px 0 0; font-weight: 600;";
        p.textContent = note;
        container.appendChild(p);
        break;
      }
    }
  }

  // Watch for Vue re-renders after navigation
  const observer = new MutationObserver(() => {
    clearTimeout(debounce);
    debounce = setTimeout(applyNotes, 250);
  });

  function start() {
    observer.observe(document.body, { childList: true, subtree: true });
    applyNotes();
  }

  const _push = history.pushState.bind(history);
  history.pushState = function (...args) { _push(...args); setTimeout(applyNotes, 600); };
  const _replace = history.replaceState.bind(history);
  history.replaceState = function (...args) { _replace(...args); setTimeout(applyNotes, 600); };

  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", start);
  } else {
    start();
  }
})();
