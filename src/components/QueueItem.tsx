import React from "react";
import {Col} from "react-bootstrap";
import {BsMusicNoteBeamed, IoMdCopy, IoPlay, MdNavigateBefore, MdNavigateNext, RiDeleteBinLine} from "react-icons/all";
import ControlButtonOverlay from "./player/ControlButtonOverlay";

interface QueueItemProps {
    index: number,
    queueIndex: number,
    queue: string[],
    play: (url: string) => void,
    playFromQueue: (index: number) => void,
    deleteFromQueue: (index: number) => void,
    swapQueueItems: (oldIndex: number, newIndex: number) => void
}

class QueueItem extends React.Component<QueueItemProps> {
    urlInputRef: HTMLInputElement | null;

    constructor(props: QueueItemProps) {
        super(props);

        this.urlInputRef = null;
    }

    cssSafe(url: string) {
        return url.replace(/[^a-z0-9]/g, (s) => {
            const c = s.charCodeAt(0);
            if (c === 32) {
                return "-";
            } else if (c >= 65 && c <= 90) {
                return "_" + s.toLowerCase();
            }
            return "__" + ("000" + c.toString(16)).slice(-4);
        });
    }

    copyToClipboard() {
        const tempInput = document.createElement("input");
        tempInput.value = this.props.queue[this.props.index];
        document.body.appendChild(tempInput);
        tempInput.select();
        document.execCommand("copy");
        document.body.removeChild(tempInput);
    }

    render() {
        const css = this.cssSafe(this.props.queue[this.props.index]);
        const playing = this.props.queueIndex === this.props.index;
        return (
            <Col className={"queue-item rounded shadow my-2 mx-1 p-1" + (playing ? " bg-dark" : "")}>
                <div className={"d-flex w-100"}>
                    <div>
                        {this.props.index > 0 ?
                            <ControlButtonOverlay
                                id={"tooltip-queue-" + css + "-before"}
                                onClick={() => {
                                    this.props.swapQueueItems(this.props.index, this.props.index - 1);
                                }}
                                tooltip={"Move up"}>
                                <MdNavigateBefore/>
                            </ControlButtonOverlay> :
                            <></>
                        }
                        {this.props.index < this.props.queue.length - 1 ?
                            <ControlButtonOverlay
                                id={"tooltip-queue-" + css + "-after"}
                                onClick={() => {
                                    this.props.swapQueueItems(this.props.index, this.props.index + 1);
                                }}
                                tooltip={"Move down"}>
                                <MdNavigateNext/>
                            </ControlButtonOverlay> :
                            <></>
                        }
                    </div>
                    <div className={"ml-auto"}>
                        <ControlButtonOverlay
                            id={"tooltip-queue-" + css + "-copy"}
                            onClick={this.copyToClipboard.bind(this)}
                            tooltip={"Copy source to clipboard"}>
                            <IoMdCopy/>
                        </ControlButtonOverlay>
                        {playing ?
                            <ControlButtonOverlay
                                id={"tooltip-queue-" + css + "-playing"}
                                tooltip={"Currently playing"}>
                                <BsMusicNoteBeamed className={"blink"}/>
                            </ControlButtonOverlay> :
                            <>
                                <ControlButtonOverlay
                                    id={"tooltip-queue-" + css + "-playFromQueue"}
                                    onClick={() => {
                                        this.props.playFromQueue(this.props.index);
                                    }}
                                    tooltip={"Play"}>
                                    <IoPlay/>
                                </ControlButtonOverlay>
                                <ControlButtonOverlay
                                    className={"text-danger"}
                                    id={"tooltip-queue-" + css + "-delete"}
                                    onClick={() => {
                                        this.props.deleteFromQueue(this.props.index);
                                    }}
                                    tooltip={"Delete item"}>
                                    <RiDeleteBinLine/>
                                </ControlButtonOverlay>
                            </>
                        }
                    </div>
                </div>
                <a href={this.props.queue[this.props.index]} target={"_blank"}>
                    {this.props.queue[this.props.index]}
                </a>
            </Col>
        );
    }
}

export default QueueItem;
