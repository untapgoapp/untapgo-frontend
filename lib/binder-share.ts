export type BinderShareOutcome = "shared" | "copied" | "cancelled";

type BinderShareInput = {
  ownerId: string;
  nickname: string;
};

export function binderPublicUrl(ownerId: string): string {
  return new URL(
    `/profile/${encodeURIComponent(ownerId)}/binder`,
    window.location.origin,
  ).toString();
}

function fallbackCopy(value: string): boolean {
  const textarea = document.createElement("textarea");
  textarea.value = value;
  textarea.setAttribute("readonly", "");
  textarea.style.position = "fixed";
  textarea.style.left = "-9999px";
  textarea.style.opacity = "0";
  document.body.appendChild(textarea);
  textarea.focus();
  textarea.select();
  const copied = document.execCommand("copy");
  textarea.remove();
  return copied;
}

export async function shareBinderLink({
  ownerId,
  nickname,
}: BinderShareInput): Promise<BinderShareOutcome> {
  const url = binderPublicUrl(ownerId);
  const title = `${nickname}'s Binder`;
  const text = `Browse ${nickname}'s Binder on UntapGo.`;

  if (typeof navigator.share === "function") {
    try {
      await navigator.share({ title, text, url });
      return "shared";
    } catch (error) {
      if (error instanceof DOMException && error.name === "AbortError") {
        return "cancelled";
      }
      // Desktop share implementations may reject the payload. Continue to copy.
    }
  }

  if (navigator.clipboard?.writeText) {
    try {
      await navigator.clipboard.writeText(url);
      return "copied";
    } catch {
      // The Clipboard API may be unavailable because of browser permissions.
    }
  }

  if (fallbackCopy(url)) return "copied";
  throw new Error("BINDER_SHARE_UNAVAILABLE");
}
