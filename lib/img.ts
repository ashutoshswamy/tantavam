// Cloudinary serves its own resized, auto-format (avif/webp) copy straight from its CDN, so remote product photos skip the
// extra hop through Next's optimizer. Anything else (hashed static imports, already compressed) is returned untouched.
export function cld(src: string, width: number, quality: number | "auto" = "auto") {
  return src.includes("res.cloudinary.com") && src.includes("/upload/")
    ? src.replace("/upload/", `/upload/f_auto,q_${quality},w_${width},c_limit/`)
    : src;
}
