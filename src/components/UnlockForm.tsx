import { ActionPanel, Action, Form } from "@vicinae/api";

/**
 * Presents a form to unlock the database by entering the password.
 */
export function UnlockForm({
    onUnlock,
}: {
    onUnlock: (password: string) => void;
}) {
    return (
        <Form
            actions={
                <ActionPanel>
                    <Action.SubmitForm
                        title="Unlock"
                        onSubmit={(input) => {
                            const password = input.password?.toString();

                            if (password) {
                                onUnlock(password);
                            }
                        }}
                    />
                </ActionPanel>
            }
        >
            <Form.Description
                key="unlock-description"
                text="Please enter your database password to unlock the KeePassXC database."
            />
            <Form.Description
                key="unlock-description-2"
                text="Your password will be stored encrypted in your login keyring."
            />
            <Form.PasswordField
                id="password"
                key="password"
                title="Password"
            />
        </Form>
    );
}
