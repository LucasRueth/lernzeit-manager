export type Role = 'Student:in' | 'Tutor:in' | 'Admin';
export type GoalStatus = 'offen' | 'in_bearbeitung' | 'erreicht';
export type PlanLevel = 'grob' | 'detail';

export interface Account {
  username: string;
  password: string;
  name: string;
  role: Role;
}

export interface Goal {
  id: string;
  title: string;
  type: string;
  module: string;
  targetDate: string;
  plannedHours: number;
  status: GoalStatus;
  description: string;
  achievedAt: string | null;
  createdAt: string;
}

export interface StudyPlan {
  id: string;
  date: string;
  startTime: string;
  duration: number;
  goalId: string;
  level: PlanLevel;
  focus: string;
  reminderMinutes: number;
  done: boolean;
  createdAt: string;
}

export interface StudySession {
  id: string;
  goalId: string;
  startedAt: string;
  durationMinutes: number;
  note: string;
}

export interface AppState {
  meta: {
    appVersion: string;
    owner: string;
    createdAt: string;
    updatedAt: string;
  };
  settings: {
    inactiveDays: number;
    upcomingWindow: number;
    autoReminder: boolean;
  };
  goals: Goal[];
  plans: StudyPlan[];
  sessions: StudySession[];
}

export const APP_VERSION = '2.1.0-ms4';
export const PLANNING_HORIZON_MONTHS = 6;
export const SESSION_USER_KEY = 'lernzeitManagerMs4React:currentUser';
const STORAGE_PREFIX = 'lernzeitManagerMs4React:';

export const TEST_ACCOUNTS: Account[] = [
  { username: 'student.demo', password: 'Lernzeit2026!', name: 'Demo Student:in', role: 'Student:in' },
  { username: 'tutor.demo', password: 'Tutor2026!', name: 'Tutor Demo', role: 'Tutor:in' },
  { username: 'admin.ms4', password: 'Admin2026!', name: 'MS4 Admin', role: 'Admin' }
];

export function todayIso(date = new Date()): string {
  return date.toISOString().slice(0, 10);
}

