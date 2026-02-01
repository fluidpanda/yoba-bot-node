import { requireEnv } from "@/config";

export interface RouterConfig {
    id: string;
    label: string;
    host: string;
    port?: number;
    username: string;
    privateKeyPath: string;
    knownHostsPath: string;
}

export interface RoutersConfig {
    routers: RouterConfig[];
}

export function loadRoutersConfig(): RoutersConfig {
    return {
        routers: [
            {
                id: "dev",
                label: "dev environment",
                host: requireEnv("ROUTER_DEV_HOST"),
                port: process.env.ROUTER_DEV_PORT ? Number(process.env.ROUTER_DEV_PORT) : 22,
                username: requireEnv("ROUTER_DEV_USER"),
                privateKeyPath: requireEnv("ROUTER_DEV_KEY"),
                knownHostsPath: requireEnv("ROUTER_DEV_KNOWN_HOST"),
            },
        ],
    };
}
