import { FormEvent, useEffect, useMemo, useRef, useState } from 'react';
import {
  Activity,
  AlarmClock,
  BarChart3,
  Bell,
  BookOpen,
  CalendarDays,
  CheckCircle2,
  Clock3,
  Database,
  Download,
  Flame,
  LayoutDashboard,
  LogOut,
  Play,
  Plus,
  RefreshCw,
  RotateCcw,
  Save,
  ShieldCheck,
  Sparkles,
  Square,
  TimerReset,
  Trash2,
  Upload
} from 'lucide-react';
import {
  Account,
  AppState,
  Goal,
  GoalStatus,
  PLANNING_HORIZON_MONTHS,
  PlanLevel,
  StudyPlan,
  StudySession,
  TEST_ACCOUNTS,
  actualMinutes,
  actualMinutesForGoal,
  dateSortAsc,
  defaultState,
  formatTimer,
  getGoal,
  goalCompletionRate,
  horizonEndIso,
  hoursLabel,
  isWithinPlanningHorizon,
  loadState,
  minutesLabel,
  minutesToHours,
  monthIso,
  plannedMinutes,
  reminderMessages,
  saveState,
  sixMonthPlans,
  todayIso,
  toDateTime,
  uid,
  upcomingPlans,
  SESSION_USER_KEY
} from './domain';
import './styles.css';

type ViewKey = 'dashboard' | 'goals' | 'planning' | 'timer' | 'analytics' | 'reminders' | 'data';

const NAV_ITEMS: Array<{ key: ViewKey; label: string; icon: typeof LayoutDashboard }> = [
  { key: 'dashboard', label: 'Dashboard', icon: LayoutDashboard },
  { key: 'goals', label: 'Lernziele', icon: BookOpen },
  { key: 'planning', label: 'Planung', icon: CalendarDays },
  { key: 'timer', label: 'Stoppuhr', icon: Clock3 },
  { key: 'analytics', label: 'Auswertung', icon: BarChart3 },
  { key: 'reminders', label: 'Erinnerungen', icon: Bell },
  { key: 'data', label: 'Daten & Export', icon: Database }
];


const PAGE_META: Record<ViewKey, { eyebrow: string; description: string }> = {
  dashboard: {
    eyebrow: 'Überblick',
    description: 'Aktuelle Kennzahlen, nächste Lernblöcke und offene Hinweise auf einen Blick.'
  },
  goals: {
    eyebrow: 'Ziele verwalten',
    description: 'Lernziele mit Zieldatum, Status und geplantem Aufwand anlegen und nachverfolgen.'
  },
  planning: {
    eyebrow: 'Lernzeiten planen',
    description: 'Grobplanung für sechs Monate und Detailplanung für den ausgewählten Monat erstellen.'
  },
  timer: {
    eyebrow: 'Lernzeit erfassen',
    description: 'Ungestörte Lernzeit live messen und anschließend einem Lernziel zuordnen.'
  },
  analytics: {
    eyebrow: 'Fortschritt auswerten',
    description: 'Geplante und erfasste Lernzeiten vergleichen sowie Zielerreichung prüfen.'
  },
  reminders: {
    eyebrow: 'Hinweise und Regeln',
    description: 'Erinnerungen zu Lernblöcken, nahenden Zielterminen und Inaktivität prüfen.'
  },
  data: {
    eyebrow: 'Datenverwaltung',
    description: 'Daten exportieren, importieren und Demo-Daten für die Prüfung zurücksetzen.'
  }
};

const deutschDatum = new Intl.DateTimeFormat('de-DE', { dateStyle: 'medium' });
const deutschZeit = new Intl.DateTimeFormat('de-DE', { timeStyle: 'short' });
const deutschDatumZeit = new Intl.DateTimeFormat('de-DE', { dateStyle: 'medium', timeStyle: 'short' });

function statusLabel(status: GoalStatus): string {
  return status === 'in_bearbeitung' ? 'in Bearbeitung' : status;
}

function statusClass(status: GoalStatus): string {
  return status.replace('_', '-');
}

function levelLabel(level: PlanLevel): string {
  return level === 'grob' ? 'Grobplanung · 6 Monate' : 'Detailplanung · 1 Monat';
}

function clamp(value: number, min = 0, max = 100): number {
  return Math.max(min, Math.min(max, value));
}

function downloadText(filename: string, text: string, mime = 'application/json'): void {
  const blob = new Blob([text], { type: `${mime};charset=utf-8` });
  const href = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = href;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  a.remove();
  URL.revokeObjectURL(href);
}

