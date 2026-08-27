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

  useEffect(() => {
    // Speech bubbles are wider than the collapsed companion. Resize the native
    // window whenever a message is present so text and actions cannot be clipped.
    void setCompanionExpanded(Boolean(message));
  }, [message]);

  async function act(action: 'return' | 'break' | 'not_drift' | 'dismiss') {
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

  async function dismissMessage() {
    if (kind === 'nudge') {
      await act('dismiss');
      return;
    }
    setMessage(null);
    setKind(null);
    await setCompanionExpanded(false);
  }

  async function toggleStatus() {
    if (message && kind === 'notice') {
      await dismissMessage();
      return;
    }
    if (nudgeActive.current) return;
    await setCompanionExpanded(true);
    setMessage(companionStatusLine(mascot, state, name));
    setKind('notice');
  }

  const stateLabel = state.replaceAll('_', ' ');

  return (
    <main className="pet-window">
      {message ? (
        <section className="bubble" aria-live="polite">
          <button
            type="button"
            aria-label="Dismiss companion message"
            title="Dismiss"
            onClick={() => void dismissMessage()}
            style={{
              position: 'absolute',
              top: 8,
              right: 8,
              zIndex: 3,
              width: 28,
              height: 28,
              padding: 0,
              borderRadius: 999,
            }}
          >
            ×
          </button>
          <p style={{ paddingRight: 28 }}>{message}</p>
          <div>
            {kind === 'nudge' ? (
              <>
                <button onClick={() => void act('return')}>Back to it</button>
                <button onClick={() => void act('break')}>10-min break</button>
                <button onClick={() => void act('not_drift')}>Not a drift</button>
              </>
            ) : (
              <button onClick={() => void dismissMessage()}>Got it</button>
            )}
          </div>
        </section>
      ) : null}
      <button
        className="pet-stage"
        onDoubleClick={() => void toggleStatus()}
        aria-label={`${name || 'FlowPet'} companion. Double-click for status.`}
        title="Double-click for status"
        style={{ position: 'relative', height: 140 }}
      >
        <Mascot mascot={mascot} state={state} name={name} size="small" speaking={Boolean(message)} />
        <span
          aria-hidden="true"
          style={{
            position: 'absolute',
            left: '50%',
            bottom: 0,
            transform: 'translateX(-50%)',
            maxWidth: 126,
            padding: '3px 7px',
            borderRadius: 999,
            background: 'rgba(24, 21, 31, 0.82)',
            color: '#f4efff',
            fontSize: 9,
            fontWeight: 700,
            lineHeight: 1.2,
            whiteSpace: 'nowrap',
            overflow: 'hidden',
            textOverflow: 'ellipsis',
            pointerEvents: 'none',
          }}
        >
          {name || 'FlowPet'} · {stateLabel}
        </span>
      </button>
    </main>
  );
}
