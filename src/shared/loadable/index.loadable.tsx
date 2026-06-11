import { Suspense, type ComponentType, lazy } from "react";
import AppLoader from "../../components/loaders/app.loader";
import type { ReactNodeProps } from "../types/node.type";

/**
 * Wraps a lazy component so that if a dynamic chunk fails to load
 * (stale browser cache after a new deployment), the page does a single
 * hard reload to pick up the fresh index.html and new asset hashes.
 */
export function lazyWithRetry<T extends ComponentType<any>>(
  factory: () => Promise<{ default: T }>,
): React.LazyExoticComponent<T> {
  return lazy(() =>
    factory().catch((err) => {
      // Only auto-reload once to avoid reload loops
      const reloadKey = `chunk-reload-${btoa(err?.message ?? "unknown").slice(0, 20)}`;
      if (!sessionStorage.getItem(reloadKey)) {
        sessionStorage.setItem(reloadKey, "1");
        window.location.reload();
        // Return a never-resolving promise — reload will take over
        return new Promise(() => {});
      }
      throw err;
    }),
  );
}

const Loadable = <P extends object>(
  Component: ComponentType<P>
): React.FC<P & ReactNodeProps> => {
  return (props: P & ReactNodeProps) => (
    <Suspense fallback={<AppLoader />}>
      <Component {...props} />
    </Suspense>
  );
};

export default Loadable;
