import type { BotCtx } from "@/bot/types";
import type { MiddlewareFn } from "telegraf";
import { truncateText } from "@/logging/utils";

type ReplyArgs = Parameters<BotCtx["reply"]>;
type ReplyText = ReplyArgs[0];
type LoggableText = string | { toString(): string } | null | undefined;

function asLoggableText(x: ReplyText): LoggableText {
    return x as unknown as LoggableText;
}

export const botLogOutgoingReply: MiddlewareFn<BotCtx> = async (
    ctx: BotCtx,
    next: () => Promise<void>,
): Promise<void> => {
    const originalReply = ctx.reply.bind(ctx);
    (ctx as unknown as { reply: typeof ctx.reply }).reply = async (...args) => {
        const raw: LoggableText = asLoggableText(args[0]);
        const text: string = raw === null ? "" : String(raw);
        ctx.state.logger?.debug("REPLY:BODY:", { text: truncateText(text, 300) });
        return originalReply(...args);
    };
    await next();
};
