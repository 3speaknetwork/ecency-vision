import React, {Component} from "react";

import isEqual from "react-fast-compare";

import {ActiveUser} from "../../store/active-user/types";
import {User} from "../../store/users/types";
import {Global} from "../../store/global/types";

import Tooltip from "../tooltip";
import EmojiPicker from "../emoji-picker";
import Gallery from "../gallery";
import Fragments from "../fragments";
import AddImage from "../add-image";
import AddImageMobile from "../add-image-mobile";
import AddLink from "../add-link";

import {uploadImage} from "../../api/misc";

import {addImage} from "../../api/private-api";

import {error} from "../feedback";

import {_t} from "../../i18n";

import {insertOrReplace, replace} from "../../util/input-util";

import {getAccessToken} from "../../helper/user-token";

import _c from "../../util/fix-class-names";

import {
    formatBoldSvg,
    formatItalicSvg,
    formatTitleSvg,
    codeTagsSvg,
    formatQuoteCloseSvg,
    formatListNumberedSvg,
    formatListBulletedSvg,
    linkSvg,
    imageSvg,
    gridSvg,
    emoticonHappyOutlineSvg,
  textShortSvg,
  infoOutlineSvg,
  videoSvg
} from "../../img/svg";
import VideoUpload from "../upload-video/upload-video";
import VideoGallery from "../video-gallery";
import { BeneficiaryRoute } from "../../api/operations";


interface Props {
    global: Global;
    users: User[];
    activeUser: ActiveUser | null;
    beneficiaryAdded?: (item: BeneficiaryRoute) => void;
    sm?: boolean;
    showEmoji?: boolean;
    toggleThreaspeak?: any
}

interface State {
    gallery: boolean;
    fragments: boolean;
    image: boolean;
    link: boolean;
    mobileImage: boolean;
    showVideo: boolean;
    showVideoGallery: boolean;
}

export class EditorToolbar extends Component<Props> {
    state: State = {
        gallery: false,
        fragments: false,
        image: false,
        link: false,
        mobileImage: false,
        showVideo: false,
        showVideoGallery: false,
    }

    holder = React.createRef<HTMLDivElement>();
    fileInput = React.createRef<HTMLInputElement>();
    beneficiaryAdded: ((video: any) => void) | undefined;

    shouldComponentUpdate(nextProps: Readonly<Props>, nextState: Readonly<State>): boolean {
        return !isEqual(this.props.users, nextProps.users)
            || !isEqual(this.props.activeUser, nextProps.activeUser)
            || !isEqual(this.props.showEmoji, nextProps.showEmoji)
            || !isEqual(this.state, nextState);
    }

    toggleGallery = () => {
        const {gallery} = this.state;
        this.setState({gallery: !gallery});
    }

    toggleFragments = () => {
        const {fragments} = this.state;
        this.setState({fragments: !fragments});
    }

    toggleImage = (e?: React.MouseEvent<HTMLElement>) => {
        if (e) {
            e.stopPropagation();
        }
        const {image} = this.state;
        this.setState({image: !image});
    }

    toggleVideo = (val: boolean) => this.setState({showVideo: val})
    toggleVideoGallery = (val: boolean) => this.setState({ showVideoGallery: val})

    toggleMobileImage = (e?: React.MouseEvent<HTMLElement>) => {
        if (e) {
            e.stopPropagation();
        }
        const {mobileImage} = this.state;
        this.setState({mobileImage: !mobileImage});
    }

    toggleLink = (e?: React.MouseEvent<HTMLElement>) => {
        if (e) {
            e.stopPropagation();
        }
        const {link} = this.state;

        this.setState({link: !link});
    }

    componentDidMount() {
        const el = this.getTargetEl();
        if (el) {
            el.addEventListener('dragover', this.onDragOver);
            el.addEventListener('drop', this.drop);
            el.addEventListener('paste', this.onPaste);
        }
    }

    componentWillUnmount() {
        const el = this.getTargetEl();
        if (el) {
            el.removeEventListener('dragover', this.onDragOver);
            el.removeEventListener('drop', this.drop);
            el.removeEventListener('paste', this.onPaste);
        }
    }

    getTargetEl = (): HTMLInputElement | null => {
        const holder = this.holder.current;
        if (!holder || !holder.parentElement) {
            return null;
        }

        return holder.parentElement.querySelector('.the-editor');
    }

    insertText = (before: string, after: string = "") => {
        const el = this.getTargetEl();
        if (el) {
            insertOrReplace(el, before, after);
        }
    };

    replaceText = (find: string, rep: string) => {
        const el = this.getTargetEl();
        if (el) {
            replace(el, find, rep);
        }
    }

