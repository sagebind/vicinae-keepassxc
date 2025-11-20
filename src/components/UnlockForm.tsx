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
            <Form.PasswordField
                id="password"
                title="Enter your database password"
            />
        </Form>
    );
}
