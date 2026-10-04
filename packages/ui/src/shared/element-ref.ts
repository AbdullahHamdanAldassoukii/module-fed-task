import { useImperativeHandle, useRef, type Ref, type RefObject } from 'react';

export function useElementRef<T extends HTMLElement>(
  ref: Ref<HTMLElement> | undefined,
): RefObject<T> {
  const elementRef = useRef<T>(null);
  useImperativeHandle<HTMLElement | null, T | null>(ref, () => elementRef.current, []);
  return elementRef;
}
