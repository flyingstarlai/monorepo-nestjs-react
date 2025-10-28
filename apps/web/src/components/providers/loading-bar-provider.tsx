import { useRef, useEffect } from 'react';
import LoadingBar, { type LoadingBarRef } from 'react-top-loading-bar';

interface LoadingBarProviderProps {
  router: any; // TanStack Router instance
}

export function LoadingBarProvider({ router }: LoadingBarProviderProps) {
  const ref = useRef<LoadingBarRef>(null);

  useEffect(() => {
    // Subscribe to router state changes
    const unsubscribe = router.subscribe('onResolved', () => {
      ref.current?.complete();
    });

    const unsubscribeLoad = router.subscribe('onBeforeLoad', () => {
      ref.current?.continuousStart();
    });

    return () => {
      unsubscribe();
      unsubscribeLoad();
    };
  }, [router]);

  return (
    <LoadingBar
      ref={ref}
      color="hsl(var(--primary))"
      height={2}
      shadow={false}
      transitionTime={300}
      loaderSpeed={500}
      waitingTime={0}
    />
  );
}
