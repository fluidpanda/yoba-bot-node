import type { Plugin } from "../types.js";
import { infoPlugin } from "./info.js";
import { pingPlugin } from "./ping.js";
import { rawPlugin } from "./raw.js";
import { whoamiPlugin } from "./whoami.js";

export const plugins: Plugin[] = [infoPlugin, pingPlugin, rawPlugin, whoamiPlugin];
