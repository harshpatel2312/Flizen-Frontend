// src/components/SideDrawer.jsx
// Right-side slide-out drawer shared by the Find Your Flights filters and the
// My Trips trip details: dimmed + blurred backdrop, slide-in panel, fixed header,
// independently scrolling body, optional footer.
// Closes on the X button, Escape, or a backdrop click; locks page scrolling
// while open (the page keeps its scroll position) and returns focus on close.

import { useEffect, useId, useRef } from 'react';

export default function SideDrawer({
  isOpen,
  onClose,
  title,
  subtitle,
  headerExtra,
  footer,
  widthClass = 'max-w-[380px]',
  headerClassName = 'px-6 py-5',
  bodyClassName = 'px-6 py-6 space-y-8',
  children,
}) {
  const titleId = useId();
  const closeRef = useRef(null);
  const onCloseRef = useRef(onClose);

  useEffect(() => {
    onCloseRef.current = onClose;
  }, [onClose]);

  useEffect(() => {
    if (!isOpen) return undefined;

    const previouslyFocused = document.activeElement;
    const { overflow, paddingRight } = document.body.style;
    // Compensate for the hidden scrollbar so the page underneath does not shift.
    const scrollbar = window.innerWidth - document.documentElement.clientWidth;
    document.body.style.overflow = 'hidden';
    if (scrollbar > 0) document.body.style.paddingRight = `${scrollbar}px`;

    const onKey = (e) => {
      if (e.key === 'Escape') onCloseRef.current?.();
    };
    document.addEventListener('keydown', onKey);
    closeRef.current?.focus({ preventScroll: true });

    return () => {
      document.removeEventListener('keydown', onKey);
      document.body.style.overflow = overflow;
      document.body.style.paddingRight = paddingRight;
      if (previouslyFocused instanceof HTMLElement) previouslyFocused.focus({ preventScroll: true });
    };
  }, [isOpen]);

  return (
    <>
      {/* Backdrop */}
      <div
        className={`fixed inset-0 z-40 bg-black/60 backdrop-blur-sm transition-opacity duration-300 ${
          isOpen ? 'opacity-100' : 'opacity-0 pointer-events-none'
        }`}
        onClick={onClose}
        aria-hidden="true"
      />

      {/* Sliding panel: full-screen on phones; on larger screens a floating sheet
          inset from the edges with large rounded corners. */}
      <aside
        role="dialog"
        aria-modal="true"
        aria-labelledby={titleId}
        aria-hidden={!isOpen}
        inert={isOpen ? undefined : ''}
        className={`fixed right-0 top-0 h-full w-full ${widthClass} bg-[#121212] border-l border-[#2C2C2C] flex flex-col shadow-2xl z-50 overflow-hidden transition-transform duration-300 ease-in-out sm:top-3 sm:bottom-3 sm:right-3 sm:h-auto sm:rounded-[28px] sm:border sm:shadow-[0_24px_64px_rgba(0,0,0,0.6)] ${
          isOpen ? 'translate-x-0' : 'translate-x-[calc(100%+1rem)]'
        }`}
      >
        {/* Header */}
        <div className={`flex items-center justify-between gap-3 border-b border-[#2C2C2C] ${headerClassName}`}>
          <div className="min-w-0">
            <h2 id={titleId} className="font-headline-md text-headline-md text-primary">{title}</h2>
            {subtitle && <p className="font-label-md text-label-md text-on-surface-variant">{subtitle}</p>}
          </div>
          <div className="flex items-center gap-2 shrink-0">
            {headerExtra}
            <button
              ref={closeRef}
              type="button"
              onClick={onClose}
              aria-label="Close"
              className="w-10 h-10 flex items-center justify-center rounded-full hover:bg-[#1F1F1F] transition-all focus:outline-none focus-visible:ring-2 focus-visible:ring-white"
            >
              <span className="material-symbols-outlined text-primary">close</span>
            </button>
          </div>
        </div>

        {/* Scrollable content */}
        <div className={`flex-1 overflow-y-auto overscroll-contain flight-details-scroll ${bodyClassName}`}>
          {children}
        </div>

        {footer && (
          <div className="px-6 py-5 bg-[#121212] border-t border-[#2C2C2C] flex items-center gap-4">
            {footer}
          </div>
        )}
      </aside>
    </>
  );
}
