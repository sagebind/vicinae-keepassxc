import { spawn } from "node:child_process";
import which from "which";

type Entry = Record<string, string>;

export class Database {
    #path: string;
    #password: string;

    constructor(path: string, password: string) {
        this.#path = path;
        this.#password = password;
    }

    async getEntryNames(includeTrash: boolean = false): Promise<string[]> {
        const output = await this.exec(
            "ls",
            "--quiet",
            "--recursive",
            this.#path,
        );

        const fullNames = [];
        const groupStack: string[] = [];

        for (const line of (output as string).split("\n")) {
            const [, indentation, name, slash] =
                /^(\s*)(.*?)(\/?)$/.exec(line) || [];
            // Infer tree depth from indentation.
            const depth = indentation.length / 2;

            while (groupStack.length > depth) {
                groupStack.pop();
            }

            if (name === "[empty]") {
                // Skip empty entries.
                continue;
            } else if (slash) {
                groupStack.push(name);
            } else {
                if (groupStack.length > 0) {
                    if (includeTrash || groupStack[0] !== "Trash") {
                        fullNames.push(groupStack.join("/") + "/" + name);
                    }
                } else {
                    fullNames.push(name);
                }
            }
        }

        return fullNames;
    }

    async getEntryByPath(entryPath: string): Promise<Entry | null> {
        const output = await this.exec(
            "show",
            "--quiet",
            "--all",
            "--show-protected",
            this.#path,
            entryPath,
        );

        if (!output) {
            return null;
        }

        const entry: Entry = {};

        for (const line of (output as string).split("\n")) {
            const [, key, value] = /^([^:]+):\s*(.*)$/.exec(line) || [];
            if (key) {
                entry[key] = value;
            }
        }

        return entry;
    }

    private async exec(...args: string[]): Promise<string> {
        const [cliCommand, ...cliArgs] = await getCliCommand();

        const child = spawn(cliCommand, [...cliArgs, ...args], {
            stdio: ["pipe", "pipe", "inherit"],
        });

        return await new Promise((resolve, reject) => {
            // Send password to CLI to unlock database.
            child.stdin.write(this.#password);
            child.stdin.end();

            let output = "";

            child.stdout.on("data", (data) => {
                output += data.toString();
            });

            child.on("close", (code) => {
                if (code === 0) {
                    resolve(output);
                } else {
                    reject(new Error(`keepassxc-cli exited with code ${code}`));
                }
            });
        });
    }
}

async function getCliCommand(): Promise<string[]> {
    if (await commandExists("keepassxc-cli")) {
        return ["keepassxc-cli"];
    }

    if (await commandExists("flatpak")) {
        return [
            "flatpak",
            "run",
            "--command=keepassxc-cli",
            "org.keepassxc.KeePassXC",
        ];
    }

    throw new Error("Could not find KeePassXC CLI");
}

async function commandExists(command: string): Promise<boolean> {
    return !!(await which(command, { nothrow: true }));
}
