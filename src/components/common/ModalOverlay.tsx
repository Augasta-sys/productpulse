import { useEffect, useRef, type ReactNode } from 'react';
import { createPortal } from 'react-dom';

interface ModalOverlayProps {
  open: boolean;
  onClose: () => void;
  children: ReactNode;
  className?: string;
}

export default function ModalOverlay({
  open,
  onClose,
  children,
  className = '',
}: ModalOverlayProps) {
  const closeRef = useRef(onClose);
  const contentRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    closeRef.current = onClose;
  }, [onClose]);

  useEffect(() => {
    if (!open) return;

    const scrollY = window.scrollY;
    const body = document.body;
    const html = document.documentElement;

    const previousStyles = {
      bodyOverflow: body.style.overflow,
      bodyPosition: body.style.position,
      bodyTop: body.style.top,
      bodyWidth: body.style.width,
      htmlOverflow: html.style.overflow,
      htmlPaddingRight: html.style.paddingRight,
    };

    const scrollbarWidth = window.innerWidth - html.clientWidth;

    body.style.overflow = 'hidden';
    body.style.position = 'fixed';
    body.style.top = `-${scrollY}px`;
    body.style.width = '100%';
    html.style.overflow = 'hidden';

    if (scrollbarWidth > 0) {
      html.style.paddingRight = `${scrollbarWidth}px`;
    }

    if (contentRef.current) contentRef.current.scrollTop = 0;

    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') closeRef.current();
    };

    window.addEventListener('keydown', handleKeyDown);

    return () => {
      window.removeEventListener('keydown', handleKeyDown);
      body.style.overflow = previousStyles.bodyOverflow;
      body.style.position = previousStyles.bodyPosition;
      body.style.top = previousStyles.bodyTop;
      body.style.width = previousStyles.bodyWidth;
      html.style.overflow = previousStyles.htmlOverflow;
      html.style.paddingRight = previousStyles.htmlPaddingRight;
      window.scrollTo(0, scrollY);
    };
  }, [open]);

  if (!open) return null;

  return createPortal(
    <div
      className="fixed inset-0 z-[99999] flex items-start justify-center overflow-y-auto bg-black/60 p-3 pt-4 backdrop-blur-sm sm:p-6"
      onMouseDown={(event) => {
        if (event.target === event.currentTarget) closeRef.current();
      }}
    >
      <div
        ref={contentRef}
        className={`my-0 max-h-[calc(100dvh-32px)] w-full shrink-0 overflow-y-auto rounded-2xl bg-white shadow-2xl [-ms-overflow-style:none] [scrollbar-width:none] [&::-webkit-scrollbar]:hidden dark:bg-[#151a1c] sm:max-h-[calc(100dvh-48px)] ${className}`}
      >
        {children}
      </div>
    </div>,
    document.body,
  );
}
