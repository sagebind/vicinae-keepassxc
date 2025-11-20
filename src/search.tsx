import { setTimeout } from "node:timers/promises";
import { useEffect, useState } from "react";
import {
    ActionPanel,
    Action,
    List,
    Icon,
    closeMainWindow,
    getPreferenceValues,
    openExtensionPreferences,
    showToast,
    Clipboard,
} from "@vicinae/api";
import { performAutoType } from "./common/autotype";
import { getEntryByPath, getEntryNames } from "./common/keepassxc";

export default function () {
    const { databasePath, keyDelay } = getPreferenceValues();

    if (!databasePath) {
        showToast({
            title: "Database path not set",
            message:
                "Please set the database path in the extension preferences.",
        });
        return openExtensionPreferences();
    }

    const [isLoading, setIsLoading] = useState(true);
    const [entryNames, setEntryNames] = useState<string[]>([]);

    useEffect(() => {
        getEntryNames(databasePath).then((names) => {
            setEntryNames(names);
            setIsLoading(false);
        });
    }, [databasePath]);

    return (
        <List
            isLoading={isLoading}
            searchBarPlaceholder="Search KeePassXC entries..."
        >
            {entryNames.map((name, idx) => (
                <List.Item
                    id={`${idx}:${name}`}
                    key={`${idx}:${name}`}
                    title={name.split("/").pop() || name}
                    subtitle={name.lastIndexOf("/") > 0 ? name.substring(0, name.lastIndexOf("/")) : undefined}
                    icon={Icon.Key}
                    actions={
                        <ActionPanel>
                            <Action
                                title="Auto-Type"
                                icon={Icon.Keyboard}
                                onAction={() =>
                                    performAutoType(
                                        databasePath,
                                        name,
                                        parseInt(keyDelay, 10),
                                    )
                                }
                            />
                            <Action
                                title="Copy username"
                                icon={Icon.CopyClipboard}
                                onAction={() => {
                                    (async () => {
                                        const entry = await getEntry(
                                            databasePath,
                                            name,
                                        );

                                        if (entry.UserName) {
                                            await Clipboard.copy(
                                                entry.UserName,
                                            );
                                        }
                                    })();
                                }}
                            />
                            <Action
                                title="Copy password"
                                icon={Icon.CopyClipboard}
                                onAction={() => {
                                    (async () => {
                                        const entry = await getEntry(
                                            databasePath,
                                            name,
                                        );

                                        if (entry.Password) {
                                            await Clipboard.copy(
                                                entry.Password,
                                                {
                                                    concealed: true,
                                                }
                                            );
                                        }
                                    })();
                                }}
                            />
                            <Action
                                title="Paste username"
                                icon={Icon.Window}
                                onAction={() => {
                                    (async () => {
                                        const entry = await getEntry(
                                            databasePath,
                                            name,
                                        );

                                        if (entry.UserName) {
                                            closeMainWindow();
                                            await setTimeout(5000);
                                            await Clipboard.paste(
                                                entry.UserName,
                                            );
                                        }
                                    })();
                                }}
                            />
                            <Action
                                title="Paste password"
                                icon={Icon.Key}
                                onAction={() => {
                                    (async () => {
                                        const entry = await getEntry(
                                            databasePath,
                                            name,
                                        );

                                        if (entry.Password) {
                                            await closeMainWindow();
                                            await setTimeout(5000);
                                            await Clipboard.paste(
                                                entry.Password,
                                            );
                                        }
                                    })();
                                }}
                            />
                        </ActionPanel>
                    }
                />
            ))}
        </List>
    );
}

async function getEntry(databasePath: string, entryName: string): Promise<Record<string, string>> {
    const entry = await getEntryByPath(databasePath, entryName);
    if (!entry) {
        throw new Error(`Entry "${entryName}" not found in database.`);
    }
    return entry;
}
