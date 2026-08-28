import { useEffect, useRef, useState } from 'react';
import { listen } from '@tauri-apps/api/event';
import {
  currentMonitor,
  getCurrentWindow,
  LogicalPosition,
  LogicalSize,
} from '@tauri-apps/api/window';
import { Mascot } from './components/Mascot';
import { companionStatusLine, derivePetState, petStateFromLabel } from './lib/mascots';
import {
  getDashboard,
  getSettings,
  resolveNudge,
} from './lib/api';
import type { CompanionEvent, Dashboard, MascotId, PetState } from './lib/types';
import './pet-overrides.css';

const COLLAPSED_SIZE = { width: 170, height: 190 };
const EXPANDED_SIZE = { width: 400, height: 480 };

async function placePetWindow(expanded: boolean, show = false) {
  const window = getCurrentWindow();
  const target = expanded ? EXPANDED_SIZE : COLLAPSED_SIZE;

  await window.setSize(new LogicalSize(target.width, target.height));

  const monitor = await currentMonitor();
  if (monitor) {
    const monitorPosition = monitor.position.toLogical(monitor.scaleFactor);
    const monitorSize = monitor.size.toLogical(monitor.scaleFactor);
    const x = monitorPosition.x + monitorSize.width - target.width - 18;
    const y = monitorPosition.y + monitorSize.height - target.height - 54;
    await window.setPosition(new LogicalPosition(x, y));
  }

  if (show) await window.show();
}

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
    void placePetWindow(false);
    void sync();
    const interval = window.setInterval(() => void sync(), 10_000);
    let unlistenCompanion: (() => void) | undefined;
    let unlistenDashboard: (() => void) | undefined;

    void listen<CompanionEvent>('flowpet://companion', (event) => {
      const payload = event.payload;
      if (payload.kind === 'nudge') {
        // Nudges are proactive. Reveal the full bubble immediately; no click required.
        void placePetWindow(true, true);
        clearTransientTimer();
        nudgeActive.current = true;
        setState('nudging');
        setMessage(payload.message || null);
        setNudgeId(payload.nudge_id || null);
        setKind('nudge');
      } else if (payload.kind === 'notice') {
        // Any future companion notice should follow the same pop-up behavior.
        void placePetWindow(true, true);
        setMessage(payload.message || null);
        setKind('notice');
      } else if (payload.kind === 'clear') {
        nudgeActive.current = false;
        setMessage(null);
        setNudgeId(null);
        setKind(null);
        void placePetWindow(false);
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
    // Fallback for any message source that is not emitted through the companion event.
    void placePetWindow(Boolean(message), Boolean(message));
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
    await placePetWindow(false);
  }

  async function dismissMessage() {
    if (kind === 'nudge') {
      await act('dismiss');
      return;
    }
    setMessage(null);
    setKind(null);
    await placePetWindow(false);
  }

  async function toggleStatus() {
    if (message && kind === 'notice') {
      await dismissMessage();
      return;
    }
    if (nudgeActive.current) return;
    await placePetWindow(true, true);
    setMessage(companionStatusLine(mascot, state, name));
    setKind('notice');
  }

  async function hideCompanion() {
    await getCurrentWindow().hide();
  }

  const stateLabel = state.replaceAll('_', ' ');

  return (
    <main className={`pet-window ${message ? 'pet-window--message' : ''}`}>
      {!message ? (
        <button
          type="button"
          aria-label="Hide companion"
          title="Hide companion"
          onClick={() => void hideCompanion()}
          className="pet-hide"
        >
          ×
        </button>
      ) : null}

      {message ? (
        <section className="bubble" aria-live="assertive">
          <button
            type="button"
            aria-label="Dismiss companion message"
            title="Dismiss message"
            onClick={() => void dismissMessage()}
            className="bubble__dismiss"
          >
            ×
          </button>
          <p>{message}</p>
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
        onClick={() => void toggleStatus()}
        aria-label={`${name || 'FlowPet'} companion. Click for current status.`}
        title="Click for current status"
      >
        <Mascot mascot={mascot} state={state} name={name} size="small" speaking={Boolean(message)} />
        <span className="pet-state-label" aria-hidden="true">
          {name || 'FlowPet'} · {stateLabel}
        </span>
      </button>
    </main>
  );
}
