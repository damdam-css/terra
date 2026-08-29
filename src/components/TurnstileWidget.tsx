import React, { useEffect, useRef } from 'react';

declare global {
  interface Window {
    turnstile?: {
      render: (element: HTMLElement, options: { sitekey: string; callback: (token: string) => void; 'expired-callback'?: () => void; 'error-callback'?: () => void }) => string;
      reset: (widgetId?: string) => void;
    };
  }
}

interface Props {
  siteKey?: string;
  onToken: (token: string) => void;
}

export const TurnstileWidget: React.FC<Props> = ({ siteKey, onToken }) => {
  const ref = useRef<HTMLDivElement>(null);
  const widgetId = useRef<string>();

  useEffect(() => {
    if (!siteKey || !ref.current) return;

    const render = () => {
      if (!ref.current || !window.turnstile) return;
      widgetId.current = window.turnstile.render(ref.current, {
        sitekey: siteKey,
        callback: onToken,
        'expired-callback': () => onToken(''),
        'error-callback': () => onToken(''),
      });
    };

    if (window.turnstile) {
      render();
      return;
    }

    const existing = document.querySelector('script[data-turnstile]');
    if (!existing) {
      const script = document.createElement('script');
      script.src = 'https://challenges.cloudflare.com/turnstile/v0/api.js?render=explicit';
      script.async = true;
      script.defer = true;
      script.dataset.turnstile = 'true';
      script.onload = render;
      document.head.appendChild(script);
    } else {
      existing.addEventListener('load', render, { once: true });
    }

    return () => {
      if (widgetId.current && window.turnstile) window.turnstile.reset(widgetId.current);
    };
  }, [siteKey, onToken]);

  if (!siteKey) return null;
  return <div ref={ref} className="mt-2 min-h-[65px]" />;
};
