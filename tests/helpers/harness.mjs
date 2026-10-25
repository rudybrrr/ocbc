import { readFileSync, existsSync } from "node:fs";
import { resolve } from "node:path";
import ts from "typescript";
import { createRequire } from "node:module";
const loadPackage = createRequire(import.meta.url);

// Run the real store and companion hook with deterministic effects and timers.
export function harness(saved, blocked = false) {
  const state = [], effects = [], cache = new Map(), timers = new Map();
  let cursor = 0, dirty = false, timerId = 0;
  let raw = saved === undefined ? null : JSON.stringify(saved);
  const storage = {
    getItem: () => { if (blocked) throw Error("Storage blocked"); return raw; },
    setItem: (_, value) => { if (blocked) throw Error("Quota exceeded"); raw = value; },
    removeItem: () => { if (blocked) throw Error("Storage blocked"); raw = null; },
  };
  let store;
  const react = {
    useContext: () => store,
    createContext: () => ({ Provider: "provider" }),
    useState(initial) {
      const i = cursor++;
      if (!(i in state)) state[i] = typeof initial === "function" ? initial() : initial;
      return [state[i], (next) => {
        const value = typeof next === "function" ? next(state[i]) : next;
        if (!Object.is(value, state[i])) { state[i] = value; dirty = true; }
      }];
    },
    useMemo: (fn) => fn(),
    useEffect(fn, deps) {
      const i = cursor++;
      const old = effects[i];
      if (!old || deps.some((dep, index) => !Object.is(dep, old.deps[index]))) {
        effects[i] = { deps, fn, cleanup: old?.cleanup, pending: true };
      }
    },
  };
  const doc = {
    documentElement: { dataset: {} },
    addEventListener() {}, removeEventListener() {},
    querySelector: () => null,
  };
  let confirmExit = true;
  const win = {
    confirm: () => confirmExit,
    setTimeout: (fn) => { timers.set(++timerId, fn); return timerId; },
    clearTimeout: (id) => timers.delete(id),
  };
  function load(file) {
    if (cache.has(file)) return cache.get(file).exports;
    const loadedModule = { exports: {} };
    cache.set(file, loadedModule);
    const code = ts.transpileModule(readFileSync(file, "utf8"), {
      compilerOptions: { target: ts.ScriptTarget.ES2017, module: ts.ModuleKind.CommonJS, jsx: ts.JsxEmit.ReactJSX },
    }).outputText;
    const localRequire = (id) => {
      if (id === "react") return react;
      if (id === "@/lib/transition") return { withTransition: (fn) => fn() };
      // DOM animation is verified in the browser; this harness exercises banking state.
      if (id === "@/lib/use-content-motion") return { useContentMotion: () => undefined };
      if (!id.startsWith("@/")) return loadPackage(id);
      const base = resolve("src", id.slice(2));
      return load(existsSync(`${base}.ts`) ? `${base}.ts` : `${base}.tsx`);
    };
    new Function("require", "module", "exports", "localStorage", "document", "window", "requestAnimationFrame", code)(
      localRequire, loadedModule, loadedModule.exports, storage, doc, win, () => {},
    );
    return loadedModule.exports;
  }
  function render(fn) {
    let result;
    for (let pass = 0; pass < 20; pass++) {
      dirty = false; cursor = 0; result = fn();
      for (const effect of effects) {
        if (!effect?.pending) continue;
        effect.pending = false; effect.cleanup?.(); effect.cleanup = effect.fn();
      }
      if (!dirty) return result;
    }
    throw Error("Render did not settle");
  }
  return { load, render, timers, saved: () => JSON.parse(raw), setStore: (value) => { store = value; }, confirmExit: (value) => { confirmExit = value; } };
}
