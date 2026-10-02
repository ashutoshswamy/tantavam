import "intro.js/introjs.css";

const KEY = "tantvam:tour-done";
let started = false; // StrictMode runs effects twice in dev

// First-visit walkthrough of the header, once per browser. Steps whose element isn't on screen are skipped.
export async function startTourOnce() {
  if (started) return;
  started = true;
  try {
    if (localStorage.getItem(KEY)) return;
  } catch {
    return;
  }
  const { default: introJs } = await import("intro.js");
  const shown = (sel: string) => {
    const el = document.querySelector<HTMLElement>(sel);
    return el && el.getClientRects().length ? el : null;
  };
  const steps = [
    { title: "Welcome to Tantvam", intro: "Here's a quick look around. It takes about 20 seconds." },
    { element: shown('[data-tour="categories"]'), title: "Shop by collection", intro: "Browse ethnic wear for women and for men." },
    { element: shown('[data-tour="search"]'), title: "Search", intro: "Looking for something specific? Search any piece by name." },
    { element: shown('[data-tour="cart"]'), title: "Your cart", intro: "Pieces you add land here. It opens from the side, so you can keep browsing." },
    {
      element: shown('[data-tour="account"]'),
      title: "Your account",
      intro: "Sign in to check out, track your orders and keep a wishlist. It all lives in this menu.",
    },
  ].filter((s) => !("element" in s) || s.element);

  const finish = () => {
    try {
      localStorage.setItem(KEY, "1");
    } catch {}
  };
  introJs
    .tour()
    .setOptions({
      steps,
      showBullets: false,
      showProgress: true,
      exitOnOverlayClick: false,
      nextLabel: "Next",
      prevLabel: "Back",
      doneLabel: "Start shopping",
      tooltipClass: "tantvam-tour",
    })
    .onComplete(finish)
    .onExit(finish)
    .start();
}
