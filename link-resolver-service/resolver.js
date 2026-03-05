import { config } from './config.js';

/**
 * Resolves a URL by following HTTP redirects to the final destination
 * @param {string} url - The original URL to resolve
 * @returns {Promise<{originalUrl: string, resolvedUrl: string, redirected: boolean, status: string}>}
 */
export async function resolveUrl(url) {
  const originalUrl = url;
  const visitedUrls = new Set();
  let currentUrl = url;
  let redirectCount = 0;

  try {
    while (redirectCount <= config.MAX_REDIRECTS) {
      // Detect redirect loops
      if (visitedUrls.has(currentUrl)) {
        console.warn(`[Resolver] Redirect loop detected for ${originalUrl}`);
        return {
          originalUrl,
          resolvedUrl: originalUrl,
          redirected: false,
          status: 'fallback'
        };
      }

      visitedUrls.add(currentUrl);

      // Create AbortController for timeout
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), config.TIMEOUT_MS);

      try {
        const response = await fetch(currentUrl, {
          method: 'HEAD', // Use HEAD to avoid downloading full content
          redirect: 'manual', // Manually handle redirects
          headers: {
            'User-Agent': config.USER_AGENT,
            'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8',
            'Accept-Language': 'en-US,en;q=0.9',
            'Accept-Encoding': 'gzip, deflate, br',
            'Connection': 'keep-alive',
            'Upgrade-Insecure-Requests': '1'
          },
          signal: controller.signal
        });

        clearTimeout(timeoutId);

        // Check for redirect status codes
        if (response.status >= 300 && response.status < 400) {
          const location = response.headers.get('location');
          
          if (!location) {
            // No location header, return current URL
            return {
              originalUrl,
              resolvedUrl: currentUrl,
              redirected: redirectCount > 0,
              status: 'ok'
            };
          }

          // Resolve relative URLs
          const nextUrl = new URL(location, currentUrl).href;
          redirectCount++;
          currentUrl = nextUrl;
          continue;
        }

        // Success - no more redirects
        if (response.ok || response.status < 300) {
          return {
            originalUrl,
            resolvedUrl: currentUrl,
            redirected: redirectCount > 0,
            status: 'ok'
          };
        }

        // Non-redirect error status
        return {
          originalUrl,
          resolvedUrl: originalUrl,
          redirected: false,
          status: 'fallback'
        };

      } catch (fetchError) {
        clearTimeout(timeoutId);

        if (fetchError.name === 'AbortError') {
          console.warn(`[Resolver] Timeout resolving ${currentUrl}`);
          return {
            originalUrl,
            resolvedUrl: originalUrl,
            redirected: false,
            status: 'fallback'
          };
        }

        // If HEAD fails, try GET as fallback (some servers don't support HEAD)
        if (redirectCount === 0) {
          try {
            const getController = new AbortController();
            const getTimeoutId = setTimeout(() => getController.abort(), config.TIMEOUT_MS);
            
            const getResponse = await fetch(currentUrl, {
              method: 'GET',
              redirect: 'manual',
              headers: {
                'User-Agent': config.USER_AGENT,
                'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8',
                'Accept-Language': 'en-US,en;q=0.9',
                'Accept-Encoding': 'gzip, deflate, br',
                'Connection': 'keep-alive',
                'Upgrade-Insecure-Requests': '1'
              },
              signal: getController.signal
            });

            clearTimeout(getTimeoutId);

            if (getResponse.status >= 300 && getResponse.status < 400) {
              const location = getResponse.headers.get('location');
              if (location) {
                const nextUrl = new URL(location, currentUrl).href;
                redirectCount++;
                currentUrl = nextUrl;
                continue;
              }
            }

            if (getResponse.ok || getResponse.status < 300) {
              return {
                originalUrl,
                resolvedUrl: currentUrl,
                redirected: redirectCount > 0,
                status: 'ok'
              };
            }
          } catch (getError) {
            // Fall through to error handling
          }
        }

        throw fetchError;
      }
    }

    // Exceeded max redirects
    console.warn(`[Resolver] Max redirects exceeded for ${originalUrl}`);
    return {
      originalUrl,
      resolvedUrl: originalUrl,
      redirected: false,
      status: 'fallback'
    };

  } catch (error) {
    console.error(`[Resolver] Error resolving ${originalUrl}:`, error.message);
    return {
      originalUrl,
      resolvedUrl: originalUrl,
      redirected: false,
      status: 'fallback'
    };
  }
}
