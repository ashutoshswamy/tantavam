// Chainable stand-in for the supabase client: every table resolves to rows[table]; head count queries resolve to counts[table].
type Opts = { rows?: Record<string, unknown[]>; counts?: Record<string, number> };

export function fakeDb({ rows = {}, counts = {} }: Opts = {}) {
  return {
    from(table: string) {
      let head = false;
      const q: any = new Proxy(() => {}, {
        get(_t, prop) {
          if (prop === "then") {
            const result = head ? { count: counts[table] ?? 0, data: null } : { data: rows[table] ?? [], count: null };
            return (res: (v: unknown) => void) => res(result);
          }
          if (prop === "maybeSingle") return () => Promise.resolve({ data: rows[table]?.[0] ?? null });
          return (...args: unknown[]) => {
            if (prop === "select" && (args[1] as { head?: boolean } | undefined)?.head) head = true;
            return q;
          };
        },
      });
      return q;
    },
  };
}
