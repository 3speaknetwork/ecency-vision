import React, { Component } from "react";

import { History, Location } from "history";

import { Link } from "react-router-dom";
import { match } from "react-router";
import isEqual from "react-fast-compare";

import { EntryFilter, Global } from "../../store/global/types";
import { Community } from "../../store/communities/types";

import ListStyleToggle from "../list-style-toggle/index";
import DropDown, { MenuItem } from "../dropdown";

import { _t } from "../../i18n";

import _c from "../../util/fix-class-names";

interface MatchParams {
  filter: string;
  name: string;
}

interface Props {
  history: History;
  location: Location;
  match: match<MatchParams>;
  global: Global;
  community: Community;
  toggleListStyle: (view: string | null) => void;
}

export class CommunityMenu extends Component<Props> {
  shouldComponentUpdate(nextProps: Readonly<Props>): boolean {
    return (
      !isEqual(this.props.location, nextProps.location) ||
      !isEqual(this.props.global, nextProps.global)
    );
  }

  render() {
    const { community, match, global } = this.props;
    const { filter, name } = match.params;
    
    const menuConfig: {
      history: History;
      label: string;
      items: MenuItem[];
    } = {
      history: this.props.history,
      label:
        (filter === EntryFilter.trending)
          ? "Community Posts"
          : _t(`entry-filter.filter-${filter}`), // Keep for other translations
      items: [
        ...(global.hive_id === "hive-125568"
          ? [
              ...([{ label: "5,000stats", value: EntryFilter.created }]),
              ...([{ label: "50,000stats", value: EntryFilter.sats50000 }]),
              ...([{ label: "500,000sat", value: EntryFilter.sats500000 }]),
              // ...([{ label: "0.5BTC", value: EntryFilter.trending }]),
              ...([{ label: "0.5BTC", value: EntryFilter.trending }]),
              ...( [{ label: "1BTC", value: EntryFilter.hot }]),
            ]
          : [
              { label: "Trending", value: EntryFilter.trending },
              { label: "Hot", value: EntryFilter.hot },
              { label: "Created", value: EntryFilter.created },
              { label: "Payout", value: EntryFilter.payout },
              { label: "Muted", value: EntryFilter.muted },
            ])
      ].map((item) => {
        return {
          label: item.label, // Custom label starting with numbers
          href: `/${item.value}/${community.name}`,
          active: filter === item.value,
        };
      }),
    };
    
    return (
      <div className="community-menu">
        <div className="menu-items">
          <>
            <span className="d-flex d-lg-none community-menu-item selected-item">
              <DropDown {...menuConfig} float="left" />
            </span>
            <div className="d-none d-lg-flex align-items-center">
              {menuConfig.items.map((menuItem) => (
                <Link
                  className={_c(
                    `community-menu-item ${
                      menuItem.active ? "selected-item" : ""
                    }`
                  )}
                  to={menuItem.href!}
                  key={`community-menu-item-${menuItem.label}`}
                >
                  {menuItem.label}
                </Link>
              ))}
            </div>
          </>

          <Link
            to={`/subscribers/${name}`}
            className={_c(
              `community-menu-item ${
                filter === "subscribers" ? "selected-item" : ""
              }`
            )}
          >
            {_t("community.subscribers")}
          </Link>
          <Link
            to={`/activities/${name}`}
            className={_c(
              `community-menu-item ${
                filter === "activities" ? "selected-item" : ""
              }`
            )}
          >
            {_t("community.activities")}
          </Link>
        </div>

        {EntryFilter[filter as EntryFilter] && (
          <div className="page-tools">
            <ListStyleToggle
              global={this.props.global}
              toggleListStyle={this.props.toggleListStyle}
            />
          </div>
        )}
      </div>
    );
  }
}

export default (p: Props) => {
  const props: Props = {
    history: p.history,
    location: p.location,
    match: p.match,
    global: p.global,
    community: p.community,
    toggleListStyle: p.toggleListStyle,
  };

  return <CommunityMenu {...props} />;
};
