import { infoPlugin } from "./info";
import { pingPlugin } from "./ping";
import { rawPlugin } from "./raw";
import { whoamiPlugin } from "./whoami";
import type { Plugin } from "../types";

export const plugins: Plugin[] = [infoPlugin, pingPlugin, rawPlugin, whoamiPlugin];
