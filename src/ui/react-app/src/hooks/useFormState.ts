/**
 * useFormState — Hook for working with the shared form state in MCPAppContext.
 *
 * Usage:
 *   const { getValue, setValue, getAll, reset } = useFormState();
 *   setValue('contactId', '123');
 *   const id = getValue('contactId');
 */
import { useCallback } from "react";
import { useMCPApp } from "../context/MCPAppContext.js";

export interface UseFormStateReturn {
  /** Get a single form value */
  getValue: (key: string) => any;
  /** Set a single form value */
  setValue: (key: string, value: any) => void;
  /** Get all form values */
  getAll: () => Record<string, any>;
  /** Reset all form values */
  reset: () => void;
  /** The entire form state object */
  formState: Record<string, any>;
}

export function useFormState(): UseFormStateReturn {
  const { formState, setFormValue, resetFormState } = useMCPApp();

  const getValue = useCallback(
    (key: string) => formState[key],
    [formState],
  );

  const getAll = useCallback(() => ({ ...formState }), [formState]);

  return {
    getValue,
    setValue: setFormValue,
    getAll,
    reset: resetFormState,
    formState,
  };
}