export default function App() {
  const [account, setAccount] = useState<Account | null>(() => {
    const username = localStorage.getItem(SESSION_USER_KEY);
    return TEST_ACCOUNTS.find((item) => item.username === username) ?? null;
  });
  const [state, setState] = useState<AppState | null>(() => {
    const username = localStorage.getItem(SESSION_USER_KEY);
    return username ? loadState(username) : null;
  });
  const [view, setView] = useState<ViewKey>('dashboard');
  const [toast, setToast] = useState('');

  useEffect(() => {
    if (!state) return;
    saveState(state);
  }, [state]);

  function notify(message: string) {
    setToast(message);
    window.clearTimeout(Number((notify as unknown as { timer?: number }).timer));
    (notify as unknown as { timer?: number }).timer = window.setTimeout(() => setToast(''), 3500);
  }

  function handleLogin(username: string, password: string): boolean {
    const found = TEST_ACCOUNTS.find((item) => item.username === username.trim() && item.password === password);
    if (!found) return false;
    localStorage.setItem(SESSION_USER_KEY, found.username);
    setAccount(found);
    setState(loadState(found.username));
    setView('dashboard');
    notify(`Willkommen, ${found.name}.`);
    return true;
  }

  function logout() {
    localStorage.removeItem(SESSION_USER_KEY);
    setAccount(null);
    setState(null);
  }

  if (!account || !state) {
    return <LoginScreen onLogin={handleLogin} />;
  }

  const activeTitle = NAV_ITEMS.find((item) => item.key === view)?.label ?? 'Dashboard';
  const activeMeta = PAGE_META[view];

  return (
    <div className="app-shell">
      <aside className="sidebar">
        <div className="brand-panel">
          <div className="brand-mark">LM</div>
          <div>
            <strong>Lernzeit-Manager</strong>
            <span>MS4 · Thema A</span>
          </div>
        </div>
        <nav className="nav-list" aria-label="Hauptnavigation">
          {NAV_ITEMS.map(({ key, label, icon: Icon }) => (
            <button key={key} className={view === key ? 'active' : ''} onClick={() => setView(key)}>
              <Icon size={18} />
              {label}
            </button>
          ))}
        </nav>
        <div className="sidebar-footer">
          <div className="user-chip">
            <span>{account.name}</span>
            <small>{account.role}</small>
          </div>
          <button className="ghost-button" onClick={logout}>
            <LogOut size={17} /> Abmelden
          </button>
        </div>
      </aside>

      <main className="main-content">
        <header className="hero-card">
          <div>
            <p className="eyebrow"><Sparkles size={15} /> {activeMeta.eyebrow}</p>
            <h1>{activeTitle}</h1>
            <p>{activeMeta.description}</p>
          </div>
          <div className="hero-actions">
            <button className="secondary-button" onClick={() => requestNotificationPermission(notify)}>
              <Bell size={17} /> Benachrichtigungen
            </button>
            <span className="date-pill">{deutschDatum.format(new Date())}</span>
          </div>
        </header>

        {toast && <div className="toast" role="status">{toast}</div>}

        {view === 'dashboard' && <Dashboard state={state} setView={setView} />}
        {view === 'goals' && <GoalsView state={state} setState={setState} notify={notify} />}
        {view === 'planning' && <PlanningView state={state} setState={setState} notify={notify} />}
        {view === 'timer' && <TimerView state={state} setState={setState} notify={notify} />}
        {view === 'analytics' && <AnalyticsView state={state} />}
        {view === 'reminders' && <RemindersView state={state} setState={setState} notify={notify} />}
        {view === 'data' && <DataView account={account} state={state} setState={setState} notify={notify} />}
      </main>
    </div>
  );
}

function LoginScreen({ onLogin }: { onLogin: (username: string, password: string) => boolean }) {
  const [username, setUsername] = useState('student.demo');
  const [password, setPassword] = useState('Lernzeit2026!');
  const [error, setError] = useState('');

  function submit(event: FormEvent) {
    event.preventDefault();
    const ok = onLogin(username, password);
    setError(ok ? '' : 'Login fehlgeschlagen. Bitte Test-Account prüfen.');
  }

  return (
    <div className="login-shell">
      <section className="login-card">
        <div className="brand-panel large">
          <div className="brand-mark">LM</div>
          <div>
            <p className="eyebrow"><ShieldCheck size={15} /> MS4-Prototyp</p>
            <h1>Lernzeit-Manager</h1>
            <span>Browser-App für Lernziele, Lernplanung und Lernzeitmessung.</span>
          </div>
        </div>
        <form onSubmit={submit} className="stacked-form">
          <label>
            Benutzername
            <input value={username} autoComplete="username" onChange={(event) => setUsername(event.target.value)} required />
          </label>
          <label>
            Passwort
            <input value={password} autoComplete="current-password" type="password" onChange={(event) => setPassword(event.target.value)} required />
          </label>
          {error && <p className="form-error">{error}</p>}
          <button className="primary-button" type="submit">Anmelden</button>
        </form>
        <div className="test-accounts">
          <strong>Test-Accounts</strong>
          {TEST_ACCOUNTS.map((item) => (
            <button key={item.username} onClick={() => { setUsername(item.username); setPassword(item.password); }}>
              <span>{item.username}</span>
              <small>{item.password}</small>
            </button>
          ))}
        </div>
      </section>
    </div>
  );
}

