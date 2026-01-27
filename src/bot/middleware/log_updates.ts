import type { BotCtx } from "@/bot/types";
import type { MiddlewareFn } from "telegraf";

export const botLogUpdates: MiddlewareFn<BotCtx> = async (ctx: BotCtx, next: () => Promise<void>): Promise<void> => {
    ctx.state.logger?.debug("Update body:", {
        type: ctx.updateType,
        from: ctx.from?.username,
        id: ctx.from?.id,
        text: ctx?.text,
    });
    await next();
};
