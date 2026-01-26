import type { Context, MiddlewareFn } from "telegraf";
import type { Update } from "telegraf/types";
import { BotCtx } from "@/bot/types";
import { log } from "@/logging";
import { Logger } from "@/logging/logger";

const logger: Logger = log.with({ module: "updates" });

export const botLogUpdates: MiddlewareFn<BotCtx> = async (
    ctx: Context<Update>,
    next: () => Promise<void>,
): Promise<void> => {
    logger.debug("update", {
        type: ctx.updateType,
        from: ctx.from?.username,
        id: ctx.from?.id,
        text: ctx?.text,
    });
    await next();
};
