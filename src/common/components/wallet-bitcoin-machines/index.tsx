import React, { Component, Fragment, useEffect, useState } from "react";
import moment from "moment";
import { History } from "history";
import { FormControl } from "react-bootstrap";
import { ActiveUser } from "../../store/active-user/types";
import { Account } from "../../store/accounts/types";
import { Global } from "../../store/global/types";
import { DynamicProps } from "../../store/dynamic-props/types";
import { Transactions } from "../../store/transactions/types";
import { Points, PointTransaction, TransactionType } from "../../store/points/types";
import BaseComponent from "../base";
import DropDown from "../dropdown";
import Transfer from "../transfer";
import Tooltip from "../tooltip";
import Purchase from "../purchase";
import Promote from "../promote";
import Boost from "../boost";
import LinearProgress from "../linear-progress";
import WalletMenu from "../wallet-menu";
import EntryLink from "../entry-link";
import { error, success } from "../feedback";
import { _t } from "../../i18n";
import { claimPoints, getCurrencyTokenRate } from "../../api/private-api";
import { claimBaPoints } from "../../api/breakaway";
import { dateToFullRelative } from "../../helper/parse-date";
import { getCommunity } from "../../api/bridge";
import { Community } from "../../store/communities/types";
import {
    bitcoinSvg,
    copyContent
} from "../../img/svg";
import FormattedCurrency from "../formatted-currency";
import axios, { AxiosResponse } from 'axios';
import { Button } from "react-bootstrap"
import { getAccount } from "../../api/hive"
import { getBtcWalletBalance, getBtcTransactions } from "../../api/breakaway";
import { Link } from "react-router-dom";
import { fetchOrdinals, getUserByUsername } from "../../api/breakaway";

export const formatMemo = (memo: string, history: History) => {
    return memo.split(" ").map(x => {
        if (x.indexOf("/") >= 3) {
            const [author, permlink] = x.split("/");
            return <Fragment key={x}>{EntryLink({
                history: history,
                entry: { category: "ecency", author: author.replace("@", ""), permlink },
                children: <span>{"@"}{author.replace("@", "")}/{permlink}</span>
            })}{" "}</Fragment>
        }
        return <Fragment key={x}>{x}{" "}</Fragment>;
    });
}

interface TransactionRowProps {
    history: History;
    tr: any;
    i: any,
}

export class TransactionRow extends Component<TransactionRowProps> {
    render() {
        const { tr, history, i } = this.props;
        // console.log(".......lll.......",tr.vout[0], i)

        const timestamp = tr.status.block_time;

        const date = new Date(timestamp * 1000);

        const dateRelative = date.toLocaleString();

        // console.log(dateRelative);

        const satoshisToBtc = (satoshis: number) => Number(satoshis / 100000000).toFixed(8);

        return (
            <div className="transaction-list-item">
                <div className="transaction-icon">{bitcoinSvg}</div>
                <div className="transaction-title">
                    <div className="transaction-name">
                        {satoshisToBtc(tr.vout.length > 1 ? tr.vout[0]?.value : tr.vout[i]?.value)} btc{i}
                    </div>
                    <div className="transaction-date">
                    {dateRelative}
                    </div>
                </div>
                <div className="transaction-numbers" style={{cursor: "pointer"}}>
                    <a 
                        href={`https://blockstream.info/tx/${tr.txid}`}
                        // href={`https://explorer.cloverpool.com/btc/transaction/${tr.txid}`}
                        target="_blank" 
                    >
                        {tr.txid.substring(0,30)}...
                    </a>
                </div> 
            </div>
        );
    }
}

interface Props {
    global: Global;
    myCommunity?: Community;
    dynamicProps: DynamicProps;
    history: History;
    activeUser: ActiveUser | any;
    account: Account | any;
    points: Points;
    signingKey: string;
    transactions: Transactions;
    fetchPoints: (username: string, type?: number) => void;
    updateWalletValues: () => void;
    addAccount: (data: Account) => void;
    updateActiveUser: (data?: Account) => void;
    setSigningKey: (key: string) => void;
}