    onDragOver = (e: DragEvent) => {
        const {activeUser} = this.props;
        if (!activeUser) {
            return;
        }

        e.preventDefault();
        e.stopPropagation();

        if (e.dataTransfer) {
            e.dataTransfer.effectAllowed = 'copy';
            e.dataTransfer.dropEffect = 'copy';
        }
    }

    drop = (e: DragEvent) => {
        const {activeUser} = this.props;
        if (!activeUser) {
            return;
        }

        e.preventDefault();
        e.stopPropagation();

        if (!e.dataTransfer) {
            return;
        }

        const files = [...e.dataTransfer.files]
            .filter(i => this.checkFile(i.name))
            .filter(i => i);

        if (files.length > 0) {
            files.forEach(file => this.upload(file));
        }
    }

    onPaste = (e: ClipboardEvent) => {
        if (!e.clipboardData) {
            return;
        }

        // when text copied from ms word, it adds screenshot of selected text to clipboard.
        // check if data in clipboard is long string and skip upload.
        // (i think no one uses more than 50 chars for a image file)
        const txtData = e.clipboardData.getData('text/plain');
        if (txtData.length >= 50) {
            return;
        }

        const files = [...e.clipboardData.items]
            .map(item =>
                item.type.indexOf('image') !== -1 ? item.getAsFile() : null
            )
            .filter(i => i);

        if (files.length > 0) {
            e.stopPropagation();
            e.preventDefault();

            files.forEach(file => {
                if (file) this.upload(file).then();
            });
        }
    }

    bold = () => {
        this.insertText("**", "**");
    };

    italic = () => {
        this.insertText("*", "*");
    };

    header = (w: number) => {
        const h = "#".repeat(w);
        this.insertText(`${h} `);
    };

    code = () => {
        this.insertText("<code>", "</code>");
    };

    quote = () => {
        this.insertText(">");
    };

    ol = () => {
        this.insertText("1. item1\n2. item2\n3. item3");
    };

    ul = () => {
        this.insertText("* item1\n* item2\n* item3");
    };

    link = (text: string, url: string) => {
        this.insertText(`[${text}`, `](${url})`);
    };

    image = (text: string, url: string) => {
        this.insertText(`![${text}`, `](${url})`);
    };

    table = (e: React.MouseEvent<HTMLElement>) => {
        e.stopPropagation();
        const t =
            "\n|\tColumn 1\t|\tColumn 2\t|\tColumn 3\t|\n" +
            "|\t------------\t|\t------------\t|\t------------\t|\n" +
            "|\t     Text     \t|\t     Text     \t|\t     Text     \t|\n";
        this.insertText(t);
    };

    table1 = (e: React.MouseEvent<HTMLElement>) => {
        e.stopPropagation();

        const t = "\n|\tColumn 1\t|\n" + "|\t------------\t|\n" + "|\t     Text     \t|\n";
        this.insertText(t);
    };

    table2 = (e: React.MouseEvent<HTMLElement>) => {
        e.stopPropagation();
        const t =
            "\n|\tColumn 1\t|\tColumn 2\t|\n" +
            "|\t------------\t|\t------------\t|\n" +
            "|\t     Text     \t|\t     Text     \t|\n";
        this.insertText(t);
    };

    fileInputChanged = (e: React.ChangeEvent<HTMLInputElement>): void => {
        let files = [...e.target.files as FileList] 
            .filter(i => this.checkFile(i.name))
            .filter(i => i);

        const {global: { isElectron } } = this.props;

        if (files.length > 0) {
            e.stopPropagation();
            e.preventDefault();
        }

        if(files.length > 1 && isElectron){
            let isWindows = process.platform === "win32";
            if (isWindows) {
                files = files.reverse()    
            }
        }

        files.forEach(file => this.upload(file));

        // reset input
        e.target.value = "";
    };

    upload = async (file: File) => {
        const {activeUser, global} = this.props;

        const username = activeUser?.username!;

        const tempImgTag = `![Uploading ${file.name} #${Math.floor(
            Math.random() * 99
        )}]()\n\n`;
        this.insertText(tempImgTag);

        let imageUrl: string;
        try {
            let token = getAccessToken(username);
            if(token) {
                const resp = await uploadImage(file, token);
                imageUrl = resp.url;

            if (global.usePrivate && imageUrl.length > 0) {
                addImage(username, imageUrl).then();
            }

            const imageName = imageUrl.length > 0 && imageUrl.split('/').pop();
            const imgTag = imageUrl.length > 0 && `![${imageName}](${imageUrl})\n\n`;

            imgTag && this.replaceText(tempImgTag, imgTag);
            }
            else {
                error(_t("editor-toolbar.image-error-cache"))
            }
        } catch (e) {
            if ((e as any).response?.status === 413) {
                error(_t("editor-toolbar.image-error-size"));
            } else {
                error(_t("editor-toolbar.image-error"));
            }
            return;
        }
    };

