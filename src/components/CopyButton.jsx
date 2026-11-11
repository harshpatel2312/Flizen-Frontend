// src/components/CopyButton.jsx
// Small round copy-to-clipboard button.
// - Pass `value` to let it copy and show the check mark itself, or
// - pass `onClick` + `copied` to control it from the parent.

import { useEffect, useRef, useState } from 'react';

export default function CopyButton({ value, label = 'value', copied: copiedProp, onClick }) {
  const [copiedSelf, setCopiedSelf] = useState(false);
  const timer = useRef(null);
  const controlled = typeof onClick === 'function';
  const copied = controlled ? copiedProp : copiedSelf;

  useEffect(() => () => clearTimeout(timer.current), []);

  const handleClick = async (e) => {
    e.stopPropagation();
    if (controlled) {
      onClick(e);
      return;
    }
    if (!value) return;
    try {
      await navigator.clipboard.writeText(value);
      setCopiedSelf(true);
      clearTimeout(timer.current);
      timer.current = setTimeout(() => setCopiedSelf(false), 1500);
    } catch {
      // Clipboard API unavailable or denied — fail silently.
    }
  };

  return (
    <button
      type="button"
      onClick={handleClick}
      aria-label={copied ? 'Copied' : `Copy ${label}`}
      title={copied ? 'Copied' : `Copy ${label}`}
      className="flex-shrink-0 w-7 h-7 flex items-center justify-center rounded-full border border-[#2C2C2C] text-outline hover:text-primary hover:border-[#4A4A4A] transition-colors"
    >
      <span className="material-symbols-outlined text-[14px] leading-none">
        {copied ? 'check' : 'content_copy'}
      </span>
    </button>
  );
}
