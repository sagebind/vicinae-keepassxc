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
import { Database, Entry } from "./common/keepassxc";
import { getDatabasePassword, storeDatabasePassword } from "./common/password";
import { UnlockForm } from "./components/UnlockForm";

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
    const [isUnlocked, setIsUnlocked] = useState(true);
    const [database, setDatabase] = useState<Database | null>(null);

    useEffect(() => {
        (async () => {
            const password = await getDatabasePassword(databasePath);

            if (!password) {
                setIsUnlocked(false);
                return;
            }

            const newDatabase = new Database(databasePath, password);
            await newDatabase.refresh();
            setDatabase(newDatabase);
            setIsLoading(false);
        })();
    }, [databasePath, isUnlocked]);

    if (!isUnlocked) {
        return (
            <UnlockForm
                onUnlock={(password) => {
                    storeDatabasePassword(databasePath, password).then(() => {
                        setIsUnlocked(true);
                        setIsLoading(true);
                    });
                }}
            ></UnlockForm>
        );
    }

    return (
        <List
            isLoading={isLoading || !database}
            searchBarPlaceholder="Search KeePassXC entries..."
        >
            {database?.getAllEntries().map((entry) => (
                <ListItem entry={entry} keyDelay={keyDelay} />
            ))}
        </List>
    );
}

function ListItem({ entry, keyDelay }: { entry: Entry; keyDelay: string }) {
    return (
        <List.Item
            id={entry.uuid}
            key={entry.uuid}
            title={entry.name}
            subtitle={entry.groupPath}
            icon={Icon.Key}
            actions={
                <ActionPanel>
                    <Action
                        title="Auto-type"
                        icon={Icon.Keyboard}
                        onAction={() =>
                            performAutoType(entry, parseInt(keyDelay, 10))
                        }
                    />
                    <Action
                        title="Copy username"
                        icon={Icon.CopyClipboard}
                        onAction={() => {
                            (async () => {
                                if (entry.username) {
                                    await Clipboard.copy(entry.username);
                                }
                            })();
                        }}
                    />
                    <Action
                        title="Copy password"
                        icon={Icon.CopyClipboard}
                        onAction={() => {
                            (async () => {
                                if (entry.password) {
                                    await Clipboard.copy(entry.password, {
                                        concealed: true,
                                    });
                                }
                            })();
                        }}
                    />
                    <Action
                        title="Paste username"
                        icon={Icon.Window}
                        onAction={() => {
                            (async () => {
                                if (entry.username) {
                                    closeMainWindow();
                                    await setTimeout(5000);
                                    await Clipboard.paste(entry.username);
                                }
                            })();
                        }}
                    />
                    <Action
                        title="Paste password"
                        icon={Icon.Key}
                        onAction={() => {
                            (async () => {
                                if (entry.password) {
                                    await closeMainWindow();
                                    await setTimeout(5000);
                                    await Clipboard.paste(entry.password);
                                }
                            })();
                        }}
                    />
                </ActionPanel>
            }
        />
    );
}
