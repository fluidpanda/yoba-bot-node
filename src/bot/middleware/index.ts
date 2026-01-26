import { botErrorBoundary } from "./error_boundary";
import { botLogUpdates } from "./log_updates";
import { botRestrictToOwner } from "./restrict_to_owner";
import type { BotCtx } from "../types";
import type { MiddlewareFn } from "telegraf";

export interface MiddlewareOptions {
    ownerId: number | null;
}

export function buildMiddlewares(opts: MiddlewareOptions): Array<MiddlewareFn<BotCtx>> {
    const mw: Array<MiddlewareFn<BotCtx>> = [];

    mw.push(botErrorBoundary({ ownerId: opts.ownerId }));
    mw.push(botLogUpdates);
    if (opts.ownerId !== null) {
        mw.push(botRestrictToOwner(opts.ownerId));
    }
    return mw;
}
