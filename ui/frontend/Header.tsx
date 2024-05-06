import { useSDK } from '@metamask/sdk-react';
import { Buffer } from 'buffer';
import { MD5 } from 'crypto-js';
import React, { RefObject, useCallback, useEffect, useRef } from 'react';

import AdvancedOptionsMenu from './AdvancedOptionsMenu';
import BuildMenu from './BuildMenu';
import { ButtonSet, IconButton, IconLink, Button as OneButton, Rule } from './ButtonSet';
import ChannelMenu from './ChannelMenu';
import ConfigMenu from './ConfigMenu';
import {
  BuildIcon,
  ConfigIcon,
  ExpandableIcon,
  HelpIcon,
  MoreOptionsActiveIcon,
  MoreOptionsIcon,
} from './Icon';
import ModeMenu from './ModeMenu';
import PopButton, { ButtonProps } from './PopButton';
import ToolsMenu from './ToolsMenu';
import * as actions from './actions';
import { jsonPost, routes } from './api';
import { useAppDispatch, useAppSelector } from './hooks';
import { setAccount } from './reducers/metamask';
import { performGistSave } from './reducers/output/gist';
import { navigateToHelp } from './reducers/page';
import * as selectors from './selectors';

import styles from './Header.module.css';

const Header: React.FC = () => {
  const menuContainer = useRef<HTMLDivElement | null>(null);

  return (
    <>
      <div data-test-id="header" className={styles.container}>
        <div className={styles.left}>
          <ButtonSet>
            <ExecuteButton />
            {/* <BuildMenuButton menuContainer={menuContainer} /> */}
          </ButtonSet>

          <ButtonSet>
            <ModeMenuButton menuContainer={menuContainer} />
            <Rule />
            <ChannelMenuButton menuContainer={menuContainer} />
            <Rule />
            <AdvancedOptionsMenuButton menuContainer={menuContainer} />
          </ButtonSet>
          <ButtonSet>
            <ConnectMetamaskButton />
          </ButtonSet>
          <ButtonSet>
            <UploadToNodeButton />
          </ButtonSet>
        </div>

        <div className={styles.right}>
          <ButtonSet>
            <ShareButton />
          </ButtonSet>

          <ButtonSet>
            <ToolsMenuButton menuContainer={menuContainer} />
          </ButtonSet>

          <ButtonSet>
            <ConfigMenuButton menuContainer={menuContainer} />
          </ButtonSet>

          <ButtonSet>
            <HelpButton />
          </ButtonSet>
        </div>
      </div>

      <div ref={menuContainer} />
    </>
  );
};

interface PortalProps {
  menuContainer: RefObject<HTMLDivElement>;
}

const ExecuteButton: React.FC = () => {
  const executionLabel = useAppSelector(selectors.getExecutionLabel);

  const dispatch = useAppDispatch();
  const execute = useCallback(() => dispatch(actions.performPrimaryAction()), [dispatch]);

  return (
    <OneButton isPrimary type="button" onClick={execute} iconRight={BuildIcon}>
      {executionLabel}
    </OneButton>
  );
};

const BuildMenuButton: React.FC<PortalProps> = ({ menuContainer }) => {
  const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(({ toggle }, ref) => (
    <IconButton type="button" title="Select what to build" ref={ref} onClick={toggle}>
      <MoreOptionsIcon />
    </IconButton>
  ));
  Button.displayName = 'BuildMenuButton.Button';

  return <PopButton Button={Button} Menu={BuildMenu} menuContainer={menuContainer} />;
};

const ModeMenuButton: React.FC<PortalProps> = ({ menuContainer }) => {
  const label = useAppSelector(selectors.getModeLabel);

  const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(({ toggle }, ref) => (
    <OneButton
      type="button"
      title="Mode &mdash; Choose the optimization level"
      ref={ref}
      onClick={toggle}
      iconRight={ExpandableIcon}
    >
      {label}
    </OneButton>
  ));
  Button.displayName = 'ModeMenuButton.Button';

  return <PopButton Button={Button} Menu={ModeMenu} menuContainer={menuContainer} />;
};

const ChannelMenuButton: React.FC<PortalProps> = ({ menuContainer }) => {
  const label = useAppSelector(selectors.getChannelLabel);

  const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(({ toggle }, ref) => (
    <OneButton
      type="button"
      title="Channel &mdash; Choose the Rust version"
      ref={ref}
      onClick={toggle}
      iconRight={ExpandableIcon}
    >
      {label}
    </OneButton>
  ));
  Button.displayName = 'ChannelMenuButton.Button';

  return <PopButton Button={Button} Menu={ChannelMenu} menuContainer={menuContainer} />;
};

const AdvancedOptionsMenuButton: React.FC<PortalProps> = ({ menuContainer }) => {
  const advancedOptionsSet = useAppSelector(selectors.getAdvancedOptionsSet);

  const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(({ toggle }, ref) => (
    <IconButton type="button" title="Advanced compilation flags" ref={ref} onClick={toggle}>
      {advancedOptionsSet ? <MoreOptionsActiveIcon /> : <MoreOptionsIcon />}
    </IconButton>
  ));
  Button.displayName = 'AdvancedOptionsMenuButton.Button';

  return <PopButton Button={Button} Menu={AdvancedOptionsMenu} menuContainer={menuContainer} />;
};