function Dashboard({ state, setView }: { state: AppState; setView: (view: ViewKey) => void }) {
  const planned = plannedMinutes(state);
  const actual = actualMinutes(state);
  const progress = planned > 0 ? clamp(Math.round((actual / planned) * 100)) : 0;
  const next = upcomingPlans(state, 1)[0];
  const nextGoal = next ? getGoal(state, next.goalId) : undefined;
  const messages = reminderMessages(state);

  return (
    <div className="page-grid">
      <section className="metric-grid">
        <Metric icon={CalendarDays} label="Geplante Lernzeit" value={hoursLabel(minutesToHours(planned))} helper="Grob- und Detailplanung" />
        <Metric icon={Clock3} label="Erfasste Lernzeit" value={hoursLabel(minutesToHours(actual))} helper="gespeicherte Stoppuhr-Sitzungen" />
        <Metric icon={CheckCircle2} label="Zielerreichung" value={`${goalCompletionRate(state)} %`} helper="abgeschlossene Lernziele" />
        <Metric icon={AlarmClock} label="Nächster Lernblock" value={next ? deutschZeit.format(toDateTime(next.date, next.startTime)) : '–'} helper={nextGoal?.title ?? 'keine kommende Planung'} />
      </section>

      <section className="content-grid two-columns">
        <article className="card tall-card">
          <SectionHeader title="Plan/Ist-Fortschritt" text="Vergleich der geplanten Lernzeit mit den gespeicherten Stoppuhr-Sitzungen." />
          <div className="progress-block">
            <div><span>Gesamt</span><strong>{progress} %</strong></div>
            <div className="progress-track"><span style={{ width: `${progress}%` }} /></div>
          </div>
          <MiniBars state={state} />
          <button className="secondary-button full" onClick={() => setView('analytics')}><BarChart3 size={17} /> Zur Auswertung</button>
        </article>

        <article className="card tall-card">
          <SectionHeader title="Aktuelle Hinweise" text="Wichtige Hinweise zu bevorstehenden Lernblöcken, Zielterminen und Lernpausen." />
          <div className="message-list">
            {messages.length === 0 ? <EmptyState text="Aktuell liegen keine kritischen Hinweise vor." /> : messages.map((message) => <Notice key={message} text={message} />)}
          </div>
          <button className="primary-button full" onClick={() => setView('timer')}><Play size={17} /> Lernzeit starten</button>
        </article>
      </section>

      <section className="content-grid two-columns">
        <article className="card">
          <SectionHeader title="Nächste Lernblöcke" text="Die nächsten geplanten Lerneinheiten in chronologischer Reihenfolge." />
          <PlanList plans={upcomingPlans(state, 4)} state={state} compact />
        </article>
        <article className="card">
          <SectionHeader title="Lernziele im Blick" text="Auszug der Lernziele mit Status, Zieldatum und erfasster Lernzeit." />
          <GoalList goals={dateSortAsc(state.goals).slice(0, 4)} state={state} compact />
        </article>
      </section>
    </div>
  );
}

function Metric({ icon: Icon, label, value, helper }: { icon: typeof LayoutDashboard; label: string; value: string; helper: string }) {
  return (
    <article className="metric-card card">
      <div className="metric-icon"><Icon size={21} /></div>
      <span>{label}</span>
      <strong>{value}</strong>
      <small>{helper}</small>
    </article>
  );
}

