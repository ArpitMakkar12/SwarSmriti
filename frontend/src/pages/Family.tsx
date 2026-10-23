import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { ArrowRight, Mic, Plus } from 'lucide-react';
import { PageHeader, Notice, Tape } from '../components/ui';
import { usePerson } from '../context/PersonContext';
import { apiService } from '../services/api';
import { tiltFor } from '../utils/format';
import { Person } from '../types';

/** A big serif initial, like a monogram on a photo frame. */
const Monogram: React.FC<{ name: string }> = ({ name }) => (
  <span
    aria-hidden="true"
    className="flex h-16 w-14 shrink-0 items-center justify-center rounded-t-full border-[1.5px] border-oxblood font-display text-3xl italic text-oxblood"
  >
    {name.trim().charAt(0).toUpperCase() || '?'}
  </span>
);

const Family: React.FC = () => {
  const { people, current, select, reload, loading, error } = usePerson();
  const navigate = useNavigate();
  const [adding, setAdding] = useState(false);
  const [name, setName] = useState('');
  const [about, setAbout] = useState('');
  const [saving, setSaving] = useState(false);
  const [formError, setFormError] = useState<string | null>(null);
  const [removing, setRemoving] = useState<string | null>(null);

  const showForm = adding || (!loading && people.length === 0);

  const add = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    setFormError(null);
    const res = await apiService.createPerson(name, about);
    setSaving(false);
    if (res.status === 'success' && res.data) {
      await reload(res.data.id); // switch the whole app to the new person
      setName('');
      setAbout('');
      setAdding(false);
      navigate('/persona');
    } else {
      setFormError(res.message || 'Could not add them.');
    }
  };

  const open = (p: Person, to: string) => {
    select(p.id);
    navigate(to);
  };

  const remove = async (p: Person) => {
    const warning = `Remove ${p.name} from the archive?\n\nThis also deletes ${p.memory_count} ${
      p.memory_count === 1 ? 'memory' : 'memories'
    }${p.has_cloned_voice ? ' and their cloned voice' : ''}. It can't be undone.`;
    if (!confirm(warning)) return;
    setRemoving(p.id);
    const res = await apiService.deletePerson(p.id);
    setRemoving(null);
    if (res.status === 'success') await reload();
    else setFormError(res.message || `Could not remove ${p.name}.`);
  };

  return (
    <div className="flex flex-col gap-12">
      <PageHeader
        eyebrow="The family"
        title="Everyone we're remembering"
        subtitle="Each person keeps their own memories, their own way of speaking and their own voice."
      />

      {error && <Notice>{error}</Notice>}

      {people.length > 0 && (
        <ul className="grid gap-8 sm:grid-cols-2">
          {people.map((p) => {
            const isCurrent = p.id === current?.id;
            return (
              <li
                key={p.id}
                className="relative flex flex-col gap-5 pb-6 bg-card px-7 pt-9 shadow-keepsake animate-settle"
                style={{ transform: `rotate(${tiltFor(p.id) * 0.6}deg)` }}
              >
                <Tape className={tiltFor(p.id) > 0 ? 'right-8' : 'left-8'} />
                <div className="flex items-start gap-4">
                  <Monogram name={p.name} />
                  <div className="flex flex-col min-w-0 gap-1">
                    <h2 className="text-2xl leading-tight font-display text-ink">{p.name}</h2>
                    <p className="text-sm text-ink-soft">
                      {p.memory_count} {p.memory_count === 1 ? 'memory' : 'memories'}
                      {p.has_cloned_voice && (
                        <span className="inline-flex items-center gap-1 ml-2 text-oxblood">
                          <Mic className="h-3.5 w-3.5" /> their voice
                        </span>
                      )}
                    </p>
                    {isCurrent && <span className="eyebrow text-oxblood">Remembering now</span>}
                  </div>
                </div>
                {p.about && <p className="italic leading-relaxed line-clamp-3 font-display text-ink-soft">{p.about}</p>}
                <div className="flex flex-wrap items-center gap-3 pt-4 mt-auto border-t border-dashed border-rule">
                  <button type="button" onClick={() => open(p, '/talk')} className="btn-ink">
                    Talk with {p.name.split(' ')[0]} <ArrowRight className="w-4 h-4" />
                  </button>
                  <button type="button" onClick={() => open(p, '/persona')} className="text-sm underline text-ink underline-offset-4 hover:text-oxblood">
                    Edit portrait
                  </button>
                  <button
                    type="button"
                    onClick={() => remove(p)}
                    disabled={removing === p.id}
                    className="ml-auto text-sm underline text-ink-muted underline-offset-4 hover:text-oxblood disabled:opacity-50"
                  >
                    {removing === p.id ? 'Removing…' : 'Remove'}
                  </button>
                </div>
              </li>
            );
          })}
        </ul>
      )}

      {showForm ? (
        <form onSubmit={add} className="relative flex flex-col max-w-3xl pt-10 pb-8 gap-7 bg-card px-7 shadow-letter animate-settle sm:px-10">
          <Tape className="left-12" />
          <span className="eyebrow">{people.length === 0 ? 'The first person in the archive' : 'Someone new'}</span>
          <div className="flex flex-col gap-2">
            <label htmlFor="new-name" className="eyebrow">
              Their name
            </label>
            <input
              id="new-name"
              value={name}
              onChange={(e) => setName(e.target.value)}
              maxLength={80}
              autoFocus={adding}
              placeholder="Nani, Dadaji, Papa, or their full name"
              className="border-b-[1.5px] border-ink bg-transparent py-2 font-display text-3xl text-ink outline-none placeholder:text-ink-muted/60 focus:border-oxblood"
            />
          </div>
          <div className="flex flex-col gap-2">
            <label htmlFor="new-about" className="eyebrow">
              A few words about them (you can add more later)
            </label>
            <textarea
              id="new-about"
              value={about}
              onChange={(e) => setAbout(e.target.value)}
              maxLength={2000}
              rows={3}
              placeholder="Who they are, and how they talk."
              className="text-lg leading-9 bg-transparent outline-none resize-none lined font-display text-ink placeholder:italic placeholder:text-ink-muted/70"
            />
          </div>
          {formError && <Notice>{formError}</Notice>}
          <div className="flex flex-wrap items-center gap-4">
            <button type="submit" disabled={saving || !name.trim()} className="btn-seal">
              {saving ? 'Adding…' : 'Add to the family'}
            </button>
            {people.length > 0 && (
              <button type="button" onClick={() => setAdding(false)} className="text-sm underline text-ink-soft underline-offset-4 hover:text-ink">
                Cancel
              </button>
            )}
          </div>
        </form>
      ) : (
        <button
          type="button"
          onClick={() => setAdding(true)}
          className="flex max-w-3xl items-center justify-center gap-2 border-[1.5px] border-dashed border-rule-strong py-8 font-display text-xl text-ink-soft transition-colors hover:border-oxblood hover:bg-card hover:text-ink"
        >
          <Plus className="w-5 h-5" /> Add someone to the family
        </button>
      )}
    </div>
  );
};

export default Family;