const ShareButton: React.FC = () => {
  const dispatch = useAppDispatch();
  const gistSave = useCallback(() => dispatch(performGistSave()), [dispatch]);

  return (
    <OneButton type="button" title="Create shareable links to this code" onClick={gistSave}>
      Share
    </OneButton>
  );
};

const ConnectMetamaskButton: React.FC = () => {
  const { sdk, connected, provider, chainId, account } = useSDK();
  const targetChainId = process.env.REACT_APP_Target_Chain_ID;
  const dispatch = useAppDispatch();
  const disconnect = async () => {
    try {
      await sdk?.terminate();
    } catch (err) {
      console.warn('failed to disconnect..', err);
    }
  };

  const switchEthereumChain = async (hexChainId: string | undefined) => {
    if (!hexChainId) {
      console.debug(`hexChainId is undefined`);
      return;
    }
    console.debug(`switching to network chainId=${hexChainId}`);
    try {
      const response = await provider?.request({
        method: 'wallet_switchEthereumChain',
        params: [{ chainId: hexChainId }], // chainId must be in hexadecimal numbers
      });
      console.debug(`response`, response);
    } catch (err) {
      console.error(err);
    }
  };

  const connect = async () => {
    try {
      await sdk?.connect();
    } catch (err) {
      console.warn('failed to connect..', err);
    }
  };

  const local_account = useAppSelector((state) => selectors.accountSelector(state));

  useEffect(() => {
    if (account) {
      dispatch(setAccount({ address: account }));
    } else {
      dispatch(setAccount(null));
    }
  }, [account]);

  useEffect(() => {
    // console.log("connected=", connected, "chainId=", chainId)
    if (connected && chainId !== targetChainId) {
      switchEthereumChain(targetChainId);
    }
  }, [connected, targetChainId]);

  return (
    <div>
      <OneButton
        type="button"
        title={!connected ? 'Connect to metamask' : 'Disconnect to metamask'}
        onClick={!connected ? connect : disconnect}
      >
        {connected ? (
          <div
            style={{
              display: 'flex',
              justifyContent: 'center',
              alignItems: 'center',
              height: '100vh',
            }}
          >
            <div style={{ marginRight: '5px' }}>
              {local_account
                ? `${local_account.address.substring(0, 5)}...${local_account.address.substring(local_account.address.length - 5)}`
                : ''}
            </div>
            <div
              style={{
                width: '10px',
                height: '10px',
                backgroundColor: 'green',
                borderRadius: '50%',
              }}
            ></div>
          </div>
        ) : (
          'Connect Wallet'
        )}
      </OneButton>
    </div>
  );
};

const UploadToNodeButton: React.FC = () => {
  // has already connected to metamask && wasm code is exists
  const local_account = useAppSelector((state) => selectors.accountSelector(state));
  const { wasm } = useAppSelector((state) => state.output);
  const is_active = local_account && wasm.code;
  const { provider } = useSDK();

  const uploadWASMToNode = async () => {
    if (local_account && wasm.code) {
      try {
        const message = wasm.code;
        const hexMessage = '0x' + Buffer.from(message, 'utf8').toString('hex');
        const sign = await provider?.request({
          method: 'personal_sign',
          params: [hexMessage, local_account.address],
        });
        console.log(`sign: ${sign}`);
        console.log(`wasm.code: ${wasm.code}`);
        // const image = btoa(wasm.code + sign);
        // const image = btoa(`\0asm${wasm.code}`);
        const image = wasm.code;
        const image_md5 = MD5(image).toString().toUpperCase();
        const payload = {
          jsonrpc: '2.0',
          method: 'rpc-add-new-image',
          params: {
            image: image,
            image_md5: image_md5,
          },
        };
        console.log('payload: ', payload);
        const d = await jsonPost(routes.uploadWasm, payload);
        console.log('uploadWASMToNode response: ', d);
      } catch (err) {
        console.warn(`failed to connect..`, err);
      }
    } else {
      console.warn(`WASM code not exists..`);
    }
  };

  return (
    <div>
      <OneButton
        type="button"
        title={'Upload to node'}
        disabled={!is_active}
        onClick={uploadWASMToNode}
      >
        Upload WASM
      </OneButton>
    </div>
  );
};

const ToolsMenuButton: React.FC<PortalProps> = ({ menuContainer }) => {
  const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(({ toggle }, ref) => (
    <OneButton
      type="button"
      title="Run extra tools on the source code"
      ref={ref}
      onClick={toggle}
      iconRight={ExpandableIcon}
    >
      Tools
    </OneButton>
  ));
  Button.displayName = 'ToolsMenuButton.Button';

  return <PopButton Button={Button} Menu={ToolsMenu} menuContainer={menuContainer} />;
};

const ConfigMenuButton: React.FC<PortalProps> = ({ menuContainer }) => {
  const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(({ toggle }, ref) => (
    <OneButton
      type="button"
      title="Show the configuration options"
      ref={ref}
      onClick={toggle}
      iconLeft={ConfigIcon}
      iconRight={ExpandableIcon}
    >
      Config
    </OneButton>
  ));
  Button.displayName = 'ConfigMenuButton.Button';

  return <PopButton Button={Button} Menu={ConfigMenu} menuContainer={menuContainer} />;
};

const HelpButton: React.FC = () => (
  <IconLink title="View help" action={navigateToHelp}>
    <HelpIcon />
  </IconLink>
);

export default Header;