function GoalsView({ state, setState, notify }: { state: AppState; setState: (state: AppState) => void; notify: (message: string) => void }) {
  const [form, setForm] = useState({ title: '', type: 'Modul', module: '', targetDate: todayIso(), plannedHours: 20, status: 'offen' as GoalStatus, description: '' });

  function submit(event: FormEvent) {
    event.preventDefault();
    if (!form.title.trim()) {
      notify('Bitte einen Titel für das Lernziel eingeben.');
      return;
    }
    if (!isWithinPlanningHorizon(form.targetDate)) {
      notify(`Das Zieldatum muss innerhalb des ${PLANNING_HORIZON_MONTHS}-Monats-Horizonts liegen.`);
      return;
    }
    if (Number(form.plannedHours) <= 0) {
      notify('Die geplanten Stunden müssen größer als 0 sein.');
      return;
    }
    const goal: Goal = {
      id: uid('goal'),
      title: form.title.trim(),
      type: form.type,
      module: form.module.trim(),
      targetDate: form.targetDate,
      plannedHours: Number(form.plannedHours),
      status: form.status,
      description: form.description.trim(),
      achievedAt: form.status === 'erreicht' ? new Date().toISOString() : null,
      createdAt: new Date().toISOString()
    };
    setState({ ...state, goals: [goal, ...state.goals] });
    setForm({ title: '', type: 'Modul', module: '', targetDate: todayIso(), plannedHours: 20, status: 'offen', description: '' });
    notify('Lernziel gespeichert.');
  }

  function updateGoal(goalId: string, patch: Partial<Goal>) {
    setState({ ...state, goals: state.goals.map((goal) => goal.id === goalId ? { ...goal, ...patch } : goal) });
  }

  function deleteGoal(goalId: string) {
    setState({ ...state, goals: state.goals.filter((goal) => goal.id !== goalId), plans: state.plans.filter((plan) => plan.goalId !== goalId), sessions: state.sessions.filter((session) => session.goalId !== goalId) });
    notify('Lernziel und zugehörige Einträge gelöscht.');
  }

  return (
    <section className="content-grid two-columns">
      <article className="card">
        <SectionHeader title="Lernziel anlegen" text="Erfasse ein konkretes Ziel mit Termin, geplanter Lernzeit und aktuellem Bearbeitungsstatus." />
        <form className="form-grid" onSubmit={submit}>
          <label className="span-2">Titel<input value={form.title} onChange={(e) => setForm({ ...form, title: e.target.value })} placeholder="z. B. ISEF01 Projektbericht einreichen" required /></label>
          <label>Typ<select value={form.type} onChange={(e) => setForm({ ...form, type: e.target.value })}><option>Modul</option><option>Klausur</option><option>Projektbericht</option><option>Zwischenziel</option><option>Sonstiges Lernziel</option></select></label>
          <label>Modul / Thema<input value={form.module} onChange={(e) => setForm({ ...form, module: e.target.value })} placeholder="z. B. ISEF01" /></label>
          <label>Zieldatum<input type="date" min={todayIso()} max={horizonEndIso()} value={form.targetDate} onChange={(e) => setForm({ ...form, targetDate: e.target.value })} required /></label>
          <label>Geplante Stunden<input type="number" min="0.5" step="0.5" value={form.plannedHours} onChange={(e) => setForm({ ...form, plannedHours: Number(e.target.value) })} required /></label>
          <label>Status<select value={form.status} onChange={(e) => setForm({ ...form, status: e.target.value as GoalStatus })}><option value="offen">offen</option><option value="in_bearbeitung">in Bearbeitung</option><option value="erreicht">erreicht</option></select></label>
          <label className="span-2">Beschreibung<textarea value={form.description} onChange={(e) => setForm({ ...form, description: e.target.value })} rows={4} placeholder="Woran erkennt man die Zielerreichung?" /></label>
          <button className="primary-button span-2" type="submit"><Plus size={17} /> Lernziel speichern</button>
        </form>
      </article>

      <article className="card">
        <SectionHeader title="Lernziele" text="Hier werden alle Ziele angezeigt und können als erreicht markiert oder entfernt werden." />
        <div className="goal-editor-list">
          {dateSortAsc(state.goals).map((goal) => {
            const actualHours = minutesToHours(actualMinutesForGoal(state, goal.id));
            const percent = goal.plannedHours > 0 ? clamp(Math.round((actualHours / goal.plannedHours) * 100)) : 0;
            return (
              <article className="list-card" key={goal.id}>
                <div className="list-main">
                  <div className="row-wrap">
                    <span className={`status-badge ${statusClass(goal.status)}`}>{statusLabel(goal.status)}</span>
                    <span className="soft-badge">{goal.type}</span>
                    {goal.module && <span className="soft-badge">{goal.module}</span>}
                  </div>
                  <h3>{goal.title}</h3>
                  <p>{goal.description || 'Keine Beschreibung hinterlegt.'}</p>
                  <div className="progress-block small">
                    <div><span>Ist {hoursLabel(actualHours)} / Plan {hoursLabel(goal.plannedHours)}</span><strong>{percent} %</strong></div>
                    <div className="progress-track"><span style={{ width: `${percent}%` }} /></div>
                  </div>
                  <small>Zieldatum: {deutschDatum.format(new Date(goal.targetDate))}</small>
                </div>
                <div className="list-actions">
                  <button className="secondary-button" onClick={() => updateGoal(goal.id, { status: goal.status === 'erreicht' ? 'in_bearbeitung' : 'erreicht', achievedAt: goal.status === 'erreicht' ? null : new Date().toISOString() })}>
                    <CheckCircle2 size={16} /> {goal.status === 'erreicht' ? 'Zurücksetzen' : 'Erreicht'}
                  </button>
                  <button className="danger-button" onClick={() => deleteGoal(goal.id)}><Trash2 size={16} /> Löschen</button>
                </div>
              </article>
            );
          })}
        </div>
      </article>
    </section>
  );
}

