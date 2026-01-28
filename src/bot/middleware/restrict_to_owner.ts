import type { BotCtx } from "@/bot/types";
import type { MiddlewareFn } from "telegraf";

export function botRestrictToOwner(ownerId: number): MiddlewareFn<BotCtx> {
    return async (ctx: BotCtx, next: () => Promise<void>): Promise<void> => {
        if (ctx.from?.id !== ownerId) {
            ctx.state.logger?.debug("Not owner request", {
                type: ctx.updateType,
                from: ctx.from?.username,
                id: ctx.from?.id,
                text: ctx?.text,
            });
            return;
        }
        await next();
    };
}
