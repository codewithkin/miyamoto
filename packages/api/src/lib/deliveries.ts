/**
 * Letters the server has finished, waiting for the phone to say it got them
 * (plan 13).
 *
 * A letter is written, checked and saved whether or not the phone is still
 * there to receive it. Nothing cancels that work when a connection drops.
 * What the server can't see is whether the letter reached the screen: a
 * phone put away mid-wait may or may not still hold the connection, and a
 * proxy may keep the server's side open after the phone's side has gone.
 * So the phone confirms each letter it receives (chat.replyReceived). One
 * that isn't confirmed in time is treated as undelivered, and the
 * server pushes it.
 *
 * In memory, in the one server process, because the wait is seconds and
 * the confirmation arrives at the same process that is waiting. A restart
 * mid-wait loses at most one notification. The letter itself is already
 * saved and appears the next time the chat opens.
 */

const pending = new Map<string, ReturnType<typeof setTimeout>>();

const keyOf = (userId: string, threadId: string) => `${userId}:${threadId}`;

/**
 * Starts waiting for the phone to confirm a letter on this thread. If it
 * doesn't within `timeoutMs`, `onUndelivered` runs, once. A newer letter on
 * the same thread replaces the wait for the older one.
 */
export function awaitDelivery(args: {
  userId: string;
  threadId: string;
  timeoutMs: number;
  onUndelivered: () => void;
}): void {
  const key = keyOf(args.userId, args.threadId);
  const previous = pending.get(key);
  if (previous) clearTimeout(previous);
  pending.set(
    key,
    setTimeout(() => {
      pending.delete(key);
      args.onUndelivered();
    }, args.timeoutMs),
  );
}

/** The phone got the letter. Returns whether one was being waited on. */
export function confirmDelivery(userId: string, threadId: string): boolean {
  const key = keyOf(userId, threadId);
  const timer = pending.get(key);
  if (!timer) return false;
  clearTimeout(timer);
  pending.delete(key);
  return true;
}
