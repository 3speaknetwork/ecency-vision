import React, {useEffect, useState, useCallback} from "react";

import {History} from "history";

import {Link} from "react-router-dom";

import moment from "moment";
import { RCAccount } from "@hiveio/dhive/lib/chain/rc";

import {Global} from "../../store/global/types";
import {Account, FullAccount} from "../../store/accounts/types";
import {ActiveUser} from "../../store/active-user/types";

import UserAvatar from "../user-avatar";
import Tooltip from "../tooltip";
import {Followers, Following} from "../friends";

import accountReputation from "../../helper/account-reputation";

import formattedNumber from "../../util/formatted-number";

import defaults from "../../constants/defaults.json";

import {votingPower, findRcAccounts, rcPower} from "../../api/hive";

import {_t} from "../../i18n";

import {
    formatListBulledttedSvg,
    accountMultipleSvg,
    accountPlusSvg,
    nearMeSvg,
    earthSvg,
    calendarRangeSvg,
    rssSvg,
} from "../../img/svg";

import { EditPic } from '../community-card';
import { getRelationshipBetweenAccounts } from "../../api/bridge";
import { Skeleton } from "../skeleton";
import { ResourceCreditsInfo } from "../resource-credits";
import { getBtcWalletBalance, getUserByUsername } from "../../api/breakaway";

interface Props {
    global: Global;
    history: History;
    activeUser: ActiveUser | any;
    account: Account;
    section?: string;
    addAccount: (data: Account) => void;
    updateActiveUser: (data?: Account) => void;
}

interface State {
    followersList: boolean;
    followingList: boolean;
    followsActiveUser: boolean;
    followsActiveUserLoading: boolean;
}

