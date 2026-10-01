import Link from "next/link";
import { db } from "@/lib/db";
import { gate, SECTIONS } from "@/lib/store";
import { Card, Empty, Header, btnGhost, dateTime, field, td, th, tr } from "../ui";

export const metadata = { title: "Staff logs" };

const PAGE = 100;
type Log = { id: string; actor_id: string; actor_name: string; actor_role: "admin" | "staff"; section: string; action: string; target: string; created_at: string };

export default async function Logs({ searchParams }: PageProps<"/admin/logs">) {
  await gate("staff"); // admins only
  const sp = await searchParams;
  const one = (k: string) => (typeof sp[k] === "string" ? (sp[k] as string) : "");
  const role = one("role") || "staff";
  const actor = one("actor");
  const section = one("section");
  const before = one("before");

  let query = db.from("audit_logs").select("*").order("created_at", { ascending: false }).limit(PAGE);
  if (role !== "all") query = query.eq("actor_role", role);
  if (actor) query = query.eq("actor_id", actor);
  if (section) query = query.eq("section", section);
  if (before) query = query.lt("created_at", before);

  // ponytail: people list comes from the latest 1000 entries; someone idle longer than that drops out of the dropdown
  const [{ data }, { data: recent }] = await Promise.all([
    query,
    db.from("audit_logs").select("actor_id, actor_name").order("created_at", { ascending: false }).limit(1000),
  ]);
  const logs = (data ?? []) as Log[];
  const people = [...new Map((recent ?? []).map((r) => [r.actor_id, r.actor_name])).entries()];
  const older = logs.length === PAGE ? new URLSearchParams({ role, actor, section, before: logs.at(-1)!.created_at }) : null;

  return (
    <>
      <Header title="Staff logs" description="Every change made in the admin panel, newest first." />
      <Card>
        <form className="flex flex-wrap items-end gap-3 border-b border-kajal/10 p-4 text-sm">
          <label className="grid gap-1">
            <span className="text-xs text-kajal/60">Who</span>
            <select name="role" defaultValue={role} className={field}>
              <option value="staff">Staff only</option>
              <option value="admin">Admins only</option>
              <option value="all">Everyone</option>
            </select>
          </label>
          <label className="grid gap-1">
            <span className="text-xs text-kajal/60">Person</span>
            <select name="actor" defaultValue={actor} className={field}>
              <option value="">Anyone</option>
              {people.map(([id, name]) => (
                <option key={id} value={id}>{name}</option>
              ))}
            </select>
          </label>
          <label className="grid gap-1">
            <span className="text-xs text-kajal/60">Section</span>
            <select name="section" defaultValue={section} className={`${field} capitalize`}>
              <option value="">All sections</option>
              {[...SECTIONS, "staff"].map((s) => (
                <option key={s} value={s}>{s}</option>
              ))}
            </select>
          </label>
          <button className={btnGhost}>Apply</button>
          {(actor || section || role !== "staff") && (
            <Link href="/admin/logs" className="py-2 text-kajal/60 hover:text-rani">Reset</Link>
          )}
        </form>

        {!logs.length ? (
          <Empty>No activity matches these filters.</Empty>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr>
                  <th className={th}>When</th>
                  <th className={th}>Who</th>
                  <th className={th}>Section</th>
                  <th className={th}>Action</th>
                  <th className={th}>Details</th>
                </tr>
              </thead>
              <tbody>
                {logs.map((l) => (
                  <tr key={l.id} className={tr}>
                    <td className={`${td} whitespace-nowrap text-kajal/60`}>{dateTime(l.created_at)}</td>
                    <td className={`${td} whitespace-nowrap`}>
                      <span className="font-medium">{l.actor_name}</span>
                      {l.actor_role === "admin" && (
                        <span className="ml-2 rounded-full bg-kajal px-2 py-0.5 text-[10px] font-medium uppercase tracking-wider text-mallige">Admin</span>
                      )}
                    </td>
                    <td className={`${td} capitalize text-kajal/70`}>{l.section}</td>
                    <td className={`${td} whitespace-nowrap`}>{l.action}</td>
                    <td className={`${td} text-kajal/70`}>{l.target}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
        {older && (
          <div className="border-t border-kajal/10 p-4 text-center">
            <Link href={`?${older}`} className={btnGhost}>Older entries</Link>
          </div>
        )}
      </Card>
    </>
  );
}
