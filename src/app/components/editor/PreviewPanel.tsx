"use client";

import { useMemo } from "react";

const SELECTION_SCRIPT = `
<script>
(function() {
  document.addEventListener('click', function(e) {
    e.preventDefault();
    e.stopPropagation();
    document.querySelectorAll('[data-aplz-selected]').forEach(function(el) {
      el.style.outline = '';
      el.removeAttribute('data-aplz-selected');
    });
    e.target.style.outline = '2px solid #1B4F72';
    e.target.setAttribute('data-aplz-selected', 'true');
    var s = window.getComputedStyle(e.target);
    window.parent.postMessage({
      type: 'element-selected',
      tagName: e.target.tagName.toLowerCase(),
      textContent: (e.target.textContent || '').slice(0, 50),
      styles: {
        color: s.color,
        backgroundColor: s.backgroundColor,
        fontSize: s.fontSize,
        fontWeight: s.fontWeight,
        padding: s.padding,
        margin: s.margin,
        borderRadius: s.borderRadius,
        border: s.border,
        width: s.width,
        height: s.height,
        textAlign: s.textAlign,
      }
    }, '*');
  }, true);
  window.addEventListener('message', function(e) {
    if (e.data && e.data.type === 'apply-style') {
      var el = document.querySelector('[data-aplz-selected]');
      if (el) el.style[e.data.property] = e.data.value;
    }
  });
})();
</script>`;

interface PreviewPanelProps {
  code: string;
  enableSelection?: boolean;
}

export default function PreviewPanel({
  code,
  enableSelection = true,
}: PreviewPanelProps) {
  const previewHtml = useMemo(() => {
    if (!enableSelection) return code;
    if (code.includes("</body>")) {
      return code.replace("</body>", SELECTION_SCRIPT + "</body>");
    }
    return code + SELECTION_SCRIPT;
  }, [code, enableSelection]);

  return (
    <iframe
      srcDoc={previewHtml}
      className="w-full h-full border-0 bg-white"
      sandbox="allow-scripts allow-same-origin allow-forms allow-popups"
      title="プレビュー"
    />
  );
}
