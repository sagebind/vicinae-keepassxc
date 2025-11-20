# KeePassXC Vicinae Extension

**Status: The basic idea works, but still very experimental.**

An extension for [Vicinae](https://github.com/vicinaehq/vicinae) that allows you to access your [KeePassXC](https://keepassxc.org) vault from anywhere, any time.

This extension also re-implements [Auto-Type](https://keepassxc.org/docs/KeePassXC_UserGuide#_auto_type) on top of [ydotool](https://github.com/ReimuNotMoe/ydotool), allowing you to execute auto-type of any entry into the currently-focused window. Yes, even on Wayland!

There is already a KeePassXC extension for Raycast, but it will not run in Vicinae on Linux without modifications, and it does not provide auto-type functionality anyway, which is the most valuable feature that an extension on Linux could provide in my opinion.

## Prerequisites

- Linux-only
- KeePassXC must be installed.
- You must have `ydotool` installed, `ydotoold` must be running, and the current user must have permission to the `ydotool` socket. The easiest way to accomplish this is to run `ydotool` as a user service instead of as `root`, and adding yourself to the `input` group.
- Your KDBX database file must be readable from a file system path.

## License

This project's source code and documentation is licensed under the MIT license. See the [LICENSE](LICENSE) file for details.
