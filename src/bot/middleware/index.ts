import type { BotCtx } from "@/bot/types";
import type { MiddlewareFn } from "telegraf";
import { botErrorBoundary } from "@/bot/middleware/error_boundary";
import { botLogOutgoingReply } from "@/bot/middleware/log_outgoing";
import { botLogUpdates } from "@/bot/middleware/log_updates";
import { botRequestLogger } from "@/bot/middleware/request_logger";
import { botRestrictToOwner } from "@/bot/middleware/restrict_to_owner";

export interface MiddlewareOptions {
    ownerId: number | null;
}

export function buildMiddlewares(opts: MiddlewareOptions): Array<MiddlewareFn<BotCtx>> {
    const mw: Array<MiddlewareFn<BotCtx>> = [];

    mw.push(botErrorBoundary({ ownerId: opts.ownerId }));
    mw.push(botRequestLogger);
    mw.push(botLogOutgoingReply);
    mw.push(botLogUpdates);
    if (opts.ownerId !== null) {
        mw.push(botRestrictToOwner(opts.ownerId));
    }
    return mw;
}
