import { log } from "../../logging/index.js";
import type { Context, MiddlewareFn } from "telegraf";
import type { Update } from "telegraf/types";

const logger = log.with({ module: "updates" });

export const botLogUpdates: MiddlewareFn<Context<Update>> = async (ctx: Context<Update>, next): Promise<void> => {
    logger.debug("update", {
        type: ctx.updateType,
        from: ctx.from?.username,
        id: ctx.from?.id,
        text: ctx?.text,
    });
    await next();
};
