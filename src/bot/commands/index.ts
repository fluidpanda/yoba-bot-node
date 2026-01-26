import { infoPlugin } from "./info";
import { pingPlugin } from "./ping";
import { rawPlugin } from "./raw";
import { statusPlugin } from "./status";
import { whoamiPlugin } from "./whoami";
import type { Plugin } from "@/bot/types";

export function buildCommandPlugins(opts: { ownerId: number | null; startedAtMs: number }): Plugin[] {
    return [
        infoPlugin,
        pingPlugin,
        rawPlugin,
        whoamiPlugin,
        statusPlugin({ ownerId: opts.ownerId, startedAtMs: opts.startedAtMs }),
    ];
}
