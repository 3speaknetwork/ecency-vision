import React, { Component } from "react";
import { History } from "history";

import isEqual from "react-fast-compare";

import { State as GlobalState } from "../../store/global/types";

import { getCommunity } from "../../api/bridge";

export const makePath = (filter: string, tag: string): string => {
  return `/${filter}/${tag}`;
};

interface Props {
  global: GlobalState;
  history: History;
  tag: string;
  children: JSX.Element;
}

interface State {
  i: number;
}

const cache = {};

export default class TagLink extends Component<Props, State> {
  state: State = {
    i: 0,
  };

  shouldComponentUpdate(nextProps: Readonly<Props>, nextState: Readonly<State>, nextContext: any): boolean {
    return !isEqual(this.props.children, nextProps.children) || !isEqual(this.state, nextState);
  }

  componentDidMount(): void {
    const { tag } = this.props;

    if (tag.startsWith("hive-")) {
      if (cache[tag] === undefined) {
        getCommunity(tag).then((c) => {
          if (c) {
            cache[tag] = c.title;
            this.setState({ i: Date.now() }); // trigger render
          }
        });
      }
    }
  }

  clicked = (e: React.MouseEvent<HTMLElement>) => {
    e.preventDefault();

    const { tag, global, history } = this.props;
    const { filter } = global;

    const newLoc = makePath(filter, tag);

    history.push(newLoc);
  };

  render() {
    const { children, global, tag } = this.props;

    const { filter } = global;

    const href = makePath(filter, tag);

    const props = Object.assign({}, children.props, { href, onClick: this.clicked });

    if (cache[tag]) {
      props.children = cache[tag];
    }

    return React.createElement("a", props);
  }
}