function PlanningView({ state, setState, notify }: { state: AppState; setState: (state: AppState) => void; notify: (message: string) => void }) {
  const [month, setMonth] = useState(monthIso());
  const [form, setForm] = useState({ date: todayIso(), startTime: '18:00', duration: 90, goalId: state.goals[0]?.id ?? '', level: 'detail' as PlanLevel, reminderMinutes: 15, focus: '' });

  useEffect(() => {
    if (!form.goalId && state.goals[0]) setForm((current) => ({ ...current, goalId: state.goals[0].id }));
  }, [state.goals, form.goalId]);

  function submit(event: FormEvent) {
    event.preventDefault();
    if (!form.goalId) {
      notify('Bitte zuerst ein Lernziel anlegen oder auswählen.');
      return;
    }
    if (!isWithinPlanningHorizon(form.date)) {
      notify(`Der Lernblock muss innerhalb des ${PLANNING_HORIZON_MONTHS}-Monats-Horizonts liegen.`);
      return;
    }
    if (form.level === 'detail' && !form.date.startsWith(month)) {
      notify('Detailplanungen müssen im ausgewählten Monatsfilter liegen.');
      return;
    }
    if (Number(form.duration) < 15) {
      notify('Ein Lernblock muss mindestens 15 Minuten dauern.');
      return;
    }
    const plan: StudyPlan = {
      id: uid('plan'),
      date: form.date,
      startTime: form.startTime,
      duration: Number(form.duration),
      goalId: form.goalId,
      level: form.level,
      reminderMinutes: Number(form.reminderMinutes),
      focus: form.focus.trim(),
      done: false,
      createdAt: new Date().toISOString()
    };
    setState({ ...state, plans: [plan, ...state.plans] });
    setForm({ ...form, focus: '' });
    notify('Lernzeitplanung gespeichert.');
  }

  function toggleDone(planId: string) {
    setState({ ...state, plans: state.plans.map((plan) => plan.id === planId ? { ...plan, done: !plan.done } : plan) });
  }

  function deletePlan(planId: string) {
    setState({ ...state, plans: state.plans.filter((plan) => plan.id !== planId) });
    notify('Planung gelöscht.');
  }

  const monthPlans = dateSortAsc(state.plans).filter((plan) => plan.date.startsWith(month));
  const horizonPlans = sixMonthPlans(state);

  return (
    <section className="content-grid two-columns">
      <article className="card">
        <SectionHeader title="Lernzeit planen" text="Lege Lernblöcke mit Datum, Uhrzeit, Dauer, Lernziel und Fokus fest." />
        <form className="form-grid" onSubmit={submit}>
          <label>Datum<input type="date" min={todayIso()} max={horizonEndIso()} value={form.date} onChange={(e) => setForm({ ...form, date: e.target.value })} required /></label>
          <label>Startzeit<input type="time" value={form.startTime} onChange={(e) => setForm({ ...form, startTime: e.target.value })} required /></label>
          <label>Dauer in Minuten<input type="number" min="15" step="15" value={form.duration} onChange={(e) => setForm({ ...form, duration: Number(e.target.value) })} required /></label>
          <label>Lernziel<select value={form.goalId} disabled={state.goals.length === 0} onChange={(e) => setForm({ ...form, goalId: e.target.value })}>{state.goals.map((goal) => <option key={goal.id} value={goal.id}>{goal.title}</option>)}</select></label>
          <label>Planungsebene<select value={form.level} onChange={(e) => setForm({ ...form, level: e.target.value as PlanLevel })}><option value="grob">Grobplanung · sechs Monate</option><option value="detail">Detailplanung · aktueller Monat</option></select></label>
          <label>Erinnerung<select value={form.reminderMinutes} onChange={(e) => setForm({ ...form, reminderMinutes: Number(e.target.value) })}><option value="0">keine</option><option value="15">15 Minuten vorher</option><option value="30">30 Minuten vorher</option><option value="60">60 Minuten vorher</option></select></label>
          <label className="span-2">Zwischenziel / Fokus<textarea value={form.focus} onChange={(e) => setForm({ ...form, focus: e.target.value })} rows={4} placeholder="z. B. Kapitel 3 abschließen, Karteikarten wiederholen" /></label>
          <button className="primary-button span-2" disabled={state.goals.length === 0} type="submit"><Save size={17} /> Planung speichern</button>
        </form>
      </article>

      <article className="card">
        <div className="section-header inline-header">
          <div>
            <h2>Monatsplanung</h2>
            <p>Detail- und Grobplanungen im gewählten Monat.</p>
          </div>
          <label className="compact-label">Monat<input type="month" value={month} onChange={(e) => { setMonth(e.target.value); if (form.level === 'detail' && !form.date.startsWith(e.target.value)) setForm({ ...form, date: `${e.target.value}-01` }); }} /></label>
        </div>
        <EditablePlanList plans={monthPlans} state={state} onToggle={toggleDone} onDelete={deletePlan} />
        <hr />
        <SectionHeader title="Sechsmonatsübersicht" text={`${horizonPlans.length} geplante Lernblöcke im relevanten Horizont.`} />
        <PlanList plans={horizonPlans.slice(0, 6)} state={state} compact />
      </article>
    </section>
  );
}

