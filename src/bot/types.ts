import type { Composer,Context } from "telegraf";
import type { Update } from "telegraf/types";

export type BotApi = Composer<Context<Update>>;
export type Plugin = (bot: BotApi) => void;
