import Link from "next/link";
import { db } from "@/lib/db";
import { gate } from "@/lib/store";
import { deleteMessage, setMessageRead } from "../actions";
import { Submit } from "../client";
import { Card, Empty, Header, btnDanger, btnGhost, dateTime } from "../ui";

export const metadata = { title: "Messages" };

type Message = { id: string; name: string; email: string; phone: string; body: string; read: boolean; created_at: string };

export default async function Messages({ searchParams }: PageProps<"/admin/messages">) {
  await gate("messages");
  const unreadOnly = (await searchParams).filter === "unread";
  let query = db.from("messages").select("*").order("created_at", { ascending: false }).limit(100);
  if (unreadOnly) query = query.eq("read", false);
  const [{ data }, { count: unread }] = await Promise.all([
    query,
    db.from("messages").select("id", { count: "exact", head: true }).eq("read", false),
  ]);
  const messages = (data ?? []) as Message[];

  return (
    <>
      <Header title="Messages" description="Sent from the contact page. Latest 100." />
      <Card>
        <nav className="flex gap-1 border-b border-kajal/10 p-3 text-sm">
          {[
            ["All", "?"],
            [`Unread ${unread ?? 0}`, "?filter=unread"],
          ].map(([label, href]) => (
            <Link
              key={href}
              href={href}
              aria-current={(href === "?filter=unread") === unreadOnly ? "page" : undefined}
              className="rounded-md px-3 py-1.5 text-kajal/60 hover:bg-mallige hover:text-kajal aria-[current=page]:bg-kajal aria-[current=page]:text-mallige"
            >
              {label}
            </Link>
          ))}
        </nav>
        {!messages.length ? (
          <Empty>No messages.</Empty>
        ) : (
          <ul className="divide-y divide-kajal/10">
            {messages.map((m) => (
              <li key={m.id} className={`grid gap-3 p-5 text-sm ${m.read ? "" : "bg-mallige/70"}`}>
                <div className="flex flex-wrap items-baseline justify-between gap-2">
                  <p>
                    {!m.read && <span className="mr-2 inline-block h-2 w-2 rounded-full bg-rani" aria-label="Unread" />}
                    <span className="font-semibold">{m.name}</span>
                    <a href={`mailto:${m.email}`} className="ml-2 text-kajal/60 hover:text-rani">{m.email}</a>
                    {m.phone && <a href={`tel:${m.phone}`} className="ml-2 text-kajal/60 hover:text-rani">{m.phone}</a>}
                  </p>
                  <span className="text-xs text-kajal/50">{dateTime(m.created_at)}</span>
                </div>
                <p className="whitespace-pre-line text-kajal/80">{m.body}</p>
                <div className="flex flex-wrap gap-2">
                  <a href={`mailto:${m.email}?subject=${encodeURIComponent("Re: your message to Tantavam")}`} className={btnGhost}>Reply</a>
                  <form action={setMessageRead}>
                    <input type="hidden" name="id" value={m.id} />
                    <input type="hidden" name="read" value={String(!m.read)} />
                    <Submit className={btnGhost}>{m.read ? "Mark unread" : "Mark read"}</Submit>
                  </form>
                  <form action={deleteMessage}>
                    <input type="hidden" name="id" value={m.id} />
                    <Submit className={btnDanger} confirm={`Delete message from ${m.name}?`}>Delete</Submit>
                  </form>
                </div>
              </li>
            ))}
          </ul>
        )}
      </Card>
    </>
  );
}
