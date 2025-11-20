import { spawn } from "child_process";

/**
 * Stores a secret in the system"s secret service.
 */
export async function store(label: string, secret: string, attributes: Record<string, string>) {
    const attributeArgs = Object.entries(attributes).flatMap(([key, value]) => [key, value]);

    const child = spawn("secret-tool", ["store", `--label=${label}`, ...attributeArgs], {
        stdio: ["pipe", "ignore", "inherit"],
    });

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
    const attributeArgs = Object.entries(attributes).flatMap(([key, value]) => [key, value]);

    const child = spawn("secret-tool", ["lookup", ...attributeArgs], {
        stdio: ["ignore", "pipe", "inherit"],
    });

    let secret = "";

    child.stdout.on("data", (data) => {
        secret += data.toString();
    });

    const exitCode = await new Promise((resolve, reject) => {
        child.on("close", resolve);
    });

    if (exitCode === 0) {
        return secret;
    } else {
        return null;
    }
}
