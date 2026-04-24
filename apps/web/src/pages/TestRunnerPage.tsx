import { useState, useRef, useCallback } from 'react';
import { useAuthStore } from '../store/auth';
import { navigate } from '../lib/router';
import { Play, Loader2, Terminal, RotateCcw } from 'lucide-react';

/* ─── Types ─── */

type TestStatus = 'pending' | 'running' | 'passed' | 'failed';

interface TestResult {
  id: string;
  group: string;
  name: string;
  status: TestStatus;
  error?: string;
  durationMs?: number;
}

/* ─── Constants ─── */

const API_BASE = import.meta.env.VITE_API_URL ?? 'https://dprabota.bahtyarsanzhar.workers.dev';

const API_ENDPOINTS = [
  '/api/sessions',
  '/api/sessions/classes',
  '/api/sessions/booked-rooms',
  '/api/grades',
  '/api/events',
  '/api/open-sessions',
  '/api/courses',
  '/api/courses/categories',
  '/api/courses/my/enrolled',
  '/api/admin/users',
  '/api/admin/classes',
  '/api/reports',
  '/api/reports/monthly',
  '/api/ratings/teachers',
  '/api/support/tickets',
  '/api/notifications',
  '/api/admin/settings',
  '/api/admin/changelog',
];

interface PageDef {
  path: string;
  label: string;
  checks?: string[];
}

const PAGES: PageDef[] = [
  { path: '/', label: 'DashboardPage', checks: ['Всего', 'Завершено'] },
  { path: '/sessions', label: 'SessionsPage' },
  { path: '/grades', label: 'GradesPage' },
  { path: '/events', label: 'EventsPage' },
  { path: '/open-sessions', label: 'OpenSessionsPage' },
  { path: '/courses', label: 'CourseCatalogPage' },
  { path: '/my-courses', label: 'MyCoursesPage' },
  { path: '/reports', label: 'ReportsPage' },
  { path: '/admin/users', label: 'AdminUsersPage' },
  { path: '/admin/classes', label: 'AdminClassesPage' },
  { path: '/profile', label: 'ProfilePage' },
  { path: '/settings', label: 'SettingsPage' },
  { path: '/support', label: 'SupportPage' },
  { path: '/assistant', label: 'AssistantPage' },
  { path: '/ratings', label: 'TeacherRatingsPage' },
];

/* ─── Helpers ─── */

function delay(ms: number): Promise<void> {
  return new Promise((r) => setTimeout(r, ms));
}

function fetchWithTimeout(url: string, opts: RequestInit, ms: number): Promise<Response> {
  return new Promise((resolve, reject) => {
    const ctrl = new AbortController();
    const timer = setTimeout(() => {
      ctrl.abort();
      reject(new Error(`Timeout ${ms}ms`));
    }, ms);
    fetch(url, { ...opts, signal: ctrl.signal })
      .then(resolve, reject)
      .finally(() => clearTimeout(timer));
  });
}

/* ─── Component ─── */

