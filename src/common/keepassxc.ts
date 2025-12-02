import { spawn } from "node:child_process";
import { XMLParser } from "fast-xml-parser";
import { commandExists } from "./util";

export class Entry {
    #xml: any;
    #groupPath: string;
    #handle: Handle;

    constructor(xml: any, groupPath: string, handle: Handle) {
        this.#xml = xml;
        this.#groupPath = groupPath;
        this.#handle = handle;
    }

    get uuid(): string {
        return this.#xml.UUID;
    }

    get name(): string {
        return this.getString("Title") || "";
    }

    get groupPath(): string {
        return this.#groupPath;
    }

    get username(): string | null {
        return this.getString("UserName");
    }

    get password(): string | null {
        return this.getString("Password");
    }

    get hasTotp(): boolean {
        return this.getString("TOTP Seed") !== null || this.getString("otp") !== null;
    }

    get autoTypeEnabled(): boolean {
        return this.#xml.AutoType?.Enabled === "True";
    }

    get autoTypeSequence(): string | null {
        return this.#xml.AutoType?.DefaultSequence || null;
    }

    getString(key: string): string | null {
        return this.#xml.String?.find((element: any) => element.Key === key)?.Value || null;
    }

    async getTotpCode(): Promise<string> {
        const output = await this.#handle.exec(
            "show",
            "--quiet",
            "--totp",
            this.#handle.path,
            `${this.#groupPath}/${this.name}`,
        );
        console.log(output);
        return output.trim();
    }
}

export class Database {
    #xmlParser = new XMLParser({
        ignoreAttributes: true,
    });
    #entries: Map<string, Entry> = new Map();
    #handle: Handle;

    constructor(path: string, password: string) {
        this.#handle = new Handle(path, password);
    }

    get entries(): Iterable<Entry> {
        return this.#entries.values();
    }

    getByUuid(uuid: string): Entry | null {
        return this.#entries.get(uuid) || null;
    }

    async refresh(): Promise<void> {
        const xml = await this.#handle.exec(
            "export",
            "--quiet",
            "--format",
            "xml",
            this.#handle.path,
        );
        const json = this.#xmlParser.parse(xml);
        this.#entries.clear();
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
        const entryObject = new Entry(entry, ancestors.slice(1).join("/"), this.#handle);
        this.#entries.set(entryObject.uuid, entryObject);
    }
}

class Handle {
    path: string;
    password: string;

    constructor(path: string, password: string) {
        this.path = path;
        this.password = password;
    }

    async exec(...args: string[]): Promise<string> {
        const [cliCommand, ...cliArgs] = await getCliCommand();

        const child = spawn(cliCommand, [...cliArgs, ...args], {
            stdio: ["pipe", "pipe", "inherit"],
        });

        return await new Promise((resolve, reject) => {
            // Send password to CLI to unlock database.
            child.stdin.write(this.password);
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
