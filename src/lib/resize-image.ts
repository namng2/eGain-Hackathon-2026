/**
 * Browser only. Crops a picture to a centered square and shrinks it to a small
 * JPEG, so profile pictures are tiny and the server needs no image library.
 */
export async function resizeToAvatar(file: File, size = 256): Promise<File> {
  let bitmap: ImageBitmap;
  try {
    bitmap = await createImageBitmap(file);
  } catch {
    throw new Error("We couldn't read that picture. Try a JPEG or PNG.");
  }
  try {
    const side = Math.min(bitmap.width, bitmap.height);
    const canvas = document.createElement("canvas");
    canvas.width = size;
    canvas.height = size;
    const context = canvas.getContext("2d");
    if (!context) throw new Error("Your browser can't prepare pictures.");
    // JPEG has no transparency, so paint white behind transparent PNGs.
    context.fillStyle = "#ffffff";
    context.fillRect(0, 0, size, size);
    context.drawImage(
      bitmap,
      (bitmap.width - side) / 2,
      (bitmap.height - side) / 2,
      side,
      side,
      0,
      0,
      size,
      size,
    );
    const blob = await new Promise<Blob | null>((resolve) =>
      canvas.toBlob(resolve, "image/jpeg", 0.85),
    );
    if (!blob) throw new Error("We couldn't prepare that picture.");
    return new File([blob], "avatar.jpg", { type: "image/jpeg" });
  } finally {
    bitmap.close();
  }
}
