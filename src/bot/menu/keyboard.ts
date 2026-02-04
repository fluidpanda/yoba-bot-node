import { Markup } from "telegraf";
import type { MenuCommand } from "@/bot/menu";
import type { ReplyKeyboardMarkup } from "@telegraf/types";

export function buildMainMenuKeyboard(
    commands: readonly MenuCommand[],
    columns: number,
): Markup.Markup<ReplyKeyboardMarkup> {
    const rows: string[][] = [];
    for (let index = 0; index < commands.length; index += columns) {
        rows.push(commands.slice(index, index + columns).map((c: MenuCommand): string => c.label));
    }
    return Markup.keyboard(rows).resize(true).oneTime(false);
}

export function withMainMenu(commands: readonly MenuCommand[], columns: number): Markup.Markup<ReplyKeyboardMarkup> {
    return buildMainMenuKeyboard(commands, columns);
}
