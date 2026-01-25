import type { Context, MiddlewareFn } from "telegraf";
import type { Update, User } from "telegraf/types";

export const botLogUpdates: MiddlewareFn<Context<Update>> = async (
    ctx: Context<Update>,
    next: () => Promise<void>,
): Promise<void> => {
    const from: User | undefined = ctx.from;
    const who: string = from ? `${from.username ?? ""}(${from.id})` : "unknown";
    console.log(`[update] type=${ctx.updateType} from=${who}`);
    await next();
};
