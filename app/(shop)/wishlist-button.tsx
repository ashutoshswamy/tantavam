import { auth } from "@clerk/nextjs/server";
import { SignInButton } from "@clerk/nextjs";
import { Heart } from "lucide-react";
import { db } from "@/lib/db";
import { toggleWishlist } from "@/app/actions";

const cls = "inline-flex items-center gap-2 text-sm hover:text-rani";

export async function WishlistButton({ productId }: { productId: string }) {
  const { userId } = await auth();
  if (!userId)
    return (
      <SignInButton>
        <button className={cls}><Heart size={18} strokeWidth={1.75} /> Save to wishlist</button>
      </SignInButton>
    );
  const { count } = await db.from("wishlist").select("product_id", { count: "exact", head: true }).match({ user_id: userId, product_id: productId });
  const saved = !!count;
  return (
    <form action={toggleWishlist}>
      <input type="hidden" name="id" value={productId} />
      <button className={cls} aria-pressed={saved}>
        <Heart size={18} strokeWidth={1.75} className={saved ? "fill-rani text-rani" : ""} />
        {saved ? "Saved to wishlist" : "Save to wishlist"}
      </button>
    </form>
  );
}