function TimerView({ state, setState, notify }: { state: AppState; setState: (state: AppState) => void; notify: (message: string) => void }) {
  const [goalId, setGoalId] = useState(state.goals[0]?.id ?? '');
  const [note, setNote] = useState('');
  const [running, setRunning] = useState(false);
  const [startedAt, setStartedAt] = useState<Date | null>(null);
  const [elapsed, setElapsed] = useState(0);
  const [now, setNow] = useState(Date.now());
  const intervalRef = useRef<number | null>(null);

  const shownElapsed = running && startedAt ? elapsed + now - startedAt.getTime() : elapsed;

  useEffect(() => {
    if (!running) return;
    setNow(Date.now());
    intervalRef.current = window.setInterval(() => setNow(Date.now()), 1000);
    return () => {
      if (intervalRef.current) window.clearInterval(intervalRef.current);
    };
  }, [running]);

  function startPause() {
    if (running && startedAt) {
      setElapsed((value) => value + Date.now() - startedAt.getTime());
      setStartedAt(null);
      setRunning(false);
      return;
    }
    setNow(Date.now());
    setStartedAt(new Date());
    setRunning(true);
  }

  function reset() {
    setRunning(false);
    setStartedAt(null);
    setElapsed(0);
  }

  function save() {
    const minutes = Math.max(1, Math.round(shownElapsed / 60000));
    const session: StudySession = {
      id: uid('session'),
      goalId,
      startedAt: new Date(Date.now() - shownElapsed).toISOString(),
      durationMinutes: minutes,
      note: note.trim() || 'Ungestörte Lernzeit per Stoppuhr erfasst.'
    };
    setState({ ...state, sessions: [session, ...state.sessions] });
    reset();
    setNote('');
    notify(`${minutesLabel(minutes)} Lernzeit gespeichert.`);
  }

  return (
    <section className="content-grid two-columns">
      <article className="card timer-card">
        <SectionHeader title="Ungestörte Lernzeit messen" text="Die Anzeige läuft live mit. Nach dem Speichern wird die Zeit dem ausgewählten Lernziel zugeordnet." />
        <div className="timer-display">{formatTimer(shownElapsed)}</div>
        <div className="timer-actions">
          <button className="primary-button" onClick={startPause}>{running ? <Square size={18} /> : <Play size={18} />} {running ? 'Pausieren' : 'Starten'}</button>
          <button className="secondary-button" onClick={reset}><TimerReset size={18} /> Zurücksetzen</button>
          <button className="success-button" disabled={shownElapsed < 1000 || !goalId} onClick={save}><Save size={18} /> Speichern</button>
        </div>
        <label>Lernziel<select value={goalId} onChange={(e) => setGoalId(e.target.value)}>{state.goals.map((goal) => <option key={goal.id} value={goal.id}>{goal.title}</option>)}</select></label>
        <label>Notiz<textarea value={note} onChange={(e) => setNote(e.target.value)} rows={4} placeholder="Was wurde gelernt?" /></label>
      </article>

      <article className="card">
        <SectionHeader title="Gespeicherte Lernzeiten" text="Alle gespeicherten Lernsitzungen mit Dauer, Ziel, Notiz und Startzeitpunkt." />
        <div className="session-list">
          {state.sessions.length === 0 ? <EmptyState text="Noch keine Lernzeiten erfasst." /> : state.sessions.map((session) => (
            <article className="list-card compact" key={session.id}>
              <div>
                <span className="soft-badge">{minutesLabel(session.durationMinutes)}</span>
                <h3>{getGoal(state, session.goalId)?.title ?? 'Gelöschtes Lernziel'}</h3>
                <p>{session.note}</p>
                <small>{deutschDatumZeit.format(new Date(session.startedAt))}</small>
              </div>
              <button className="danger-button icon-only" onClick={() => setState({ ...state, sessions: state.sessions.filter((item) => item.id !== session.id) })}><Trash2 size={16} /></button>
            </article>
          ))}
        </div>
      </article>
    </section>
  );
}

function AnalyticsView({ state }: { state: AppState }) {
  const totalPlanned = plannedMinutes(state);
  const totalActual = actualMinutes(state);
  const sixMonths = sixMonthPlans(state);

  return (
    <div className="page-grid">
      <section className="metric-grid">
        <Metric icon={Activity} label="Plan/Ist-Quote" value={`${totalPlanned > 0 ? clamp(Math.round((totalActual / totalPlanned) * 100)) : 0} %`} helper="bezogen auf geplante Lernzeit" />
        <Metric icon={BookOpen} label="Lernziele" value={`${state.goals.length}`} helper="im System erfasst" />
        <Metric icon={CheckCircle2} label="Erreicht" value={`${state.goals.filter((goal) => goal.status === 'erreicht').length}`} helper="abgeschlossene Ziele" />
        <Metric icon={Flame} label="Lernsitzungen" value={`${state.sessions.length}`} helper="per Stoppuhr gespeichert" />
      </section>
      <section className="content-grid two-columns">
        <article className="card tall-card">
          <SectionHeader title="Zielerreichung je Lernziel" text="Zeigt pro Lernziel, wie viel der geplanten Lernzeit bereits erfasst wurde." />
          <MiniBars state={state} large />
        </article>
        <article className="card tall-card">
          <SectionHeader title="Planungsqualität" text="Zählt geplante, detaillierte und bereits erledigte Lernblöcke." />
          <div className="analytics-stack">
            <QualityRow label="Grobplanung im 6-Monats-Horizont" value={sixMonths.filter((plan) => plan.level === 'grob').length} />
            <QualityRow label="Detailplanung im 6-Monats-Horizont" value={sixMonths.filter((plan) => plan.level === 'detail').length} />
            <QualityRow label="Abgehakte Lernblöcke" value={state.plans.filter((plan) => plan.done).length} />
            <QualityRow label="Offene Lernblöcke" value={state.plans.filter((plan) => !plan.done).length} />
          </div>
        </article>
      </section>
    </div>
  );
}

