import React from "react";
import ReactPlayer from "react-player";
import {Socket} from "socket.io-client";
import "./Player.css";
import PlayerControls from "./PlayerControls";

interface PlayerProps {
    controlsHidden: boolean,
    showRootPlayer: boolean,
    id: string,
    isEmbed: boolean,
    socket: Socket | null,
    url: string,
    playing: boolean,
    played: number,
    playbackRate: number,
    loop: boolean,
    queueIndex: number,
    queue: string[],
    playFromQueue: (index: number) => void
}

interface PlayerState {
    buffering: boolean,
    duration: number,
    fullscreen: boolean,
    loaded: number,
    muted: boolean,
    playbackRate: number,
    played: number,
    playerPoppedOut: boolean,
    ready: boolean,
    seeking: boolean,
    volume: number
}

class Player extends React.Component<PlayerProps, PlayerState> {
    fullscreenNode: HTMLDivElement | undefined;
    interaction: boolean;
    player: React.RefObject<ReactPlayer>;

    constructor(props: PlayerProps) {
        super(props);
        this.interaction = false;
        this.player = React.createRef();

        this.state = {
            buffering: false,
            duration: 0,
            fullscreen: false,
            loaded: 0,
            muted: true,
            playbackRate: this.props.playbackRate,
            played: 0,
            playerPoppedOut: false,
            ready: false,
            seeking: false,
            volume: 0.3
        };

        this.props.socket?.emit("update", {
            muted: true,
            volume: 0.3
        });
    }

    unloadCaptionsYT() {
        const player = this.player.current?.getInternalPlayer();
        console.log("Internal player:", player);
        if (player && player.unloadModule) {
            console.log("Unloading cc of youtube player");
            player.unloadModule("cc");  // Works for AS3 ignored by html5
            player.unloadModule("captions");  // Works for html5 ignored by AS3
        }
    }

    componentDidUpdate(prevProps: Readonly<PlayerProps>, prevState: Readonly<PlayerState>) {
        if (prevProps.url !== this.props.url) {
            console.log("Url changed, setting state to unready");
            this.setState({
                ready: false
            });
        }

        if (Math.abs(prevState.played - this.props.played) * prevState.duration * prevState.playbackRate > 2) {
            console.log("Desynced, currently at", prevState.played * prevState.duration,
                "should seek to", this.props.played * prevState.duration);
            if (this.interaction) {
                console.log("Not seeking, interaction has happened");
            } else {
                if (this.player.current) {
                    this.player.current.seekTo(this.props.played * prevState.duration, "seconds");
                }
                this.setState({
                    played: this.props.played
                });
            }
        }
    }

    updateState(data: any) {
        if (this.props.socket) {
            this.props.socket.emit("update", data);
        }
        window.parent.postMessage({
            vendor: "Web-SyncPlay",
            data
        }, "*");
        this.setState(data);
    }

    render() {
        return (
            <div className={"player"}
                 ref={(node) => this.fullscreenNode = node || undefined}>
                {this.props.showRootPlayer ? <></> :
                    <PlayerControls
                        controlsHidden={this.props.controlsHidden}
                        duration={this.state.duration}
                        endInteract={() => this.interaction = false}
                        fullscreen={this.state.fullscreen}
                        fullscreenNode={this.fullscreenNode}
                        isEmbed={this.props.isEmbed}
                        muted={this.state.muted}
                        playbackRate={this.state.playbackRate}
                        played={this.state.played}
                        player={this.player}
                        playFromQueue={this.props.playFromQueue}
                        playing={this.props.playing}
                        queue={this.props.queue}
                        queueIndex={this.props.queueIndex}
                        roomId={this.props.id}
                        startInteract={() => this.interaction = true}
                        updateState={this.updateState.bind(this)}
                        url={this.props.url}
                        volume={this.state.volume}/>
                }
                <ReactPlayer
                    style={{
                        backgroundColor: "#000000",
                        overflow: "hidden",
                        maxHeight: this.state.fullscreen || this.props.isEmbed ? "100vh" : "calc(100vh - 169px)",
                        visibility: this.state.playerPoppedOut ? "hidden" : "visible"
                    }}
                    ref={this.player}
                    width={"100%"}
                    height={this.state.fullscreen || this.props.isEmbed ? "100vh" : "calc((9 / 16) * 100vw)"}
                    config={{
                        youtube: {
                            playerVars: {
                                disablekb: 1,
                                modestbranding: 1,
                                origin: window.location.host
                            }
                        }
                    }}
                    url={this.props.url}
                    pip={true}
                    playing={this.props.playing}
                    controls={this.props.showRootPlayer}
                    loop={this.props.loop}
                    playbackRate={this.props.playbackRate}
                    volume={this.state.volume}
                    muted={this.state.muted}
                    onReady={() => {
                        console.log("Player ready");
                        this.updateState({ready: true});
                        // need "long" timeout for yt to be ready
                        setTimeout(this.unloadCaptionsYT.bind(this), 1000);
                    }}
                    onPlay={() => this.updateState({playing: true})}
                    onPause={() => this.updateState({playing: false})}
                    onBuffer={() => this.updateState({buffering: true})}
                    onBufferEnd={() => this.updateState({buffering: false})}
                    onEnded={() => {
                        if (this.props.loop) {
                            this.updateState({
                                played: 0,
                                playing: true
                            });
                        } else if (this.props.queueIndex + 1 < this.props.queue.length) {
                            this.props.playFromQueue(this.props.queueIndex + 1);
                        } else {
                            this.updateState({playing: false});
                        }
                    }}
                    onError={(e) => console.error("playback error", e)}
                    onProgress={(progress) => {
                        // We only want to update time slider if we are not currently seeking
                        if (!this.state.seeking) {
                            this.updateState(progress);
                        }
                    }}
                    onDuration={(duration) => this.updateState({duration})}
                />
            </div>
        );
    }
}

export default Player;
