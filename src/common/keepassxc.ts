import { spawn } from "node:child_process";
import { XMLParser } from "fast-xml-parser";
import { commandExists } from "./util";

export type Entry = {
    uuid: string;
    name: string;
    groupPath: string;
    username?: string;
    password: string;
    autoType: {
        enabled: boolean;
        sequence?: string;
    };
    attributes: Record<string, string>;
};

export class Database {
    #xmlParser = new XMLParser();
    #entries: Record<string, Entry> = {};
    #path: string;
    #password: string;

    constructor(path: string, password: string) {
        this.#path = path;
        this.#password = password;
    }

    getAllEntries(): Entry[] {
        return Object.values(this.#entries);
    }

    getByUuid(uuid: string): Entry | null {
        return this.#entries[uuid] || null;
    }

    async refresh(): Promise<void> {
        const xml = await this.exec(
            "export",
            "--quiet",
            "--format",
            "xml",
            this.#path,
        );
        const json = this.#xmlParser.parse(xml);
        this.#entries = {};
        this.parseGroup(json.KeePassFile.Root.Group, []);
    }

    private parseGroup(group: any, ancestors: string[]) {
        const newAncestors = [...ancestors, group.Name];

        if (Array.isArray(group.Entry)) {
            for (const entry of group.Entry) {
                this.parseEntry(entry, newAncestors);
            }
        } else if (group.Entry) {
            this.parseEntry(group.Entry, newAncestors);
        }

        if (Array.isArray(group.Group)) {
            for (const child of group.Group) {
                this.parseGroup(child, newAncestors);
            }
        } else if (group.Group) {
            this.parseGroup(group.Group, newAncestors);
        }
    }

    private parseEntry(entry: any, ancestors: string[]) {
        const uuid: string = entry.UUID;
        const attributes: Record<string, string> = {};

        for (const stringNode of entry.String) {
            const key: string = stringNode.Key;
            const value: string = stringNode.Value;
            attributes[key] = value;
        }

        this.#entries[uuid] = {
            uuid,
            name: attributes.Title || "",
            groupPath: ancestors.slice(1).join("/"),
            username: attributes.UserName || "",
            password: attributes.Password || "",
            autoType: {
                enabled: entry.AutoType?.Enabled === "True",
                sequence: entry.AutoType?.DefaultSequence || "",
            },
            attributes,
        };
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