export function TestRunnerPage() {
  const { lang } = useAuthStore();
  const [results, setResults] = useState<TestResult[]>([]);
  const [running, setRunning] = useState(false);
  const [done, setDone] = useState(false);
  const consoleErrors = useRef<string[]>([]);
  const logRef = useRef<HTMLDivElement>(null);

  const scrollToBottom = useCallback(() => {
    if (logRef.current) {
      logRef.current.scrollTop = logRef.current.scrollHeight;
    }
  }, []);

  const updateResult = useCallback(
    (id: string, patch: Partial<TestResult>) => {
      setResults((prev) => {
        const next = prev.map((r) => (r.id === id ? { ...r, ...patch } : r));
        return next;
      });
      setTimeout(scrollToBottom, 30);
    },
    [scrollToBottom],
  );

  const addResult = useCallback(
    (r: TestResult) => {
      setResults((prev) => [...prev, r]);
      setTimeout(scrollToBottom, 30);
    },
    [scrollToBottom],
  );

  /* ─── Run a single test ─── */
  async function runTest(
    id: string,
    group: string,
    name: string,
    fn: () => Promise<void>,
    add: typeof addResult,
    update: typeof updateResult,
  ): Promise<boolean> {
    add({ id, group, name, status: 'running' });
    const t0 = performance.now();
    try {
      await fn();
      update(id, { status: 'passed', durationMs: performance.now() - t0 });
      return true;
    } catch (err) {
      update(id, {
        status: 'failed',
        error: err instanceof Error ? err.message : String(err),
        durationMs: performance.now() - t0,
      });
      return false;
    }
  }

  /* ─── Main runner ─── */
  const runAll = useCallback(async () => {
    setResults([]);
    setRunning(true);
    setDone(false);
    consoleErrors.current = [];

    const token = useAuthStore.getState().token;
    const headers: Record<string, string> = {};
    if (token) headers['Authorization'] = `Bearer ${token}`;

    // Intercept console.error
    const origError = console.error;
    console.error = (...args: unknown[]) => {
      consoleErrors.current.push(args.map(String).join(' '));
      origError.apply(console, args);
    };

    // Intercept window errors
    const capturedErrors: string[] = [];
    const onErr = (e: ErrorEvent) => capturedErrors.push(e.message);
    const onRej = (e: PromiseRejectionEvent) => capturedErrors.push(String(e.reason));
    window.addEventListener('error', onErr);
    window.addEventListener('unhandledrejection', onRej);

    const add = (r: TestResult) => {
      setResults((prev) => [...prev, r]);
      setTimeout(scrollToBottom, 30);
    };
    const update = (id: string, patch: Partial<TestResult>) => {
      setResults((prev) => prev.map((r) => (r.id === id ? { ...r, ...patch } : r)));
      setTimeout(scrollToBottom, 30);
    };

    /* ── A. Health Check ── */
    await runTest('health', 'A. Health Check', 'GET /api/health → 200', async () => {
      const res = await fetchWithTimeout(`${API_BASE}/api/health`, { headers }, 5000);
      if (!res.ok) throw new Error(`Status ${res.status}`);
    }, add, update);

    /* ── B. Auth Check ── */
    await runTest('auth', 'B. Auth Check', 'GET /api/auth/me → user object', async () => {
      const res = await fetchWithTimeout(`${API_BASE}/api/auth/me`, { headers }, 5000);
      if (!res.ok) throw new Error(`Status ${res.status}`);
      const json = await res.json();
      const data = json.data ?? json;
      if (!data.id || !data.role || !data.full_name) {
        throw new Error('Response missing id, role or full_name');
      }
    }, add, update);

    /* ── C. API Endpoints Smoke ── */
    for (let i = 0; i < API_ENDPOINTS.length; i++) {
      const ep = API_ENDPOINTS[i]!;
      await runTest(`api-${i}`, 'C. API Smoke', `GET ${ep}`, async () => {
        const res = await fetchWithTimeout(`${API_BASE}${ep}`, { headers }, 5000);
        if (!res.ok) throw new Error(`Status ${res.status}`);
        const json = await res.json();
        if (json.success !== true) throw new Error('json.success !== true');
      }, add, update);
    }

    /* ── D. Page Render Check ── */
    for (let i = 0; i < PAGES.length; i++) {
      const page = PAGES[i]!;
      await runTest(`page-${i}`, 'D. Page Render', `${page.path} (${page.label})`, async () => {
        capturedErrors.length = 0;
        navigate(page.path);
        await delay(1200);
        const main = document.querySelector('main');
        if (!main) throw new Error('<main> not found in DOM');
        if ((main.innerHTML?.length ?? 0) < 50) throw new Error('Empty screen (innerHTML < 50 chars)');
        if (capturedErrors.length > 0) throw new Error(`JS errors: ${capturedErrors.join('; ')}`);
      }, add, update);
    }

    /* ── E. Language Toggle ── */
    await runTest('lang-kz', 'E. Language Toggle', 'Switch to KZ → check KZ text', async () => {
      const origLang = useAuthStore.getState().lang;
      useAuthStore.getState().setLang('kz');
      navigate('/');
      await delay(1500);
      const body = document.body.innerText;
      const hasKz = body.includes('Басқару тақтасы') || body.includes('Басты бет') || body.includes('Тәрбие');
      if (!hasKz) throw new Error('KZ text not found after lang switch');
      // Restore
      useAuthStore.getState().setLang(origLang);
    }, add, update);

    await runTest('lang-ru', 'E. Language Toggle', 'Switch back to RU → check RU text', async () => {
      useAuthStore.getState().setLang('ru');
      navigate('/');
      await delay(1500);
      const body = document.body.innerText;
      const hasRu = body.includes('Панель управления') || body.includes('Система управления') || body.includes('Тәрбие');
      if (!hasRu) throw new Error('RU text not found after lang switch');
    }, add, update);

    /* ── F. Console Error Scan ── */
    await runTest('console-errors', 'F. Console Errors', 'Check captured console.error calls', async () => {
      if (consoleErrors.current.length > 0) {
        throw new Error(`${consoleErrors.current.length} console.error(s): ${consoleErrors.current.slice(0, 3).join(' | ')}`);
      }
    }, add, update);

    // Restore console & listeners
    console.error = origError;
    window.removeEventListener('error', onErr);
    window.removeEventListener('unhandledrejection', onRej);

    // Navigate back
    navigate('/test-runner');
    setRunning(false);
    setDone(true);
  }, [scrollToBottom]);

  /* ─── Derived stats ─── */
  const total = results.length;
  const passed = results.filter((r) => r.status === 'passed').length;
  const failed = results.filter((r) => r.status === 'failed').length;
  const runningCount = results.filter((r) => r.status === 'running').length;
  const expectedTotal = 1 + 1 + API_ENDPOINTS.length + PAGES.length + 2 + 1; // A + B + C + D + E(2) + F
  const progress = running ? (total / expectedTotal) * 100 : done ? 100 : 0;

  /* ─── Render ─── */
  return (
    <div className="mx-auto max-w-4xl space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 dark:text-gray-100">
            {lang === 'kz' ? 'Тест жүгірткіші' : 'Тест-раннер'}
          </h1>
          <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">
            {lang === 'kz'
              ? 'Бір батырмамен барлық SPA smoke-тесттерін жүргізу'
              : 'Полный smoke-тест SPA одним кликом'}
          </p>
        </div>
        <button
          onClick={runAll}
          disabled={running}
          className="inline-flex items-center gap-2 rounded-xl bg-primary-600 px-6 py-3 text-sm font-semibold text-white shadow-lg hover:bg-primary-700 active:scale-[0.97] transition-all disabled:opacity-50 disabled:cursor-not-allowed"
        >
          {running ? (
            <>
              <Loader2 size={18} className="animate-spin" />
              {lang === 'kz' ? 'Орындалуда...' : 'Выполняется...'}
            </>
          ) : done ? (
            <>
              <RotateCcw size={18} />
              {lang === 'kz' ? 'Қайта жүргізу' : 'Запустить снова'}
            </>
          ) : (
            <>
              <Play size={18} />
              {lang === 'kz' ? 'Тесттерді бастау' : 'Запустить тесты'}
            </>
          )}
        </button>
      </div>

      {/* Progress bar */}
      {(running || done) && (
        <div className="space-y-2">
          <div className="flex items-center justify-between text-xs text-gray-500 dark:text-gray-400">
            <span>
              {running
                ? lang === 'kz' ? 'Орындалуда...' : 'Выполняется...'
                : lang === 'kz' ? 'Аяқталды' : 'Завершено'}
            </span>
            <span>{Math.round(progress)}%</span>
          </div>
          <div className="h-2.5 w-full overflow-hidden rounded-full bg-gray-200 dark:bg-gray-700">
            <div
              className={`h-full rounded-full transition-all duration-300 ${
                done && failed === 0
                  ? 'bg-green-500'
                  : done && failed > 0
                    ? 'bg-amber-500'
                    : 'bg-primary-500'
              }`}
              style={{ width: `${Math.min(progress, 100)}%` }}
            />
          </div>
        </div>
      )}

      {/* Summary cards */}
      {done && (
        <div className="grid grid-cols-3 gap-3">
          <div className="rounded-xl border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 p-4 text-center">
            <p className="text-2xl font-bold text-gray-900 dark:text-gray-100">{total}</p>
            <p className="text-xs text-gray-500 dark:text-gray-400">{lang === 'kz' ? 'Барлығы' : 'Всего'}</p>
          </div>
          <div className="rounded-xl border border-green-200 dark:border-green-800 bg-green-50 dark:bg-green-900/30 p-4 text-center">
            <p className="text-2xl font-bold text-green-700 dark:text-green-400">{passed}</p>
            <p className="text-xs text-green-600 dark:text-green-400">{lang === 'kz' ? 'Өтті' : 'Passed'}</p>
          </div>
          <div className="rounded-xl border border-red-200 dark:border-red-800 bg-red-50 dark:bg-red-900/30 p-4 text-center">
            <p className="text-2xl font-bold text-red-700 dark:text-red-400">{failed}</p>
            <p className="text-xs text-red-600 dark:text-red-400">{lang === 'kz' ? 'Сәтсіз' : 'Failed'}</p>
          </div>
        </div>
      )}

      {/* Live log */}
      {results.length > 0 && (
        <div className="rounded-xl border border-gray-200 dark:border-gray-700 bg-gray-950 overflow-hidden">
          <div className="flex items-center gap-2 border-b border-gray-800 px-4 py-2.5 bg-gray-900">
            <Terminal size={14} className="text-gray-400" />
            <span className="text-xs font-medium text-gray-400">
              Test Log — {passed} passed, {failed} failed{runningCount > 0 ? `, ${runningCount} running` : ''}
            </span>
          </div>
          <div ref={logRef} className="max-h-[500px] overflow-y-auto p-3 space-y-0.5 font-mono text-[13px] leading-6">
            {results.map((r) => (
              <div key={r.id} className="flex items-start gap-2">
                {r.status === 'running' && (
                  <span className="shrink-0 text-yellow-400">⏳</span>
                )}
                {r.status === 'passed' && (
                  <span className="shrink-0 text-green-400">✅</span>
                )}
                {r.status === 'failed' && (
                  <span className="shrink-0 text-red-400">❌</span>
                )}
                {r.status === 'pending' && (
                  <span className="shrink-0 text-gray-500">○</span>
                )}
                <div className="min-w-0 flex-1">
                  <span
                    className={`${
                      r.status === 'passed'
                        ? 'text-green-400'
                        : r.status === 'failed'
                          ? 'text-red-400'
                          : r.status === 'running'
                            ? 'text-yellow-300'
                            : 'text-gray-500'
                    }`}
                  >
                    <span className="text-gray-500">[{r.group}]</span> {r.name}
                    {r.durationMs != null && (
                      <span className="ml-2 text-gray-600">({Math.round(r.durationMs)}ms)</span>
                    )}
                  </span>
                  {r.status === 'failed' && r.error && (
                    <div className="mt-0.5 text-red-500/80 text-xs break-all">↳ {r.error}</div>
                  )}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Empty state */}
      {results.length === 0 && !running && (
        <div className="flex flex-col items-center justify-center rounded-xl border-2 border-dashed border-gray-200 dark:border-gray-700 py-20 text-gray-400">
          <Terminal size={40} className="mb-3" />
          <p className="text-sm">
            {lang === 'kz'
              ? 'Тесттерді бастау үшін батырманы басыңыз'
              : 'Нажмите кнопку для запуска тестов'}
          </p>
        </div>
      )}
    </div>
  );
}
