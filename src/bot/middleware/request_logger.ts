import type { BotCtx } from "@/bot/types";
import type { MiddlewareFn } from "telegraf";
import { log } from "@/logging";

function makeFallbackId(): string {
    return `${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;
}

function makeUpdateId(ctx: BotCtx): string {
    if ("update_id" in ctx.update) {
        return String(ctx.update.update_id);
    }
    return makeFallbackId();
}

export const botRequestLogger: MiddlewareFn<BotCtx> = async (ctx: BotCtx, next: () => Promise<void>): Promise<void> => {
    const updateId: string = makeUpdateId(ctx);
    ctx.state.updateId = updateId;
    ctx.state.logger = log.with({
        updateId,
        fromId: ctx.from?.id,
    });
    ctx.state.logger.debug("Update started", {
        type: ctx.updateType,
    });
    try {
        await next();
    } finally {
        ctx.state.logger.debug("Update finished");
    }
};