    checkFile = (filename: string) => {
        const filenameLow = filename.toLowerCase();
        return ['jpg', 'jpeg', 'gif', 'png'].some(el => filenameLow.endsWith(el));
    };

    render() {
        const {gallery, fragments, image, link, mobileImage, showVideo, showVideoGallery} = this.state;
        const {global, sm, activeUser, showEmoji = true, beneficiaryAdded, toggleThreaspeak} = this.props;

        return (
            <>
                <div className={_c(`editor-toolbar ${sm ? 'toolbar-sm' : ''}`)} ref={this.holder}>
                    <Tooltip content={_t("editor-toolbar.bold")}>
                        <div className="editor-tool" onClick={this.bold}>
                            {formatBoldSvg}
                        </div>
                    </Tooltip>
                    <Tooltip content={_t("editor-toolbar.italic")}>
                        <div className="editor-tool" onClick={this.italic}>
                            {formatItalicSvg}
                        </div>
                    </Tooltip>
                    <Tooltip content={_t("editor-toolbar.header")}>
                        <div
                            className="editor-tool"
                            onClick={() => {
                                this.header(1);
                            }}
                        >
                            {formatTitleSvg}
                            <div className="sub-tool-menu">
                                {[...Array(3).keys()].map((i) => (
                                    <div
                                        key={i}
                                        className="sub-tool-menu-item"
                                        onClick={(e: React.MouseEvent<HTMLElement>) => {
                                            e.stopPropagation();
                                            this.header(i + 2);
                                        }}
                                    >
                                        {`H${i + 2}`}
                                    </div>
                                ))}
                            </div>
                        </div>
                    </Tooltip>
                    <div className="tool-separator"/>
                    <Tooltip content={_t("editor-toolbar.code")}>
                        <div className="editor-tool" onClick={this.code}>
                            {codeTagsSvg}
                        </div>
                    </Tooltip>
                    <Tooltip content={_t("editor-toolbar.quote")}>
                        <div className="editor-tool" onClick={this.quote}>
                            {formatQuoteCloseSvg}
                        </div>
                    </Tooltip>
                    <div className="tool-separator"/>
                    <Tooltip content={_t("editor-toolbar.ol")}>
                        <div className="editor-tool" onClick={this.ol}>
                            {formatListNumberedSvg}
                        </div>
                    </Tooltip>
                    <Tooltip content={_t("editor-toolbar.ul")}>
                        <div className="editor-tool" onClick={this.ul}>
                            {formatListBulletedSvg}
                        </div>
                    </Tooltip>
                    <div className="tool-separator"/>
                    <Tooltip content={_t("editor-toolbar.link")}>
                        <div className="editor-tool" onClick={this.toggleLink}>
                            {linkSvg}
                        </div>
                    </Tooltip>

                    {(() => {
                        // if (activeUser && global.isMobile) {
                        //     return <Tooltip content={_t("editor-toolbar.image")}>
                        //         <div className="editor-tool" onClick={this.toggleMobileImage}>
                        //             {imageSvg}
                        //         </div>
                        //     </Tooltip>
                        // }

                        return <Tooltip content={_t("editor-toolbar.image")}>
                            <div
                                className="editor-tool"
                                // onClick={this.toggleImage}
                                >
                                {imageSvg}

                                {activeUser && (
                                    <div className="sub-tool-menu">
                                        <div
                                            className="sub-tool-menu-item"
                                            onClick={(e: React.MouseEvent<HTMLElement>) => {
                                                e.stopPropagation();
                                                const el = this.fileInput.current;
                                                if (el) el.click();
                                            }}>
                                            From device
                                        </div>
                                        <div
                                          className="sub-tool-menu-item"
                                          onClick={(e: React.MouseEvent<HTMLElement>) => {
                                              e.stopPropagation();
                                              this.toggleGallery();
                                          }}
                                        >
                                            {/* {_t("editor-toolbar.gallery")} */}Photo gallery
                                        </div>
                                        <div
                                            className="sub-tool-menu-item"
                                            onClick={this.toggleImage}
                                            >
                                            Image url
                                        </div>
                                    </div>
                                )}
                            </div>
                        </Tooltip>
                    })()}
                    <Tooltip content={_t("editor-toolbar.video")}>
                        <div className="editor-tool" >
                            {videoSvg}
                             <div className="sub-tool-menu">
                                        <div
                                            className="sub-tool-menu-item"
                                            onClick={() => this.setState({ showVideo: true })}>
                                            Upload from PC
                                        </div>
                                        <div
                                          className="sub-tool-menu-item"
                                          onClick={() => this.setState({ showVideoGallery: true })}
                                        >
                                            Video gallery
                                        </div>
                            </div>
                        </div>
                    </Tooltip>
                    <Tooltip content={_t("editor-toolbar.table")}>
                        <div className="editor-tool" onClick={this.table}>
                            {gridSvg}
                            <div className="sub-tool-menu">
                                <div className="sub-tool-menu-item" onClick={this.table}>
                                    {_t("editor-toolbar.table-3-col")}
                                </div>
                                <div className="sub-tool-menu-item" onClick={this.table2}>
                                    {_t("editor-toolbar.table-2-col")}
                                </div>
                                <div className="sub-tool-menu-item" onClick={this.table1}>
                                    {_t("editor-toolbar.table-1-col")}
                                </div>
                            </div>
                        </div>
                    </Tooltip>

                    {/* WILL RETURN WHEN FIXED ON ECENCY */}
                    {/* <Tooltip content={_t("editor-toolbar.emoji")}>
                        <div className="editor-tool" role="none">
                            {emoticonHappyOutlineSvg}
                            {showEmoji && <EmojiPicker fallback={(e) => {
                                this.insertText(e, '');
                            }}/>}
                        </div>
                    </Tooltip> */}
              <Tooltip content="Markdown tutorial">
                <a href="https://commonmark.org/help/">
                  <div className="editor-tool" role="none">
                    {infoOutlineSvg}
                  </div>
                </a>
              </Tooltip>
                    {global.usePrivate && <Tooltip content={_t("editor-toolbar.fragments")}>
                      <div className="editor-tool" onClick={this.toggleFragments}>
                          {textShortSvg}
                      </div>
                    </Tooltip>}
                </div>
                <input
                    onChange={this.fileInputChanged}
                    className="file-input"
                    ref={this.fileInput}
                    type="file"
                    accept="image/*"
                    multiple={true}
                    style={{display: 'none'}}
                />
                {(gallery && activeUser) && <Gallery global={global} activeUser={activeUser} onHide={this.toggleGallery} onPick={(url: string) => {
                    const fileName = url.split("/").pop() || "";
                    this.image(fileName, url);
                    this.toggleGallery();
                }}/>}
                {(fragments && activeUser) && <Fragments activeUser={activeUser} onHide={this.toggleFragments} onPick={(body: string) => {
                    this.insertText(body);
                    this.toggleFragments();
                }}/>}
                {image && <AddImage onHide={this.toggleImage} onSubmit={(text: string, link: string) => {
                    this.image(text, link);
                    this.toggleImage();
                }}/>}
                {showVideo && activeUser && <VideoUpload setShowGallery={() => this.setState({ showVideoGallery: true })} global={global} show={showVideo} activeUser={activeUser} setShow={this.toggleVideo}  />}
                {showVideoGallery && activeUser && <VideoGallery 
                    activeUser={activeUser} 
                    showGallery={showVideoGallery} 
                    setShowGallery={this.toggleVideoGallery} 
                    insertText={this.insertText} 
                    setVideoEncoderBeneficiary={beneficiaryAdded}
                    toggleThreaspeak={toggleThreaspeak}
                />}
                {link && <AddLink onHide={this.toggleLink} onSubmit={(text: string, link: string) => {
                    this.link(text, link);
                    this.toggleLink();
                }}/>}
                {mobileImage && (
                    <AddImageMobile global={global}
                                    activeUser={activeUser}
                                    onHide={this.toggleMobileImage}
                                    onPick={(url) => {
                                        const fileName = url.split("/").pop() || "";
                                        this.image(fileName, url);
                                        this.toggleMobileImage();
                                    }}
                                    onGallery={() => {
                                        this.toggleMobileImage();
                                        this.toggleGallery();
                                    }}
                                    onUpload={() => {
                                        this.toggleMobileImage();
                                        const el = this.fileInput.current;
                                        if (el) el.click();
                                    }}
                    />
                )}
            </>
        );
    }

}

export default (props: Props) => {
    const p: Props = {
        global: props.global,
        users: props.users,
        activeUser: props.activeUser,
        sm: props.sm,
        showEmoji: props.showEmoji,
        beneficiaryAdded: props.beneficiaryAdded,
        toggleThreaspeak: props.toggleThreaspeak,
    }
    return <EditorToolbar {...p} />
}
