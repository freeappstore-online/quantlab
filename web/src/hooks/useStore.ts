import { useCallback, useRef, useState } from 'react';
import { clearAll, DEFAULT_SETTINGS, loadSessions, loadSettings, MAX_SESSIONS, saveSessions, saveSettings } from '../services/storage';
import type { Session, Settings } from '../types';

/** Sessions and settings, mirrored into localStorage through the typed storage service. */
export function useStore() {
  const [sessions, setSessions] = useState<Session[]>(loadSessions);
  const [settings, setSettingsState] = useState<Settings>(loadSettings);
  const [saveFailed, setSaveFailed] = useState(false);
  const sessionsRef = useRef(sessions);
  const settingsRef = useRef(settings);

  const addSession = useCallback((session: Session) => {
    const next = [...sessionsRef.current, session].slice(-MAX_SESSIONS);
    sessionsRef.current = next;
    setSessions(next);
    setSaveFailed(!saveSessions(next));
  }, []);

  const updateSettings = useCallback((patch: Partial<Settings>) => {
    const next = { ...settingsRef.current, ...patch };
    settingsRef.current = next;
    setSettingsState(next);
    setSaveFailed(!saveSettings(next));
  }, []);

  const clearData = useCallback(() => {
    clearAll();
    sessionsRef.current = [];
    settingsRef.current = DEFAULT_SETTINGS;
    setSessions([]);
    setSettingsState(DEFAULT_SETTINGS);
    setSaveFailed(false);
  }, []);

  return { sessions, settings, saveFailed, addSession, updateSettings, clearData };
}

export type Store = ReturnType<typeof useStore>;
