import type { BotCtx } from "@/bot/types";
import type { MiddlewareFn } from "telegraf";
import { truncateText } from "@/logging/utils";

export const botLogUpdates: MiddlewareFn<BotCtx> = async (ctx: BotCtx, next: () => Promise<void>): Promise<void> => {
    ctx.state.logger?.debug("Update body:", {
        type: ctx.updateType,
        from: ctx.from?.username,
        id: ctx.from?.id,
        text: truncateText(ctx?.text, 300),
    });
    await next();
};
