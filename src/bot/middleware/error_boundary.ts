import type { BotCtx } from "@/bot/types";
import type { MiddlewareFn } from "telegraf";
import { formatJson } from "@/logging/utils";

export interface ErrorBoundaryOptions {
    ownerId: number | null;
}

function extractCommand(ctx: BotCtx): string | null {
    const msg = ctx.message;
    if (!msg || !("text" in msg)) return null;

    const text: string = String(msg.text);
    if (!text.startsWith("/")) return null;

    const first: string = text.split(/\s+/, 1)[0] ?? "";
    return first.split("@", 1)[0] ?? null;
}

function formatErrorForOwner(err: unknown): string {
    if (err instanceof Error) {
        const stack: string = err.stack ?? "";
        const head: string = stack.length > 1_800 ? stack.slice(0, 1_800) + "\n...truncated" : stack;
        return `${err.name}: ${err.message}\n\n${head}`;
    }
    if (typeof err === "string") return err;
    try {
        return formatJson(err, 2);
    } catch {
        return String(err);
    }
}

export function botErrorBoundary(opts: ErrorBoundaryOptions): MiddlewareFn<BotCtx> {
    return async (ctx: BotCtx, next: () => Promise<void>): Promise<void> => {
        try {
            await next();
        } catch (err: unknown) {
            const cmd: string | null = extractCommand(ctx);
            ctx.state.logger?.error("Unhandled middleware error", err, {
                updateType: ctx.updateType,
                command: cmd ?? undefined,
                fromId: ctx.from?.id,
                fromUsername: ctx.from?.username,
            });
            const canReply: boolean = typeof ctx.reply === "function";
            if (canReply) {
                const isOwner: boolean = opts.ownerId !== null && ctx.from?.id === opts.ownerId;
                if (isOwner) {
                    const details: string = formatErrorForOwner(err);
                    const text: string = "Bot error occurred. Details:\n" + details;
                    const max: number = 3_800;
                    await ctx.reply(text.length > max ? text.slice(0, max) + "\n...truncated" : text);
                } else {
                    await ctx.reply("Something went wrong");
                }
            }
        }
    };
}
