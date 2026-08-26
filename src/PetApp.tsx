import { useEffect, useRef, useState } from 'react';
import { listen } from '@tauri-apps/api/event';
import { Mascot } from './components/Mascot';
import { companionStatusLine, derivePetState, petStateFromLabel } from './lib/mascots';
import {
  getDashboard,
  getSettings,
  resolveNudge,
  setCompanionExpanded,
} from './lib/api';
import type { CompanionEvent, Dashboard, MascotId, PetState } from './lib/types';

export default function PetApp() {
  const [state, setState] = useState<PetState>('idle');
  const [mascot, setMascot] = useState<MascotId>('otter');
  const [name, setName] = useState('Pip');
  const [message, setMessage] = useState<string | null>(null);
  const [nudgeId, setNudgeId] = useState<string | null>(null);
  const [kind, setKind] = useState<'nudge' | 'notice' | null>(null);

  const previousDashboard = useRef<Dashboard | null>(null);
  const nudgeActive = useRef(false);
  const transientTimer = useRef<number | null>(null);

  function clearTransientTimer() {
    if (transientTimer.current != null) {
      window.clearTimeout(transientTimer.current);
      transientTimer.current = null;
    }
  }

  function showTransient(next: PetState, fallback: PetState, milliseconds = 3200) {
    clearTransientTimer();
    setState(next);
    transientTimer.current = window.setTimeout(() => {
      if (!nudgeActive.current) setState(fallback);
    }, milliseconds);
  }

  async function sync() {
    const [dashboard, settings] = await Promise.all([getDashboard(), getSettings()]);
    setMascot(settings.mascot);
    setName(settings.companion_name);

    const fallback = derivePetState(dashboard);
    const previous = previousDashboard.current;
    const recoveryImproved = previous != null && dashboard.recovery_count > previous.recovery_count;
    const previouslyCompleted = new Set(
      previous?.quests.filter((quest) => quest.completed).map((quest) => quest.id) ?? [],
    );
    const questCompleted = dashboard.quests.some(
      (quest) => quest.completed && !previouslyCompleted.has(quest.id),
    );

    if (!nudgeActive.current) {
      if (questCompleted) showTransient('celebrating', fallback, 3600);
      else if (recoveryImproved) showTransient('recovering', fallback, 3000);
      else setState(fallback);
    }
    previousDashboard.current = dashboard;
  }

  useEffect(() => {
    void sync();
    const interval = window.setInterval(() => void sync(), 10_000);
    let unlistenCompanion: (() => void) | undefined;
    let unlistenDashboard: (() => void) | undefined;

    void listen<CompanionEvent>('flowpet://companion', (event) => {
      const payload = event.payload;
      if (payload.kind === 'nudge') {
        clearTransientTimer();
        nudgeActive.current = true;
        setState('nudging');
        setMessage(payload.message || null);
        setNudgeId(payload.nudge_id || null);
        setKind('nudge');
      } else if (payload.kind === 'notice') {
        setMessage(payload.message || null);
        setKind('notice');
      } else if (payload.kind === 'clear') {
        nudgeActive.current = false;
        setMessage(null);
        setNudgeId(null);
        setKind(null);
        void sync();
      } else if (!nudgeActive.current) {
        setState(petStateFromLabel(payload.label));
      }
    }).then((fn) => { unlistenCompanion = fn; });

    void listen('flowpet://dashboard-changed', () => void sync()).then((fn) => {
      unlistenDashboard = fn;
    });

    return () => {
      window.clearInterval(interval);
      clearTransientTimer();
      unlistenCompanion?.();
      unlistenDashboard?.();
    };
  }, []);

  async function act(action: 'return' | 'break' | 'not_drift') {
    if (nudgeId) await resolveNudge(nudgeId, action);
    nudgeActive.current = false;
    setMessage(null);
    setNudgeId(null);
    setKind(null);
    if (action === 'break') setState('break');
    else if (action === 'return') showTransient('recovering', 'neutral', 3000);
    else setState('neutral');
    await setCompanionExpanded(false);
  }

  async function toggleStatus() {
    if (message && kind === 'notice') {
      setMessage(null);
      setKind(null);
      await setCompanionExpanded(false);
      return;
    }
    if (nudgeActive.current) return;
    await setCompanionExpanded(true);
    setMessage(companionStatusLine(mascot, state, name));
    setKind('notice');
  }

  return (
    <main className="pet-window">
      {message ? (
        <section className="bubble">
          <p>{message}</p>
          <div>
            {kind === 'nudge' ? (
              <>
                <button onClick={() => void act('return')}>Back to it</button>
                <button onClick={() => void act('break')}>10-min break</button>
                <button onClick={() => void act('not_drift')}>Not a drift</button>
              </>
            ) : (
              <button onClick={() => void toggleStatus()}>Got it</button>
            )}
          </div>
        </section>
      ) : null}
      <button
        className="pet-stage"
        onDoubleClick={() => void toggleStatus()}
        aria-label={`${name || 'FlowPet'} companion`}
      >
        <Mascot mascot={mascot} state={state} name={name} size="small" speaking={Boolean(message)} />
      </button>
    </main>
  );
}
