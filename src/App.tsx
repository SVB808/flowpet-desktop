import { FormEvent, useEffect, useMemo, useState } from 'react';
import { Mascot } from './components/Mascot';
import { MASCOTS, PERSONALITIES, derivePetState, mascotById } from './lib/mascots';
import {
  clearIntent,
  endBreak,
  getDashboard,
  getSettings,
  probeProvider,
  saveSettings,
  setIntent,
  setTrackingPaused,
} from './lib/api';
import type {
  Dashboard,
  MascotId,
  MascotPersonality,
  SaveSettingsInput,
  Settings,
} from './lib/types';

const formatMinutes = (minutes: number) => {
  const hours = Math.floor(minutes / 60);
  const rest = minutes % 60;
  return hours ? `${hours}h ${rest}m` : `${rest}m`;
};

const formatRecovery = (seconds: number | null) => {
  if (seconds == null) return '—';
  const minutes = Math.floor(seconds / 60);
  const rest = seconds % 60;
  return minutes ? `${minutes}m ${rest}s` : `${rest}s`;
};

export default function App() {
  const [dashboard, setDashboard] = useState<Dashboard | null>(null);
  const [settings, setSettings] = useState<Settings | null>(null);
  const [intentDraft, setIntentDraft] = useState('');
  const [settingsOpen, setSettingsOpen] = useState(false);
  const [saving, setSaving] = useState(false);
  const [probeMessage, setProbeMessage] = useState<string | null>(null);
  const [apiKeyDraft, setApiKeyDraft] = useState('');

  const [onboardingMascot, setOnboardingMascot] = useState<MascotId>('otter');
  const [onboardingPersonality, setOnboardingPersonality] = useState<MascotPersonality>('playful');
  const [onboardingName, setOnboardingName] = useState('Pip');
  const [onboardingCapture, setOnboardingCapture] = useState<Settings['capture_mode']>('context_redacted');

  async function refresh() {
    const next = await getDashboard();
    setDashboard(next);
    setIntentDraft((current) => current || next.active_intent || '');
  }

  useEffect(() => {
    void refresh();
    void getSettings().then(setSettings);
    const interval = window.setInterval(() => void refresh(), 10_000);
    return () => window.clearInterval(interval);
  }, []);

  const observedMinutes = useMemo(() => {
    if (!dashboard) return 0;
    return dashboard.focus_minutes + dashboard.neutral_minutes + dashboard.drift_minutes;
  }, [dashboard]);

  const focusShare = useMemo(() => {
    if (!dashboard || observedMinutes <= 0) return 0;
    return Math.round((dashboard.focus_minutes / observedMinutes) * 100);
  }, [dashboard, observedMinutes]);

  if (!dashboard || !settings) {
    return <main className="loading">Waking your companion…</main>;
  }

  async function completeOnboarding() {
    if (!settings) return;
    setSaving(true);
    try {
      const next = await saveSettings({
        ...settings,
        onboarding_complete: true,
        capture_mode: onboardingCapture,
        mascot: onboardingMascot,
        mascot_personality: onboardingPersonality,
        companion_name: onboardingName.trim() || 'Pip',
      });
      setSettings(next);
      await refresh();
    } finally {
      setSaving(false);
    }
  }

  async function submitIntent(event: FormEvent) {
    event.preventDefault();
    const value = intentDraft.trim();
    if (value) await setIntent(value);
    else await clearIntent();
    await refresh();
  }

  async function persistSettings(event: FormEvent) {
    event.preventDefault();
    if (!settings) return;
    setSaving(true);
    setProbeMessage(null);
    try {
      const input: SaveSettingsInput = {
        ...settings,
        byo_api_key: apiKeyDraft.trim() || undefined,
      };
      const next = await saveSettings(input);
      setSettings(next);
      setApiKeyDraft('');
      setProbeMessage('Saved. New activity will use these settings.');
    } catch (error) {
      setProbeMessage(String(error));
    } finally {
      setSaving(false);
    }
  }

  async function testProvider() {
    if (!settings) return;
    setProbeMessage('Testing provider…');
    try {
      const result = await probeProvider({
        ...settings,
        byo_api_key: apiKeyDraft.trim() || undefined,
      });
      setProbeMessage(result.message);
    } catch (error) {
      setProbeMessage(String(error));
    }
  }

  if (!settings.onboarding_complete) {
    return (
      <main className="onboarding">
        <section className="onboarding__preview">
          <Mascot mascot={onboardingMascot} state="neutral" name={onboardingName} />
          <h2>{onboardingName.trim() || mascotById(onboardingMascot).name}</h2>
          <p>{mascotById(onboardingMascot).tagline}</p>
        </section>
        <section className="onboarding__content">
          <p className="eyebrow">FIRST RUN · PRIVATE BY DEFAULT</p>
          <h1>Choose your focus companion.</h1>
          <p>
            Species and personality affect presentation and nudge wording only. They never change what FlowPet captures or how activity is classified.
          </p>

          <div className="mascot-grid" role="radiogroup" aria-label="Companion animal">
            {MASCOTS.map((mascot) => (
              <button
                key={mascot.id}
                type="button"
                className={onboardingMascot === mascot.id ? 'choice active' : 'choice'}
                onClick={() => setOnboardingMascot(mascot.id)}
              >
                <Mascot mascot={mascot.id} state="neutral" size="tiny" />
                <strong>{mascot.name}</strong>
                <small>{mascot.tagline}</small>
              </button>
            ))}
          </div>

          <div className="form-grid">
            <label>
              Companion name
              <input
                maxLength={24}
                value={onboardingName}
                onChange={(event) => setOnboardingName(event.target.value)}
                placeholder="Pip"
              />
            </label>
            <label>
              Personality
              <select
                value={onboardingPersonality}
                onChange={(event) => setOnboardingPersonality(event.target.value as MascotPersonality)}
              >
                {PERSONALITIES.map((personality) => (
                  <option key={personality.id} value={personality.id}>
                    {personality.name} · {personality.description}
                  </option>
                ))}
              </select>
            </label>
          </div>

          <h2>Choose what FlowPet may notice.</h2>
          <div className="capture-grid" role="radiogroup" aria-label="Activity capture mode">
            <button
              type="button"
              className={onboardingCapture === 'app_only' ? 'capture active' : 'capture'}
              onClick={() => setOnboardingCapture('app_only')}
            >
              <strong>App only</strong>
              <small>Process name only</small>
            </button>
            <button
              type="button"
              className={onboardingCapture === 'context_redacted' ? 'capture active' : 'capture'}
              onClick={() => setOnboardingCapture('context_redacted')}
            >
              <strong>Redacted context</strong>
              <small>Recommended</small>
            </button>
            <button
              type="button"
              className={onboardingCapture === 'context' ? 'capture active' : 'capture'}
              onClick={() => setOnboardingCapture('context')}
            >
              <strong>Full window title</strong>
              <small>Most context</small>
            </button>
          </div>
          <p className="privacy-note">
            No screenshots, keystrokes, clipboard capture, microphone, or document bodies. Tracking stays paused until you start it here.
          </p>
          <button className="primary" disabled={saving} onClick={() => void completeOnboarding()}>
            {saving ? 'Starting…' : 'Start local tracking'}
          </button>
        </section>
      </main>
    );
  }

  const petState = derivePetState(dashboard);
  const companionName = settings.companion_name.trim() || mascotById(settings.mascot).name;

  return (
    <main className="shell">
      <header>
        <div>
          <p className="eyebrow">LOCAL-FIRST FOCUS COMPANION</p>
          <h1>Today’s flow</h1>
        </div>
        <div className="actions">
          <span className="pill">{dashboard.provider_status}</span>
          {dashboard.break_until ? (
            <button onClick={() => void endBreak().then(refresh)}>End intentional break</button>
          ) : null}
          <button onClick={() => void setTrackingPaused(!dashboard.tracking_paused).then(refresh)}>
            {dashboard.tracking_paused ? 'Resume' : 'Pause'} tracking
          </button>
          <button onClick={() => setSettingsOpen(true)}>Settings</button>
        </div>
      </header>

      <section className={`hero hero--${dashboard.current_label}`}>
        <div>
          <span className="kicker">NOW</span>
          <h2>
            {dashboard.tracking_paused
              ? 'Tracking is resting.'
              : dashboard.current_label === 'focus'
                ? 'You’re on the thread.'
                : dashboard.current_label === 'drift'
                  ? 'The thread slipped.'
                  : 'Between arcs.'}
          </h2>
          <p className="current-context">
            <strong>{dashboard.current_process || 'Waiting for foreground activity'}</strong>
            {dashboard.current_title ? ` · ${dashboard.current_title}` : ''}
          </p>
          <p>{dashboard.current_reason || 'FlowPet will classify this once it has enough context.'}</p>
          <form onSubmit={submitIntent}>
            <label>What matters right now?</label>
            <div className="intent">
              <input
                value={intentDraft}
                onChange={(event) => setIntentDraft(event.target.value)}
                placeholder="Finish the API error handling"
              />
              <button>Set intent</button>
            </div>
          </form>
        </div>
        <div className="hero__pet">
          <Mascot mascot={settings.mascot} state={petState} name={companionName} />
          <p>{companionName} · {mascotById(settings.mascot).tagline}</p>
        </div>
      </section>

      <section className="metrics">
        <article><span>Focus</span><strong>{formatMinutes(dashboard.focus_minutes)}</strong><small>confirmed productive context</small></article>
        <article><span>Drift</span><strong>{formatMinutes(dashboard.drift_minutes)}</strong><small>confirmed off-intent context</small></article>
        <article><span>Recoveries</span><strong>{dashboard.recovery_count}</strong><small>returns from drift today</small></article>
        <article><span>Median return</span><strong>{formatRecovery(dashboard.median_recovery_seconds)}</strong><small>{focusShare}% focus share · {formatMinutes(observedMinutes)} observed</small></article>
      </section>

      <section className="dashboard-grid">
        <article className="panel">
          <div className="panel__head">
            <div><span className="kicker">TRACE</span><h3>Recent attention</h3></div>
            <span className="muted">automatic · no timer</span>
          </div>
          <div className="segment-list">
            {dashboard.segments.slice(-12).reverse().map((segment) => (
              <div className="segment" key={segment.id}>
                <i className={`state-dot state-dot--${segment.label}`} />
                <div>
                  <strong>{segment.process_name}</strong>
                  <span>{segment.context_title || segment.category}</span>
                </div>
                <small>{segment.label} · {Math.round(segment.confidence * 100)}%</small>
              </div>
            ))}
            {dashboard.segments.length === 0 ? <p className="empty">No activity yet.</p> : null}
          </div>
        </article>

        <article className="panel">
          <div className="panel__head">
            <div><span className="kicker">RECOVERY</span><h3>Return skill</h3></div>
          </div>
          <div className="recovery-card">
            <strong>{formatRecovery(dashboard.median_recovery_seconds)}</strong>
            <span>median recovery</span>
            <p>FlowPet rewards getting back to what matters, not pretending drift never happens.</p>
          </div>
        </article>
      </section>

      <section className="panel quests-panel">
        <div className="panel__head">
          <div><span className="kicker">QUESTS</span><h3>Small wins {companionName} can notice</h3></div>
          <span className="muted">generated locally</span>
        </div>
        <div className="quests">
          {dashboard.quests.map((quest) => (
            <article key={quest.id} className={quest.completed ? 'quest done' : 'quest'}>
              <strong>{quest.title}</strong>
              <p>{quest.description}</p>
              <div className="quest-progress"><span style={{ width: `${Math.min(100, (quest.progress / Math.max(1, quest.target)) * 100)}%` }} /></div>
              <small>{quest.progress}/{quest.target}{quest.completed ? ' · complete' : ''}</small>
            </article>
          ))}
        </div>
      </section>

      {settingsOpen ? (
        <div className="modal" onMouseDown={() => setSettingsOpen(false)}>
          <form className="settings" onSubmit={persistSettings} onMouseDown={(event) => event.stopPropagation()}>
            <div className="settings__head">
              <div><p className="eyebrow">CONTROL ROOM</p><h2>Settings</h2></div>
              <button type="button" onClick={() => setSettingsOpen(false)}>×</button>
            </div>

            <fieldset>
              <legend>Companion</legend>
              <div className="companion-preview">
                <Mascot mascot={settings.mascot} state="neutral" name={companionName} size="small" />
                <div><strong>{companionName}</strong><span>{mascotById(settings.mascot).tagline}</span></div>
              </div>
              <div className="mascot-grid small" role="radiogroup" aria-label="Companion animal">
                {MASCOTS.map((mascot) => (
                  <button
                    type="button"
                    key={mascot.id}
                    className={settings.mascot === mascot.id ? 'choice active' : 'choice'}
                    onClick={() => setSettings({ ...settings, mascot: mascot.id })}
                  >
                    <Mascot mascot={mascot.id} state="neutral" size="tiny" />
                    <strong>{mascot.name}</strong>
                  </button>
                ))}
              </div>
              <label>
                Companion name
                <input
                  maxLength={24}
                  value={settings.companion_name}
                  onChange={(event) => setSettings({ ...settings, companion_name: event.target.value })}
                />
              </label>
              <label>
                Personality
                <select
                  value={settings.mascot_personality}
                  onChange={(event) => setSettings({ ...settings, mascot_personality: event.target.value as MascotPersonality })}
                >
                  {PERSONALITIES.map((personality) => (
                    <option key={personality.id} value={personality.id}>
                      {personality.name} · {personality.description}
                    </option>
                  ))}
                </select>
              </label>
              <label className="toggle">Desktop pet<input type="checkbox" checked={settings.pet_enabled} onChange={(event) => setSettings({ ...settings, pet_enabled: event.target.checked })} /></label>
              <label className="toggle">Adaptive nudges<input type="checkbox" checked={settings.nudge_enabled} onChange={(event) => setSettings({ ...settings, nudge_enabled: event.target.checked })} /></label>
              <div className="form-grid">
                <label>
                  Base drift delay (seconds)
                  <input type="number" min={45} max={1800} value={settings.drift_nudge_after_seconds} onChange={(event) => setSettings({ ...settings, drift_nudge_after_seconds: Number(event.target.value) })} />
                </label>
                <label>
                  Nudge cooldown (seconds)
                  <input type="number" min={120} max={7200} value={settings.nudge_cooldown_seconds} onChange={(event) => setSettings({ ...settings, nudge_cooldown_seconds: Number(event.target.value) })} />
                </label>
              </div>
            </fieldset>

            <fieldset>
              <legend>Privacy</legend>
              <label>
                Capture mode
                <select value={settings.capture_mode} onChange={(event) => setSettings({ ...settings, capture_mode: event.target.value as Settings['capture_mode'] })}>
                  <option value="app_only">App only</option>
                  <option value="context_redacted">App + redacted window title</option>
                  <option value="context">App + full window title</option>
                </select>
              </label>
              <p className="fieldset-help">FlowPet never captures screenshots or keystrokes. Model providers receive only compact foreground context when you explicitly enable them.</p>
            </fieldset>

            <fieldset>
              <legend>Classification route</legend>
              <label>
                Provider
                <select value={settings.provider} onChange={(event) => setSettings({ ...settings, provider: event.target.value as Settings['provider'] })}>
                  <option value="rules">Rules only · fully local</option>
                  <option value="ollama">Ollama · local model</option>
                  <option value="openai_compatible">OpenAI-compatible · BYO</option>
                </select>
              </label>

              {settings.provider === 'ollama' ? (
                <>
                  <label>Ollama URL<input value={settings.ollama_base_url} onChange={(event) => setSettings({ ...settings, ollama_base_url: event.target.value })} /></label>
                  <label>Model<input value={settings.ollama_model} onChange={(event) => setSettings({ ...settings, ollama_model: event.target.value })} placeholder="qwen3:4b" /></label>
                </>
              ) : null}

              {settings.provider === 'openai_compatible' ? (
                <>
                  <label>Base URL<input value={settings.byo_base_url} onChange={(event) => setSettings({ ...settings, byo_base_url: event.target.value })} placeholder="https://provider.example/v1" /></label>
                  <label>Model<input value={settings.byo_model} onChange={(event) => setSettings({ ...settings, byo_model: event.target.value })} /></label>
                  <label>
                    API key
                    <input
                      type="password"
                      autoComplete="off"
                      value={apiKeyDraft}
                      onChange={(event) => setApiKeyDraft(event.target.value)}
                      placeholder={settings.has_byo_api_key ? 'Stored in OS credential vault · enter to replace' : 'Enter API key'}
                    />
                  </label>
                </>
              ) : null}

              <button type="button" onClick={() => void testProvider()}>Test provider</button>
              {probeMessage ? <p className="probe-message">{probeMessage}</p> : null}
            </fieldset>

            <div className="actions sticky-actions">
              <button type="button" onClick={() => setSettingsOpen(false)}>Cancel</button>
              <button className="primary" disabled={saving}>{saving ? 'Saving…' : 'Save settings'}</button>
            </div>
          </form>
        </div>
      ) : null}
    </main>
  );
}
