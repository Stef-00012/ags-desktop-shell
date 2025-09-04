import { type Accessor, createBinding, createState, type Setter, With } from "ags";
import { defaultConfig } from "@/constants/config";
import { getMainPlayer } from "@/util/player";
import { getMainColor } from "@/util/file";
import { config } from "@/util/config";
import { sleep } from "@/util/timer";
import { Gtk, Gdk } from "ags/gtk4";
import Mpris from "gi://AstalMpris";
import Pango from "gi://Pango";
import Adw from "gi://Adw";

interface Props {
    gdkmonitor: Gdk.Monitor;
    visible: Accessor<boolean>;
    setVisible: Setter<boolean>;
}

export default function Launcher({ gdkmonitor, visible: isVisible, setVisible }: Props) {
    const mpris = Mpris.get_default()

    const buttonSize = 25;
    const buttonSpacing = 5;
    const volumeSliderWidth = 100;

    const players = createBinding(mpris, "players");
    const mainPlayer = players(getMainPlayer);

    function handleEscKey(
		_e: Gtk.EventControllerKey,
		keyval: number,
		_: number,
		_mod: number,
	) {
		if (keyval === Gdk.KEY_Escape) setVisible(false);
	}

    function handleMediaKeys(
        _e: Gtk.EventControllerKey,
        keyval: number,
        _: number,
        modifier: number,
    ) {
        const player = mainPlayer.get();
        if (!player) return;

        if (keyval === Gdk.KEY_space) {
            const playbackStatus = player.playback_status;

            if (playbackStatus === Mpris.PlaybackStatus.PLAYING && player.canPause) return player.pause();
            if ((playbackStatus === Mpris.PlaybackStatus.PAUSED || playbackStatus === Mpris.PlaybackStatus.STOPPED) && player.canPlay) return player.play();
        }

        if (keyval === Gdk.KEY_Left) {
            if (player.canGoPrevious) return player.previous();
        }

        if (keyval === Gdk.KEY_Right) {
            if (player.canGoNext) return player.next();
        }

        if (keyval === Gdk.KEY_Up) {
            const volume = player.volume;
            if (volume >= 1) return;

            const newVolume = Math.min(volume + 0.05, 1);
            player.set_volume(newVolume);
        }

        if (keyval === Gdk.KEY_Up) {
            const volume = player.volume;
            if (volume <= 0) return;

            const newVolume = Math.max(volume - 0.05, 0);
            player.set_volume(newVolume);
        }

        if (modifier === Gdk.ModifierType.CONTROL_MASK) {
            if (keyval === Gdk.KEY_l) {
                const loopStatus = player.loopStatus;

                if (loopStatus === Mpris.Loop.UNSUPPORTED) return;

                if (loopStatus === Mpris.Loop.NONE) return player.set_loop_status(Mpris.Loop.PLAYLIST);
                if (loopStatus === Mpris.Loop.PLAYLIST) return player.set_loop_status(Mpris.Loop.TRACK);
                if (loopStatus === Mpris.Loop.TRACK) return player.set_loop_status(Mpris.Loop.NONE);
            }

            if (keyval === Gdk.KEY_s) {
                const shuffleStatus = player.shuffleStatus

                if (shuffleStatus === Mpris.Shuffle.UNSUPPORTED) return;

                player.shuffle();
            }
        }
    }

    const [controlsLeftBoxVisible, setControlsLeftBoxVisible] = createState(false);
    const [metadataLeftBoxVisible, setMetadataLeftBoxVisible] = createState(false);
    const [bottomLayoutBotVisible, setBottomLayoutBotVisible] = createState(false);

    const [controlsLeftPlayPauseButtonVisible, setControlsLeftPlayPauseButtonVisible] = createState(false);
    const [controlsLeftSeekNextButtonVisible, setControlsLeftSeekNextButtonVisible] = createState(false);
    const [controlsLeftSeekPreviousButtonVisible, setControlsLeftSeekPreviousButtonVisible] = createState(false);
    const [controlsLeftLoopButtonVisible, setControlsLeftLoopButtonVisible] = createState(false);
    const [controlsLeftShuffleButtonVisible, setControlsLeftShuffleButtonVisible] = createState(false);
    const [controlsLeftVolumeButtonVisible, setControlsLeftVolumeButtonVisible] = createState(false);

    const [bottomLayoutPlayPauseButtonVisible, setBottomLayoutPlayPauseButtonVisible] = createState(false);
    const [bottomLayoutSeekNextButtonVisible, setBottomLayoutSeekNextButtonVisible] = createState(false);
    const [bottomLayoutSeekPreviousButtonVisible, setBottomLayoutSeekPreviousButtonVisible] = createState(false);
    const [bottomLayoutLoopButtonVisible, setBottomLayoutLoopButtonVisible] = createState(false);
    const [bottomLayoutShuffleButtonVisible, setBottomLayoutShuffleButtonVisible] = createState(false);
    const [bottomLayoutVolumeButtonVisible, setBottomLayoutVolumeButtonVisible] = createState(false);

    return (
        <Gtk.Window
            class="media-player"
            defaultWidth={500}
            defaultHeight={500}
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

                isVisible.subscribe(async () => {
                    const classes = self.cssClasses;
                    const visible = isVisible.get();

                    if (!visible) {
                        revealer.set_reveal_child(visible);
                        self.set_css_classes(
                            classes.filter((className) => className !== "open"),
                        );

                        await sleep(transitionDuration);
                    }

                    self.set_visible(visible);

                    if (visible) {
                        revealer.set_reveal_child(visible);
                        self.set_css_classes([...classes, "open"]);
                    }
                });
            }}
        >
            <Gtk.EventControllerKey onKeyPressed={handleEscKey} />
            <Gtk.EventControllerKey onKeyPressed={handleMediaKeys} />

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
                <Adw.BreakpointBin
                    widthRequest={380}
                    heightRequest={60}
                >
                    <Adw.Breakpoint
                        condition={Adw.BreakpointCondition.new_length(Adw.BreakpointConditionLengthType.MAX_HEIGHT, 130, Adw.LengthUnit.PX)}
                        onApply={() => {
                            setControlsLeftBoxVisible(true)
                        }}
                        onUnapply={() => {
                            setControlsLeftBoxVisible(false);
                        }}
                    />

                    <Adw.Breakpoint
                        condition={Adw.BreakpointCondition.new_and(
                            Adw.BreakpointCondition.new_length(Adw.BreakpointConditionLengthType.MIN_HEIGHT, 131, Adw.LengthUnit.PX),
                            Adw.BreakpointCondition.new_length(Adw.BreakpointConditionLengthType.MAX_HEIGHT, 170, Adw.LengthUnit.PX)
                        )}
                        onApply={() => {
                            setMetadataLeftBoxVisible(true);
                        }}
                        onUnapply={() => {
                            setMetadataLeftBoxVisible(false);
                        }}
                    />

                    <Adw.Breakpoint
                        condition={Adw.BreakpointCondition.new_length(Adw.BreakpointConditionLengthType.MIN_HEIGHT, 171, Adw.LengthUnit.PX)}
                        onApply={() => {
                            setBottomLayoutBotVisible(true);
                        }}
                        onUnapply={() => {
                            setBottomLayoutBotVisible(false);
                        }}
                    />

                    <With value={players}>
                        {(players) => {
                            const mainPlayer = getMainPlayer(players)
                            
                            if (!mainPlayer) return (
                                <box>
                                    <label
                                        label="No Media Playing..."
                                        class="no-media-text"
                                        halign={Gtk.Align.CENTER}
                                        valign={Gtk.Align.CENTER}
                                        hexpand
                                        vexpand
                                    />
                                </box>
                            );

                            const coverArt = createBinding(mainPlayer, "coverArt");
                            const artist = createBinding(mainPlayer, "artist")((artist) => artist || "Unknown Artist");
                            const title = createBinding(mainPlayer, "title")((title) => title || "Unknown Title");
                            // const duration = createBinding(mainPlayer, "length");
                            // const position = createBinding(mainPlayer, "position");
                            const volume = createBinding(mainPlayer, "volume");
                            const playbackStatus = createBinding(mainPlayer, "playback_status");
                            const loopStatus = createBinding(mainPlayer, "loop_status");
                            const shuffleStatus = createBinding(mainPlayer, "shuffle_status");
                            const canGoNext = createBinding(mainPlayer, "can_go_next");
                            const canGoPrevious = createBinding(mainPlayer, "can_go_previous");

                            const mainColor = coverArt(getMainColor);

                            function togglePlayPause() {
                                if (!mainPlayer) return;

                                const playbackStatus = mainPlayer.playback_status;

                                if (playbackStatus === Mpris.PlaybackStatus.PLAYING && mainPlayer.canPause) return mainPlayer.pause();
                                if ((playbackStatus === Mpris.PlaybackStatus.PAUSED || playbackStatus === Mpris.PlaybackStatus.STOPPED) && mainPlayer.canPlay) return mainPlayer.play();
                            }

                            function seekPrevious() {
                                if (!mainPlayer || !mainPlayer.canGoPrevious) return;

                                mainPlayer.previous();
                            }

                            function seekNext() {
                                if (!mainPlayer || !mainPlayer.canGoNext) return;

                                mainPlayer.next();
                            }

                            function updateLoop() {
                                if (!mainPlayer) return;

                                const loopStatus = mainPlayer.loopStatus;

                                if (loopStatus === Mpris.Loop.UNSUPPORTED) return;

                                if (loopStatus === Mpris.Loop.NONE) return mainPlayer.set_loop_status(Mpris.Loop.PLAYLIST);
                                if (loopStatus === Mpris.Loop.PLAYLIST) return mainPlayer.set_loop_status(Mpris.Loop.TRACK);
                                if (loopStatus === Mpris.Loop.TRACK) return mainPlayer.set_loop_status(Mpris.Loop.NONE);
                            }

                            function updateShuffle() {
                                if (!mainPlayer) return;

                                const shuffleStatus = mainPlayer.shuffleStatus

                                if (shuffleStatus === Mpris.Shuffle.UNSUPPORTED) return;

                                mainPlayer.shuffle();
                            }

                            function handleVolumeChange({ value }: { value: number }) {
                                if (!mainPlayer) return;

                                mainPlayer.set_volume(value);
                            }

                            function transformPlayPauseIcon(playbackStatus: Mpris.PlaybackStatus) {
                                return playbackStatus === Mpris.PlaybackStatus.PLAYING
                                    ? "mi-pause-circle-filled-symbolic"
                                    : "mi-play-circle-filled-symbolic";
                            }

                            function transformPlaybackClass(playbackStatus: Mpris.PlaybackStatus) {
                                const classes = ["large-icons"]

                                if (
                                    !mainPlayer ||
                                    (playbackStatus === Mpris.PlaybackStatus.PLAYING && !mainPlayer.canPause) ||
                                    (playbackStatus === Mpris.PlaybackStatus.PAUSED || playbackStatus === Mpris.PlaybackStatus.STOPPED) && !mainPlayer.canPlay
                                ) classes.push("disabled");

                                return classes.join(" ");
                            }

                            function transformPlaybackCursor(playbackStatus: Mpris.PlaybackStatus) {
                                if (
                                    !mainPlayer ||
                                    (playbackStatus === Mpris.PlaybackStatus.PLAYING && !mainPlayer.canPause) ||
                                    (playbackStatus === Mpris.PlaybackStatus.PAUSED || playbackStatus === Mpris.PlaybackStatus.STOPPED) && !mainPlayer.canPlay
                                ) return Gdk.Cursor.new_from_name("not-allowed", null);

                                return Gdk.Cursor.new_from_name("pointer", null);
                            }

                            function transformLoopIcon(loopStatus: Mpris.Loop) {
                                if (loopStatus === Mpris.Loop.PLAYLIST) return "mi-repeat-symbolic";
                                if (loopStatus === Mpris.Loop.TRACK) return "mi-repeat-one-symbolic";

                                return "mi-repeat-symbolic";
                            }

                            function transformLoopClass(loopStatus: Mpris.Loop) {
                                const classes = ["large-icons"]

                                if (loopStatus === Mpris.Loop.PLAYLIST) classes.push("active");
                                if (loopStatus === Mpris.Loop.TRACK) classes.push("active");
                                if (loopStatus === Mpris.Loop.UNSUPPORTED) classes.push("disabled");

                                return classes.join(" ");
                            }

                            function transformLoopCursor(loopStatus: Mpris.Loop) {
                                if (loopStatus === Mpris.Loop.UNSUPPORTED) return Gdk.Cursor.new_from_name("not-allowed", null);
                                return Gdk.Cursor.new_from_name("pointer", null);
                            }

                            function transformShuffleClass(shuffleStatus: Mpris.Shuffle) {
                                const classes = ["large-icons"]

                                if (shuffleStatus === Mpris.Shuffle.ON) classes.push("active");
                                if (shuffleStatus === Mpris.Shuffle.UNSUPPORTED) classes.push("disabled");

                                return classes.join(" ");
                            }

                            function transformShuffleCursor(shuffleStatus: Mpris.Shuffle) {
                                if (shuffleStatus === Mpris.Shuffle.UNSUPPORTED) return Gdk.Cursor.new_from_name("not-allowed", null);
                                return Gdk.Cursor.new_from_name("pointer", null);
                            }

                            function transformSeekNextClass(canGoNext: boolean) {
                                const classes = ["large-icons"]

                                if (!canGoNext) classes.push("disabled");

                                return classes.join(" ");
                            }

                            function transformSeekNextCursor(canGoNext: boolean) {
                                if (!canGoNext) return Gdk.Cursor.new_from_name("not-allowed", null);
                                return Gdk.Cursor.new_from_name("pointer", null);
                            }

                            function transformSeekPreviousClass(canGoPrevious: boolean) {
                                const classes = ["large-icons"]

                                if (!canGoPrevious) classes.push("disabled");

                                return classes.join(" ");
                            }

                            function transformSeekPreviousCursor(canGoPrevious: boolean) {
                                if (!canGoPrevious) return Gdk.Cursor.new_from_name("not-allowed", null);
                                return Gdk.Cursor.new_from_name("pointer", null);
                            }

                            return (
                                <box>
                                    <box visible={controlsLeftBoxVisible} orientation={Gtk.Orientation.HORIZONTAL}>
                                        <box orientation={Gtk.Orientation.HORIZONTAL} spacing={5}>
                                            <box>
                                                <With value={coverArt}>
                                                    {(coverArt) => {
                                                        if (coverArt) {
                                                            return (
                                                                <image
                                                                    css={mainColor((color) => `background-color: ${color};`)}
                                                                    widthRequest={35}
                                                                    heightRequest={35}
                                                                    class="cover-art"
                                                                    file={coverArt}
                                                                    overflow={Gtk.Overflow.HIDDEN}
                                                                />
                                                            )
                                                        }

                                                        return (
                                                            <image
                                                                css={mainColor((color) => `background-color: ${color};`)}
                                                                hexpand
                                                                vexpand
                                                                widthRequest={35}
                                                                heightRequest={35}
                                                                class="cover-art"
                                                                iconName="mi-music-note-symbolic"
                                                                overflow={Gtk.Overflow.HIDDEN}
                                                            />
                                                        )
                                                    }}
                                                </With>
                                            </box>

                                            <box orientation={Gtk.Orientation.VERTICAL} spacing={5} class="metadata" valign={Gtk.Align.CENTER}>
                                                <label
                                                    halign={Gtk.Align.START}
                                                    label={title}
                                                    wrap
                                                    ellipsize={Pango.EllipsizeMode.NONE}
                                                    wrapMode={Pango.WrapMode.WORD_CHAR}
                                                />
                                                <label
                                                    halign={Gtk.Align.START}
                                                    label={artist}
                                                    wrap
                                                    ellipsize={Pango.EllipsizeMode.NONE}
                                                    wrapMode={Pango.WrapMode.WORD_CHAR}
                                                />
                                            </box>
                                        </box>

                                        <Adw.BreakpointBin
                                            widthRequest={35}
                                            heightRequest={60}
                                        >
                                            <Adw.Breakpoint
                                                condition={Adw.BreakpointCondition.new_length(Adw.BreakpointConditionLengthType.MAX_WIDTH, 100, Adw.LengthUnit.PX)}
                                                onApply={() => {
                                                    setControlsLeftPlayPauseButtonVisible(true);
                                                }}
                                                onUnapply={() => {
                                                    setControlsLeftPlayPauseButtonVisible(false);
                                                }}
                                            />

                                            <Adw.Breakpoint
                                                condition={Adw.BreakpointCondition.new_and(
                                                    Adw.BreakpointCondition.new_length(Adw.BreakpointConditionLengthType.MIN_WIDTH, 101, Adw.LengthUnit.PX),
                                                    Adw.BreakpointCondition.new_length(Adw.BreakpointConditionLengthType.MAX_WIDTH, 136, Adw.LengthUnit.PX)
                                                )}
                                                onApply={() => {
                                                    setControlsLeftPlayPauseButtonVisible(true);
                                                    setControlsLeftSeekNextButtonVisible(true);
                                                }}
                                                onUnapply={() => {
                                                    setControlsLeftPlayPauseButtonVisible(false);
                                                    setControlsLeftSeekNextButtonVisible(false);
                                                }}
                                            />

                                            <Adw.Breakpoint
                                                condition={Adw.BreakpointCondition.new_and(
                                                    Adw.BreakpointCondition.new_length(Adw.BreakpointConditionLengthType.MIN_WIDTH, 137, Adw.LengthUnit.PX),
                                                    Adw.BreakpointCondition.new_length(Adw.BreakpointConditionLengthType.MAX_WIDTH, 172, Adw.LengthUnit.PX)
                                                )}
                                                onApply={() => {
                                                    setControlsLeftPlayPauseButtonVisible(true);
                                                    setControlsLeftSeekNextButtonVisible(true);
                                                    setControlsLeftSeekPreviousButtonVisible(true);
                                                }}
                                                onUnapply={() => {
                                                    setControlsLeftPlayPauseButtonVisible(false);
                                                    setControlsLeftSeekNextButtonVisible(false);
                                                    setControlsLeftSeekPreviousButtonVisible(false);
                                                }}
                                            />

                                            <Adw.Breakpoint
                                                condition={Adw.BreakpointCondition.new_and(
                                                    Adw.BreakpointCondition.new_length(Adw.BreakpointConditionLengthType.MIN_WIDTH, 173, Adw.LengthUnit.PX),
                                                    Adw.BreakpointCondition.new_length(Adw.BreakpointConditionLengthType.MAX_WIDTH, 208, Adw.LengthUnit.PX)
                                                )}
                                                onApply={() => {
                                                    setControlsLeftPlayPauseButtonVisible(true);
                                                    setControlsLeftSeekNextButtonVisible(true);
                                                    setControlsLeftSeekPreviousButtonVisible(true);
                                                    setControlsLeftLoopButtonVisible(true);
                                                }}
                                                onUnapply={() => {
                                                    setControlsLeftPlayPauseButtonVisible(false);
                                                    setControlsLeftSeekNextButtonVisible(false);
                                                    setControlsLeftSeekPreviousButtonVisible(false);
                                                    setControlsLeftLoopButtonVisible(false);
                                                }}
                                            />

                                            <Adw.Breakpoint
                                                condition={Adw.BreakpointCondition.new_and(
                                                    Adw.BreakpointCondition.new_length(Adw.BreakpointConditionLengthType.MIN_WIDTH, 209, Adw.LengthUnit.PX),
                                                    Adw.BreakpointCondition.new_length(Adw.BreakpointConditionLengthType.MAX_WIDTH, 209 + volumeSliderWidth, Adw.LengthUnit.PX)
                                                )}
                                                onApply={() => {
                                                    setControlsLeftPlayPauseButtonVisible(true);
                                                    setControlsLeftSeekNextButtonVisible(true);
                                                    setControlsLeftSeekPreviousButtonVisible(true);
                                                    setControlsLeftLoopButtonVisible(true);
                                                    setControlsLeftShuffleButtonVisible(true);
                                                }}
                                                onUnapply={() => {
                                                    setControlsLeftPlayPauseButtonVisible(false);
                                                    setControlsLeftSeekNextButtonVisible(false);
                                                    setControlsLeftSeekPreviousButtonVisible(false);
                                                    setControlsLeftLoopButtonVisible(false);
                                                    setControlsLeftShuffleButtonVisible(false);
                                                }}
                                            />

                                            <Adw.Breakpoint
                                                condition={Adw.BreakpointCondition.new_length(Adw.BreakpointConditionLengthType.MIN_WIDTH, 209 + volumeSliderWidth + 1, Adw.LengthUnit.PX)}
                                                onApply={() => {
                                                    setControlsLeftPlayPauseButtonVisible(true);
                                                    setControlsLeftSeekNextButtonVisible(true);
                                                    setControlsLeftSeekPreviousButtonVisible(true);
                                                    setControlsLeftLoopButtonVisible(true);
                                                    setControlsLeftShuffleButtonVisible(true);
                                                    setControlsLeftVolumeButtonVisible(true);
                                                }}
                                                onUnapply={() => {
                                                    setControlsLeftPlayPauseButtonVisible(false);
                                                    setControlsLeftSeekNextButtonVisible(false);
                                                    setControlsLeftSeekPreviousButtonVisible(false);
                                                    setControlsLeftLoopButtonVisible(false);
                                                    setControlsLeftShuffleButtonVisible(false);
                                                    setControlsLeftVolumeButtonVisible(false);
                                                }}
                                            />

                                            <box hexpand halign={Gtk.Align.END} spacing={buttonSpacing} orientation={Gtk.Orientation.HORIZONTAL} valign={Gtk.Align.CENTER}>
                                                <box visible={controlsLeftVolumeButtonVisible}>
                                                    <slider
                                                        min={0}
                                                        max={1}
                                                        value={volume}
                                                        step={0.01}
                                                        widthRequest={volumeSliderWidth}
                                                        onChangeValue={handleVolumeChange}
                                                    />
                                                </box>

                                                <box visible={controlsLeftShuffleButtonVisible} cursor={shuffleStatus(transformShuffleCursor)}>
                                                    <Gtk.GestureClick button={Gdk.BUTTON_PRIMARY} onPressed={updateShuffle} />
                                                    <image
                                                        iconName="mi-shuffle-symbolic"
                                                        class={shuffleStatus(transformShuffleClass)}
                                                        widthRequest={buttonSize}
                                                        heightRequest={buttonSize}
                                                        iconSize={Gtk.IconSize.LARGE}
                                                    />
                                                </box>

                                                <box visible={controlsLeftSeekPreviousButtonVisible} cursor={canGoPrevious(transformSeekPreviousCursor)}>
                                                    <Gtk.GestureClick button={Gdk.BUTTON_PRIMARY} onPressed={seekPrevious} />
                                                    <image
                                                        iconName="mi-skip-previous-symbolic"
                                                        class={canGoPrevious(transformSeekPreviousClass)}
                                                        widthRequest={buttonSize}
                                                        heightRequest={buttonSize}
                                                        iconSize={Gtk.IconSize.LARGE}
                                                    />
                                                </box>

                                                <box visible={controlsLeftPlayPauseButtonVisible} cursor={playbackStatus(transformPlaybackCursor)}>
                                                    <Gtk.GestureClick button={Gdk.BUTTON_PRIMARY} onPressed={togglePlayPause} />
                                                    <image
                                                        iconName={playbackStatus(transformPlayPauseIcon)}
                                                        class={playbackStatus(transformPlaybackClass)}
                                                        widthRequest={buttonSize}
                                                        heightRequest={buttonSize}
                                                        iconSize={Gtk.IconSize.LARGE}
                                                    />
                                                </box>

                                                <box visible={controlsLeftSeekNextButtonVisible} cursor={canGoNext(transformSeekNextCursor)}>
                                                    <Gtk.GestureClick button={Gdk.BUTTON_PRIMARY} onPressed={seekNext} />
                                                    <image
                                                        iconName="mi-skip-next-symbolic"
                                                        class={canGoNext(transformSeekNextClass)}
                                                        widthRequest={buttonSize}
                                                        heightRequest={buttonSize}
                                                        iconSize={Gtk.IconSize.LARGE}
                                                    />
                                                </box>

                                                <box visible={controlsLeftLoopButtonVisible} cursor={loopStatus(transformLoopCursor)}>
                                                    <Gtk.GestureClick button={Gdk.BUTTON_PRIMARY} onPressed={updateLoop} />
                                                    <image
                                                        iconName={loopStatus(transformLoopIcon)}
                                                        class={loopStatus(transformLoopClass)}
                                                        widthRequest={buttonSize}
                                                        heightRequest={buttonSize}
                                                        iconSize={Gtk.IconSize.LARGE}
                                                    />
                                                </box>
                                            </box>
                                        </Adw.BreakpointBin>
                                    </box>

                                    <box visible={metadataLeftBoxVisible} orientation={Gtk.Orientation.VERTICAL}>
                                        <box orientation={Gtk.Orientation.HORIZONTAL} halign={Gtk.Align.START} spacing={5}>
                                            <box>
                                                <With value={coverArt}>
                                                    {(coverArt) => {
                                                        if (coverArt) {
                                                            return (
                                                                <image
                                                                    css={mainColor((color) => `background-color: ${color};`)}
                                                                    halign={Gtk.Align.FILL}
                                                                    hexpand
                                                                    vexpand
                                                                    class="cover-art"
                                                                    file={coverArt}
                                                                    overflow={Gtk.Overflow.HIDDEN}
                                                                />
                                                            )
                                                        }

                                                        return (
                                                            <image
                                                                css={mainColor((color) => `background-color: ${color};`)}
                                                                hexpand
                                                                vexpand
                                                                widthRequest={35}
                                                                heightRequest={35}
                                                                class="cover-art"
                                                                iconName="mi-music-note-symbolic"
                                                                overflow={Gtk.Overflow.HIDDEN}
                                                            />
                                                        )
                                                    }}
                                                </With>
                                            </box>

                                            <box orientation={Gtk.Orientation.VERTICAL} spacing={5} class="metadata" valign={Gtk.Align.CENTER}>
                                                <label
                                                    halign={Gtk.Align.START}
                                                    label={title}
                                                    wrap
                                                    ellipsize={Pango.EllipsizeMode.NONE}
                                                    wrapMode={Pango.WrapMode.WORD_CHAR}
                                                />
                                                <label
                                                    halign={Gtk.Align.START}
                                                    label={artist}
                                                    wrap
                                                    ellipsize={Pango.EllipsizeMode.NONE}
                                                    wrapMode={Pango.WrapMode.WORD_CHAR}
                                                />
                                            </box>
                                        </box>

                                        <box hexpand halign={Gtk.Align.CENTER} spacing={buttonSpacing} orientation={Gtk.Orientation.HORIZONTAL} valign={Gtk.Align.CENTER}>
                                            <box>
                                                <slider
                                                    min={0}
                                                    max={1}
                                                    value={volume}
                                                    step={0.01}
                                                    widthRequest={volumeSliderWidth}
                                                    onChangeValue={handleVolumeChange}
                                                />
                                            </box>

                                            <box cursor={shuffleStatus(transformShuffleCursor)}>
                                                <Gtk.GestureClick button={Gdk.BUTTON_PRIMARY} onPressed={updateShuffle} />
                                                <image
                                                    iconName="mi-shuffle-symbolic"
                                                    class={shuffleStatus(transformShuffleClass)}
                                                    widthRequest={buttonSize}
                                                    heightRequest={buttonSize}
                                                    iconSize={Gtk.IconSize.LARGE}
                                                />
                                            </box>

                                            <box cursor={canGoPrevious(transformSeekPreviousCursor)}>
                                                <Gtk.GestureClick button={Gdk.BUTTON_PRIMARY} onPressed={seekPrevious} />
                                                <image
                                                    iconName="mi-skip-previous-symbolic"
                                                    class={canGoPrevious(transformSeekPreviousClass)}
                                                    widthRequest={buttonSize}
                                                    heightRequest={buttonSize}
                                                    iconSize={Gtk.IconSize.LARGE}
                                                />
                                            </box>

                                            <box cursor={playbackStatus(transformPlaybackCursor)}>
                                                <Gtk.GestureClick button={Gdk.BUTTON_PRIMARY} onPressed={togglePlayPause} />
                                                <image
                                                    iconName={playbackStatus(transformPlayPauseIcon)}
                                                    class={playbackStatus(transformPlaybackClass)}
                                                    widthRequest={buttonSize}
                                                    heightRequest={buttonSize}
                                                    iconSize={Gtk.IconSize.LARGE}
                                                />
                                            </box>

                                            <box cursor={canGoNext(transformSeekNextCursor)}>
                                                <Gtk.GestureClick button={Gdk.BUTTON_PRIMARY} onPressed={seekNext} />
                                                <image
                                                    iconName="mi-skip-next-symbolic"
                                                    class={canGoNext(transformSeekNextClass)}
                                                    widthRequest={buttonSize}
                                                    heightRequest={buttonSize}
                                                    iconSize={Gtk.IconSize.LARGE}
                                                />
                                            </box>

                                            <box cursor={loopStatus(transformLoopCursor)}>
                                                <Gtk.GestureClick button={Gdk.BUTTON_PRIMARY} onPressed={updateLoop} />
                                                <image
                                                    iconName={loopStatus(transformLoopIcon)}
                                                    class={loopStatus(transformLoopClass)}
                                                    widthRequest={buttonSize}
                                                    heightRequest={buttonSize}
                                                    iconSize={Gtk.IconSize.LARGE}
                                                />
                                            </box>
                                        </box>
                                    </box>

                                    <box visible={bottomLayoutBotVisible} orientation={Gtk.Orientation.VERTICAL} spacing={5}>
                                        <box>
                                            <With value={coverArt}>
                                                {(coverArt) => {
                                                    if (coverArt) {
                                                        return (
                                                            <image
                                                                css={mainColor((color) => `background-color: ${color};`)}
                                                                widthRequest={35}
                                                                heightRequest={35}
                                                                hexpand
                                                                vexpand
                                                                class="cover-art"
                                                                file={coverArt}
                                                                overflow={Gtk.Overflow.HIDDEN}
                                                            />
                                                        )
                                                    }

                                                    return (
                                                        <image
                                                            css={mainColor((color) => `background-color: ${color};`)}
                                                            hexpand
                                                            vexpand
                                                            widthRequest={35}
                                                            heightRequest={35}
                                                            class="cover-art"
                                                            iconName="mi-music-note-symbolic"
                                                            overflow={Gtk.Overflow.HIDDEN}
                                                        />
                                                    )
                                                }}
                                            </With>
                                        </box>
                                        
                                        <box orientation={Gtk.Orientation.HORIZONTAL} spacing={5}>
                                            <box orientation={Gtk.Orientation.VERTICAL} spacing={5} class="metadata" valign={Gtk.Align.CENTER}>
                                                <label
                                                    halign={Gtk.Align.START}
                                                    label={title}
                                                    wrap
                                                    ellipsize={Pango.EllipsizeMode.NONE}
                                                    wrapMode={Pango.WrapMode.WORD_CHAR}
                                                />
                                                <label
                                                    halign={Gtk.Align.START}
                                                    label={artist}
                                                    wrap
                                                    ellipsize={Pango.EllipsizeMode.NONE}
                                                    wrapMode={Pango.WrapMode.WORD_CHAR}
                                                />
                                            </box>

                                            <Adw.BreakpointBin
                                                widthRequest={35}
                                                heightRequest={60}
                                            >
                                                <Adw.Breakpoint
                                                    condition={Adw.BreakpointCondition.new_length(Adw.BreakpointConditionLengthType.MAX_WIDTH, 100, Adw.LengthUnit.PX)}
                                                    onApply={() => {
                                                        setBottomLayoutPlayPauseButtonVisible(true);
                                                    }}
                                                    onUnapply={() => {
                                                        setBottomLayoutPlayPauseButtonVisible(false);
                                                    }}
                                                />

                                                <Adw.Breakpoint
                                                    condition={Adw.BreakpointCondition.new_and(
                                                        Adw.BreakpointCondition.new_length(Adw.BreakpointConditionLengthType.MIN_WIDTH, 101, Adw.LengthUnit.PX),
                                                        Adw.BreakpointCondition.new_length(Adw.BreakpointConditionLengthType.MAX_WIDTH, 136, Adw.LengthUnit.PX)
                                                    )}
                                                    onApply={() => {
                                                        setBottomLayoutPlayPauseButtonVisible(true);
                                                        setBottomLayoutSeekNextButtonVisible(true);
                                                    }}
                                                    onUnapply={() => {
                                                        setBottomLayoutPlayPauseButtonVisible(false);
                                                        setBottomLayoutSeekNextButtonVisible(false);
                                                    }}
                                                />

                                                <Adw.Breakpoint
                                                    condition={Adw.BreakpointCondition.new_and(
                                                        Adw.BreakpointCondition.new_length(Adw.BreakpointConditionLengthType.MIN_WIDTH, 137, Adw.LengthUnit.PX),
                                                        Adw.BreakpointCondition.new_length(Adw.BreakpointConditionLengthType.MAX_WIDTH, 172, Adw.LengthUnit.PX)
                                                    )}
                                                    onApply={() => {
                                                        setBottomLayoutPlayPauseButtonVisible(true);
                                                        setBottomLayoutSeekNextButtonVisible(true);
                                                        setBottomLayoutSeekPreviousButtonVisible(true);
                                                    }}
                                                    onUnapply={() => {
                                                        setBottomLayoutPlayPauseButtonVisible(false);
                                                        setBottomLayoutSeekNextButtonVisible(false);
                                                        setBottomLayoutSeekPreviousButtonVisible(false);
                                                    }}
                                                />

                                                <Adw.Breakpoint
                                                    condition={Adw.BreakpointCondition.new_and(
                                                        Adw.BreakpointCondition.new_length(Adw.BreakpointConditionLengthType.MIN_WIDTH, 173, Adw.LengthUnit.PX),
                                                        Adw.BreakpointCondition.new_length(Adw.BreakpointConditionLengthType.MAX_WIDTH, 208, Adw.LengthUnit.PX)
                                                    )}
                                                    onApply={() => {
                                                        setBottomLayoutPlayPauseButtonVisible(true);
                                                        setBottomLayoutSeekNextButtonVisible(true);
                                                        setBottomLayoutSeekPreviousButtonVisible(true);
                                                        setBottomLayoutLoopButtonVisible(true);
                                                    }}
                                                    onUnapply={() => {
                                                        setBottomLayoutPlayPauseButtonVisible(false);
                                                        setBottomLayoutSeekNextButtonVisible(false);
                                                        setBottomLayoutSeekPreviousButtonVisible(false);
                                                        setBottomLayoutLoopButtonVisible(false);
                                                    }}
                                                />

                                                <Adw.Breakpoint
                                                    condition={Adw.BreakpointCondition.new_and(
                                                        Adw.BreakpointCondition.new_length(Adw.BreakpointConditionLengthType.MIN_WIDTH, 209, Adw.LengthUnit.PX),
                                                        Adw.BreakpointCondition.new_length(Adw.BreakpointConditionLengthType.MAX_WIDTH, 209 + volumeSliderWidth, Adw.LengthUnit.PX)
                                                    )}
                                                    onApply={() => {
                                                        setBottomLayoutPlayPauseButtonVisible(true);
                                                        setBottomLayoutSeekNextButtonVisible(true);
                                                        setBottomLayoutSeekPreviousButtonVisible(true);
                                                        setBottomLayoutLoopButtonVisible(true);
                                                        setBottomLayoutShuffleButtonVisible(true);
                                                    }}
                                                    onUnapply={() => {
                                                        setBottomLayoutPlayPauseButtonVisible(false);
                                                        setBottomLayoutSeekNextButtonVisible(false);
                                                        setBottomLayoutSeekPreviousButtonVisible(false);
                                                        setBottomLayoutLoopButtonVisible(false);
                                                        setBottomLayoutShuffleButtonVisible(false);
                                                    }}
                                                />

                                                <Adw.Breakpoint
                                                    condition={Adw.BreakpointCondition.new_length(Adw.BreakpointConditionLengthType.MIN_WIDTH, 209 + volumeSliderWidth + 1, Adw.LengthUnit.PX)}
                                                    onApply={() => {
                                                        setBottomLayoutPlayPauseButtonVisible(true);
                                                        setBottomLayoutSeekNextButtonVisible(true);
                                                        setBottomLayoutSeekPreviousButtonVisible(true);
                                                        setBottomLayoutLoopButtonVisible(true);
                                                        setBottomLayoutShuffleButtonVisible(true);
                                                        setBottomLayoutVolumeButtonVisible(true);
                                                    }}
                                                    onUnapply={() => {
                                                        setBottomLayoutPlayPauseButtonVisible(false);
                                                        setBottomLayoutSeekNextButtonVisible(false);
                                                        setBottomLayoutSeekPreviousButtonVisible(false);
                                                        setBottomLayoutLoopButtonVisible(false);
                                                        setBottomLayoutShuffleButtonVisible(false);
                                                        setBottomLayoutVolumeButtonVisible(false);
                                                    }}
                                                />

                                                <box hexpand halign={Gtk.Align.END} spacing={buttonSpacing} orientation={Gtk.Orientation.HORIZONTAL} valign={Gtk.Align.CENTER}>
                                                    <box visible={bottomLayoutVolumeButtonVisible}>
                                                        <slider
                                                            min={0}
                                                            max={1}
                                                            value={volume}
                                                            step={0.01}
                                                            widthRequest={volumeSliderWidth}
                                                            onChangeValue={handleVolumeChange}
                                                        />
                                                    </box>

                                                    <box visible={bottomLayoutShuffleButtonVisible} cursor={shuffleStatus(transformShuffleCursor)}>
                                                        <Gtk.GestureClick button={Gdk.BUTTON_PRIMARY} onPressed={updateShuffle} />
                                                        <image
                                                            iconName="mi-shuffle-symbolic"
                                                            class={shuffleStatus(transformShuffleClass)}
                                                            widthRequest={buttonSize}
                                                            heightRequest={buttonSize}
                                                            iconSize={Gtk.IconSize.LARGE}
                                                        />
                                                    </box>

                                                    <box visible={bottomLayoutSeekPreviousButtonVisible} cursor={canGoPrevious(transformSeekPreviousCursor)}>
                                                        <Gtk.GestureClick button={Gdk.BUTTON_PRIMARY} onPressed={seekPrevious} />
                                                        <image
                                                            iconName="mi-skip-previous-symbolic"
                                                            class={canGoPrevious(transformSeekPreviousClass)}
                                                            widthRequest={buttonSize}
                                                            heightRequest={buttonSize}
                                                            iconSize={Gtk.IconSize.LARGE}
                                                        />
                                                    </box>

                                                    <box visible={bottomLayoutPlayPauseButtonVisible} cursor={playbackStatus(transformPlaybackCursor)}>
                                                        <Gtk.GestureClick button={Gdk.BUTTON_PRIMARY} onPressed={togglePlayPause} />
                                                        <image
                                                            iconName={playbackStatus(transformPlayPauseIcon)}
                                                            class={playbackStatus(transformPlaybackClass)}
                                                            widthRequest={buttonSize}
                                                            heightRequest={buttonSize}
                                                            iconSize={Gtk.IconSize.LARGE}
                                                        />
                                                    </box>

                                                    <box visible={bottomLayoutSeekNextButtonVisible} cursor={canGoNext(transformSeekNextCursor)}>
                                                        <Gtk.GestureClick button={Gdk.BUTTON_PRIMARY} onPressed={seekNext} />
                                                        <image
                                                            iconName="mi-skip-next-symbolic"
                                                            class={canGoNext(transformSeekNextClass)}
                                                            widthRequest={buttonSize}
                                                            heightRequest={buttonSize}
                                                            iconSize={Gtk.IconSize.LARGE}
                                                        />
                                                    </box>

                                                    <box visible={bottomLayoutLoopButtonVisible} cursor={loopStatus(transformLoopCursor)}>
                                                        <Gtk.GestureClick button={Gdk.BUTTON_PRIMARY} onPressed={updateLoop} />
                                                        <image
                                                            iconName={loopStatus(transformLoopIcon)}
                                                            class={loopStatus(transformLoopClass)}
                                                            widthRequest={buttonSize}
                                                            heightRequest={buttonSize}
                                                            iconSize={Gtk.IconSize.LARGE}
                                                        />
                                                    </box>
                                                </box>
                                            </Adw.BreakpointBin>
                                        </box>
                                    </box>
                                </box>
                            )
                        }}
                    </With>
                </Adw.BreakpointBin>
            </revealer>
        </Gtk.Window>
    )
}