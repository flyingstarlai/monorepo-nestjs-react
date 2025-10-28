import React, { useRef } from 'react';
import LoadingBar, { type LoadingBarRef } from 'react-top-loading-bar';
import { useRouterState } from '@tanstack/react-router';

interface AppLoadingBarProps {
  className?: string;
}

function LoadingBarInner({ className }: AppLoadingBarProps) {
  const ref = useRef<LoadingBarRef>(null);
  const isLoading = useRouterState({ select: (s) => s.isLoading });

  React.useEffect(() => {
    if (isLoading) {
      ref.current?.continuousStart();
    } else {
      ref.current?.complete();
    }
  }, [isLoading]);

  return (
    <LoadingBar
      ref={ref}
      color="hsl(var(--primary))"
      height={2}
      className={className}
      shadow={false}
      transitionTime={300}
      loaderSpeed={500}
      waitingTime={0}
    />
  );
}

export function AppLoadingBar({ className }: AppLoadingBarProps) {
  const [isRouterReady, setIsRouterReady] = React.useState(false);

  React.useEffect(() => {
    // Check if router is available after a short delay
    const timer = setTimeout(() => {
      setIsRouterReady(true);
    }, 100);

    return () => clearTimeout(timer);
  }, []);

  if (!isRouterReady) {
    return null;
  }

  return <LoadingBarInner className={className} />;
}
