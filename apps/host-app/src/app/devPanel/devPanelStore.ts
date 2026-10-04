let isOpen = false;
let trigger: HTMLElement | null = null;
const listeners = new Set<() => void>();

function notify() {
  listeners.forEach((listener) => listener());
}

export const devPanel = {
  getSnapshot: (): boolean => isOpen,
  subscribe: (listener: () => void) => {
    listeners.add(listener);
    return () => listeners.delete(listener);
  },
  open: (nextTrigger: HTMLElement) => {
    trigger = nextTrigger;
    if (!isOpen) {
      isOpen = true;
      notify();
    }
  },
  close: () => {
    if (!isOpen) return;

    isOpen = false;
    notify();
    queueMicrotask(() => {
      if (trigger?.isConnected) trigger.focus();
    });
  },
};
