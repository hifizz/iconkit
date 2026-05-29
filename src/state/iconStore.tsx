import {
  createContext,
  useContext,
  useReducer,
  type Dispatch,
  type ReactNode,
} from "react"

import { defaultIconState, type IconState } from "@/lib/types"

// ---- deep partial patch -----------------------------------------------------

type DeepPartial<T> = {
  [K in keyof T]?: T[K] extends object ? DeepPartial<T[K]> : T[K]
}

function deepMerge<T>(base: T, patch: DeepPartial<T>): T {
  const out = { ...base } as T
  for (const key in patch) {
    const pv = patch[key] as unknown
    const bv = (base as Record<string, unknown>)[key]
    if (
      pv &&
      typeof pv === "object" &&
      !Array.isArray(pv) &&
      bv &&
      typeof bv === "object"
    ) {
      ;(out as Record<string, unknown>)[key] = deepMerge(bv, pv as object)
    } else if (pv !== undefined) {
      ;(out as Record<string, unknown>)[key] = pv
    }
  }
  return out
}

// ---- history ----------------------------------------------------------------

const HISTORY_LIMIT = 100
const COALESCE_MS = 400

type History = {
  past: IconState[]
  present: IconState
  future: IconState[]
  lastKey?: string
  lastTs: number
}

export type IconAction =
  | { type: "patch"; patch: DeepPartial<IconState>; coalesceKey?: string; ts: number }
  | { type: "set"; next: IconState }
  | { type: "undo" }
  | { type: "redo" }
  | { type: "reset" }

function reducer(state: History, action: IconAction): History {
  switch (action.type) {
    case "patch": {
      const next = deepMerge(state.present, action.patch)
      // Coalesce rapid same-key edits (slider drags) into one history entry.
      const coalesce =
        action.coalesceKey !== undefined &&
        action.coalesceKey === state.lastKey &&
        action.ts - state.lastTs < COALESCE_MS
      const past = coalesce
        ? state.past
        : [...state.past, state.present].slice(-HISTORY_LIMIT)
      return {
        past,
        present: next,
        future: [],
        lastKey: action.coalesceKey,
        lastTs: action.ts,
      }
    }
    case "set": {
      return {
        past: [...state.past, state.present].slice(-HISTORY_LIMIT),
        present: action.next,
        future: [],
        lastKey: undefined,
        lastTs: 0,
      }
    }
    case "undo": {
      if (state.past.length === 0) return state
      const previous = state.past[state.past.length - 1]
      return {
        past: state.past.slice(0, -1),
        present: previous,
        future: [state.present, ...state.future],
        lastKey: undefined,
        lastTs: 0,
      }
    }
    case "redo": {
      if (state.future.length === 0) return state
      const next = state.future[0]
      return {
        past: [...state.past, state.present],
        present: next,
        future: state.future.slice(1),
        lastKey: undefined,
        lastTs: 0,
      }
    }
    case "reset": {
      return {
        past: [...state.past, state.present].slice(-HISTORY_LIMIT),
        present: defaultIconState,
        future: [],
        lastKey: undefined,
        lastTs: 0,
      }
    }
    default:
      return state
  }
}

// ---- context ----------------------------------------------------------------

const StateCtx = createContext<IconState | null>(null)
const DispatchCtx = createContext<Dispatch<IconAction> | null>(null)
const HistoryCtx = createContext<{ canUndo: boolean; canRedo: boolean } | null>(null)

export function IconStoreProvider({ children }: { children: ReactNode }) {
  const [history, dispatch] = useReducer(reducer, {
    past: [],
    present: defaultIconState,
    future: [],
    lastTs: 0,
  })
  return (
    <StateCtx.Provider value={history.present}>
      <DispatchCtx.Provider value={dispatch}>
        <HistoryCtx.Provider
          value={{
            canUndo: history.past.length > 0,
            canRedo: history.future.length > 0,
          }}
        >
          {children}
        </HistoryCtx.Provider>
      </DispatchCtx.Provider>
    </StateCtx.Provider>
  )
}

export function useIconState(): IconState {
  const ctx = useContext(StateCtx)
  if (!ctx) throw new Error("useIconState must be used within IconStoreProvider")
  return ctx
}

export function useIconDispatch(): Dispatch<IconAction> {
  const ctx = useContext(DispatchCtx)
  if (!ctx) throw new Error("useIconDispatch must be used within IconStoreProvider")
  return ctx
}

export function useHistory() {
  const ctx = useContext(HistoryCtx)
  if (!ctx) throw new Error("useHistory must be used within IconStoreProvider")
  return ctx
}

/** Convenience helper: dispatch a patch with a timestamp + optional coalesce key. */
export function usePatch() {
  const dispatch = useIconDispatch()
  return (patch: DeepPartial<IconState>, coalesceKey?: string) =>
    dispatch({ type: "patch", patch, coalesceKey, ts: Date.now() })
}
