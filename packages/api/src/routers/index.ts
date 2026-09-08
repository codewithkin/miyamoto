import { protectedProcedure, publicProcedure, router } from "../index";
import { accountRouter } from "./account";
import { chatRouter } from "./chat";
import { libraryRouter } from "./library";
import { pathRouter } from "./path";
import { supportRouter } from "./support";

export const appRouter = router({
  healthCheck: publicProcedure.query(() => {
    return "OK";
  }),
  privateData: protectedProcedure.query(({ ctx }) => {
    return {
      message: "This is private",
      user: ctx.session.user,
    };
  }),
  chat: chatRouter,
  path: pathRouter,
  library: libraryRouter,
  support: supportRouter,
  account: accountRouter,
});
export type AppRouter = typeof appRouter;
