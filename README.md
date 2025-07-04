This is my linux custom desktop shell.

### Features

https://i.stefdp.com/raw/yxrB0y2qvw74.mp4

- Bar
    - CPU - See the general load and each core's load (on hover)
    - Disk - See the available and used disk space (on hover)
    - RAM - See the available and used RAM & Swap (on hover)
    - Battery - See the percentage, power drain and time to empty/full of the battery (on hover)
    - Time - See current hour, year & month (on click) and calendar (on right click)
    - Media Icon - The cover url of the playing media on Spotify
    - Media Metadata - The Spotify song name & arist, and album & volume (on hover)
    - Media Lyrics - The spotify song line-synced lyrics when available (sourced from [Musixmatch](https://musixmatch.com) and [lrclib.net](https://lrclib.net))
    - Speaker - Volume and device name (on hover)
    - Micrphone - Volume and device name (on hover)
    - Network - Wifi or ethernet info
    - Notifications - Notification count and center (on click)
    - Tray - Tray apps
    - Power - Power actions (see session menu)

- Notification Daemon
    - Notification popup
    - Notification center

- OSD:
    - Speaker volume %
    - Microphone volume %
    - Screen brightness %

- Launcher
    - Apps
    - Calculator

- Session Menu
    - Lock Screen
    - Sleep
    - Logout
    - Task Manager
    - Hibernate
    - Shutdown
    - Reboot
    - Reboot to Firmware (UEFI/BIOS)

### Required Libraries

> [!IMPORTANT]
> [`ags`](https://aylur.github.io/ags/guide/install.html) is required to run the desktop shell

- `libsoup3`
- `glib-networking`
- `libadwaita`
- [`AstalIO`](https://aylur.github.io/astal/guide/installation) & [`Astal4`](https://aylur.github.io/astal/guide/installation)
- [`AstalApps`](https://aylur.github.io/astal/guide/libraries/apps#installation)
- [`AstalBattery`](https://aylur.github.io/astal/guide/libraries/battery#installation)
- [`AstalBluetooth`](https://aylur.github.io/astal/guide/libraries/bluetooth#installation)
- [`AstalMpris`](https://aylur.github.io/astal/guide/libraries/mpris#installation)
- [`AstalNetwork`](https://aylur.github.io/astal/guide/libraries/network#installation)
- [`AstalNotifd`](https://aylur.github.io/astal/guide/libraries/notifd#installation)
- [`AstalTray`](https://aylur.github.io/astal/guide/libraries/tray#installation)
- [`AstalWp`](https://aylur.github.io/astal/guide/libraries/wireplumber#installation)

### How to run

1. Clone this repository and move its contents to `~/.config/ags`
2. Install all the [required libraries](#required-libraries)
3. just run `ags run`

An example for NixOS can be found [here](https://github.com/Stef-00012/dots/tree/main/homes/stef/programs/widgets/ags).

### Configuration

The desktop shell can be configured by creating the `~/.config/stef-shell/config.json` file

the avaible properties are:
- `paths.musixmatchToken` (`string`): The path where to store the musixmatch cookie, usertoken and expiration date (default: `/tmp/musixmatch_token.json`). [^1] [^2]
- `paths.backlightBaseDir` (`string`): The path where the backlight data for all devices is stored (default: `/sys/class/backlight`). [^1]
- `paths.saveFolder` (`string`): The folder where to save lyrics and song icons when middle clicked (default: `$HOME/Music/spotifyData`). [^1]
- `paths.lyricsFolder` (`string`): The path where the local lyrics files will be stored (default: `$HOME/.config/stef-shell/lyrics`). [^1]

- `volumeStep.media` (`number`): Percentage of volume increase/decrease when scrolling on the media module (default: `0.05`). [^3]
- `volumeStep.microphone` (`number`): Percentage of volume increase/decrease when scrolling on the microphone module (default: `0.05`). [^3]
- `volumeStep.speaker` (`number`): Percentage of volume increase/decrease when scrolling on the speaker module (default: `0.05`). [^3]

- `animationsDuration.notification` (`number`): How long the notification animation should last (default: `500`). [^4]
- `animationsDuration.launcher` (`number`): How long the launcher animation should last (default: `300`). [^4]
- `animationsDuration.notificationCenter` (`number`): How long the notification center animation should last (default: `500`). [^4]
- `animationsDuration.osd` (`number`): How long the OSD animation should last (default: `300`). [^4]
- `animationsDuration.sessionMenu` (`number`): How long the session menu animation should last (default: `300`). [^4]

- `animationsType.notification` (`string`): The notifications animation type (default: `SLIDE_LEFT`). [^5]
- `animationsType.launcher` (`string`): The launcher animation type (default: `CROSSFADE`). [^5]
- `animationsType.notificationCenter` (`string`): The notification center animation type (default: `SLIDE_LEFT`). [^5]
- `animationsType.osd` (`string`): The OSD animation type (default: `CROSSFADE`). [^5]
- `animationsType.sessionMenu` (`string`): The session menu animation type (default: `CROSSFADE`). [^5]

- `timeouts.osd`: How long the OSD should last before disappearing (default: `3000`). [^4]
- `timeouts.defaultNotificationExpire`: How long a notification should last before disappearing (default: `5000`). [^4] [^6]

- `sessionMenu.buttonWidth` (`number`): How large should a button be in the session menu (default: `120`). [^7]
- `sessionMenu.buttonHeight` (`number`): How high should a button be in the session menu (default: `120`). [^7]
- `sessionMenu.buttonGap` (`number`): How large should the gap between buttons be in the session menu (default: `120`). [^7]

- `mediaMaxLength` (`number`): How many characters should be displayed in the media bar module before it would start scrolling (default: `25`). [^8]
- `systemStatsUpdateInterval` (`number`): How often system stats (CPU, Disk, RAM etc.) should be updated (default: `1000`). [^9]

[^1]: Must be an absolute path
[^2]: Must be a `.json` file
[^3]: Must be between `0` and `1`, `0.01` = 1%
[^4]: Must be greater or equal to `0` and defined in milliseconds
[^5]: Must be one of `CROSSFADE`, `NONE`, `SLIDE_DOWN`, `SLIDE_LEFT`, `SLIDE_RIGHT`, `SLIDE_DOWN`, `SWING_UP`, `SWING_LEFT`, `SWING_RIGHT`, `SWING_DOWN`
[^6]: A notification can override this expire timeout by specifying an own expiry time (example: `notify-send "hello" -t 10000` would last 10 seconds even if the timeout is 5 seconds)
[^7]: Must be greater than `0` and defined in px
[^8]: Must be greater than `0`
[^9]: Must be greater than `100` and defined in milliseconds

### Suggested Hyprland Config

`windowrule`s:
- `float, class:^(gjs)$` (float normal desktop shell windows)
- `noblur, class:^(gjs)$, title:^(?!AGS Session Menu$).*` (remove the blur to normal desktop shell windows (except for session manager))
- `noanim, class:^(gjs)$` (disable the animations normal desktop shell windows)
- `pin, class:^(gjs)$, title:^(AGS Notification Center)$` (pin the notification center so it always stays in the active workspace)
- `pin, class:^(gjs)$, title:^(AGS Session Menu)$` (pin th session menu so it always stays in the active workspace)

`layerrule`s:
- `noanim, gtk4-layer-shell` (disable the animations layered desktop shell windows)

### Local Lyrics

For local lyrics to work for a song you must follow these steps:

1. Copy the song's track ID (right click the media module while it's playing that song)
2. Create a file `<track_id>.lrc` in your lyrics folder (default is `$HOME/.config/stef-shell/lyrics`, can be configured through the `config.json` file)
3. Add the lyrics in that file, for it work correctly it must follow this format: `[mm:ss.ms] Lyric here` (example: `[01:34.819] Lyric here`)
    `mm` = minutes (padded, so `1` => `01`)
    `ss` = seconds (padded, so `1` => `01`)
    `ms` = milliseconds (padded, so `1` => `001`)

# TO-DO

- [x] Animations

- [x] Launcher
    - [x] Launch Programs
    - [x] Calculator
    - [ ] Clipboard (not sure)
- [x] Notification Daemon
    - [x] Notification Popups
    - [x] Notification Center
- [x] OSD
    - [x] Speaker Volume
    - [x] Microphone Volume
    - [x] Brightness
- [x] Bar
    - [x] CPU
    - [x] Disk
    - [x] RAM
    - [x] Battery
    - [x] Clock
    - [x] Media
    - [x] Lyrics
    - [x] Speaker
    - [x] Microphone
    - [x] Network
    - [x] Notifications
    - [x] Tray
    - [x] Power Actions
- [x] Session menu

# Credits

Icons inside the `icons` folder are from [Material Symbols](https://fonts.google.com/icons?icon.size=24&icon.color=%23e3e3e3&icon.set=Material+Symbols&icon.style=Rounded)