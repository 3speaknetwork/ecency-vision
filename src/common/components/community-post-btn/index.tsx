import React, {Component} from "react";

import {History} from "history";

import {Button} from "react-bootstrap";

import {Community} from "../../store/communities/types";

import {_t} from "../../i18n";
import { ActiveUser } from "../../store/active-user/types";
import { Global } from "../../store/global/types";
import { getBtcWalletBalance, getUserByUsername } from "../../api/breakaway";
import { error } from "../feedback";

interface Props {
    history: History;
    community: Community;
    activeUser?: ActiveUser | any;
    global?: Global | any;
}

export class CommunityPostBtn extends Component<Props> {

    openSubmitPage = async () => {
        const { community, activeUser, history }  = this.props
        try {
          ////MIGHT NOT BE NEEDED IF WE ARE CHECKING BTC BALANCE ON LOGIN
          if((this.props.global!.hive_id === "hive-125568" || this.props.global!.hive_id === "hive-159314" )) {
              const baUser = await getUserByUsername(activeUser!.username)
          
              let btcAddress;
      
              if(baUser?.bacUser?.bitcoinAddress) {
                btcAddress = baUser?.bacUser?.bitcoinAddress
                const addressBalance = await getBtcWalletBalance(baUser?.bacUser?.bitcoinAddress);
                if(addressBalance.balance < 0.00005) {
                  error("You must have at least 0.00005 btc to create a post");
                  return;
                } else {
                history.push(`/submit?com=${community.name}`);
                }
        
              } else {
                error("Sorry, you have no bitcoin profile");
                return
              }
      
            } else {
                history.push(`/submit?com=${community.name}`);
            }
        } catch (error) {
          console.log(error)
        }
      }

    clicked = () => {
        const {community, history} = this.props;

        history.push(`/submit?com=${community.name}`);
    }

    render() {
        return <Button onClick={this.openSubmitPage}>{_t("community.post")}</Button>
    }
}

export default (p: Props) => {
    const props: Props = {
        history: p.history,
        community: p.community,
        activeUser: p.activeUser,
        global: p.global,
    }

    return <CommunityPostBtn {...props} />
}