export const ProfileCard = (props: Props) => {
    const [followersList, setFollowersList] = useState(false);
    const [followingList, setFollowingList] = useState(false);
    const [followsActiveUser, setFollowsActiveUser] = useState(false);
    const [isMounted, setIsmounted] = useState(false);
    const [followsActiveUserLoading, setFollowsActiveUserLoading] = useState(false);
    const [rcPercent, setRcPercent] = useState(100);
    const [jsonMetaData, setJsonMetaData] = useState<any>(null)
    const [btcBalance, setBtcBalance] = useState<any>(0.000)
    
    const [, updateState] = useState();
    const forceUpdate = useCallback(() => updateState({} as any), []);

    const {activeUser, account, section, global} = props;

    useEffect(() => {
        if(activeUser && activeUser.username){
            setFollowsActiveUserLoading(activeUser && activeUser.username ? true : false);
            getFollowsInfo(account.name);
        }

        findRcAccounts(account?.name)
      .then((r: RCAccount[]) => {
        if (r && r[0]) {
          setRcPercent(rcPower(r[0]));
        }
      })
      .catch((e) => {
        setRcPercent(100);
      });
    }, 
    [account]);

    useEffect(()=>{
        getBtcBal()
        setIsmounted(true);
        return () => setIsmounted(false)
    },[])

    useEffect(() => {
        setFollowersList(false);
        setFollowingList(false);
        setFollowsActiveUserLoading(activeUser && activeUser.username ? true : false);
        isMounted && getFollowsInfo(account.name);
    }, [account.name]);

    useEffect(() => {
        console.log(global)
        const getMetaData = () => {
            try {
                const metaData = JSON.parse(activeUser?.data?.posting_json_metadata);
                setJsonMetaData(metaData)
            } catch (error) {
                console.log(error)
            }
        }
        getMetaData()
    }, [account])

    const getFollowsInfo = (username: string) => {
        if(activeUser){
            getRelationshipBetweenAccounts(username, activeUser.username).then(res=>{
                setFollowsActiveUserLoading(false);
                setFollowsActiveUser(res?.follows || false);
            }).catch((error) => {
                setFollowsActiveUserLoading(false);
                setFollowsActiveUser(false);
            });
        }
    }

    const toggleFollowers = () => {
        setFollowersList(!followersList);
    };

    const toggleFollowing = () => {
        setFollowingList(!followingList);
    };

    const getBtcBal = async () => {
        const { activeUser }  = props
        try {
          const baUser = await getUserByUsername(activeUser!.username)
      
            console.log(baUser)
          let btcAddress;
            if(baUser?.bacUser?.bitcoinAddress) {
              btcAddress = baUser?.bacUser?.bitcoinAddress
              const addressBalance = await getBtcWalletBalance(baUser?.bacUser?.bitcoinAddress);
              setBtcBalance(btcBalance?.balance)
             
              console.log(addressBalance)
            }
        } catch (error) {
          console.log(error)
        }
      }

    const loggedIn = activeUser && activeUser.username;
    
    if (!account.__loaded) {
        return <div className="profile-card">
            <div className="profile-avatar">
                {UserAvatar({...props, username: account.name, size: "xLarge"})}
            </div>

            <h1>
                <div className="username">{account.name}</div>
            </h1>
        </div>
    }

    const formatString = (str: string) => str?.length <= 20 ? str : str?.slice(0, 10) + "..." + str?.slice(-10);

    const vPower = votingPower(account);

    const isMyProfile = activeUser && activeUser.username === account.name && activeUser.data.__loaded && activeUser.data.profile;
    const isSettings = section === 'settings';

    return (
        <div className="profile-card">
            <div className="profile-avatar">
                {UserAvatar({...props, username: account.name, size: "xLarge", src: account.profile?.profile_image})}
                {isMyProfile && isSettings &&
                    <EditPic 
                        {...props} 
                        account={account as FullAccount} 
                        activeUser={activeUser!} 
                        onUpdate={() => {
                            forceUpdate();
                        }} 
                    />
                }
                {account.__loaded && <div className="reputation">{accountReputation(account.reputation!)}</div>}
                {account.__loaded && <div className="btc-reputation">{btcBalance?.toFixed(2)}</div>}
            </div>

            <h1>
                <div className="username">{account.name}</div>
            </h1>

            <div>
                <ResourceCreditsInfo {...props} rcPercent={rcPercent} account={account} />
            </div>

            { (global?.communityTitle === "Bitcoin Machines" && global?.hive_id === "hive-159314") && 
            <div className="btc-profile">
                <h5>BTC ordinal info</h5>
                <div className="btc-info">
                    <span>Address:</span>
                    <span className="b-info">{formatString(jsonMetaData?.bitcoin.address)}</span>
                </div>
                <div className="btc-info">
                    <span>Message:</span>
                    <span className="b-info">{jsonMetaData?.bitcoin.message}</span>
                </div>
                <div className="btc-info">
                    <span>Signature:</span>
                    <span className="b-info">{formatString(jsonMetaData?.bitcoin.signature)}</span>
                </div>
            </div> }

            {loggedIn && !isMyProfile && 
            <div className="d-flex justify-content-center mb-3 d-md-block">
                {followsActiveUserLoading ? <Skeleton className="loading-follows-you" /> : followsActiveUser ? 
                <div className="follow-pill d-inline text-lowercase">{_t("profile.follows-you")}</div> : null}
            </div>}

            {(account.profile?.name || account.profile?.about) && (
                <div className="basic-info">
                    {account.profile?.name && <div className="full-name">{account.profile.name}</div>}
                    {account.profile?.about && <div className="about">{account.profile.about}</div>}
                </div>
            )}

            {account.__loaded && (
                <div className="stats">
                    {account.follow_stats?.follower_count !== undefined && (
                        <div className="stat followers">
                            <Tooltip content={_t("profile.followers")}>
                                <span onClick={toggleFollowers}>
                                    {formattedNumber(account.follow_stats.follower_count, {fractionDigits: 0})} {_t("profile.followers")}
                                </span>
                            </Tooltip>
                        </div>
                    )}

                    {account.follow_stats?.following_count !== undefined && (
                        <div className="stat following">
                            <Tooltip content={_t("profile.following")}>
                                <span onClick={toggleFollowing}>
                                    {formattedNumber(account.follow_stats.following_count, {fractionDigits: 0})} {_t("profile.following")}
                                </span>
                            </Tooltip>
                        </div>
                    )}
                </div>
            )}

            <div className="extra-props">
                {account.profile?.location && (
                    <div className="prop">
                        {nearMeSvg} {account.profile.location}
                    </div>
                )}

                {account.profile?.website && (
                    <div className="prop">
                        {earthSvg}
                        <a target="_external" className="website-link" href={`https://${account.profile.website.replace(/^(https?|ftp):\/\//,"")}`}>
                            {account.profile.website}
                        </a>
                    </div>
                )}

                {account.created && (
                    <div className="prop">
                        {calendarRangeSvg} {moment(new Date(account.created)).format("LL")}
                    </div>
                )}

                <div className="prop">
                    {rssSvg}
                    <a target="_external" href={`${defaults.base}/@${account.name}/rss.xml`}>
                        RSS feed
                    </a>
                </div>
            </div>

            {isMyProfile && (
                <div className="btn-controls">
                    <Link className="btn btn-sm btn-primary" to="/witnesses">{_t("profile.witnesses")}</Link>
                    <Link className="btn btn-sm btn-primary" to="/proposals">{_t("profile.proposals")}</Link>
                </div>
            )}

            {followersList && <Followers {...props} account={account} onHide={toggleFollowers}/>}
            {followingList && <Following {...props} account={account} onHide={toggleFollowing}/>}
        </div>
    );
}

export default (p: Props) => {
    const props: Props = {
        global: p.global,
        history: p.history,
        activeUser: p.activeUser,
        account: p.account,
        section: p.section,
        addAccount: p.addAccount,
        updateActiveUser: p.updateActiveUser
    }

    return <ProfileCard {...props} />;
}

