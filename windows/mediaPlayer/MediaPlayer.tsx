import { sleep } from "@/util/timer";
import Mpris from "gi://AstalMpris";
import { type Accessor, createBinding, createComputed, createState, For, type Setter, With } from "ags";
import { Gtk, Gdk } from "ags/gtk4";
import { config } from "@/util/config";
import { defaultConfig } from "@/constants/config";
import { getMainPlayer } from "@/util/player";
import Adw from "gi://Adw";
import { interval, Timer } from "ags/time";
import Pango from "gi://Pango?version=1.0";
import { marquee } from "@/util/text";

interface Props {
    gdkmonitor: Gdk.Monitor;
    visible: Accessor<boolean>;
    setVisible: Setter<boolean>;
}

export default function Launcher({ gdkmonitor, visible: isVisible, setVisible }: Props) {
    const mpris = Mpris.get_default()

    const [windowSize, setWindowSize] = createState<{ width: number; height: number }>({
        width: 500,
        height: 500,
    });

    const players = createBinding(mpris, "players");
    const mainPlayer = players(getMainPlayer);

    const coverArt = mainPlayer((player) => player?.coverArt ?? "")
    const artist = mainPlayer((player) => player?.artist ?? "Unknown Artist")
    const title = mainPlayer((player) => player?.title ?? "Unknown Title")
    const duration = mainPlayer((player) => player?.length ?? 0)
    const position = mainPlayer((player) => player?.position ?? 0)
    const volume = mainPlayer((player) => player?.volume ?? 0)

    function handleEscKey(
		_e: Gtk.EventControllerKey,
		keyval: number,
		_: number,
		_mod: number,
	) {
		if (keyval === Gdk.KEY_Escape) setVisible(false);
	}

    function togglePlayPause() {
        const player = mainPlayer.get();

        if (!player) return;

        if (player.playbackStatus === Mpris.PlaybackStatus.PLAYING) {
            player.pause();
        } else {
            player.play();
        }
    }




    function transformPlayPauseIcon(player: Mpris.Player | undefined) {
        if (!player) return "mi-play-circle-filled-symbolic";

        return player.playbackStatus === Mpris.PlaybackStatus.PLAYING
            ? "mi-pause-circle-filled-symbolic"
            : "mi-play-circle-filled-symbolic";
    }

    return (
        <Gtk.Window
            class="media-player"
            // defaultWidth={500}
            // defaultHeight={500}
            defaultWidth={800}
            defaultHeight={100}
            widthRequest={380}
            heightRequest={60}
            resizable
            title="AGS Media Player"
            display={gdkmonitor.display}
            onCloseRequest={() => {
                setVisible(false);
            }}
            $={(self) => {
                const revealer = self.child as Gtk.Revealer;
                const transitionDuration = revealer.get_transition_duration();

                let timer: Timer;

                isVisible.subscribe(async () => {
                    const classes = self.cssClasses;
                    const visible = isVisible.get();

                    if (!visible) {
                        revealer.set_reveal_child(visible);
                        self.set_css_classes(
                            classes.filter((className) => className !== "open"),
                        );

                        if (timer) timer.cancel();

                        await sleep(transitionDuration);
                    }

                    self.set_visible(visible);

                    if (visible) {
                        revealer.set_reveal_child(visible);
                        self.set_css_classes([...classes, "open"]);

                        timer = interval(100, () => {
                            const width = self.get_width() || 500;
                            const height = self.get_height() || 500;

                            setWindowSize({ width, height })
                        })
                    }
                });
            }}
        >
            <Gtk.EventControllerKey onKeyPressed={handleEscKey} />

            <revealer
                transitionDuration={config(
                    (cfg) =>
                        cfg.animationsDuration?.mediaPlayer ??
                        defaultConfig.animationsDuration.mediaPlayer,
                )}
                transitionType={config(
                    (cfg) =>
                        Gtk.RevealerTransitionType[
                            cfg.animationsType?.mediaPlayer ??
                                defaultConfig.animationsType.mediaPlayer
                        ],
                )}
            >
                <With value={windowSize}>
                    {(size) => {
                        const buttonSize = 25;
                        const buttonSpacing = 5;
                        const padding = 10;
                        const fontSize = 14;
                        const volumeSliderWidth = 100;
                        
                        const hasControlsLeft = size.height < 130;
                        const hasMetadataLeft = size.height >= 130 && size.height < 170;
                        const hasBottomLayout = size.height >= 170;

                        console.log({
                            hasControlsLeft,
                            hasMetadataLeft,
                            hasBottomLayout,
                            height: size.height,
                            width: size.width,
                        })
                        if (hasControlsLeft) {
                            const metadataButtonMinSpacing = 150;
                            const availableMetadataWidth = (size.width - (padding * 2)) / 2;
                            const availableButtonsWidth = size.width - availableMetadataWidth - metadataButtonMinSpacing;
                            const buttonsCount = Math.min(Math.floor(availableButtonsWidth / (buttonSize + buttonSpacing)), 5)
                            const includeVolumeSlider = availableButtonsWidth / (buttonSize + buttonSpacing) >= 7.5

                            console.log({
                                buttonsCount,
                                includeVolumeSlider,
                                a: Math.floor(availableButtonsWidth / (buttonSize + buttonSpacing))
                            })

                            return (
                                <box orientation={Gtk.Orientation.HORIZONTAL} class="controls-left">
                                    <box orientation={Gtk.Orientation.HORIZONTAL} spacing={5}>
                                        <image
                                            class="cover-art"
                                            file={coverArt}
                                            overflow={Gtk.Overflow.HIDDEN}
                                            widthRequest={size.height - padding}
                                        />

                                        <box orientation={Gtk.Orientation.VERTICAL} spacing={5} class="metadata" valign={Gtk.Align.CENTER}>
                                            <label
                                                halign={Gtk.Align.START}
                                                label={title}
                                                wrap
                                                maxWidthChars={Math.min(availableMetadataWidth / fontSize, 30)}
                                                ellipsize={Pango.EllipsizeMode.NONE}
                                                wrapMode={Pango.WrapMode.WORD_CHAR}
                                            />
                                            <label
                                                halign={Gtk.Align.START}
                                                label={artist}
                                                wrap
                                                maxWidthChars={Math.min(availableMetadataWidth / fontSize, 30)}
                                                ellipsize={Pango.EllipsizeMode.NONE}
                                                wrapMode={Pango.WrapMode.WORD_CHAR}
                                            />
                                        </box>
                                    </box>

                                    <box hexpand halign={Gtk.Align.END} spacing={buttonSpacing} orientation={Gtk.Orientation.HORIZONTAL} valign={Gtk.Align.CENTER}>
                                        {buttonsCount >= 5 && (
                                            <box>
                                                <Gtk.GestureClick button={Gdk.BUTTON_PRIMARY} onPressed={togglePlayPause} />
                                                <image
                                                    iconName="mi-shuffle-symbolic"
                                                    widthRequest={buttonSize}
                                                    heightRequest={buttonSize}
                                                    iconSize={Gtk.IconSize.LARGE}
                                                />
                                            </box>
                                        )}

                                        {buttonsCount >= 3 && (
                                            <box>
                                                <Gtk.GestureClick button={Gdk.BUTTON_PRIMARY} onPressed={togglePlayPause} />
                                                <image
                                                    iconName="mi-skip-previous-symbolic"
                                                    widthRequest={buttonSize}
                                                    heightRequest={buttonSize}
                                                    iconSize={Gtk.IconSize.LARGE}
                                                />
                                            </box>
                                        )}

                                        {buttonsCount >= 1 && (
                                            <box>
                                                <Gtk.GestureClick button={Gdk.BUTTON_PRIMARY} onPressed={togglePlayPause} />
                                                <image
                                                    iconName={mainPlayer(transformPlayPauseIcon)}
                                                    widthRequest={buttonSize}
                                                    heightRequest={buttonSize}
                                                    iconSize={Gtk.IconSize.LARGE}
                                                />
                                            </box>
                                        )}

                                        {buttonsCount >= 2 && (
                                            <box>
                                                <Gtk.GestureClick button={Gdk.BUTTON_PRIMARY} onPressed={togglePlayPause} />
                                                <image
                                                    iconName="mi-skip-next-symbolic"
                                                    widthRequest={buttonSize}
                                                    heightRequest={buttonSize}
                                                    iconSize={Gtk.IconSize.LARGE}
                                                />
                                            </box>
                                        )}

                                        {buttonsCount >= 4 && (
                                            <box>
                                                <Gtk.GestureClick button={Gdk.BUTTON_PRIMARY} onPressed={togglePlayPause} />
                                                <image
                                                    iconName="mi-repeat-symbolic"
                                                    widthRequest={buttonSize}
                                                    heightRequest={buttonSize}
                                                    iconSize={Gtk.IconSize.LARGE}
                                                />
                                            </box>
                                        )}
                                    </box>
                                </box>
                            )
                        }

                        return (
                            <box></box>
                        )
                    }}
                </With>
            </revealer>
        </Gtk.Window>
    )
}