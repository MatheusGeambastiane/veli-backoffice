"use client";

import { useEffect, useState } from "react";

function isEditableElement(element: Element | null) {
  return (
    element instanceof HTMLInputElement ||
    element instanceof HTMLTextAreaElement ||
    (element instanceof HTMLElement && element.isContentEditable)
  );
}

export function useVirtualKeyboard() {
  const [isOpen, setIsOpen] = useState(false);

  useEffect(() => {
    const viewport = window.visualViewport;
    let baselineHeight = viewport?.height ?? window.innerHeight;
    let focusTimer: ReturnType<typeof setTimeout> | undefined;

    function updateKeyboardState() {
      const currentHeight = viewport?.height ?? window.innerHeight;
      const hasEditableFocus = isEditableElement(document.activeElement);
      const minimumKeyboardHeight = Math.min(180, baselineHeight * 0.2);
      const keyboardIsOpen =
        hasEditableFocus && baselineHeight - currentHeight > minimumKeyboardHeight;

      setIsOpen(keyboardIsOpen);

      if (!hasEditableFocus) {
        baselineHeight = Math.max(baselineHeight, currentHeight);
      }
    }

    function handleFocusChange() {
      if (focusTimer) clearTimeout(focusTimer);
      focusTimer = setTimeout(updateKeyboardState, 80);
    }

    viewport?.addEventListener("resize", updateKeyboardState);
    viewport?.addEventListener("scroll", updateKeyboardState);
    window.addEventListener("resize", updateKeyboardState);
    document.addEventListener("focusin", handleFocusChange);
    document.addEventListener("focusout", handleFocusChange);

    return () => {
      if (focusTimer) clearTimeout(focusTimer);
      viewport?.removeEventListener("resize", updateKeyboardState);
      viewport?.removeEventListener("scroll", updateKeyboardState);
      window.removeEventListener("resize", updateKeyboardState);
      document.removeEventListener("focusin", handleFocusChange);
      document.removeEventListener("focusout", handleFocusChange);
    };
  }, []);

  return isOpen;
}
