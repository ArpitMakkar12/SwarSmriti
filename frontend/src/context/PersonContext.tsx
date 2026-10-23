/* eslint-disable react-refresh/only-export-components -- the provider and its hook belong together */
import React, { createContext, useCallback, useContext, useEffect, useMemo, useState } from 'react';
import { apiService } from '../services/api';
import { Person } from '../types';

/**
 * Who is being remembered right now.
 * Every page reads `current` from here, so switching person in the side column
 * switches the whole app: their memories, their portrait, their voice.
 */
interface PersonContextValue {
  people: Person[];
  current: Person | null;
  loading: boolean;
  error: string | null;
  select: (personId: string) => void;
  /** Reload the family from the server (after adding, editing or removing someone). */
  reload: (selectId?: string) => Promise<void>;
}

const PersonContext = createContext<PersonContextValue | null>(null);

// Remember the last person you looked at, on this browser only.
const STORAGE_KEY = 'swarsmriti.currentPerson';
const readSaved = () => {
  try {
    return localStorage.getItem(STORAGE_KEY);
  } catch {
    return null;
  }
};
const save = (id: string | null) => {
  try {
    if (id) localStorage.setItem(STORAGE_KEY, id);
    else localStorage.removeItem(STORAGE_KEY);
  } catch {
    /* private mode or storage blocked: fine, we just won't remember */
  }
};

export const PersonProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [people, setPeople] = useState<Person[]>([]);
  const [currentId, setCurrentId] = useState<string | null>(readSaved);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const reload = useCallback(async (selectId?: string) => {
    const res = await apiService.getPeople();
    if (res.status === 'success' && res.data) {
      const list = res.data;
      setPeople(list);
      setError(null);
      setCurrentId((prev) => {
        const wanted = selectId ?? prev;
        // Keep the chosen person if they still exist, otherwise fall back to the first one.
        const next = list.find((p) => p.id === wanted)?.id ?? list[0]?.id ?? null;
        save(next);
        return next;
      });
    } else {
      setError(res.message || 'Could not open the family archive.');
    }
    setLoading(false);
  }, []);

  useEffect(() => {
    reload();
  }, [reload]);

  const select = useCallback((personId: string) => {
    setCurrentId(personId);
    save(personId);
  }, []);

  const value = useMemo(
    () => ({ people, current: people.find((p) => p.id === currentId) ?? null, loading, error, select, reload }),
    [people, currentId, loading, error, select, reload],
  );

  return <PersonContext.Provider value={value}>{children}</PersonContext.Provider>;
};

export const usePerson = () => {
  const ctx = useContext(PersonContext);
  if (!ctx) throw new Error('usePerson must be used inside <PersonProvider>');
  return ctx;
};