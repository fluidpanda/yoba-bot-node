import type { Context, MiddlewareFn } from "telegraf";
import type { Update } from "telegraf/types";

export function botRestrictToOwner(ownerId: number): MiddlewareFn<Context<Update>> {
    return async (ctx: Context<Update>, next: () => Promise<void>): Promise<void> => {
        if (ctx.from?.id !== ownerId) {
            return;
        }
        await next();
    };
}
