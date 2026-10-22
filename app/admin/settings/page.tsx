import { gate, getAnnouncementDraft, getCheckoutMode, getSizeChart } from "@/lib/store";
import { setAnnouncement, setCheckoutMode, setSizeChart } from "../actions";
import { Submit } from "../client";
import { Card, Header, btn, field } from "../ui";

export const metadata = { title: "Settings" };

const MODES = [
  ["razorpay", "Razorpay", "Customers pay online at checkout. Orders arrive already paid."],
  ["whatsapp", "WhatsApp", "Customers send their cart to the store's WhatsApp. Nothing is saved automatically: you agree the order in chat, then enter it under Orders → New order."],
] as const;

export default async function Settings() {
  await gate("staff");
  const [mode, band, chart] = await Promise.all([getCheckoutMode(), getAnnouncementDraft(), getSizeChart()]);
  return (
    <>
      <Header title="Settings" description="Store-wide switches. Only admins see this page." />
      <Card title="Checkout method" className="max-w-xl">
        <form action={setCheckoutMode} className="grid gap-3 p-5 text-sm">
          {MODES.map(([value, label, hint]) => (
            <label key={value} className="flex cursor-pointer gap-3 rounded-md border border-kajal/15 p-3 has-checked:border-rani">
              <input type="radio" name="mode" value={value} defaultChecked={mode === value} className="mt-0.5 accent-rani" />
              <span>
                <span className="font-medium">{label}</span>
                <span className="block text-kajal/60">{hint}</span>
              </span>
            </label>
          ))}
          <div>
            <Submit className={btn}>Save</Submit>
          </div>
        </form>
      </Card>
      <Card title="Announcement band" className="mt-6 max-w-xl">
        <form action={setAnnouncement} className="grid gap-4 p-5 text-sm">
          <label className="grid gap-1.5 font-medium">
            Message
            <input name="text" maxLength={140} defaultValue={band.text} placeholder="e.g. Festive sale: flat 20% off, this week only" className={field} />
          </label>
          <label className="grid gap-1.5 font-medium">
            Link (optional)
            <input name="link" defaultValue={band.link} placeholder="/shop or https://..." className={field} />
            <span className="text-xs font-normal text-kajal/50">Makes the whole band clickable.</span>
          </label>
          <label className="flex items-center gap-2">
            <input type="checkbox" name="on" defaultChecked={band.on} /> Show the band on the store
          </label>
          <div>
            <Submit className={btn}>Save</Submit>
          </div>
        </form>
      </Card>
      <Card title="Size chart" className="mt-6 max-w-xl">
        <form action={setSizeChart} className="grid gap-3 p-5 text-sm">
          <textarea name="chart" rows={9} defaultValue={chart} className={`${field} font-mono`} />
          <p className="text-xs text-kajal/50">
            Shown in the fit guide on every product page. First line is the header, then one size per line, separated by commas (inches). The values here are a generic starting point: replace them with your own measurements.
          </p>
          <div>
            <Submit className={btn}>Save</Submit>
          </div>
        </form>
      </Card>
    </>
  );
}
