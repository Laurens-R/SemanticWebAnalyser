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
