import { onBeforeUnmount, onMounted } from 'vue';
import { useRouter } from 'vue-router';

const clearGlobalPointerLocks = () => {
  const root = document.documentElement;
  const body = document.body;

  if (root.style.pointerEvents === 'none') {
    root.style.pointerEvents = '';
  }

  if (body.style.pointerEvents === 'none') {
    body.style.pointerEvents = '';
  }
};

export const useInteractionRecovery = () => {
  const router = useRouter();

  let removeRouteHook: (() => void) | null = null;

  const onVisibilityChange = () => {
    if (document.visibilityState === 'visible') {
      clearGlobalPointerLocks();
    }
  };

  onMounted(() => {
    clearGlobalPointerLocks();
    removeRouteHook = router.afterEach(() => {
      clearGlobalPointerLocks();
    });
    document.addEventListener('visibilitychange', onVisibilityChange);
  });

  onBeforeUnmount(() => {
    removeRouteHook?.();
    document.removeEventListener('visibilitychange', onVisibilityChange);
  });
};
