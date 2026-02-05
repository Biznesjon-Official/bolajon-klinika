import { useEffect, useCallback } from 'react';

/**
 * Custom hook for keyboard shortcuts
 * @param {Object} shortcuts - Object with key combinations and callbacks
 * @example
 * useKeyboardShortcuts({
 *   'ctrl+k': () => openSearch(),
 *   'ctrl+s': () => save(),
 *   'esc': () => closeModal()
 * });
 */
export default function useKeyboardShortcuts(shortcuts, dependencies = []) {
  const handleKeyDown = useCallback((event) => {
    // Build key combination string
    const keys = [];
    if (event.ctrlKey || event.metaKey) keys.push('ctrl');
    if (event.shiftKey) keys.push('shift');
    if (event.altKey) keys.push('alt');
    
    const key = event.key.toLowerCase();
    if (!['control', 'shift', 'alt', 'meta'].includes(key)) {
      keys.push(key);
    }
    
    const combination = keys.join('+');
    
    // Check if this combination has a handler
    if (shortcuts[combination]) {
      event.preventDefault();
      shortcuts[combination](event);
    }
  }, [shortcuts, ...dependencies]);

  useEffect(() => {
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [handleKeyDown]);
}

// Predefined shortcuts helper
export const SHORTCUTS = {
  SEARCH: 'ctrl+k',
  SAVE: 'ctrl+s',
  CANCEL: 'esc',
  NEW: 'ctrl+n',
  REFRESH: 'ctrl+r',
  HELP: 'ctrl+/',
  CLOSE: 'esc',
  SUBMIT: 'ctrl+enter',
  PREV: 'ctrl+arrowleft',
  NEXT: 'ctrl+arrowright',
  DELETE: 'ctrl+d',
  EDIT: 'ctrl+e',
  PRINT: 'ctrl+p'
};