function RemindersView({ state, setState, notify }: { state: AppState; setState: (state: AppState) => void; notify: (message: string) => void }) {
  const messages = reminderMessages(state);
  const [inactiveDays, setInactiveDays] = useState(state.settings.inactiveDays);
  const [upcomingWindow, setUpcomingWindow] = useState(state.settings.upcomingWindow);
  const [autoReminder, setAutoReminder] = useState(state.settings.autoReminder);

  function saveSettings() {
    setState({ ...state, settings: { ...state.settings, inactiveDays: Number(inactiveDays), upcomingWindow: Number(upcomingWindow), autoReminder } });
    notify('Erinnerungseinstellungen gespeichert.');
  }

  function testNotification() {
    requestNotificationPermission((message) => notify(message)).then((granted) => {
      if (granted && 'Notification' in window) {
        new Notification('Lernzeit-Manager', { body: 'Testbenachrichtigung erfolgreich ausgelöst.' });
      }
    });
  }

  return (
    <section className="content-grid two-columns">
      <article className="card">
        <SectionHeader title="Erinnerungen" text="Aktuelle Hinweise zu Terminen, Lernblöcken und längeren Lernpausen." />
        <div className="message-list">
          {messages.length === 0 ? <EmptyState text="Keine Erinnerung aktiv. Planung sieht aktuell unkritisch aus." /> : messages.map((message) => <Notice key={message} text={message} />)}
        </div>
        <button className="primary-button full" onClick={testNotification}><Bell size={17} /> Testbenachrichtigung senden</button>
      </article>
      <article className="card">
        <SectionHeader title="Regeln konfigurieren" text="Lege fest, wann Inaktivität und nahende Zieltermine gemeldet werden sollen." />
        <div className="form-grid single">
          <label>Inaktivität melden ab Tagen<input type="number" min="1" value={inactiveDays} onChange={(e) => setInactiveDays(Number(e.target.value))} /></label>
          <label>Ziele erinnern in Tagen<input type="number" min="1" value={upcomingWindow} onChange={(e) => setUpcomingWindow(Number(e.target.value))} /></label>
          <label className="checkbox-label"><input type="checkbox" checked={autoReminder} onChange={(e) => setAutoReminder(e.target.checked)} /> Automatische Erinnerungsregeln aktivieren</label>
          <button className="primary-button" onClick={saveSettings}><Save size={17} /> Einstellungen speichern</button>
        </div>
      </article>
    </section>
  );
}

function DataView({ account, state, setState, notify }: { account: Account; state: AppState; setState: (state: AppState) => void; notify: (message: string) => void }) {
  const fileInput = useRef<HTMLInputElement | null>(null);

  function exportData() {
    downloadText(`lernzeit-manager-export-${todayIso()}.json`, JSON.stringify(state, null, 2));
    notify('Exportdatei erstellt.');
  }

  function exportReport() {
    const report = [
      '# Lernzeit-Manager Kurzbericht',
      '',
      `Benutzer: ${account.username}`,
      `Stand: ${new Date().toISOString()}`,
      `Lernziele: ${state.goals.length}`,
      `Planungen: ${state.plans.length}`,
      `Lernsitzungen: ${state.sessions.length}`,
      `Geplante Lernzeit: ${hoursLabel(minutesToHours(plannedMinutes(state)))}`,
      `Erfasste Lernzeit: ${hoursLabel(minutesToHours(actualMinutes(state)))}`,
      '',
      '## Ziele',
      ...state.goals.map((goal) => `- ${goal.title} (${statusLabel(goal.status)}), Zieldatum: ${goal.targetDate}, Plan: ${hoursLabel(goal.plannedHours)}`),
      '',
      '## Hinweise',
      ...(reminderMessages(state).length ? reminderMessages(state).map((message) => `- ${message}`) : ['- Keine aktuellen Hinweise.'])
    ].join('\n');
    downloadText(`lernzeit-manager-kurzbericht-${todayIso()}.md`, report, 'text/markdown');
  }

  function importData(file: File | undefined) {
    if (!file) return;
    const reader = new FileReader();
    reader.onload = () => {
      try {
        const imported = JSON.parse(String(reader.result)) as AppState;
        if (!Array.isArray(imported.goals) || !Array.isArray(imported.plans) || !Array.isArray(imported.sessions)) {
          throw new Error('Ungültiges Format');
        }
        setState({ ...imported, meta: { ...imported.meta, owner: account.username, updatedAt: new Date().toISOString() } });
        notify('Import erfolgreich.');
      } catch {
        notify('Import fehlgeschlagen: JSON-Format prüfen.');
      }
    };
    reader.readAsText(file);
  }

  return (
    <section className="content-grid two-columns">
      <article className="card">
        <SectionHeader title="Datenexport und Import" text="Sichere oder übertrage die lokal gespeicherten Lernziele, Planungen und Lernsitzungen." />
        <div className="button-grid">
          <button className="primary-button" onClick={exportData}><Download size={17} /> JSON exportieren</button>
          <button className="secondary-button" onClick={exportReport}><Download size={17} /> Kurzbericht exportieren</button>
          <button className="secondary-button" onClick={() => fileInput.current?.click()}><Upload size={17} /> JSON importieren</button>
          <button className="danger-button" onClick={() => { setState(defaultState(account.username)); notify('Demo-Daten wiederhergestellt.'); }}><RotateCcw size={17} /> Demo-Daten resetten</button>
          <input ref={fileInput} type="file" accept="application/json,.json" hidden onChange={(e) => importData(e.target.files?.[0])} />
        </div>
      </article>
      <article className="card">
        <SectionHeader title="Aktueller Datenbestand" text="Kurzer Überblick über die lokal gespeicherten Daten des angemeldeten Test-Accounts." />
        <div className="analytics-stack">
          <QualityRow label="Lernziele" value={state.goals.length} />
          <QualityRow label="Planungen" value={state.plans.length} />
          <QualityRow label="Lernsitzungen" value={state.sessions.length} />
          <QualityRow label="Aktive Hinweise" value={reminderMessages(state).length} />
        </div>
        <p className="muted">Die Daten werden nur im Browser für den aktuell angemeldeten Test-Account gespeichert. Für die Weitergabe kann der JSON-Export genutzt werden.</p>
      </article>
    </section>
  );
}

