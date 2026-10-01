import { clerkClient } from "@clerk/nextjs/server";
import { gate, SECTIONS } from "@/lib/store";
import { addStaff, removeStaff, updateStaff } from "../actions";
import { Submit } from "../client";
import { Card, Empty, Header, btn, btnDanger, btnGhost, field, td, th, tr } from "../ui";

export const metadata = { title: "Staff" };

export default async function Staff() {
  await gate("staff");
  const staff = await listStaff();
  return (
    <>
      <Header title="Staff" description="Staff see only the sections you tick. Admins are managed in the Clerk dashboard." />
      <Card title="Invite staff" className="mb-6">
        <form action={addStaff} className="grid gap-4 p-5">
          <input name="email" type="email" required placeholder="Email they signed up with" className={`${field} max-w-sm`} />
          <SectionBoxes />
          <div>
            <Submit className={btn}>Add staff</Submit>
          </div>
        </form>
      </Card>
      <Card title="Team">
        {!staff.length ? (
          <Empty>No staff yet.</Empty>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr>
                  <th className={th}>Member</th>
                  <th className={th}>Access</th>
                  <th className={th} />
                </tr>
              </thead>
              <tbody>
                {staff.map((u) => (
                  <tr key={u.id} className={tr}>
                    <td className={td}>
                      <p className="font-medium">{u.name || u.email}</p>
                      {u.name && <p className="text-xs text-kajal/50">{u.email}</p>}
                    </td>
                    <td className={td}>
                      <form id={`staff-${u.id}`} action={updateStaff}>
                        <input type="hidden" name="id" value={u.id} />
                        <SectionBoxes checked={u.sections} />
                      </form>
                    </td>
                    <td className={`${td} whitespace-nowrap text-right`}>
                      <button form={`staff-${u.id}`} className={btnGhost}>Save</button>
                      <form action={removeStaff} className="inline">
                        <input type="hidden" name="id" value={u.id} />
                        <Submit className={btnDanger} confirm={`Remove ${u.email} from staff?`}>Remove</Submit>
                      </form>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </Card>
    </>
  );
}

function SectionBoxes({ checked = [] }: { checked?: string[] }) {
  return (
    <div className="flex flex-wrap gap-x-4 gap-y-2 text-sm">
      {SECTIONS.map((s) => (
        <label key={s} className="flex items-center gap-1.5 capitalize">
          <input type="checkbox" name="sections" value={s} defaultChecked={checked.includes(s)} className="accent-rani" /> {s}
        </label>
      ))}
    </div>
  );
}

// ponytail: Clerk can't filter users by metadata, so scan the first 500 users. Mirror staff into a Supabase table if the user base outgrows this.
async function listStaff() {
  const { data } = await (await clerkClient()).users.getUserList({ limit: 500 });
  return data
    .filter((u) => u.publicMetadata.role === "staff")
    .map((u) => ({
      id: u.id,
      name: u.fullName,
      email: u.primaryEmailAddress?.emailAddress ?? u.id,
      sections: (u.publicMetadata.sections as string[] | undefined) ?? [],
    }));
}
