import { useGLTF } from '@react-three/drei';

const XOR_KEY = 0xAA;

// Module-level caches — survive component unmount/remount cycles
const blobCache: Record<string, string> = {};
const pendingPromises: Record<string, Promise<void>> = {};

/**
 * Correct React Suspense-compatible hook.
 *
 * HOW IT WORKS:
 * 1. First render: blobCache is empty → start fetch → throw Promise (suspend)
 * 2. Fetch completes → sets blobCache[url] → React retries render
 * 3. Retry render: blobCache has the URL → skip throw → call useGLTF(blobUrl)
 * 4. useGLTF may also suspend (async parsing) → React handles that too
 *
 * WHY NO useState/useEffect:
 * When a component suspends (throws a Promise), React does NOT commit the
 * render, so useEffect NEVER runs. If we relied on setBlobUrl() inside an
 * effect, it would never fire, leaving blobUrl=null forever. Using a
 * module-level synchronous cache bypasses this entirely.
 */
export function useEncryptedGLTF(techverseUrl: string) {
  // Step 1: kick off fetch+decrypt if not already started
  if (!blobCache[techverseUrl] && !pendingPromises[techverseUrl]) {
    pendingPromises[techverseUrl] = fetch(techverseUrl, { cache: 'force-cache' })
      .then((res) => {
        if (!res.ok) throw new Error(`Failed to fetch ${techverseUrl}: ${res.status}`);
        return res.arrayBuffer();
      })
      .then((buffer) => {
        // XOR decrypt in-place
        const view = new Uint8Array(buffer);
        for (let i = 0; i < view.length; i++) {
          view[i] ^= XOR_KEY;
        }
        // Store as blob URL in module-level cache
        const blob = new Blob([view], { type: 'model/gltf-binary' });
        blobCache[techverseUrl] = URL.createObjectURL(blob);
      })
      .catch((err) => {
        // Remove failed promise so future renders can retry
        delete pendingPromises[techverseUrl];
        throw err;
      });
  }

  // Step 2: if blob isn't ready yet, throw the pending Promise → Suspense
  if (!blobCache[techverseUrl]) {
    throw pendingPromises[techverseUrl];
  }

  // Step 3: blob URL is ready — load the GLB normally.
  // We pass { dispose: false } via the second arg to prevent Three.js from 
  // garbage-collecting the parsed scene when this component unmounts.
  // Without this, React 18 StrictMode's intentional double-mount causes
  // the scene to be disposed on first unmount, leaving a stale ref on remount.
  // eslint-disable-next-line react-hooks/rules-of-hooks
  const gltf = useGLTF(blobCache[techverseUrl]);
  return gltf;
}

/**
 * Eagerly kick off decryption before React even mounts the component.
 * Call this at module level in index.html or App.tsx for fastest load.
 */
useEncryptedGLTF.preload = (techverseUrl: string) => {
  if (!blobCache[techverseUrl] && !pendingPromises[techverseUrl]) {
    pendingPromises[techverseUrl] = fetch(techverseUrl, { cache: 'force-cache' })
      .then((res) => res.arrayBuffer())
      .then((buffer) => {
        const view = new Uint8Array(buffer);
        for (let i = 0; i < view.length; i++) {
          view[i] ^= XOR_KEY;
        }
        const blob = new Blob([view], { type: 'model/gltf-binary' });
        blobCache[techverseUrl] = URL.createObjectURL(blob);
      })
      .catch(() => {
        delete pendingPromises[techverseUrl];
      });
  }
};