function SectionHeader({ title, text }: { title: string; text: string }) {
  return (
    <div className="section-header">
      <div>
        <h2>{title}</h2>
        <p>{text}</p>
      </div>
    </div>
  );
}

function GoalList({ goals, state, compact = false }: { goals: Goal[]; state: AppState; compact?: boolean }) {
  if (goals.length === 0) return <EmptyState text="Keine Lernziele vorhanden." />;
  return (
    <div className="mini-list">
      {goals.map((goal) => (
        <article key={goal.id} className={`mini-item ${compact ? 'compact' : ''}`}>
          <span className={`status-badge ${statusClass(goal.status)}`}>{statusLabel(goal.status)}</span>
          <h3>{goal.title}</h3>
          <small>{deutschDatum.format(new Date(goal.targetDate))} · {hoursLabel(minutesToHours(actualMinutesForGoal(state, goal.id)))} Ist / {hoursLabel(goal.plannedHours)} Plan</small>
        </article>
      ))}
    </div>
  );
}

function PlanList({ plans, state, compact = false }: { plans: StudyPlan[]; state: AppState; compact?: boolean }) {
  if (plans.length === 0) return <EmptyState text="Keine passenden Planungen vorhanden." />;
  return (
    <div className="mini-list">
      {plans.map((plan) => (
        <article key={plan.id} className={`mini-item ${compact ? 'compact' : ''}`}>
          <span className="soft-badge">{levelLabel(plan.level)}</span>
          <h3>{getGoal(state, plan.goalId)?.title ?? 'ohne Lernziel'}</h3>
          <p>{plan.focus}</p>
          <small>{deutschDatumZeit.format(toDateTime(plan.date, plan.startTime))} · {minutesLabel(plan.duration)}</small>
        </article>
      ))}
    </div>
  );
}

function EditablePlanList({ plans, state, onToggle, onDelete }: { plans: StudyPlan[]; state: AppState; onToggle: (id: string) => void; onDelete: (id: string) => void }) {
  if (plans.length === 0) return <EmptyState text="Für diesen Monat gibt es noch keine Planung." />;
  return (
    <div className="plan-editor-list">
      {plans.map((plan) => (
        <article key={plan.id} className={`list-card compact ${plan.done ? 'done' : ''}`}>
          <div>
            <div className="row-wrap"><span className="soft-badge">{levelLabel(plan.level)}</span>{plan.done && <span className="status-badge erreicht">erledigt</span>}</div>
            <h3>{getGoal(state, plan.goalId)?.title ?? 'ohne Lernziel'}</h3>
            <p>{plan.focus || 'Kein Fokus hinterlegt.'}</p>
            <small>{deutschDatumZeit.format(toDateTime(plan.date, plan.startTime))} · {minutesLabel(plan.duration)} · Erinnerung {plan.reminderMinutes} Min.</small>
          </div>
          <div className="list-actions horizontal">
            <button className="secondary-button" onClick={() => onToggle(plan.id)}><CheckCircle2 size={16} /> {plan.done ? 'Öffnen' : 'Erledigt'}</button>
            <button className="danger-button icon-only" onClick={() => onDelete(plan.id)}><Trash2 size={16} /></button>
          </div>
        </article>
      ))}
    </div>
  );
}

function Notice({ text }: { text: string }) {
  return <div className="notice"><Bell size={17} /> <span>{text}</span></div>;
}

function EmptyState({ text }: { text: string }) {
  return <div className="empty-state">{text}</div>;
}

function QualityRow({ label, value }: { label: string; value: number }) {
  return (
    <div className="quality-row">
      <span>{label}</span>
      <strong>{value}</strong>
    </div>
  );
}

function MiniBars({ state, large = false }: { state: AppState; large?: boolean }) {
  const rows = state.goals.map((goal) => {
    const actual = minutesToHours(actualMinutesForGoal(state, goal.id));
    const plan = goal.plannedHours;
    const percent = plan > 0 ? clamp(Math.round((actual / plan) * 100)) : 0;
    return { goal, actual, plan, percent };
  });
  if (rows.length === 0) return <EmptyState text="Keine Daten für Diagramm vorhanden." />;
  return (
    <div className={`bar-visual ${large ? 'large' : ''}`}>
      {rows.map(({ goal, actual, plan, percent }) => (
        <div key={goal.id} className="bar-row">
          <div className="bar-label"><span>{goal.module || goal.type}</span><strong>{percent}%</strong></div>
          <div className="bar-track"><span style={{ width: `${percent}%` }} /></div>
          <small>{goal.title} · Ist {hoursLabel(actual)} / Plan {hoursLabel(plan)}</small>
        </div>
      ))}
    </div>
  );
}

async function requestNotificationPermission(notify: (message: string) => void): Promise<boolean> {
  if (!('Notification' in window)) {
    notify('Dieser Browser unterstützt keine System-Benachrichtigungen.');
    return false;
  }
  if (Notification.permission === 'granted') {
    notify('Benachrichtigungen sind bereits aktiviert.');
    return true;
  }
  const permission = await Notification.requestPermission().catch(() => 'denied' as NotificationPermission);
  const granted = permission === 'granted';
  notify(granted ? 'Benachrichtigungen aktiviert.' : 'Benachrichtigungen wurden nicht erlaubt.');
  return granted;
}
