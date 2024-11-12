import React, { useState } from 'react'
import { Button } from 'react-bootstrap';
import { success } from '../feedback';
import clipboard from '../../util/clipboard';
import QRCode from 'react-qr-code';
import { downloadSvg } from '../../img/svg';
import { createFreeAccount, getAccountKeys } from '../../api/breakaway';
import { _t } from '../../i18n';
import { Link } from 'react-router-dom';

export const FreeAccount = (props: any) => {
    const { 
        activeUser, 
        username
    } = props;

    const [keys, setKeys] = useState<any>(null)
    const [isDownloaded, setIsDownloaded] = useState<any>(false);
    const [message, setMessage] = useState("");
    const [step, setStep] = useState(1)

    const createAccount = async () => {
        try {
            console.log(username)
            const response = await createFreeAccount(username, keys)
            console.log(response)
            if(response.success) {
                setStep(2)
                setMessage(response.message)
            }
        } catch (error) {
            console.log(error)
        }
    }
    const getKeys = async () => {
        try {
            console.log(username)
            const response = await getAccountKeys(username)
            console.log(response)
            if(response.success) {
                setKeys(response.accountDetails)
            }
        } catch (error) {
            console.log(error)
        }
    }

    const downloadKeys = async () => {
        console.log("downloading.....")
        if (keys) {
          setIsDownloaded(false);
          const element = document.createElement("a");
          const keysToFile = `
              ${_t("onboard.file-warning")}
      
              ${_t("onboard.recommend")}
              1. ${_t("onboard.recommend-print")}
              2. ${_t("onboard.recommend-use")}
              3. ${_t("onboard.recommend-save")}
              4. ${_t("onboard.recommend-third-party")}
    
              ${_t("onboard.account-info")}
    
              Username: ${username}
    
              Password: ${keys?.masterPassword}
    
              ${_t("onboard.owner-private")} ${keys.owner}
      
              ${_t("onboard.active-private")} ${keys.active}
      
              ${_t("onboard.posting-private")} ${keys.posting}
      
              ${_t("onboard.memo-private")} ${keys.memo}
      
      
              ${_t("onboard.keys-use")}
              ${_t("onboard.owner")} ${_t("onboard.owner-use")}   
              ${_t("onboard.active")} ${_t("onboard.active-use")}  
              ${_t("onboard.posting")} ${_t("onboard.posting-use")} 
              ${_t("onboard.memo")} ${_t("onboard.memo-use")}`;
    
          const file = new Blob([keysToFile.replace(/\n/g, "\r\n")], {
            type: "text/plain",
          });
          element.href = URL.createObjectURL(file);
          element.download = `${username}_hive_keys.txt`;
          document.body.appendChild(element);
          element.click();
          setIsDownloaded(true);
        }
      };

  return (
        <>
            <div className="success-wrapper">
                {step === 1 ? <>
                    {!keys && <div className='d-flex flex-column'>
                        <h2>Create a free Hive account</h2>
                        <p>Click below to get your keys</p>
                        <Button onClick={getKeys}>Get account keys</Button>
                    </div >}
                    {keys && (<div className="success-info">
                        <h3>Creation steps</h3>
                        {!activeUser && <>
                        <strong style={{textAlign: "center"}}>
                            Please make sure you have keychain installed as an
                            extension on your browser (If you are a using the web
                            browser, we recommend that you pin it to your browser.)
                        </strong>
                        <div className="keychain-ext">
                            <p>Download the Hive Keychain extension for your preferred device:</p>
                            <ul className="ul">
                            <li className="kc-list">
                                <img className="a-c" src="https://hive-keychain.com/img/browsers/android.svg" alt="" />
                                <a
                                href="https://play.google.com/store/apps/details?id=com.mobilekeychain"
                                target="_blank"
                                rel="noopener noreferrer"
                                >
                                Android
                                </a>
                            </li>
                            <li className="kc-list">
                                <img className="a-c" src="https://hive-keychain.com/img/browsers/ios.svg" alt="" />
                                <a
                                href="https://apps.apple.com/us/app/hive-keychain/id1552190010"
                                target="_blank"
                                rel="noopener noreferrer"
                                >
                                Apple
                                </a>
                            </li>
                            <li className="kc-list">
                                <img src="https://hive-keychain.com/img/browsers/chrome.svg" alt="" />
                                <a
                                href="https://chrome.google.com/webstore/detail/hive-keychain/jcacnejopjdphbnjgfaaobbfafkihpep?hl=en"
                                target="_blank"
                                rel="noopener noreferrer"
                                >
                                Chrome
                                </a>
                            </li>
                            <li className="kc-list">
                                <img src="https://hive-keychain.com/img/browsers/firefox.svg" alt="" />
                                <a
                                href="https://addons.mozilla.org/en-US/firefox/addon/hive-keychain/"
                                target="_blank"
                                rel="noopener noreferrer"
                                >
                                Mozilla
                                </a>
                            </li>
                            <li className="kc-list">
                                <img src="https://hive-keychain.com/img/browsers/brave.svg" alt="" />
                                <a
                                href="https://chrome.google.com/webstore/detail/hive-keychain/jcacnejopjdphbnjgfaaobbfafkihpep?hl=en"
                                target="_blank"
                                rel="noopener noreferrer"
                                >
                                Brave
                                </a>
                            </li>
                            </ul>
                        </div>
                        </>}
                        <div className="account-details">
                        <span style={{ lineHeight: 2 }}>
                            {_t("onboard.username")} <strong>{username}</strong>
                        </span>
                        </div>
                        <div className="account-link">
                            <h3>Step 1</h3>
                                <p>Owner: {keys?.owner}</p>
                                <p>Posting: {keys?.posting}</p>
                                <p>Memo: {keys?.memo}</p>
                                <p>Active: {keys?.active}</p>
                            <span>Download your account keys</span>
                            <Button className="mt-3" onClick={() => downloadKeys()}>
                                {_t("onboard.download-keys")} {downloadSvg}
                            </Button>
                        </div>
                        {isDownloaded && <div>
                            <Button className="mt-3" onClick={createAccount}>
                                Create account
                            </Button>
                        </div>}
                    </div>)}
                </> : <div className='d-flex flex-column align-items-center'>
                <h1>{message}</h1>
                <Link to="/">
                    <Button>Finish</Button>
                </Link>
                </div>}
            </div>
        </>
  )
}
