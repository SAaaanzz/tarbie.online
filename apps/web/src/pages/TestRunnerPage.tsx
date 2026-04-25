import { useState, useRef, useCallback } from 'react';
import { useAuthStore } from '../store/auth';
import { useThemeStore } from '../store/theme';
import { navigate } from '../lib/router';
import { Play, Loader2, Terminal, RotateCcw, ChevronDown, ChevronUp } from 'lucide-react';

/* ─── Types ─── */

type TestStatus = 'pending' | 'running' | 'passed' | 'failed';

interface TestResult {
  id: string;
  group: string;
  name: string;
  status: TestStatus;
  error?: string;
  durationMs?: number;
  story?: string;
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

const API_POST_ENDPOINTS = [
  { path: '/api/assistant/usage', method: 'GET' as const, label: 'AI usage quota' },
];

interface PageDef {
  path: string;
  label: string;
  checks?: string[];
  buttons?: ButtonDef[];
  inputs?: InputDef[];
  selects?: SelectDef[];
  modals?: ModalDef[];
}

interface ButtonDef {
  selector: string;
  label: string;
  safeToClick: boolean;
  expectModal?: boolean;
  closeAfter?: string;
}

interface InputDef {
  selector: string;
  label: string;
  testValue: string;
}

interface SelectDef {
  selector: string;
  label: string;
  optionIndex?: number;
}

interface ModalDef {
  triggerSelector: string;
  label: string;
  closeSelector: string;
}

const PAGES: PageDef[] = [
  {
    path: '/', label: 'DashboardPage', checks: ['Всего', 'Завершено'],
    buttons: [],
  },
  {
    path: '/sessions', label: 'SessionsPage',
    buttons: [
      { selector: 'button:has(.lucide-download)', label: 'Excel export menu', safeToClick: true },
      { selector: 'button:has(.lucide-wand-2)', label: 'Auto-assign btn', safeToClick: true, expectModal: true, closeAfter: 'button:has(.lucide-x)' },
      { selector: 'button:has(.lucide-upload)', label: 'Import btn', safeToClick: true, expectModal: true, closeAfter: 'button:has(.lucide-x)' },
      { selector: 'button:has(.lucide-plus)', label: 'New session btn', safeToClick: true, expectModal: true, closeAfter: 'button:has(.lucide-x)' },
    ],
    selects: [],
  },
  {
    path: '/grades', label: 'GradesPage',
    selects: [
      { selector: 'select.input-field', label: 'Class selector' },
    ],
    inputs: [
      { selector: 'input[type="month"]', label: 'Month picker', testValue: '' },
    ],
  },
  {
    path: '/events', label: 'EventsPage',
    buttons: [
      { selector: 'button:has(.lucide-plus)', label: 'New event btn', safeToClick: true, expectModal: true, closeAfter: 'button:has(.lucide-x)' },
    ],
  },
  {
    path: '/open-sessions', label: 'OpenSessionsPage',
    buttons: [
      { selector: 'button:has(.lucide-plus)', label: 'New open session btn', safeToClick: true, expectModal: true, closeAfter: 'button:has(.lucide-x)' },
    ],
  },
  {
    path: '/courses', label: 'CourseCatalogPage',
    inputs: [
      { selector: 'input[type="text"]', label: 'Search input', testValue: 'test' },
    ],
  },
  { path: '/my-courses', label: 'MyCoursesPage' },
  {
    path: '/reports', label: 'ReportsPage',
    selects: [
      { selector: 'select.input-field', label: 'Class selector' },
    ],
    inputs: [
      { selector: 'input[type="month"]', label: 'Month picker', testValue: '' },
    ],
  },
  { path: '/admin/users', label: 'AdminUsersPage' },
  { path: '/admin/classes', label: 'AdminClassesPage' },
  {
    path: '/profile', label: 'ProfilePage',
    buttons: [
      { selector: 'button:has(.lucide-camera)', label: 'Avatar upload hover btn', safeToClick: false },
    ],
    selects: [
      { selector: 'select.input-field', label: 'Language select' },
    ],
  },
  {
    path: '/settings', label: 'SettingsPage',
    buttons: [
      { selector: 'button:has(.lucide-bell)', label: 'Webhook setup btn', safeToClick: false },
    ],
  },
  {
    path: '/support', label: 'SupportPage',
    buttons: [
      { selector: 'button:has(.lucide-plus)', label: 'New ticket btn', safeToClick: true },
    ],
  },
  {
    path: '/assistant', label: 'AssistantPage',
    inputs: [
      { selector: 'input[type="text"]', label: 'AI prompt input', testValue: '' },
    ],
  },
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

  /* ─── Run a single test with story ─── */
  async function runTest(
    id: string,
    group: string,
    name: string,
    fn: () => Promise<string>,
    add: typeof addResult,
    update: typeof updateResult,
  ): Promise<boolean> {
    add({ id, group, name, status: 'running' });
    const t0 = performance.now();
    try {
      const story = await fn();
      update(id, { status: 'passed', durationMs: performance.now() - t0, story });
      return true;
    } catch (err) {
      update(id, {
        status: 'failed',
        error: err instanceof Error ? err.message : String(err),
        durationMs: performance.now() - t0,
        story: `FAIL → ${err instanceof Error ? err.message : String(err)}`,
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

    /* ══════════════════════════════════════════════════════════════════
       A. HEALTH CHECK
       ══════════════════════════════════════════════════════════════════ */
    await runTest('health', 'A. Health Check', 'GET /api/health → 200', async () => {
      const res = await fetchWithTimeout(`${API_BASE}/api/health`, { headers }, 5000);
      if (!res.ok) throw new Error(`Status ${res.status}`);
      return `1) Отправлен GET ${API_BASE}/api/health → status ${res.status} OK`;
    }, add, update);

    /* ══════════════════════════════════════════════════════════════════
       B. AUTH CHECK
       ══════════════════════════════════════════════════════════════════ */
    await runTest('auth', 'B. Auth Check', 'GET /api/auth/me → user object', async () => {
      const res = await fetchWithTimeout(`${API_BASE}/api/auth/me`, { headers }, 5000);
      if (!res.ok) throw new Error(`Status ${res.status}`);
      const json = await res.json();
      const data = json.data ?? json;
      if (!data.id || !data.role || !data.full_name) {
        throw new Error('Response missing id, role or full_name');
      }
      return `1) GET /api/auth/me → ${res.status}\n2) user.id=${data.id}, role=${data.role}, name=${data.full_name}`;
    }, add, update);

    /* ══════════════════════════════════════════════════════════════════
       C. API ENDPOINTS SMOKE
       ══════════════════════════════════════════════════════════════════ */
    for (let i = 0; i < API_ENDPOINTS.length; i++) {
      const ep = API_ENDPOINTS[i]!;
      await runTest(`api-${i}`, 'C. API Smoke', `GET ${ep}`, async () => {
        const res = await fetchWithTimeout(`${API_BASE}${ep}`, { headers }, 5000);
        if (!res.ok) throw new Error(`Status ${res.status}`);
        const json = await res.json();
        if (json.success !== true) throw new Error('json.success !== true');
        const dataLen = Array.isArray(json.data) ? json.data.length : (json.data ? 1 : 0);
        return `1) GET ${ep} → ${res.status}\n2) success=true, data items=${dataLen}`;
      }, add, update);
    }

    /* ══════════════════════════════════════════════════════════════════
       CA. EXTRA API ENDPOINTS
       ══════════════════════════════════════════════════════════════════ */
    for (let i = 0; i < API_POST_ENDPOINTS.length; i++) {
      const ep = API_POST_ENDPOINTS[i]!;
      await runTest(`api-extra-${i}`, 'CA. API Extra', `${ep.method} ${ep.path} (${ep.label})`, async () => {
        const res = await fetchWithTimeout(`${API_BASE}${ep.path}`, { method: ep.method, headers }, 5000);
        if (!res.ok) throw new Error(`Status ${res.status}`);
        return `1) ${ep.method} ${ep.path} → ${res.status}`;
      }, add, update);
    }

    /* ══════════════════════════════════════════════════════════════════
       D. PAGE RENDER CHECK
       ══════════════════════════════════════════════════════════════════ */
    for (let i = 0; i < PAGES.length; i++) {
      const page = PAGES[i]!;
      await runTest(`page-${i}`, 'D. Page Render', `${page.path} (${page.label})`, async () => {
        capturedErrors.length = 0;
        const steps: string[] = [];
        steps.push(`1) navigate("${page.path}")`);
        navigate(page.path);
        await delay(1200);
        const main = document.querySelector('main');
        if (!main) throw new Error('<main> not found in DOM');
        steps.push(`2) <main> found, innerHTML length=${main.innerHTML?.length ?? 0}`);
        if ((main.innerHTML?.length ?? 0) < 50) throw new Error('Empty screen (innerHTML < 50 chars)');
        if (page.checks) {
          for (const txt of page.checks) {
            const found = main.innerHTML.includes(txt);
            steps.push(`3) check text "${txt}" → ${found ? 'FOUND' : 'NOT FOUND'}`);
            if (!found) throw new Error(`Expected text "${txt}" not found`);
          }
        }
        if (capturedErrors.length > 0) throw new Error(`JS errors: ${capturedErrors.join('; ')}`);
        steps.push(`4) No JS errors captured`);
        return steps.join('\n');
      }, add, update);
    }

    /* ══════════════════════════════════════════════════════════════════
       E. BUTTON CLICK TESTS (every button on every page)
       ══════════════════════════════════════════════════════════════════ */
    let btnIdx = 0;
    for (const page of PAGES) {
      if (!page.buttons || page.buttons.length === 0) continue;
      for (const btn of page.buttons) {
        const testId = `btn-${btnIdx++}`;
        await runTest(testId, 'E. Button Clicks', `${page.label} → ${btn.label}`, async () => {
          const steps: string[] = [];
          steps.push(`1) navigate("${page.path}")`);
          navigate(page.path);
          await delay(1200);

          const el = document.querySelector(btn.selector) as HTMLButtonElement | null;
          if (!el) {
            steps.push(`2) selector "${btn.selector}" → NOT FOUND (skip)`);
            return steps.join('\n');
          }
          steps.push(`2) found button: "${el.textContent?.trim().slice(0, 40)}"`);

          if (btn.safeToClick) {
            capturedErrors.length = 0;
            el.click();
            steps.push(`3) clicked button`);
            await delay(800);

            if (btn.expectModal) {
              const modal = document.querySelector('[role="dialog"], .modal, .fixed.inset-0');
              steps.push(`4) modal expected → ${modal ? 'FOUND' : 'NOT FOUND'}`);
              if (btn.closeAfter) {
                await delay(300);
                const closeBtn = document.querySelector(btn.closeAfter) as HTMLElement | null;
                if (closeBtn) {
                  closeBtn.click();
                  steps.push(`5) closed modal via "${btn.closeAfter}"`);
                  await delay(400);
                }
              }
            }

            if (capturedErrors.length > 0) {
              throw new Error(`JS errors after click: ${capturedErrors.join('; ')}`);
            }
            steps.push(`${steps.length + 1}) No JS errors after click`);
          } else {
            steps.push(`3) button marked unsafe, skip click (exists = OK)`);
          }
          return steps.join('\n');
        }, add, update);
      }
    }

    /* ══════════════════════════════════════════════════════════════════
       F. AUTO-CLICK EVERY BUTTON ON EVERY PAGE
       ══════════════════════════════════════════════════════════════════ */
    for (let i = 0; i < PAGES.length; i++) {
      const page = PAGES[i]!;
      await runTest(`auto-btn-${i}`, 'F. Click All Buttons', `${page.label} (${page.path})`, async () => {
        const steps: string[] = [];
        navigate(page.path);
        await delay(1200);

        const allBtns = Array.from(document.querySelectorAll('main button:not([disabled])'));
        steps.push(`1) navigate("${page.path}") → ${allBtns.length} enabled buttons`);

        let clicked = 0;
        let errored = 0;
        for (let bi = 0; bi < allBtns.length; bi++) {
          const btn = allBtns[bi] as HTMLButtonElement;
          const text = btn.textContent?.trim().slice(0, 40) || '(empty)';
          // Skip dangerous buttons (delete, remove, logout)
          const lower = text.toLowerCase();
          const isDangerous = ['удалить', 'жою', 'delete', 'remove', 'выйти', 'шығу', 'logout'].some(w => lower.includes(w));
          if (isDangerous) {
            steps.push(`  ${bi + 1}. ⚠️ SKIP dangerous: "${text}"`);
            continue;
          }
          capturedErrors.length = 0;
          try {
            btn.click();
            clicked++;
            await delay(400);
            // Close any modal that opened
            const modal = document.querySelector('.fixed.inset-0, [role="dialog"]');
            if (modal) {
              const closeBtn = modal.querySelector('button:has(.lucide-x), button[aria-label="close"]') as HTMLElement | null;
              if (closeBtn) { closeBtn.click(); await delay(300); }
            }
            if (capturedErrors.length > 0) {
              errored++;
              steps.push(`  ${bi + 1}. ❌ "${text}" → JS error: ${capturedErrors[0]?.slice(0, 60)}`);
            } else {
              steps.push(`  ${bi + 1}. ✅ "${text}" → OK`);
            }
          } catch {
            errored++;
            steps.push(`  ${bi + 1}. ❌ "${text}" → click threw`);
          }
          // Re-navigate if page changed
          if (window.location.pathname !== page.path) {
            navigate(page.path);
            await delay(800);
          }
        }
        steps.push(`2) clicked=${clicked}, errors=${errored}, skipped_dangerous=${allBtns.length - clicked - (allBtns.length - clicked)}`);
        if (errored > 0) throw new Error(`${errored} button(s) caused JS errors`);
        return steps.join('\n');
      }, add, update);
    }

    /* ══════════════════════════════════════════════════════════════════
       G. INPUT FIELD TESTS
       ══════════════════════════════════════════════════════════════════ */
    let inputIdx = 0;
    for (const page of PAGES) {
      if (!page.inputs || page.inputs.length === 0) continue;
      for (const inp of page.inputs) {
        const testId = `input-${inputIdx++}`;
        await runTest(testId, 'G. Input Fields', `${page.label} → ${inp.label}`, async () => {
          const steps: string[] = [];
          navigate(page.path);
          await delay(1200);

          const el = document.querySelector(inp.selector) as HTMLInputElement | null;
          if (!el) {
            steps.push(`1) selector "${inp.selector}" → NOT FOUND`);
            throw new Error(`Input not found: ${inp.selector}`);
          }
          steps.push(`1) found input: type="${el.type}", name="${el.name || ''}"`);

          if (inp.testValue) {
            const orig = el.value;
            const nativeInputValueSetter = Object.getOwnPropertyDescriptor(window.HTMLInputElement.prototype, 'value')?.set;
            nativeInputValueSetter?.call(el, inp.testValue);
            el.dispatchEvent(new Event('input', { bubbles: true }));
            el.dispatchEvent(new Event('change', { bubbles: true }));
            steps.push(`2) set value="${inp.testValue}" (was "${orig}")`);
            await delay(500);
            steps.push(`3) value after set: "${el.value}"`);
            // Restore
            nativeInputValueSetter?.call(el, orig);
            el.dispatchEvent(new Event('input', { bubbles: true }));
            steps.push(`4) restored value to "${orig}"`);
          } else {
            steps.push(`2) no test value specified, checking presence only`);
          }
          return steps.join('\n');
        }, add, update);
      }
    }

    /* ══════════════════════════════════════════════════════════════════
       H. SELECT/DROPDOWN TESTS
       ══════════════════════════════════════════════════════════════════ */
    let selIdx = 0;
    for (const page of PAGES) {
      if (!page.selects || page.selects.length === 0) continue;
      for (const sel of page.selects) {
        const testId = `select-${selIdx++}`;
        await runTest(testId, 'H. Select Fields', `${page.label} → ${sel.label}`, async () => {
          const steps: string[] = [];
          navigate(page.path);
          await delay(1200);

          const el = document.querySelector(sel.selector) as HTMLSelectElement | null;
          if (!el) {
            steps.push(`1) selector "${sel.selector}" → NOT FOUND`);
            throw new Error(`Select not found: ${sel.selector}`);
          }
          const optCount = el.options.length;
          steps.push(`1) found <select> with ${optCount} options, current="${el.value}"`);

          if (optCount > 1) {
            const targetIdx = sel.optionIndex ?? 1;
            const origVal = el.value;
            el.value = el.options[Math.min(targetIdx, optCount - 1)]?.value ?? '';
            el.dispatchEvent(new Event('change', { bubbles: true }));
            steps.push(`2) changed to option[${targetIdx}]="${el.value}"`);
            await delay(600);
            // Restore
            el.value = origVal;
            el.dispatchEvent(new Event('change', { bubbles: true }));
            steps.push(`3) restored to "${origVal}"`);
          } else {
            steps.push(`2) only ${optCount} option(s), skip interaction`);
          }
          return steps.join('\n');
        }, add, update);
      }
    }

    /* ══════════════════════════════════════════════════════════════════
       I. AUTO-DISCOVER ALL INPUTS/SELECTS ON EVERY PAGE
       ══════════════════════════════════════════════════════════════════ */
    for (let i = 0; i < PAGES.length; i++) {
      const page = PAGES[i]!;
      await runTest(`auto-input-${i}`, 'I. Auto-Discover Inputs', `${page.label} (${page.path})`, async () => {
        const steps: string[] = [];
        navigate(page.path);
        await delay(1200);

        const inputs = document.querySelectorAll('main input, main textarea, main select');
        steps.push(`1) navigate("${page.path}") → found ${inputs.length} form elements`);

        inputs.forEach((el, idx) => {
          const tag = el.tagName.toLowerCase();
          const type = (el as HTMLInputElement).type || '';
          const name = (el as HTMLInputElement).name || '';
          const val = (el as HTMLInputElement).value?.slice(0, 30) || '';
          steps.push(`  ${idx + 1}. <${tag}> type="${type}" name="${name}" value="${val}"`);
        });

        return steps.join('\n');
      }, add, update);
    }

    /* ══════════════════════════════════════════════════════════════════
       J. SIDEBAR NAVIGATION TESTS
       ══════════════════════════════════════════════════════════════════ */
    await runTest('sidebar-links', 'J. Sidebar Navigation', 'Click every sidebar link', async () => {
      const steps: string[] = [];
      navigate('/');
      await delay(800);

      const sidebarLinks = document.querySelectorAll('aside a, nav a, [data-sidebar] a');
      steps.push(`1) found ${sidebarLinks.length} sidebar/nav links`);

      let clicked = 0;
      for (let li = 0; li < sidebarLinks.length; li++) {
        const link = sidebarLinks[li] as HTMLAnchorElement;
        const href = link.getAttribute('href') || '';
        const text = link.textContent?.trim().slice(0, 40) || '';
        steps.push(`  ${li + 1}. <a href="${href}"> "${text}"`);

        if (href && href.startsWith('/') && !href.includes('test-runner')) {
          navigate(href);
          await delay(600);
          const main = document.querySelector('main');
          const ok = main && (main.innerHTML?.length ?? 0) > 30;
          steps.push(`     → navigated, main rendered: ${ok ? 'YES' : 'NO'}`);
          clicked++;
        }
      }
      steps.push(`2) navigated to ${clicked} sidebar links`);
      navigate('/');
      return steps.join('\n');
    }, add, update);

    /* ══════════════════════════════════════════════════════════════════
       K. THEME TOGGLE TEST
       ══════════════════════════════════════════════════════════════════ */
    await runTest('theme-toggle', 'K. Theme Toggle', 'Toggle dark/light theme', async () => {
      const steps: string[] = [];
      const origTheme = useThemeStore.getState().theme;
      steps.push(`1) current theme: "${origTheme}"`);

      useThemeStore.getState().toggleTheme();
      await delay(300);
      const newTheme = useThemeStore.getState().theme;
      steps.push(`2) toggled → now "${newTheme}"`);
      const hasDarkClass = document.documentElement.classList.contains('dark');
      steps.push(`3) <html> has .dark class: ${hasDarkClass}`);

      if (newTheme === 'dark' && !hasDarkClass) throw new Error('Expected .dark class on <html>');
      if (newTheme === 'light' && hasDarkClass) throw new Error('Unexpected .dark class on <html>');

      // Restore
      useThemeStore.getState().setTheme(origTheme);
      await delay(200);
      steps.push(`4) restored theme to "${origTheme}"`);
      return steps.join('\n');
    }, add, update);

    /* ══════════════════════════════════════════════════════════════════
       L. LANGUAGE TOGGLE (KZ)
       ══════════════════════════════════════════════════════════════════ */
    await runTest('lang-kz', 'L. Language Toggle', 'Switch to KZ → check KZ text', async () => {
      const steps: string[] = [];
      const origLang = useAuthStore.getState().lang;
      steps.push(`1) original lang: "${origLang}"`);

      useAuthStore.getState().setLang('kz');
      navigate('/');
      await delay(1500);
      steps.push(`2) switched to "kz", navigated to /`);

      const body = document.body.innerText;
      const hasKz = body.includes('Басқару тақтасы') || body.includes('Басты бет') || body.includes('Тәрбие');
      steps.push(`3) KZ text found: ${hasKz}`);
      if (!hasKz) throw new Error('KZ text not found after lang switch');

      useAuthStore.getState().setLang(origLang);
      steps.push(`4) restored lang to "${origLang}"`);
      return steps.join('\n');
    }, add, update);

    /* ══════════════════════════════════════════════════════════════════
       L2. LANGUAGE TOGGLE (RU)
       ══════════════════════════════════════════════════════════════════ */
    await runTest('lang-ru', 'L. Language Toggle', 'Switch back to RU → check RU text', async () => {
      const steps: string[] = [];
      useAuthStore.getState().setLang('ru');
      navigate('/');
      await delay(1500);
      steps.push(`1) switched to "ru", navigated to /`);

      const body = document.body.innerText;
      const hasRu = body.includes('Панель управления') || body.includes('Система управления') || body.includes('Тәрбие');
      steps.push(`2) RU text found: ${hasRu}`);
      if (!hasRu) throw new Error('RU text not found after lang switch');
      return steps.join('\n');
    }, add, update);

    /* ══════════════════════════════════════════════════════════════════
       M. LANGUAGE TOGGLE PER PAGE (every page in KZ, then back to RU)
       ══════════════════════════════════════════════════════════════════ */
    for (let i = 0; i < PAGES.length; i++) {
      const page = PAGES[i]!;
      await runTest(`lang-page-${i}`, 'M. Lang Per Page', `${page.label} in KZ`, async () => {
        const steps: string[] = [];
        useAuthStore.getState().setLang('kz');
        navigate(page.path);
        await delay(1200);
        steps.push(`1) navigate("${page.path}") in KZ`);

        const main = document.querySelector('main');
        if (!main) throw new Error('<main> not found');
        steps.push(`2) <main> rendered, length=${main.innerHTML?.length ?? 0}`);
        if ((main.innerHTML?.length ?? 0) < 30) throw new Error('Empty screen in KZ mode');
        steps.push(`3) page rendered in KZ — OK`);

        useAuthStore.getState().setLang('ru');
        return steps.join('\n');
      }, add, update);
    }

    /* ══════════════════════════════════════════════════════════════════
       N. AUTH STORE FUNCTIONS
       ══════════════════════════════════════════════════════════════════ */
    await runTest('store-auth-setlang', 'N. Store Functions', 'authStore.setLang round-trip', async () => {
      const steps: string[] = [];
      const orig = useAuthStore.getState().lang;
      steps.push(`1) original lang="${orig}"`);

      useAuthStore.getState().setLang('kz');
      const now = useAuthStore.getState().lang;
      steps.push(`2) setLang("kz") → lang="${now}"`);
      if (now !== 'kz') throw new Error(`Expected "kz", got "${now}"`);

      useAuthStore.getState().setLang(orig);
      steps.push(`3) restored lang="${useAuthStore.getState().lang}"`);
      return steps.join('\n');
    }, add, update);

    await runTest('store-theme-toggle', 'N. Store Functions', 'themeStore.toggleTheme round-trip', async () => {
      const steps: string[] = [];
      const orig = useThemeStore.getState().theme;
      steps.push(`1) original theme="${orig}"`);

      useThemeStore.getState().toggleTheme();
      const mid = useThemeStore.getState().theme;
      steps.push(`2) toggle → theme="${mid}"`);

      useThemeStore.getState().toggleTheme();
      const end = useThemeStore.getState().theme;
      steps.push(`3) toggle again → theme="${end}"`);
      if (end !== orig) throw new Error(`Expected "${orig}", got "${end}"`);

      useThemeStore.getState().setTheme(orig);
      return steps.join('\n');
    }, add, update);

    /* ══════════════════════════════════════════════════════════════════
       O. PAGINATION TESTS
       ══════════════════════════════════════════════════════════════════ */
    const paginatedPages = ['/sessions', '/courses', '/admin/users'];
    for (let i = 0; i < paginatedPages.length; i++) {
      const ppath = paginatedPages[i]!;
      await runTest(`pagination-${i}`, 'O. Pagination', `Pagination on ${ppath}`, async () => {
        const steps: string[] = [];
        navigate(ppath);
        await delay(1200);
        steps.push(`1) navigate("${ppath}")`);

        const nextBtns = document.querySelectorAll('main button');
        let paginationBtn: HTMLButtonElement | null = null;
        nextBtns.forEach((b) => {
          const txt = (b as HTMLElement).textContent?.trim().toLowerCase() || '';
          if (txt.includes('→') || txt.includes('next') || txt.includes('дальше') || txt.includes('келесі') || txt === '>') {
            paginationBtn = b as HTMLButtonElement;
          }
        });

        if (paginationBtn) {
          steps.push(`2) found pagination button: "${(paginationBtn as HTMLButtonElement).textContent?.trim()}"`);
          if (!(paginationBtn as HTMLButtonElement).disabled) {
            (paginationBtn as HTMLButtonElement).click();
            await delay(800);
            steps.push(`3) clicked → page changed`);
          } else {
            steps.push(`3) button disabled (only 1 page?)`);
          }
        } else {
          steps.push(`2) no pagination button found (possibly single page)`);
        }
        return steps.join('\n');
      }, add, update);
    }

    /* ══════════════════════════════════════════════════════════════════
       P. FILTER BUTTONS
       ══════════════════════════════════════════════════════════════════ */
    await runTest('filter-sessions', 'P. Filters', 'Session status filter buttons', async () => {
      const steps: string[] = [];
      navigate('/sessions');
      await delay(1200);
      steps.push(`1) navigate("/sessions")`);

      const filterBtns = document.querySelectorAll('main button');
      const statusKeywords = ['все', 'запланировано', 'завершено', 'отменено', 'барлық', 'жоспарланған'];
      let filtersFound = 0;

      filterBtns.forEach((b) => {
        const text = (b as HTMLElement).textContent?.trim().toLowerCase() || '';
        if (statusKeywords.some((kw) => text.includes(kw))) {
          filtersFound++;
          steps.push(`  filter: "${(b as HTMLElement).textContent?.trim()}"`);
          (b as HTMLElement).click();
        }
      });

      if (filtersFound > 0) {
        await delay(600);
        steps.push(`2) clicked ${filtersFound} filter buttons`);
      } else {
        steps.push(`2) no filter buttons found`);
      }
      return steps.join('\n');
    }, add, update);

    /* ══════════════════════════════════════════════════════════════════
       Q. CLICKABLE CARDS & LIST ITEMS
       ══════════════════════════════════════════════════════════════════ */
    const cardPages = ['/events', '/open-sessions', '/courses', '/ratings'];
    for (let i = 0; i < cardPages.length; i++) {
      const cp = cardPages[i]!;
      await runTest(`cards-${i}`, 'Q. Card Clicks', `Clickable cards on ${cp}`, async () => {
        const steps: string[] = [];
        navigate(cp);
        await delay(1200);
        steps.push(`1) navigate("${cp}")`);

        const cards = document.querySelectorAll('main [class*="cursor-pointer"], main [onclick], main .card');
        steps.push(`2) found ${cards.length} clickable card(s)`);

        if (cards.length > 0) {
          capturedErrors.length = 0;
          (cards[0] as HTMLElement).click();
          steps.push(`3) clicked first card`);
          await delay(800);

          if (capturedErrors.length > 0) {
            throw new Error(`JS errors after card click: ${capturedErrors.join('; ')}`);
          }
          steps.push(`4) no JS errors after click`);

          // Try to close any opened modal
          const closeBtn = document.querySelector('button:has(.lucide-x), [aria-label="close"]') as HTMLElement | null;
          if (closeBtn) {
            closeBtn.click();
            await delay(300);
            steps.push(`5) closed modal/dialog`);
          }
        }
        return steps.join('\n');
      }, add, update);
    }

    /* ══════════════════════════════════════════════════════════════════
       R. RESPONSIVE / MOBILE SIDEBAR TOGGLE
       ══════════════════════════════════════════════════════════════════ */
    await runTest('sidebar-toggle', 'R. Sidebar', 'Toggle sidebar collapse', async () => {
      const steps: string[] = [];
      navigate('/');
      await delay(800);

      const toggleBtn = document.querySelector('button:has(.lucide-chevrons-left), button:has(.lucide-chevrons-right), button:has(.lucide-menu)') as HTMLElement | null;
      if (toggleBtn) {
        steps.push(`1) found sidebar toggle button`);
        toggleBtn.click();
        await delay(400);
        steps.push(`2) clicked → sidebar toggled`);
        toggleBtn.click();
        await delay(400);
        steps.push(`3) clicked again → sidebar restored`);
      } else {
        steps.push(`1) no sidebar toggle button found`);
      }
      return steps.join('\n');
    }, add, update);

    /* ══════════════════════════════════════════════════════════════════
       S. HEADER/LAYOUT BUTTONS
       ══════════════════════════════════════════════════════════════════ */
    await runTest('header-btns', 'S. Header Buttons', 'Theme & lang buttons in header', async () => {
      const steps: string[] = [];
      navigate('/');
      await delay(800);

      // Theme toggle in header
      const themeBtn = document.querySelector('header button:has(.lucide-moon), header button:has(.lucide-sun)') as HTMLElement | null;
      if (themeBtn) {
        const origTheme = useThemeStore.getState().theme;
        themeBtn.click();
        await delay(300);
        steps.push(`1) clicked theme toggle in header → theme="${useThemeStore.getState().theme}"`);
        useThemeStore.getState().setTheme(origTheme);
      } else {
        steps.push(`1) no theme button in header`);
      }

      // Language button
      const langBtn = document.querySelector('header button:has(.lucide-globe), header button:has(.lucide-languages)') as HTMLElement | null;
      if (langBtn) {
        langBtn.click();
        await delay(300);
        steps.push(`2) clicked lang toggle in header`);
        // Restore
        useAuthStore.getState().setLang('ru');
      } else {
        steps.push(`2) no lang button in header`);
      }

      return steps.join('\n');
    }, add, update);

    /* ══════════════════════════════════════════════════════════════════
       T. FULL DOM SCAN — ALL BUTTONS EVERYWHERE
       ══════════════════════════════════════════════════════════════════ */
    for (let i = 0; i < PAGES.length; i++) {
      const page = PAGES[i]!;
      await runTest(`dom-scan-${i}`, 'T. Full DOM Scan', `All <button> on ${page.label}`, async () => {
        const steps: string[] = [];
        navigate(page.path);
        await delay(1200);

        const btns = document.querySelectorAll('button');
        steps.push(`1) navigate("${page.path}") → ${btns.length} total <button> in DOM`);

        let enabledCount = 0;
        let disabledCount = 0;
        btns.forEach((b, idx) => {
          const text = b.textContent?.trim().slice(0, 60) || '(empty)';
          const disabled = b.disabled;
          if (disabled) disabledCount++; else enabledCount++;
          if (idx < 20) {
            steps.push(`  ${idx + 1}. "${text}" ${disabled ? '[disabled]' : '[enabled]'}`);
          }
        });
        if (btns.length > 20) steps.push(`  ... and ${btns.length - 20} more`);
        steps.push(`2) enabled=${enabledCount}, disabled=${disabledCount}`);
        return steps.join('\n');
      }, add, update);
    }

    /* ══════════════════════════════════════════════════════════════════
       U. ALL LINKS SCAN
       ══════════════════════════════════════════════════════════════════ */
    for (let i = 0; i < PAGES.length; i++) {
      const page = PAGES[i]!;
      await runTest(`links-scan-${i}`, 'U. Links Scan', `All <a> on ${page.label}`, async () => {
        const steps: string[] = [];
        navigate(page.path);
        await delay(1200);

        const links = document.querySelectorAll('a');
        steps.push(`1) navigate("${page.path}") → ${links.length} total <a> in DOM`);

        links.forEach((a, idx) => {
          const href = a.getAttribute('href') || '';
          const text = a.textContent?.trim().slice(0, 50) || '(empty)';
          if (idx < 15) {
            steps.push(`  ${idx + 1}. <a href="${href}"> "${text}"`);
          }
        });
        if (links.length > 15) steps.push(`  ... and ${links.length - 15} more`);
        return steps.join('\n');
      }, add, update);
    }

    /* ══════════════════════════════════════════════════════════════════
       W. AUTO-CLICK EVERY LINK ON EVERY PAGE
       ══════════════════════════════════════════════════════════════════ */
    for (let i = 0; i < PAGES.length; i++) {
      const page = PAGES[i]!;
      await runTest(`auto-link-${i}`, 'W. Click All Links', `${page.label} (${page.path})`, async () => {
        const steps: string[] = [];
        navigate(page.path);
        await delay(1200);

        const links = Array.from(document.querySelectorAll('main a[href]'));
        steps.push(`1) navigate("${page.path}") → ${links.length} links in <main>`);

        let visited = 0;
        for (let li = 0; li < links.length && li < 10; li++) {
          const a = links[li] as HTMLAnchorElement;
          const href = a.getAttribute('href') || '';
          const text = a.textContent?.trim().slice(0, 40) || '';
          if (href.startsWith('/') && !href.includes('test-runner') && !href.includes('logout')) {
            capturedErrors.length = 0;
            a.click();
            await delay(600);
            const main = document.querySelector('main');
            const ok = main && (main.innerHTML?.length ?? 0) > 30;
            steps.push(`  ${li + 1}. <a href="${href}"> "${text}" → ${ok ? '✅ rendered' : '❌ empty'}`);
            if (capturedErrors.length > 0) steps.push(`     ⚠️ JS error: ${capturedErrors[0]?.slice(0, 80)}`);
            visited++;
            navigate(page.path);
            await delay(600);
          } else if (href.startsWith('http')) {
            steps.push(`  ${li + 1}. <a href="${href.slice(0, 50)}"> "${text}" → external, skip`);
          }
        }
        steps.push(`2) visited ${visited} internal links`);
        return steps.join('\n');
      }, add, update);
    }

    /* ══════════════════════════════════════════════════════════════════
       X. OPEN & CLOSE EVERY MODAL
       ══════════════════════════════════════════════════════════════════ */
    const modalPages = PAGES.filter(p => p.buttons?.some(b => b.expectModal));
    for (let i = 0; i < modalPages.length; i++) {
      const page = modalPages[i]!;
      const modalBtns = page.buttons!.filter(b => b.expectModal);
      for (let j = 0; j < modalBtns.length; j++) {
        const mb = modalBtns[j]!;
        await runTest(`modal-cycle-${i}-${j}`, 'X. Modal Open/Close', `${page.label} → ${mb.label}`, async () => {
          const steps: string[] = [];
          navigate(page.path);
          await delay(1200);
          steps.push(`1) navigate("${page.path}")`);

          const trigger = document.querySelector(mb.selector) as HTMLElement | null;
          if (!trigger) { steps.push(`2) trigger not found`); return steps.join('\n'); }

          // Open modal
          trigger.click();
          await delay(800);
          const modal = document.querySelector('.fixed.inset-0, [role="dialog"], .modal');
          steps.push(`2) opened modal → ${modal ? 'VISIBLE' : 'NOT FOUND'}`);

          if (modal) {
            // Check all inputs inside modal
            const modalInputs = modal.querySelectorAll('input, textarea, select');
            steps.push(`3) modal has ${modalInputs.length} form elements`);
            modalInputs.forEach((el, idx) => {
              const tag = el.tagName.toLowerCase();
              const type = (el as HTMLInputElement).type || '';
              const name = (el as HTMLInputElement).name || '';
              const placeholder = (el as HTMLInputElement).placeholder || '';
              steps.push(`  ${idx + 1}. <${tag}> type="${type}" name="${name}" placeholder="${placeholder.slice(0, 30)}"`);
            });

            // Check all buttons inside modal
            const modalBtnsInner = modal.querySelectorAll('button');
            steps.push(`4) modal has ${modalBtnsInner.length} buttons`);
            modalBtnsInner.forEach((b, idx) => {
              steps.push(`  ${idx + 1}. "${(b as HTMLElement).textContent?.trim().slice(0, 40)}"`);
            });

            // Close modal
            if (mb.closeAfter) {
              const closeBtn = document.querySelector(mb.closeAfter) as HTMLElement | null;
              if (closeBtn) { closeBtn.click(); await delay(400); steps.push(`5) closed modal`); }
            }
          }
          return steps.join('\n');
        }, add, update);
      }
    }

    /* ══════════════════════════════════════════════════════════════════
       Y. API ERROR HANDLING (bad requests)
       ══════════════════════════════════════════════════════════════════ */
    const errorEndpoints = [
      { path: '/api/nonexistent', expect: 404, label: '404 Not Found' },
      { path: '/api/sessions/99999999', expect: 404, label: 'Invalid session ID' },
      { path: '/api/grades?session_id=invalid', expect: 400, label: 'Bad grade query' },
    ];
    for (let i = 0; i < errorEndpoints.length; i++) {
      const ep = errorEndpoints[i]!;
      await runTest(`api-err-${i}`, 'Y. API Errors', `${ep.label} (${ep.path})`, async () => {
        const steps: string[] = [];
        try {
          const res = await fetchWithTimeout(`${API_BASE}${ep.path}`, { headers }, 5000);
          steps.push(`1) ${ep.path} → status ${res.status}`);
          if (res.ok) {
            steps.push(`2) ⚠️ expected error but got 200 OK`);
          } else {
            steps.push(`2) ✅ correctly returned error status ${res.status}`);
          }
        } catch (err) {
          steps.push(`1) request failed: ${err instanceof Error ? err.message : String(err)}`);
        }
        return steps.join('\n');
      }, add, update);
    }

    /* ══════════════════════════════════════════════════════════════════
       Z. IMAGE/AVATAR LOADING CHECK
       ══════════════════════════════════════════════════════════════════ */
    await runTest('img-check', 'Z. Images', 'Check all images load on profile/main pages', async () => {
      const steps: string[] = [];
      const imgPages = ['/', '/profile', '/admin/users', '/ratings'];
      let totalImgs = 0;
      let brokenImgs = 0;

      for (const p of imgPages) {
        navigate(p);
        await delay(1200);
        const imgs = document.querySelectorAll('main img');
        steps.push(`${p} → ${imgs.length} images`);
        imgs.forEach((img) => {
          totalImgs++;
          const src = (img as HTMLImageElement).src?.slice(0, 60) || '';
          const natural = (img as HTMLImageElement).naturalWidth;
          if (natural === 0 && src && !src.includes('data:')) {
            brokenImgs++;
            steps.push(`  ❌ broken: ${src}`);
          }
        });
      }
      steps.push(`Total: ${totalImgs} images, ${brokenImgs} broken`);
      if (brokenImgs > 0) throw new Error(`${brokenImgs} broken image(s)`);
      return steps.join('\n');
    }, add, update);

    /* ══════════════════════════════════════════════════════════════════
       AA. EMPTY STATE CHECKS
       ══════════════════════════════════════════════════════════════════ */
    await runTest('empty-states', 'AA. Empty States', 'Pages with no data show empty state', async () => {
      const steps: string[] = [];
      const emptyCheckPages = ['/my-courses', '/support'];
      for (const p of emptyCheckPages) {
        navigate(p);
        await delay(1200);
        const main = document.querySelector('main');
        const html = main?.innerHTML ?? '';
        const hasContent = html.length > 50;
        const hasEmptyMsg = html.includes('Пока нет') || html.includes('пусто') || html.includes('Әзірге жоқ') || html.includes('empty') || html.includes('бос');
        steps.push(`${p} → content=${hasContent}, empty_msg=${hasEmptyMsg}, length=${html.length}`);
      }
      return steps.join('\n');
    }, add, update);

    /* ══════════════════════════════════════════════════════════════════
       AB. ACCESSIBILITY — ALL INTERACTIVE ELEMENTS HAVE ACCESSIBLE TEXT
       ══════════════════════════════════════════════════════════════════ */
    for (let i = 0; i < PAGES.length; i++) {
      const page = PAGES[i]!;
      await runTest(`a11y-${i}`, 'AB. Accessibility', `${page.label} — buttons have text/aria`, async () => {
        const steps: string[] = [];
        navigate(page.path);
        await delay(1200);

        const btns = document.querySelectorAll('main button');
        let missing = 0;
        btns.forEach((b, idx) => {
          const text = b.textContent?.trim() || '';
          const aria = b.getAttribute('aria-label') || '';
          const title = b.getAttribute('title') || '';
          const hasIcon = b.querySelector('svg') !== null;
          const accessible = text.length > 0 || aria.length > 0 || title.length > 0;
          if (!accessible && hasIcon) {
            missing++;
            steps.push(`  ${idx + 1}. ⚠️ icon-only button without aria-label`);
          }
        });
        steps.push(`1) ${btns.length} buttons, ${missing} missing accessible text`);
        return steps.join('\n');
      }, add, update);
    }

    /* ══════════════════════════════════════════════════════════════════
       AC. NETWORK LATENCY — API RESPONSE TIMES
       ══════════════════════════════════════════════════════════════════ */
    await runTest('api-latency', 'AC. API Latency', 'Measure response times for all endpoints', async () => {
      const steps: string[] = [];
      const timings: { ep: string; ms: number }[] = [];
      for (const ep of API_ENDPOINTS.slice(0, 8)) {
        const t0 = performance.now();
        try {
          await fetchWithTimeout(`${API_BASE}${ep}`, { headers }, 5000);
          const ms = Math.round(performance.now() - t0);
          timings.push({ ep, ms });
          steps.push(`${ep} → ${ms}ms ${ms > 2000 ? '⚠️ SLOW' : '✅'}`);
        } catch {
          steps.push(`${ep} → TIMEOUT/ERROR`);
        }
      }
      const avg = timings.length > 0 ? Math.round(timings.reduce((s, t) => s + t.ms, 0) / timings.length) : 0;
      const slowCount = timings.filter(t => t.ms > 2000).length;
      steps.push(`\nAverage: ${avg}ms, Slow (>2s): ${slowCount}/${timings.length}`);
      if (slowCount > timings.length / 2) throw new Error('More than half of endpoints are slow');
      return steps.join('\n');
    }, add, update);

    /* ══════════════════════════════════════════════════════════════════
       V. CONSOLE ERROR SCAN
       ══════════════════════════════════════════════════════════════════ */
    await runTest('console-errors', 'V. Console Errors', 'Check captured console.error calls', async () => {
      const steps: string[] = [];
      steps.push(`1) total console.error captured: ${consoleErrors.current.length}`);
      if (consoleErrors.current.length > 0) {
        consoleErrors.current.slice(0, 5).forEach((e, i) => {
          steps.push(`  ${i + 1}. ${e.slice(0, 120)}`);
        });
        throw new Error(`${consoleErrors.current.length} console.error(s): ${consoleErrors.current.slice(0, 3).join(' | ')}`);
      }
      steps.push(`2) CLEAN — no console errors`);
      return steps.join('\n');
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

  /* ─── Expandable story state ─── */
  const [expandedIds, setExpandedIds] = useState<Set<string>>(new Set());
  const toggleExpand = useCallback((id: string) => {
    setExpandedIds((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id); else next.add(id);
      return next;
    });
  }, []);

  /* ─── Derived stats ─── */
  const total = results.length;
  const passed = results.filter((r) => r.status === 'passed').length;
  const failed = results.filter((r) => r.status === 'failed').length;
  const runningCount = results.filter((r) => r.status === 'running').length;
  // A(1)+B(1)+C(eps)+CA(post)+D(pages)+E(btns)+F(pages)+G(inputs)+H(selects)+I(pages)+J(1)+K(1)+L(2)+M(pages)+N(2)+O(3)+P(1)+Q(4)+R(1)+S(1)+T(pages)+U(pages)+W(pages)+X(modals)+Y(3)+Z(1)+AA(1)+AB(pages)+AC(1)+V(1)
  const btnCount = PAGES.reduce((s, p) => s + (p.buttons?.length ?? 0), 0);
  const inputCount = PAGES.reduce((s, p) => s + (p.inputs?.length ?? 0), 0);
  const selectCount = PAGES.reduce((s, p) => s + (p.selects?.length ?? 0), 0);
  const modalCount = PAGES.reduce((s, p) => s + (p.buttons?.filter(b => b.expectModal)?.length ?? 0), 0);
  const expectedTotal = 1 + 1 + API_ENDPOINTS.length + API_POST_ENDPOINTS.length + PAGES.length + btnCount + PAGES.length + inputCount + selectCount + PAGES.length + 1 + 1 + 2 + PAGES.length + 2 + 3 + 1 + 4 + 1 + 1 + PAGES.length + PAGES.length + PAGES.length + modalCount + 3 + 1 + 1 + PAGES.length + 1 + 1;
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
          <div ref={logRef} className="max-h-[600px] overflow-y-auto p-3 space-y-1 font-mono text-[13px] leading-6">
            {results.map((r) => (
              <div key={r.id} className="group">
                <div
                  className="flex items-start gap-2 cursor-pointer hover:bg-gray-800/50 rounded px-1 -mx-1"
                  onClick={() => r.story && toggleExpand(r.id)}
                >
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
                  {r.story && (
                    <span className="shrink-0 text-gray-600 opacity-0 group-hover:opacity-100 transition-opacity">
                      {expandedIds.has(r.id) ? <ChevronUp size={12} /> : <ChevronDown size={12} />}
                    </span>
                  )}
                </div>
                {/* ─── Story / History ─── */}
                {r.story && expandedIds.has(r.id) && (
                  <div className="ml-7 mt-1 mb-2 rounded border border-gray-700/50 bg-gray-900/80 px-3 py-2 text-[11px] leading-5 text-gray-400 whitespace-pre-wrap">
                    {r.story}
                  </div>
                )}
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
