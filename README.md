This is my linux custom bar, to run it you need [`AGS`](https://github.com/aylur/ags/tree/v3).

Currently those plugins are required:
- Battery
- Mpris
- Network
- WirePlumber

to try it just run `ags run app.ts` using AGS v3

### Features

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

### Suggested Hyprland Config

`windowrule`s:
- `float, class:^(gjs)$` (float normal desktop shell windows)
- `noblur, class:^(gjs)$, title:^(?!AGS Session Menu$).*` (remove the blur to normal desktop shell windows (except for session manager))
- `noanim, class:^(gjs)$` (disable the animations normal desktop shell windows)
- `pin, class:^(gjs)$, title:^(AGS Notification Center)$` (pin the notification center so it always stays in the active workspace)
- `pin, class:^(gjs)$, title:^(AGS Session Menu)$` (pin th session menu so it always stays in the active workspace)

`layerrule`s:
- `noanim, gtk4-layer-shell` (disable the animations layered desktop shell windows)

# TO-DO

- [ ] Animations

- [x] Launcher
    - [x] Launch Programs
    - [x] Calculator
    - [ ] Clipboard
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
    - [ ] Workspaces (maybe?)
- [x] Session menu

# Credits

Icons inside the `icons` folder are from [Material Symbols](https://fonts.google.com/icons?icon.size=24&icon.color=%23e3e3e3&icon.set=Material+Symbols&icon.style=Rounded)