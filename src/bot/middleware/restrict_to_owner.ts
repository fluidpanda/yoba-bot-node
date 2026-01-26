import { BotCtx } from "../types";
import type { MiddlewareFn } from "telegraf";

export function botRestrictToOwner(ownerId: number): MiddlewareFn<BotCtx> {
    return async (ctx: BotCtx, next: () => Promise<void>): Promise<void> => {
        if (ctx.from?.id !== ownerId) {
            return;
        }
        await next();
    };
}
