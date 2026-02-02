import * as fs from "node:fs";
import yaml from "yaml";
import { requireEnv } from "@/config";

export interface RouterConfig {
    id: string;
    label: string;
    host: string;
    port?: number;
    username: string;
    privateKeyPath: string;
    knownHostsPath?: string;
}

export interface RoutersConfig {
    routers: RouterConfig[];
}

export interface RouterYaml {
    id: string;
    label: string;
    host_env: string;
    user_env: string;
    key_env: string;
    known_hosts_env?: string;
    port?: number;
}

export interface RoutersYamlFile {
    routers: RouterYaml[];
}

function isRoutersYamlFile(v: unknown): v is RoutersYamlFile {
    if (typeof v !== "object" || v === null) return false;

    const obj = v as Record<string, unknown>;
    if (!Array.isArray(obj.routers)) return false;

    return obj.routers.every((r): boolean => {
        if (typeof r !== "object" || r === null) return false;
        const o = r as Record<string, unknown>;

        return (
            typeof o.id === "string" &&
            typeof o.label === "string" &&
            typeof o.host_env === "string" &&
            typeof o.user_env === "string" &&
            typeof o.key_env === "string" &&
            (o.port === undefined || typeof o.port === "number") &&
            (o.known_hosts_env === undefined || typeof o.known_hosts_env === "string")
        );
    });
}

export function loadRoutersConfig(): RoutersConfig {
    const raw: string = fs.readFileSync("config/routers.yaml", "utf8");
    const parsed: unknown = yaml.parse(raw) as unknown;

    if (!isRoutersYamlFile(parsed)) {
        throw new Error("Invalid routers.yaml format");
    }

    return {
        routers: parsed.routers.map((r) => ({
            id: r.id,
            label: r.label,
            host: requireEnv(r.host_env),
            username: requireEnv(r.user_env),
            privateKeyPath: requireEnv(r.key_env),
            knownHostsPath: r.known_hosts_env ? requireEnv(r.known_hosts_env) : undefined,
            port: r.port ?? 22,
        })),
    };
}