export function monthIso(date = new Date()): string {
  return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`;
}

export function uid(prefix = 'id'): string {
  return `${prefix}_${Date.now()}_${Math.random().toString(16).slice(2)}`;
}

export function toDateTime(date: string, time = '00:00'): Date {
  return new Date(`${date}T${time}:00`);
}

export function addDays(base: Date, days: number): string {
  const copy = new Date(base);
  copy.setDate(copy.getDate() + days);
  return todayIso(copy);
}

export function addMonths(base: Date, months: number): Date {
  const copy = new Date(base);
  copy.setMonth(copy.getMonth() + months);
  return copy;
}

export function horizonEndIso(date = new Date()): string {
  return todayIso(addMonths(date, PLANNING_HORIZON_MONTHS));
}

export function isWithinPlanningHorizon(dateIso: string, base = new Date()): boolean {
  const start = new Date(todayIso(base));
  const end = addMonths(start, PLANNING_HORIZON_MONTHS);
  const target = new Date(dateIso);
  return target >= start && target <= end;
}

export function minutesToHours(minutes: number): number {
  return Math.round((minutes / 60) * 10) / 10;
}

export function hoursLabel(hours: number): string {
  if (!Number.isFinite(hours)) return '0 h';
  return `${Math.round(hours * 10) / 10} h`;
}

export function minutesLabel(minutes: number): string {
  const hours = Math.floor(minutes / 60);
  const rest = Math.round(minutes % 60);
  if (hours <= 0) return `${rest} Min.`;
  if (rest === 0) return `${hours} Std.`;
  return `${hours} Std. ${rest} Min.`;
}

export function formatTimer(milliseconds: number): string {
  const totalSeconds = Math.max(0, Math.floor(milliseconds / 1000));
  const hours = Math.floor(totalSeconds / 3600);
  const minutes = Math.floor((totalSeconds % 3600) / 60);
  const seconds = totalSeconds % 60;
  return [hours, minutes, seconds].map((value) => String(value).padStart(2, '0')).join(':');
}

export function dateSortAsc<T extends { date?: string; targetDate?: string; startTime?: string }>(items: T[]): T[] {
  return [...items].sort((a, b) => {
    const ad = `${a.date ?? a.targetDate ?? ''}T${a.startTime ?? '00:00'}`;
    const bd = `${b.date ?? b.targetDate ?? ''}T${b.startTime ?? '00:00'}`;
    return ad.localeCompare(bd);
  });
}

export function defaultState(username: string): AppState {
  const now = new Date();
  return {
    meta: {
      appVersion: APP_VERSION,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      owner: username
    },
    settings: {
      inactiveDays: 7,
      upcomingWindow: 30,
      autoReminder: true
    },
    goals: [
      {
        id: 'goal_isef01_project',
        title: 'ISEF01 Projektbericht strukturieren und einreichen',
        type: 'Projektbericht',
        module: 'ISEF01',
        targetDate: addDays(now, 120),
        plannedHours: 55,
        status: 'in_bearbeitung',
        description: 'Projektbericht vorbereiten, MS4-Liefergegenstände prüfen, Review durchführen und final einreichen.',
        achievedAt: null,
        createdAt: new Date().toISOString()
      },
      {
        id: 'goal_se_recap',
        title: 'Software-Engineering-Grundlagen wiederholen',
        type: 'Modul',
        module: 'Software Engineering',
        targetDate: addDays(now, 75),
        plannedHours: 35,
        status: 'offen',
        description: 'Anforderungen, Architektur, Tests und Dokumentation wiederholen.',
        achievedAt: null,
        createdAt: new Date().toISOString()
      },
      {
        id: 'goal_exam_prep',
        title: 'Klausurvorbereitung abschließen',
        type: 'Klausur',
        module: 'Nebenmodul',
        targetDate: addDays(now, 40),
        plannedHours: 25,
        status: 'offen',
        description: 'Lernkarten, Übungsfragen und Zusammenfassung bearbeiten.',
        achievedAt: null,
        createdAt: new Date().toISOString()
      }
    ],
    plans: [
      {
        id: 'plan_detail_1',
        date: addDays(now, 1),
        startTime: '18:00',
        duration: 90,
        goalId: 'goal_isef01_project',
        level: 'detail',
        focus: 'Benutzerhandbuch und technische Dokumentation final prüfen',
        reminderMinutes: 15,
        done: false,
        createdAt: new Date().toISOString()
      },
      {
        id: 'plan_detail_2',
        date: addDays(now, 3),
        startTime: '19:00',
        duration: 120,
        goalId: 'goal_se_recap',
        level: 'detail',
        focus: 'Architektur- und Schnittstellenkapitel wiederholen',
        reminderMinutes: 30,
        done: false,
        createdAt: new Date().toISOString()
      },
      {
        id: 'plan_grob_1',
        date: addDays(now, 32),
        startTime: '18:30',
        duration: 180,
        goalId: 'goal_exam_prep',
        level: 'grob',
        focus: 'Block für sechsmonatige Grobplanung: Prüfungssimulation',
        reminderMinutes: 60,
        done: false,
        createdAt: new Date().toISOString()
      },
      {
        id: 'plan_grob_2',
        date: addDays(now, 95),
        startTime: '10:00',
        duration: 240,
        goalId: 'goal_isef01_project',
        level: 'grob',
        focus: 'Finale Korrektur und Abgabevorbereitung',
        reminderMinutes: 60,
        done: false,
        createdAt: new Date().toISOString()
      }
    ],
    sessions: [
      {
        id: 'session_1',
        goalId: 'goal_isef01_project',
        startedAt: new Date(Date.now() - 1000 * 60 * 60 * 24 * 2).toISOString(),
        durationMinutes: 75,
        note: 'MS4-Checkliste und Redmine-Textbaustein vorbereitet.'
      },
      {
        id: 'session_2',
        goalId: 'goal_se_recap',
        startedAt: new Date(Date.now() - 1000 * 60 * 60 * 24 * 5).toISOString(),
        durationMinutes: 95,
        note: 'Architekturbegriffe wiederholt.'
      }
    ]
  };
}

function storageKey(username: string): string {
  return `${STORAGE_PREFIX}${username}`;
}

export function loadState(username: string): AppState {
  const raw = localStorage.getItem(storageKey(username));
  if (!raw) {
    const fresh = defaultState(username);
    saveState(fresh);
    return fresh;
  }
  try {
    const parsed = JSON.parse(raw) as AppState;
    return {
      ...defaultState(username),
      ...parsed,
      meta: { ...defaultState(username).meta, ...parsed.meta, owner: username, appVersion: APP_VERSION },
      settings: { ...defaultState(username).settings, ...parsed.settings },
      goals: Array.isArray(parsed.goals) ? parsed.goals : [],
      plans: Array.isArray(parsed.plans) ? parsed.plans : [],
      sessions: Array.isArray(parsed.sessions) ? parsed.sessions : []
    };
  } catch {
    const fresh = defaultState(username);
    saveState(fresh);
    return fresh;
  }
}

export function saveState(state: AppState): void {
  const next = { ...state, meta: { ...state.meta, updatedAt: new Date().toISOString(), appVersion: APP_VERSION } };
  localStorage.setItem(storageKey(next.meta.owner), JSON.stringify(next));
}

export function getGoal(state: AppState, goalId: string): Goal | undefined {
  return state.goals.find((goal) => goal.id === goalId);
}

export function actualMinutesForGoal(state: AppState, goalId: string): number {
  return state.sessions
    .filter((session) => session.goalId === goalId)
    .reduce((sum, session) => sum + session.durationMinutes, 0);
}

export function plannedMinutes(state: AppState): number {
  return state.plans.reduce((sum, plan) => sum + plan.duration, 0);
}

export function actualMinutes(state: AppState): number {
  return state.sessions.reduce((sum, session) => sum + session.durationMinutes, 0);
}

export function goalCompletionRate(state: AppState): number {
  if (state.goals.length === 0) return 0;
  return Math.round((state.goals.filter((goal) => goal.status === 'erreicht').length / state.goals.length) * 100);
}

export function upcomingPlans(state: AppState, limit = 5): StudyPlan[] {
  const now = new Date();
  return dateSortAsc(state.plans)
    .filter((plan) => !plan.done && toDateTime(plan.date, plan.startTime).getTime() >= now.getTime())
    .slice(0, limit);
}

export function sixMonthPlans(state: AppState): StudyPlan[] {
  const start = new Date();
  start.setHours(0, 0, 0, 0);
  const end = addMonths(start, PLANNING_HORIZON_MONTHS);
  return dateSortAsc(state.plans).filter((plan) => {
    const date = toDateTime(plan.date, plan.startTime);
    return date >= start && date <= end;
  });
}

export function reminderMessages(state: AppState): string[] {
  if (!state.settings.autoReminder) return [];

  const now = new Date();
  const today = new Date(todayIso());
  const messages: string[] = [];

  const upcoming = upcomingPlans(state, 5);
  for (const plan of upcoming) {
    if (plan.reminderMinutes <= 0) continue;
    const start = toDateTime(plan.date, plan.startTime);
    const minutesUntil = Math.round((start.getTime() - now.getTime()) / 60000);
    if (minutesUntil <= plan.reminderMinutes && minutesUntil >= 0) {
      messages.push(`Geplanter Lernblock „${getGoal(state, plan.goalId)?.title ?? 'ohne Ziel'}“ startet ${minutesUntil === 0 ? 'jetzt' : `in ${minutesUntil} Minuten`}.`);
    }
  }

  const nextGoals = dateSortAsc(state.goals)
    .filter((goal) => goal.status !== 'erreicht')
    .filter((goal) => {
      const diffDays = Math.ceil((new Date(goal.targetDate).getTime() - today.getTime()) / 86400000);
      return diffDays >= 0 && diffDays <= state.settings.upcomingWindow;
    })
    .slice(0, 3);

  for (const goal of nextGoals) {
    const diffDays = Math.ceil((new Date(goal.targetDate).getTime() - today.getTime()) / 86400000);
    messages.push(`Zieltermin für „${goal.title}“ ist in ${diffDays} Tagen.`);
  }

  const latestSession = state.sessions
    .map((session) => new Date(session.startedAt).getTime())
    .sort((a, b) => b - a)[0];
  if (latestSession) {
    const inactiveDays = Math.floor((Date.now() - latestSession) / 86400000);
    if (inactiveDays >= state.settings.inactiveDays) {
      messages.push(`Seit ${inactiveDays} Tagen wurde keine Lernzeit erfasst. Bitte Planung prüfen oder anpassen.`);
    }
  } else if (state.goals.some((goal) => goal.status !== 'erreicht')) {
    messages.push('Es wurde noch keine Lernzeit erfasst. Starte die Stoppuhr oder passe die Planung an.');
  }

  return messages;
}
