import React, {Component} from "react";
import {History, Location} from "history";
import _ from 'lodash'

import {Global, ProfileFilter} from "../../store/global/types";
import {Account} from "../../store/accounts/types";
import {DynamicProps} from "../../store/dynamic-props/types";
import { Entries, Entry } from "../../store/entries/types";
import { Community, Communities } from "../../store/communities/types";
import { User } from "../../store/users/types";
import { ActiveUser } from "../../store/active-user/types";
import { Reblogs } from "../../store/reblogs/types";
import { UI, ToggleType } from "../../store/ui/types";

import EntryListItem from "../entry-list-item/index";
import { EntryPinTracker } from "../../store/entry-pin-tracker/types";
import MessageNoData from "../message-no-data";
import { _t } from "../../i18n";
import LinearProgress from "../linear-progress";
import { getFollowing } from "../../api/hive";
import isCommunity from "../../helper/is-community";
import axios from "axios";
import { getBlacklist } from "../../../server/util";
import { getBtcWalletBalance, getUserByUsername } from "../../api/breakaway";

interface Props {
  history: History;
  location: Location;
  global: Global;
  dynamicProps: DynamicProps;
  entries: Entry[];
  promotedEntries: Entry[];
  communities: Communities;
  community?: Community | null;
  users: User[];
  activeUser: ActiveUser | null;
  reblogs: Reblogs;
  loading: boolean;
  ui: UI;
  entryPinTracker: EntryPinTracker;
  signingKey: string;
  addAccount: (data: Account) => void;
  updateEntry: (entry: Entry) => void;
  setActiveUser: (username: string | null) => void;
  updateActiveUser: (data?: Account) => void;
  deleteUser: (username: string) => void;
  fetchReblogs: () => void;
  addReblog: (author: string, permlink: string) => void;
  deleteReblog: (author: string, permlink: string) => void;
  toggleUIProp: (what: ToggleType) => void;
  addCommunity: (data: Community) => void;
  trackEntryPin: (entry: Entry) => void;
  setSigningKey: (key: string) => void;
  setEntryPin: (entry: Entry, pin: boolean) => void;
}

interface State {
  mutedUsers: string[];
  blacklist: string[];
  loadingMutedUsers: boolean;
  btcBalances: { [author: string]: number | undefined };
}

export class ObtcListContent extends Component<Props, State> {
  state = {
    mutedUsers: [] as string[],
    loadingMutedUsers: false,
    blacklist: [] as string[],
    btcBalances: {} as any,
    
  };

  fetchMutedUsers = () => {
    const { activeUser } = this.props;
    const { loadingMutedUsers } = this.state;
    if (!loadingMutedUsers) {
      if (activeUser) {
        this.setState({ loadingMutedUsers: true });
        getFollowing(activeUser.username, "", "ignore", 100)
          .then((r) => {
            if (r) {
              let filterList = r.map((user) => user.following);
              this.setState({ mutedUsers: filterList });
            }
          })
          .finally(() => {
            this.setState({ loadingMutedUsers: false });
          });
      }
    }
  };

  fetchBlacklist = () => {
    getBlacklist().then((response) => {
      this.setState({ ...this.state, blacklist: response });
    });
  };

  componentDidUpdate(prevProps: Props) {
    if (prevProps.activeUser?.username !== this.props.activeUser?.username) {
      this.fetchMutedUsers();
    }
    if (
      prevProps.activeUser !== this.props.activeUser &&
      !this.props.activeUser
    ) {
      this.setState({ mutedUsers: [] });
    }
  }

  componentDidMount() {
    this.fetchMutedUsers();
    this.fetchBlacklist();
  }

  fetchBtcBalances = async () => {
    const { entries } = this.props;
    const btcBalances: { [author: string]: number | undefined } = {};

    for (const entry of entries) {
      const user = await getUserByUsername(entry.author);
      console.log(user)
      const btcAddress = user?.bacUser?.bitcoinAddress;
      console.log("object", btcAddress)

      if (btcAddress) {
        const balance = await getBtcWalletBalance(btcAddress);
        console.log("object...bal...", btcAddress, balance)
        btcBalances[entry.author] = balance?.balance;
      }
    }

    this.setState({ btcBalances });
  };

  render() {
    const { entries, promotedEntries, global, activeUser, loading } =
      this.props;
    const { filter, tag } = global;
    const { mutedUsers, loadingMutedUsers, blacklist, btcBalances } = this.state;

    const THRESHOLDS: any = {
      created: 0.00005,
      sats50000: 0.0005,
      sats500000: 0.005,
      trending: 0.5,
      hot: 1,
    };

    const filteredEntries = entries.filter((entry) => {
      const btcBalance: any = btcBalances[entry.author];
      const threshold = THRESHOLDS[global.filter];
      return btcBalance !== undefined && btcBalance >= threshold && !blacklist.includes(entry.author);
    });

    const dataToRender = entries.filter((entry) =>
      !entry.community
        ? true
        : !blacklist.includes(entry.author) &&
        (entry.community === global.hive_id ||
          (entry?.json_metadata?.tags &&
            Array.isArray(entry.json_metadata.tags) &&
            entry.json_metadata.tags.some((tag) => global.tags.includes(tag))))
  );

    let mutedList: string[] = [];
    if (
      mutedUsers &&
      mutedUsers.length > 0 &&
      activeUser &&
      activeUser.username
    ) {
      mutedList = mutedList.concat(mutedUsers);
    }
    const isMyProfile =
      activeUser &&
      tag.includes("@") &&
      activeUser.username === tag.replace("@", "");
    return (
      <>
      {global.hive_id === "hive-125568" && <>
        {filteredEntries.length > 0 ? (
          filteredEntries.map((entry, index) => (
            <EntryListItem
              key={`${entry.author}-${entry.permlink}`}
              {...this.props}
              entry={entry}
              order={index}
            />
          ))
        ) : (
          <MessageNoData
            title={_t("g.no-matches")}
            description={_t("g.no-matches")}
            global={global}
            buttonTo={""}
            buttonText={""}
          />
        )}
      </>}
      </>
    );
  }
}

export default (p: Props) => {
    const props: Props = {
        history: p.history,
        location: p.location,
        global: p.global,
        dynamicProps: p.dynamicProps,
        entries: p.entries,
        promotedEntries: p.promotedEntries,
        communities: p.communities,
        community: p.community,
        users: p.users,
        activeUser: p.activeUser,
        reblogs: p.reblogs,
        ui: p.ui,
        entryPinTracker: p.entryPinTracker,
        signingKey: p.signingKey,
        addAccount: p.addAccount,
        updateEntry: p.updateEntry,
        setActiveUser: p.setActiveUser,
        updateActiveUser: p.updateActiveUser,
        deleteUser: p.deleteUser,
        fetchReblogs: p.fetchReblogs,
        addReblog: p.addReblog,
        deleteReblog: p.deleteReblog,
        toggleUIProp: p.toggleUIProp,
        addCommunity: p.addCommunity,
        trackEntryPin: p.trackEntryPin,
        setSigningKey: p.setSigningKey,
        setEntryPin: p.setEntryPin,
        loading: p.loading
    }

    return <ObtcListContent {...props} />;
}
