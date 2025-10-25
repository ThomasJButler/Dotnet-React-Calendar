/**
 * @author Tom Butler
 * @date 2025-10-25
 * @description Custom hook for keyboard navigation support.
 */

import { useEffect, useCallback } from 'react';

/**
 * Custom hook for keyboard navigation
 * @param {Object} options - Configuration options
 * @param {Function} options.onArrowUp - Handler for arrow up key
 * @param {Function} options.onArrowDown - Handler for arrow down key
 * @param {Function} options.onArrowLeft - Handler for arrow left key
 * @param {Function} options.onArrowRight - Handler for arrow right key
 * @param {Function} options.onEnter - Handler for enter key
 * @param {Function} options.onEscape - Handler for escape key
 * @param {Function} options.onTab - Handler for tab key
 * @param {Function} options.onShiftTab - Handler for shift+tab key
 * @param {boolean} options.enabled - Whether keyboard navigation is enabled
 * @param {React.RefObject} options.containerRef - Reference to the container element
 */
export const useKeyboardNavigation = (options = {}) => {
  const {
    onArrowUp,
    onArrowDown,
    onArrowLeft,
    onArrowRight,
    onEnter,
    onEscape,
    onTab,
    onShiftTab,
    onHome,
    onEnd,
    onPageUp,
    onPageDown,
    enabled = true,
    containerRef,
    preventDefault = true
  } = options;

  const handleKeyDown = useCallback((event) => {
    if (!enabled) return;

    // Check if the event target is within the container (if containerRef is provided)
    if (containerRef?.current && !containerRef.current.contains(event.target)) {
      return;
    }

    let handled = true;

    switch (event.key) {
      case 'ArrowUp':
        onArrowUp?.(event);
        break;
      case 'ArrowDown':
        onArrowDown?.(event);
        break;
      case 'ArrowLeft':
        onArrowLeft?.(event);
        break;
      case 'ArrowRight':
        onArrowRight?.(event);
        break;
      case 'Enter':
        onEnter?.(event);
        break;
      case 'Escape':
        onEscape?.(event);
        break;
      case 'Tab':
        if (event.shiftKey && onShiftTab) {
          onShiftTab(event);
        } else if (!event.shiftKey && onTab) {
          onTab(event);
        } else {
          handled = false;
        }
        break;
      case 'Home':
        onHome?.(event);
        break;
      case 'End':
        onEnd?.(event);
        break;
      case 'PageUp':
        onPageUp?.(event);
        break;
      case 'PageDown':
        onPageDown?.(event);
        break;
      default:
        handled = false;
    }

    if (handled && preventDefault) {
      event.preventDefault();
    }
  }, [
    enabled,
    containerRef,
    onArrowUp,
    onArrowDown,
    onArrowLeft,
    onArrowRight,
    onEnter,
    onEscape,
    onTab,
    onShiftTab,
    onHome,
    onEnd,
    onPageUp,
    onPageDown,
    preventDefault
  ]);

  useEffect(() => {
    if (!enabled) return;

    const element = containerRef?.current || document;
    element.addEventListener('keydown', handleKeyDown);

    return () => {
      element.removeEventListener('keydown', handleKeyDown);
    };
  }, [enabled, containerRef, handleKeyDown]);

  return { handleKeyDown };
};

export default useKeyboardNavigation;