This is my linux custom bar, to run it you need [`AGS`](https://github.com/aylur/ags/tree/v3).

Currently those plugins are required:
- Battery
- Mpris
- Network
- WirePlumber

to try it just run `ags run app.ts` using AGS v3

### Suggested Hyprland Config

`windowrule`s:
- `float, class:^(gjs)$` (float normal desktop shell windows)
- `noblur, class:^(gjs)$` (remove the blur to normal desktop shell windows)
- `noanim, class:^(gjs)$` (disable the animations normal desktop shell windows)
- `pin, class:^(gjs)$, title:^(AGS Notification Center)$` (pin the notification cneter so it always stays in the active workspace)

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
- [ ] Session menu

# Credits

Icons inside the `icons` folder are from [Material Symbols](https://fonts.google.com/icons?icon.size=24&icon.color=%23e3e3e3&icon.set=Material+Symbols&icon.style=Rounded)