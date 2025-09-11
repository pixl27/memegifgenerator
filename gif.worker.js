/* Local copy reference file for gif.js worker.
   If you have connectivity issues with CDN workers, you can replace the content of this file
   with the minified worker code from gif.js (v0.2.0) dist/gif.worker.js.
   For now, this is a stub that redirects importScripts to the CDN. */

// If importScripts fails to load from CDN due to network constraints,
// you can paste the full worker code here instead.
try {
  importScripts('https://cdn.jsdelivr.net/npm/gif.js@0.2.0/dist/gif.worker.js');
} catch (e) {
  // As a last resort, do nothing; the encoder may fail to initialize.
  // To fully support offline/airgapped, paste worker source here.
}
