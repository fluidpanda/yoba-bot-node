import dotenv from "dotenv";
import type { DotenvConfigOutput } from "dotenv";

const res: DotenvConfigOutput = dotenv.config({ quiet: true });
if (res.error) {
    const cwd: string = process.cwd();
    const msg: string = `Failed to load .env file (cwd=${cwd})\nOriginal error: ${String(res.error)}`;
    throw new Error(msg);
}
