import { handleAuthReturn } from "@/lib/auth-redirect";

/**
 * Every link into the app passes through here before it is routed —
 * expo-router's native-intent hook, called for the link that launched the
 * app (`initial: true`) and for every link while it runs.
 *
 * Its one job today is the end of a Google sign-in: the link carrying the
 * session (or the error) is finished in `lib/auth-redirect.ts` and swapped
 * for a plain route, so the session never sits in the router's params and
 * a sign-in survives the app being relaunched mid-flight (D-044). Any other
 * link is routed unchanged.
 */
export async function redirectSystemPath({
  path,
}: {
  path: string;
  initial: boolean;
}): Promise<string | null> {
  try {
    return (await handleAuthReturn(path)) ?? path;
  } catch {
    // A throw here can crash routing. The gate always knows where to go.
    return "/";
  }
}
