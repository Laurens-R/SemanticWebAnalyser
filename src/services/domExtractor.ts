/**
 * DOM extraction utilities for webview content.
 * We inject a script into the webview to extract a compact, semantic DOM.
 */

const EXTRACTION_SCRIPT = `
(function() {
  function compactNode(node, depth) {
    if (depth > 12) return '';
    if (!node || node.nodeType !== 1) return '';
    
    const tag = node.tagName.toLowerCase();
    
    // Skip non-semantic / invisible elements
    const skipTags = new Set(['script', 'style', 'noscript', 'svg', 'path', 'defs', 'symbol', 'use', 'meta', 'link', 'head']);
    if (skipTags.has(tag)) return '';
    
    const attrs = [];
    if (node.id) attrs.push('id="' + node.id + '"');
    if (node.className && typeof node.className === 'string') {
      const cls = node.className.trim().split(/\\s+/).slice(0, 5).join(' ');
      if (cls) attrs.push('class="' + cls + '"');
    }
    if (node.getAttribute('role')) attrs.push('role="' + node.getAttribute('role') + '"');
    if (node.getAttribute('aria-label')) attrs.push('aria-label="' + node.getAttribute('aria-label') + '"');
    if (node.getAttribute('data-component')) attrs.push('data-component="' + node.getAttribute('data-component') + '"');
    if (tag === 'a' && node.getAttribute('href')) attrs.push('href="' + node.getAttribute('href') + '"');
    if (tag === 'img' && node.getAttribute('alt')) attrs.push('alt="' + node.getAttribute('alt') + '"');
    if (tag === 'input') {
      if (node.getAttribute('type')) attrs.push('type="' + node.getAttribute('type') + '"');
      if (node.getAttribute('placeholder')) attrs.push('placeholder="' + node.getAttribute('placeholder') + '"');
    }
    
    let textContent = '';
    if (['p', 'h1', 'h2', 'h3', 'h4', 'h5', 'h6', 'button', 'a', 'label', 'li', 'td', 'th', 'span', 'strong', 'em'].includes(tag)) {
      textContent = node.textContent.trim().slice(0, 120);
    }
    
    const attrStr = attrs.length ? ' ' + attrs.join(' ') : '';
    const children = Array.from(node.children).map(c => compactNode(c, depth + 1)).filter(Boolean).join('');
    
    if (!children && !textContent) {
      // Only keep empty leaf elements if they have meaningful attrs
      if (!node.id && !node.className) return '';
    }
    
    const inner = textContent ? textContent : children;
    return '<' + tag + attrStr + '>' + inner + '</' + tag + '>';
  }
  
  const title = document.title;
  const dom = compactNode(document.body, 0);
  return JSON.stringify({ title, dom });
})()
`

export interface ExtractedDom {
  title: string
  dom: string
}

export async function extractDomFromWebview(
  webviewEl: Electron.WebviewTag
): Promise<ExtractedDom> {
  const result = await webviewEl.executeJavaScript(EXTRACTION_SCRIPT)
  const parsed = JSON.parse(result as string) as ExtractedDom
  return parsed
}

// ---------------------------------------------------------------------------
// Highlight / clear injected into webviews
// ---------------------------------------------------------------------------

/**
 * Builds a self-contained script that:
 * 1. Removes any previous highlight overlay + spotlights
 * 2. Creates a dark full-page overlay
 * 3. For each matched element, draws a fixed glow box over it using getBoundingClientRect()
 * Clicking the overlay dismisses the highlight.
 */
export function buildHighlightScript(selectors: (string | null)[]): string {
  const valid = selectors.filter((s): s is string => Boolean(s))
  return `
(function() {
  // Clean up previous
  document.querySelectorAll('#__swa_overlay, .swa_spotlight').forEach(function(el) { el.remove(); });

  var sels = ${JSON.stringify(valid)};
  if (!sels.length) return;

  var elements = [];
  sels.forEach(function(sel) {
    try { elements.push.apply(elements, Array.from(document.querySelectorAll(sel))); } catch(e) {}
  });
  if (!elements.length) return;

  // Dark overlay
  var overlay = document.createElement('div');
  overlay.id = '__swa_overlay';
  overlay.style.cssText = [
    'position:fixed', 'inset:0', 'background:rgba(0,0,0,0.65)',
    'z-index:2147483645', 'pointer-events:auto', 'cursor:pointer',
    'transition:opacity 0.2s'
  ].join(';');
  document.body.appendChild(overlay);

  // Glow spotlights positioned over each matched element
  elements.forEach(function(el) {
    var r = el.getBoundingClientRect();
    if (r.width === 0 && r.height === 0) return;
    var box = document.createElement('div');
    box.className = 'swa_spotlight';
    box.style.cssText = [
      'position:fixed',
      'left:' + (r.left - 5) + 'px',
      'top:' + (r.top - 5) + 'px',
      'width:' + (r.width + 10) + 'px',
      'height:' + (r.height + 10) + 'px',
      'border:2px solid #6366f1',
      'border-radius:5px',
      'box-shadow:0 0 0 4px rgba(99,102,241,0.35),0 0 24px 8px rgba(99,102,241,0.55)',
      'background:rgba(99,102,241,0.07)',
      'z-index:2147483646',
      'pointer-events:none'
    ].join(';');
    document.body.appendChild(box);
  });

  overlay.addEventListener('click', function() {
    document.querySelectorAll('#__swa_overlay, .swa_spotlight').forEach(function(e) { e.remove(); });
  }, { once: true });
})()
`
}

export const CLEAR_HIGHLIGHT_SCRIPT =
  `document.querySelectorAll('#__swa_overlay, .swa_spotlight').forEach(function(el) { el.remove(); });`

export async function highlightInWebview(
  webviewEl: Electron.WebviewTag,
  selectors: (string | null)[]
): Promise<void> {
  await webviewEl.executeJavaScript(buildHighlightScript(selectors))
}

export async function clearHighlightInWebview(
  webviewEl: Electron.WebviewTag
): Promise<void> {
  await webviewEl.executeJavaScript(CLEAR_HIGHLIGHT_SCRIPT)
}
