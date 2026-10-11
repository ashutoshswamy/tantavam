// template (not layout) remounts on every admin navigation, so each page eases in
export default function Template({ children }: { children: React.ReactNode }) {
  return <div className="animate-[rise-in_0.35s_ease-out]">{children}</div>;
}
