'use client';

// Prevent flash of wrong theme before React hydrates
export function ThemeScript() {
  return (
    <script
      dangerouslySetInnerHTML={{
        __html: `
          (function() {
            try {
              var s = JSON.parse(localStorage.getItem('lumina_settings') || '{}');
              var mode = s.darkMode || 'system';
              var dark = mode === 'dark' || (mode === 'system' && window.matchMedia('(prefers-color-scheme: dark)').matches);
              if (dark) document.documentElement.classList.add('dark');
            } catch(e) {
              if (window.matchMedia('(prefers-color-scheme: dark)').matches) {
                document.documentElement.classList.add('dark');
              }
            }
          })();
        `,
      }}
    />
  );
}
