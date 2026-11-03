import { useCallback, useRef, useState } from 'react';
import {
  clearAssessResults,
  loadAssessResults,
  loadAssessSettings,
  MAX_ASSESS_RESULTS,
  saveAssessResults,
  saveAssessSettings,
} from '../services/assess/storage';
import type { AssessRecord, AssessSettings } from '../services/assess/types';

/** Assessment results and settings, mirrored into localStorage through the typed storage service. */
export function useAssessStore() {
  const [results, setResults] = useState<AssessRecord[]>(loadAssessResults);
  const [settings, setSettingsState] = useState<AssessSettings>(loadAssessSettings);
  const resultsRef = useRef(results);
  const settingsRef = useRef(settings);

  const addResult = useCallback((record: AssessRecord) => {
    const next = [...resultsRef.current, record].slice(-MAX_ASSESS_RESULTS);
    resultsRef.current = next;
    setResults(next);
    saveAssessResults(next);
  }, []);

  const updateSettings = useCallback((patch: Partial<AssessSettings>) => {
    const next = { ...settingsRef.current, ...patch };
    settingsRef.current = next;
    setSettingsState(next);
    saveAssessSettings(next);
  }, []);

  const clearResults = useCallback(() => {
    clearAssessResults();
    resultsRef.current = [];
    setResults([]);
  }, []);

  return { results, settings, addResult, updateSettings, clearResults };
}

export type AssessStore = ReturnType<typeof useAssessStore>;
