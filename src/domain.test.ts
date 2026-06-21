import { describe, expect, it } from 'vitest';
import {
  actualMinutes,
  addDays,
  addMonths,
  defaultState,
  goalCompletionRate,
  isWithinPlanningHorizon,
  plannedMinutes,
  reminderMessages,
  sixMonthPlans,
  todayIso
} from './domain';

describe('Lernzeit-Manager domain functions', () => {
  it('creates a valid default state with goals, plans and sessions', () => {
    const state = defaultState('student.demo');
    expect(state.goals.length).toBeGreaterThanOrEqual(3);
    expect(state.plans.length).toBeGreaterThanOrEqual(4);
    expect(state.sessions.length).toBeGreaterThanOrEqual(2);
  });

  it('calculates planned and actual minutes', () => {
    const state = defaultState('student.demo');
    expect(plannedMinutes(state)).toBeGreaterThan(0);
    expect(actualMinutes(state)).toBeGreaterThan(0);
  });

  it('calculates goal completion rate and reminders safely', () => {
    const state = defaultState('student.demo');
    expect(goalCompletionRate(state)).toBeGreaterThanOrEqual(0);
    expect(Array.isArray(reminderMessages(state))).toBe(true);
  });

  it('filters planning entries to the six-month horizon', () => {
    const state = defaultState('student.demo');
    const outside = { ...state.plans[0], id: 'outside_horizon', date: todayIso(addMonths(new Date(), 7)) };
    const inside = { ...state, plans: [...state.plans, outside] };
    expect(sixMonthPlans(inside).some((plan) => plan.id === 'outside_horizon')).toBe(false);
  });

  it('validates the six-month planning horizon', () => {
    expect(isWithinPlanningHorizon(todayIso())).toBe(true);
    expect(isWithinPlanningHorizon(todayIso(addMonths(new Date(), 7)))).toBe(false);
  });

  it('respects reminder settings and no-reminder plan entries', () => {
    const state = defaultState('student.demo');
    const planWithoutReminder = {
      ...state.plans[0],
      id: 'soon_without_reminder',
      date: todayIso(),
      startTime: new Date(Date.now() + 30 * 60 * 1000).toTimeString().slice(0, 5),
      reminderMinutes: 0,
      done: false
    };
    const disabled = { ...state, settings: { ...state.settings, autoReminder: false }, plans: [planWithoutReminder], sessions: [] };
    expect(reminderMessages(disabled)).toEqual([]);

    const enabled = { ...disabled, settings: { ...disabled.settings, autoReminder: true } };
    expect(reminderMessages(enabled).some((message) => message.includes('Es wurde noch keine Lernzeit erfasst'))).toBe(true);
    expect(reminderMessages(enabled).some((message) => message.includes('Geplanter Lernblock'))).toBe(false);
  });

  it('detects inactivity after the configured number of days', () => {
    const state = defaultState('student.demo');
    const inactive = {
      ...state,
      settings: { ...state.settings, inactiveDays: 2 },
      sessions: [{ ...state.sessions[0], startedAt: addDays(new Date(), -5) + 'T12:00:00.000Z' }]
    };
    expect(reminderMessages(inactive).some((message) => message.includes('keine Lernzeit erfasst'))).toBe(true);
  });
});
