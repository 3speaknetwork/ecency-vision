import React, { useState } from 'react'
import { Button } from 'react-bootstrap';
import { success } from '../feedback';
import clipboard from '../../util/clipboard';
import QRCode from 'react-qr-code';
import { downloadSvg } from '../../img/svg';
import { _t } from '../../i18n';

export const OnboardUser = (props: any) => {
    const { 
        newUserKeys, 
        step, 
        isDownloaded, 
        activeUser, 
        global, 
        downloadKeys, 
        formatString, 
        history,
        urlHash,
        accountPassword,
        username
    } = props;

  return (
    <>
      {newUserKeys && (
                  <div className="success-wrapper">
                    <div className="success-info">
                      <h3>Account creation steps</h3>
                      {!activeUser && <>
                        <strong style={{textAlign: "center"}}>
                            Please make sure you have keychain installed as an
                            extension on your browser (If you are a using the web
                            browser, we recommend that you pin it to your browser.)
                        </strong>
                        {/* <h3> */}
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
                        {/* </h3> */}
                      </>}
                      <div className="account-details">
                        <span style={{ lineHeight: 2 }}>
                          {_t("onboard.username")} <strong>{username}</strong>
                        </span>
                      </div>
                      <div className="account-link">
                        <h3>Step 1</h3>
                        <span>Download your keys to continue</span>
                        <Button className="mt-3" onClick={() => downloadKeys()}>
                          {_t("onboard.download-keys")} {downloadSvg}
                        </Button>
                      </div>
                      {isDownloaded && (
                        <div className="account-link">
                          <h3>Step 2</h3>
                          {!activeUser && (
                            <h5 className="text-danger">
                              {_t("onboard.copy-info-message")}
                            </h5>
                          )}
                          {activeUser && (
                            <h5 className="text-danger">
                              Click or scan QR code
                            </h5>
                          )}
                          <div className="link-wrap">
                            <div
                              onClick={() => {
                                if(!activeUser) {
                                  clipboard(
                                    `${window.origin}/onboard-friend/${urlHash}`
                                  );
                                  success(_t("onboard.copy-link"));
                                } else {
                                  history.push(`/onboard-friend/${urlHash}`)
                                }
                              }}
                              style={{
                                background: "white",
                                padding: "16px",
                                cursor: "pointer",
                              }}
                            >
                              <QRCode
                                size={256}
                                style={{
                                  height: "auto",
                                  maxWidth: "100%",
                                  width: "100%",
                                }}
                                value={`${window.origin}/onboard-friend/${urlHash}`}
                                viewBox={`0 0 256 256`}
                              />
                            </div>
                          </div>
                          <div className="account-password">
                            <div className="d-flex flex-column align-items-center mb-5">
                              <h3 className="mt-2">Step 3</h3>
                             {!activeUser && <h4 style={{textAlign: "center"}}>
                                Confirm if your friend has created your account,
                                then check your email for instructions on setting
                                up your account
                              </h4>}
                              {(global.isMobile && !activeUser) ? 
                                <h4 className="text-danger" style={{textAlign: "center"}}>
                                    Click the button below to copy your master password and paste to
                                    keychain to set up your account
                                </h4> : 
                                <h4 className="text-danger" style={{textAlign: "center"}}>
                                    Click the button below to copy your master password
                                </h4>
                                }
                              <Button
                                style={{textAlign: "center"}}
                                className="d-flex flex-column align-items-center mt-3 p-3"
                                onClick={() => {
                                  clipboard(accountPassword);
                                  success(_t("onboard.key-copied"));
                                }}
                                >
                                {(!global.isMobile && !activeUser) ? 
                                    <h4 className="text-danger">
                                    Click to copy your master password below and paste to
                                    keychain to set up your account
                                    </h4> :
                                    <h4 className="text-danger">
                                        Click to copy your master password below 
                                    </h4>
                                }
                                <div className="password">
                                  {global.isMobile ? 
                                  <strong>{formatString(accountPassword)}</strong> :
                                  <strong>{accountPassword}</strong>
                                }
                                </div>
                              </Button>
                            </div>
                          </div>
                        </div>
                      )}
                    </div>
                  </div>
                )}
    </>
  )
}

