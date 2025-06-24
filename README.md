This is my linux custom bar, to run it you need [`AGS`](https://github.com/aylur/ags/tree/v3).

Currently those plugins are required:
- Battery
- Mpris
- Network
- WirePlumber

to try it just run `ags run app.ts` using AGS v3

# TO-DO
- [x] Show a popup for notifications
    - [ ] Fix the notif overlay taking too more space then needed when there aren't enough notifs to scroll (and try to find a way to resize it dynamically with a max height of half screen)
- [ ] Show a notification center to list all previous notifications
- [ ] Create an app launcher