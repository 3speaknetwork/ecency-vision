import { DeckModel } from '../../store/deck/types';
import React, { useEffect, useState } from 'react';
import { Button, Card, OverlayTrigger, Tooltip } from 'react-bootstrap';
import { _t } from '../../i18n';
import Accordion from 'react-bootstrap/Accordion';
import {
  chevronDownSvgForSlider,
  chevronUpSvgForSlider,
  deleteForeverSvg,
  hot,
  refreshSvg
} from '../../img/svg';
import { DeckHeaderSettings } from './deck-header-settings';

export interface DeckHeaderProps {
  title: DeckModel['header']['title'];
  icon: DeckModel['header']['icon'];
  updateIntervalMs: DeckModel['header']['updateIntervalMs'];
  reloading?: DeckModel['header']['reloading'];
  index: number;
  onRemove: (option: string) => void;
  onReloadColumn: (option: string) => void;
  setDeckUpdateInterval: Function;
  account: string;
}

export const DeckHeader = ({
  title,
  icon,
  updateIntervalMs,
  index,
  onRemove,
  onReloadColumn,
  reloading,
  setDeckUpdateInterval,
  account,
}: DeckHeaderProps) => {
  const [expanded, setExpanded] = useState(false);
  let splittedTitle = title.split("@");
  let onlyTitle = splittedTitle[0];
  let username = splittedTitle[1];
  let tooltip = (
    <Tooltip id="profile-tooltip" style={{ zIndex: 10 }}>
      {_t("decks.header-info")}
    </Tooltip>
  );
  let updateDataInterval: any;

  useEffect(() => {
    if (updateDataInterval) {
      clearInterval(updateDataInterval);
    }
    updateDataInterval = setInterval(() => onReloadColumn(title), updateIntervalMs);
    return () => {
      clearInterval(updateIntervalMs);
    }
  }, [updateIntervalMs]);

  return (
    <Accordion className={expanded ? "border-bottom" : ""}>
      <div className="d-flex flex-column border-bottom">
        <div className="d-flex justify-content-between align-items-center deck-header position-relative">
          <div className="d-flex align-items-center">
            <div className="deck-index">{index}</div>
            <div className="d-flex align-items-center ml-3">
              <div className="icon mr-2">{icon || hot}</div>
              <div className="header-title">{onlyTitle}</div>
              {username && (
                <div className="ml-1">
                  <small className="text-lowercase text-secondary">
                    @{username.toLowerCase()}
                  </small>
                </div>
              )}
            </div>
          </div>
          <OverlayTrigger placement="bottom" overlay={tooltip}>
            <Accordion.Toggle
              as={Button}
              variant="link"
              eventKey="0"
              className="p-0"
            >
              <div
                className={`pointer`}
                onClick={() => {
                  setExpanded(!expanded);
                }}
              >
                <span>
                  {expanded ? chevronUpSvgForSlider : chevronDownSvgForSlider}
                </span>
              </div>
            </Accordion.Toggle>
          </OverlayTrigger>
        </div>
      </div>
      <Accordion.Collapse eventKey="0">
        <Card.Body className="p-0">
          <DeckHeaderSettings
            updateInterval={updateIntervalMs}
            title={title}
            username={account}
            setDeckUpdateInterval={setDeckUpdateInterval}
          />
          <div className="d-flex justify-content-end p-2 border-bottom">
            <Button
              variant="link"
              size="sm"
              className="d-flex align-items-center"
              onClick={() => onReloadColumn(title)}
              disabled={reloading}
            >
              {reloading ? (
                <div
                  className="spinner-border spinner-border-sm text-secondary"
                  role="status"
                >
                  <span className="sr-only">{_t("g.loading")}</span>
                </div>
              ) : (
                <div className="deck-options-icon d-flex">{refreshSvg}</div>
              )}
            </Button>
            <Button
              size="sm"
              className="d-flex align-items-center text-danger pr-0"
              variant="link"
              onClick={() => onRemove(title)}
            >
              <div className="deck-options-icon d-flex">{deleteForeverSvg}</div>
            </Button>
          </div>
        </Card.Body>
      </Accordion.Collapse>
    </Accordion>
  );
};