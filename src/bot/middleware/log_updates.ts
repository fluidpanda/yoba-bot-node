import type { BotCtx } from "@/bot/types";
import type { MiddlewareFn } from "telegraf";

function truncateText(text: string | undefined, maxLen: number): string | undefined {
    if (!text) return text;
    if (text.length <= maxLen) return text;
    return text.slice(0, maxLen) + "...truncated";
}

export const botLogUpdates: MiddlewareFn<BotCtx> = async (ctx: BotCtx, next: () => Promise<void>): Promise<void> => {
    ctx.state.logger?.debug("Update body:", {
        type: ctx.updateType,
        from: ctx.from?.username,
        id: ctx.from?.id,
        text: truncateText(ctx?.text, 300),
    });
    await next();
};
