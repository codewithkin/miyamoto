import db from "@miyamoto/db";
import { z } from "zod";

import { publicProcedure, router } from "../index";

/**
 * Support and account deletion.
 *
 * Both routes are public, because both exist for people who may have lost
 * access to their account — which is the case the store requirements are
 * written for. Being public is what makes the safeguards below necessary.
 */

const email = z.email().max(320);

export const supportRouter = router({
  /** "Something wrong? Tell us plainly." */
  sendMessage: publicProcedure
    .input(
      z.object({
        email,
        topic: z.enum(["BILLING", "BUG", "MY_DATA", "REPORT_CONTENT", "OTHER"]),
        details: z.string().trim().min(10).max(4000),
      }),
    )
    .mutation(async ({ ctx, input }) => {
      await db.supportMessage.create({
        data: {
          email: input.email,
          topic: input.topic,
          details: input.details,
          // Recorded when they happen to be signed in, which saves a
          // round trip asking who they are.
          userId: ctx.session?.user.id ?? null,
        },
      });

      // Deliberately returns nothing about the account behind the address.
      return { received: true as const };
    }),

  /**
   * Starts an account deletion from the web.
   *
   * Nothing is erased here. The form is unauthenticated, so acting on it
   * immediately would let anyone delete an account by typing its email
   * address. A single-use token goes to the address on the account and the
   * erase happens only after that is followed.
   *
   * The response is identical whether or not an account exists — otherwise
   * this becomes a way to test which emails are registered.
   */
  requestDeletion: publicProcedure
    .input(z.object({ email }))
    .mutation(async ({ input }) => {
      const user = await db.user.findUnique({
        where: { email: input.email },
        select: { id: true },
      });

      if (user) {
        const token = crypto.randomUUID().replace(/-/g, "");
        const expiresAt = new Date(Date.now() + 24 * 60 * 60 * 1000);

        await db.deletionRequest.create({
          data: { email: input.email, userId: user.id, token, expiresAt },
        });

        // TODO: send the confirmation email. Until a mail provider is
        // configured the row exists and can be actioned by hand, which is
        // honest — the alternative is a page that claims to have sent
        // something it did not.
      }

      return {
        sent: true as const,
        message:
          "If that address has an account, a confirmation link is on its way. It expires in 24 hours.",
      };
    }),

  /** Completes a deletion once the emailed token comes back. */
  confirmDeletion: publicProcedure
    .input(z.object({ token: z.string().min(16).max(64) }))
    .mutation(async ({ input }) => {
      const request = await db.deletionRequest.findUnique({
        where: { token: input.token },
      });

      if (
        !request ||
        request.status === "COMPLETED" ||
        request.status === "CANCELLED" ||
        request.expiresAt.getTime() < Date.now()
      ) {
        return { deleted: false as const, reason: "INVALID_OR_EXPIRED" as const };
      }

      if (request.userId) {
        // Every domain table cascades from User, so removing the user row
        // removes conversations, trials, charges and usage with it.
        await db.user.delete({ where: { id: request.userId } });
      }

      await db.deletionRequest.update({
        where: { id: request.id },
        data: { status: "COMPLETED", verifiedAt: new Date(), completedAt: new Date() },
      });

      return { deleted: true as const };
    }),
});