export const WalletBtc = (props: Props) => {
    const [isMounted, setIsMounted] = useState(false);
    const [pointsHistory, setPointsHistory] = useState<any>([]);
    const [communityInfo, setCommunityInfo] = useState<any>();
    const [bitcoinBalance, setBitcoinBalance] = useState<any>(0);
    const [bitcoinTransactions, setBitcoinTransactions] = useState<any[]>([]);
    const [loading, setLoading] = useState(false);
    const [jsonMetaData, setJsonMetaData] = useState<any>(null)
    const [showNfts, setShowNfts] = useState(false);
    const [ordinals, setOrdinals] = useState([]);

    const { global, activeUser, account, points, history, fetchPoints, updateActiveUser } = props;
    // const jsonMetaData = JSON.parse(activeUser?.data?.posting_json_metadata)

    useEffect(() => {
        console.log(activeUser)
        setIsMounted(true);
        let user = history.location.pathname.split("/")[1];
        user = user.replace('@', '')
        global.isElectron && initiateOnElectron(user);
        getCommunityInfo();
        getBitcoinBalance();
        getBitcoinTransaction();
        return () => {
            setIsMounted(false);
        }
    }, [communityInfo?.title]);

    useEffect(() => {
        const getMetaData = () => {
            try {
                ///account
                const metaData = JSON.parse(account?.posting_json_metadata);
                setJsonMetaData(metaData)
            } catch (error) {
                console.log(error)
            }
        }
        getMetaData()
    }, [])

    useEffect(() => {
        /////test address
        // const bitcoinAddress = "bc1pet95xv7gz6s8q2r2x0g3npcyyf9yn0yr9y0x2yekxyqjzuvuef4sm5rpql"
        const bitcoinAddress = jsonMetaData?.bitcoin?.ordinalAddress

        const getOrdinals = async () => {
    
          setLoading(true);
          const data = await fetchOrdinals(bitcoinAddress);

          const imageOrdinals = data.filter(
            (inscription: any) => inscription.mime_type && inscription.mime_type.startsWith('image/')
          );
    
          setOrdinals(imageOrdinals);
          setLoading(false);
        };
    
        getOrdinals();
      }, [jsonMetaData]);

    const initiateOnElectron = (username: string) => {
        if (!isMounted && global.isElectron) {
            let getPoints = new Promise(res => fetchPoints(username))
            username && getPoints.then(res => {
                setIsMounted(true)
            }).catch((error) => {
                console.error('getPoints', error);
            });
        }
    }

    const getCommunityInfo = async () => {
        const communityData = await getCommunity(props.global.hive_id);
        setCommunityInfo(communityData);
    }

    const getBitcoinBalance = async () => {
        try {
            const data = await getBtcWalletBalance(jsonMetaData?.bitcoin?.address);
            if (data.success) {
                setBitcoinBalance(data.balance);
            }
        } catch (error) {
            console.log(error);
        }
    }

    const getBitcoinTransaction = async () => {
        setLoading(true)
        try {
            const data = await getBtcTransactions(jsonMetaData?.bitcoin?.address);
            // console.log(data)
            if (data.success) {
                setBitcoinTransactions(data.transactions);
                setLoading(false)
            }
        } catch (error) {
            console.log(error);
            setLoading(false)
        }
    }

    function copyToClipboard(text: string) {
        const textarea = document.createElement('textarea');
        textarea.value = text;
        
        textarea.style.position = 'absolute';
        textarea.style.left = '-9999px';
        
        document.body.appendChild(textarea);
        
        textarea.select();
        textarea.setSelectionRange(0, 99999);
        document.execCommand('copy');
        
        document.body.removeChild(textarea);
        success("Address copied to clipboard!")
    }    

    return (
        <>
            <div className="wallet-ecency">
                <div className="wallet-main">
                    <div className="wallet-info">
                        <div className="balance-row alternative ml-5">
                            <div className="balance-info">
                                <div className="title">Btc Address</div>
                                <div className="description">Your bitcoin wallet address</div>
                            </div>
                            <div className="balance-values">
                                <div className="amount">
                                    <span className="ml-5">{jsonMetaData?.bitcoin?.address}</span>
                                    <span 
                                        style={{cursor: "pointer"}}
                                        onClick={()=> copyToClipboard(jsonMetaData?.bitcoin?.address)}
                                    >
                                        {copyContent}
                                    </span>
                                </div>
                            </div>
                        </div>

                        <div className="balance-row alternative ml-5">
                            <div className="balance-info">
                                <div className="title">{communityInfo?.title}</div>
                                <div className="description">Your bitcoin wallet balance</div>
                            </div>
                            <div className="balance-values">
                                <div className="amount">
                                    {bitcoinBalance.toFixed(5)} (BTC)
                                </div>
                            </div>
                        </div>
                        
                        <div className="toggle-nft mb-5 p-3">
                            <Button
                                onClick={()=> setShowNfts(!showNfts)}
                            >
                                {showNfts ? "Hide Ordinals" : "Show Ordinals"}
                            </Button>
                        </div>

                        {loading ? (
                                <p>Loading...</p>
                            ) : ordinals.length > 0 ? (
                                (showNfts && 
                                <div className="wallet-nft ml-5">
                                    <h4 className="nft-title">Address Ordinals</h4>
                                    <div className="nft-image-wrapper">
                                    {ordinals.map((inscription: any) => (
                                        <div key={inscription.id} className="d-flex flex-column">
                                            <img
                                                className="nft-images mb-1"
                                                src={`https://ordinals.com/content/${inscription.id}`}
                                                alt="Ordinal"
                                            />
                                            <a
                                                className="mb-3"
                                                href={`https://ordinals.com/inscription/${inscription.id}`} 
                                                target="_blank"
                                            >
                                                See Ordinals Info
                                            </a>
                                        </div>
                                    ))}
                                    </div>
                                </div>
                                )
                            ) : (
                                <p>No Ordinals found for this address.</p>
                            )}

                        {/* <div className="balance-row alternative">
                            <div className="balance-info">
                                <div className="title">Staked Token</div>
                                <div className="description">Staked tokens are simila to hive power. The more tokens you stake, the more influnce you can have in rewarding other people's content</div>
                            </div>
                            <div className="balance-values">
                                <div className="amount">
                                    0.000 OrdsToken
                                </div>
                            </div>
                        </div> */}

                        <div className="p-transaction-list btc-trx">
                            <div className="transaction-list-header">
                                <h2>Bitcoin Wallet Transactions</h2>
                            </div>

                            {(() => {
                                if (loading) {
                                    return <LinearProgress />;
                                }
                                if (bitcoinTransactions.length === 0) {
                                    return <>No transaction found</>;
                                }
                                return (
                                    <div className="transaction-list-body">
                                        {bitcoinTransactions.map((tr: any, i) => (
                                            <TransactionRow history={history} tr={tr} key={i} i={i} />
                                        ))}
                                    </div>
                                );
                            })()}
                        </div>
                    </div>
                    <WalletMenu global={global} username={account.name} active="ecency" communityInfo={communityInfo} />
                </div>
            </div>
        </>
    );
}

export default (p: Props) => {
    const props = {
        global: p.global,
        myCommunity: p.myCommunity,
        dynamicProps: p.dynamicProps,
        history: p.history,
        activeUser: p.activeUser,
        account: p.account,
        points: p.points,
        signingKey: p.signingKey,
        transactions: p.transactions,
        fetchPoints: p.fetchPoints,
        updateWalletValues: p.updateWalletValues,
        addAccount: p.addAccount,
        updateActiveUser: p.updateActiveUser,
        setSigningKey: p.setSigningKey
    }
    return <WalletBtc {...props} />;
}
