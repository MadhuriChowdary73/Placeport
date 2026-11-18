import type { Metadata } from 'next'
import { Providers } from './providers'
import './globals.css'

export const metadata: Metadata = {
  title: { template: '%s | PlacePort', default: 'PlacePort — Amrita Placement Experiences' },
  description: 'A platform exclusively for Amrita students to share and discover placement interview experiences.',
  robots: { index: false, follow: false },  // login-only: no indexing
}

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" suppressHydrationWarning>
      <head>
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
        <link
          href="https://fonts.googleapis.com/css2?family=Poppins:wght@300;400;500;600;700;800&display=swap"
          rel="stylesheet"
        />
        <script
          dangerouslySetInnerHTML={{
            __html: `
              (function() {
                function removeInjectedWidgets() {
                  try {
                    // Remove Next.js dev indicator portal and buttons
                    var nextPortals = document.querySelectorAll('nextjs-portal, [data-nextjs-dev-tools-button], [data-nextjs-dev-indicator]');
                    nextPortals.forEach(function(el) { el.remove(); });

                    // Remove floating feedback badges or widgets
                    var allElements = document.querySelectorAll('div, button, a, iframe');
                    allElements.forEach(function(el) {
                      var text = (el.innerText || el.textContent || '').trim().toUpperCase();
                      var title = (el.getAttribute('title') || '').toUpperCase();
                      var aria = (el.getAttribute('aria-label') || '').toUpperCase();
                      var id = (el.id || '').toUpperCase();
                      var cls = (typeof el.className === 'string' ? el.className : '').toUpperCase();

                      var isFeedback = text === 'FEEDBACK' || title.indexOf('FEEDBACK') !== -1 || aria.indexOf('FEEDBACK') !== -1 || id.indexOf('FEEDBACK') !== -1 || cls.indexOf('FEEDBACK') !== -1;
                      if (isFeedback) {
                        var style = window.getComputedStyle(el);
                        if (style.position === 'fixed' || style.position === 'absolute') {
                          el.remove();
                        }
                      }
                    });
                  } catch (e) {}
                }

                if (typeof window !== 'undefined') {
                  window.addEventListener('DOMContentLoaded', removeInjectedWidgets);
                  window.addEventListener('load', removeInjectedWidgets);
                  var observer = new MutationObserver(removeInjectedWidgets);
                  if (document.documentElement) {
                    observer.observe(document.documentElement, { childList: true, subtree: true });
                  }
                }
              })();
            `,
          }}
        />
      </head>
      <body className="font-sans antialiased bg-background text-foreground">
        <Providers>{children}</Providers>
      </body>
    </html>
  )
}
