import { execFile, spawn } from "node:child_process";
import { promisify } from "node:util";

const execFileAsync = promisify(execFile);

/**
 * Stores a secret in the system"s secret service.
 */
export async function store(
    label: string,
    secret: string,
    attributes: Record<string, string>,
) {
    const attributeArgs = Object.entries(attributes).flatMap(([key, value]) => [
        key,
        value,
    ]);

    const child = spawn(
        "secret-tool",
        ["store", `--label=${label}`, ...attributeArgs],
        {
            stdio: ["pipe", "ignore", "inherit"],
        },
    );

    child.stdin.write(secret);
    child.stdin.end();

    const exitCode = await new Promise((resolve, reject) => {
        child.on("close", resolve);
    });
}

/**
 * Looks up a secret from the system"s secret service.
 */
export async function lookup(attributes: Record<string, string>) {
    const attributeArgs = Object.entries(attributes).flatMap(([key, value]) => [
        key,
        value,
    ]);

    try {
        const { stdout } = await execFileAsync("secret-tool", [
            "lookup",
            ...attributeArgs,
        ]);

        return stdout;
    } catch (_e) {
        return null;
    }
}
