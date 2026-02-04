import * as fs from "node:fs";
import yaml from "yaml";
import { requireEnv } from "@/config";

export interface RouterConfig {
    id: string;
    label: string;
    type: string;
    host: string;
    port?: number;
    username: string;
    privateKeyPath: string;
    knownHostsPath?: string;
}

export interface RouterActionConfig {
    id: string;
    label: string;
    description: string;
    targets: string[];
    run: string[];
}

export interface RoutersConfig {
    routers: RouterConfig[];
    actions: RouterActionConfig[];
}

export interface RouterYaml {
    id: string;
    label: string;
    type: string;
    host_env: string;
    user_env: string;
    key_env: string;
    known_hosts_env?: string;
    port?: number;
}

export interface ActionYaml {
    id: string;
    label: string;
    description?: string;
    targets: string[];
    run: string[];
}

export interface RoutersYamlFile {
    routers: RouterYaml[];
    actions: ActionYaml[];
}

function isRoutersYamlFile(v: unknown): v is RoutersYamlFile {
    if (typeof v !== "object" || v === null) return false;

    const objRouters = v as Record<string, unknown>;
    if (!Array.isArray(objRouters.routers) || !Array.isArray(objRouters.actions)) {
        return false;
    }

    const routersObject: boolean = objRouters.routers.every((r): boolean => {
        if (typeof r !== "object" || r === null) return false;
        const o = r as Record<string, unknown>;

        return (
            typeof o.id === "string" &&
            typeof o.label === "string" &&
            typeof o.type === "string" &&
            typeof o.host_env === "string" &&
            typeof o.user_env === "string" &&
            typeof o.key_env === "string" &&
            (o.port === undefined || typeof o.port === "number") &&
            (o.known_hosts_env === undefined || typeof o.known_hosts_env === "string")
        );
    });

    const actionsObject: boolean = objRouters.actions.every((r): boolean => {
        if (typeof r !== "object" || r === null) return false;
        const o = r as Record<string, unknown>;
        return (
            typeof o.id === "string" &&
            typeof o.label === "string" &&
            (o.description === undefined || typeof o.description === "string") &&
            Array.isArray(o.targets) &&
            o.targets.every((t): t is string => typeof t === "string") &&
            Array.isArray(o.run) &&
            o.run.every((c): c is string => typeof c === "string")
        );
    });
    return routersObject && actionsObject;
}

export function loadRoutersConfig(): RoutersConfig {
    const raw: string = fs.readFileSync("config/routers.yaml", "utf8");
    const parsed: unknown = yaml.parse(raw) as unknown;

    if (!isRoutersYamlFile(parsed)) {
        throw new Error("Invalid routers.yaml format");
    }

    return {
        routers: parsed.routers.map((r: RouterYaml) => ({
            id: r.id,
            label: r.label,
            type: r.type,
            host: requireEnv(r.host_env),
            username: requireEnv(r.user_env),
            privateKeyPath: requireEnv(r.key_env),
            knownHostsPath: r.known_hosts_env ? requireEnv(r.known_hosts_env) : undefined,
            port: r.port ?? 22,
        })),
        actions: parsed.actions.map((a: ActionYaml) => ({
            id: a.id,
            label: a.label,
            description: a.description ?? "",
            targets: [...a.targets],
            run: [...a.run],
        })),
    };
}
