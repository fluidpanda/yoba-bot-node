import dotenv, { DotenvConfigOutput } from "dotenv";

const res: DotenvConfigOutput = dotenv.config({ quiet: true });
if (res.error) {
    throw res.error;
}
