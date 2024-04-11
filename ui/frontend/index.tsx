import { MetaMaskProvider } from '@metamask/sdk-react';

import 'core-js';
import React from 'react';
import { createRoot } from 'react-dom/client';
import { Provider } from 'react-redux';
import { v4 } from 'uuid';

import PageSwitcher from './PageSwitcher';
import Router from './Router';
import { reExecuteWithBacktrace } from './actions';
import configureStore from './configureStore';
import { configureRustErrors } from './highlighting';
import playgroundApp from './reducers';
import { browserWidthChanged } from './reducers/browser';
import { clientSetIdentifiers } from './reducers/client';
import { addImport, editCode, enableFeatureGate } from './reducers/code';
import { performCratesLoad } from './reducers/crates';
import { featureFlagsForceDisableAll, featureFlagsForceEnableAll } from './reducers/featureFlags';
import { disableSyncChangesToStorage, override } from './reducers/globalConfiguration';
import { gotoPosition } from './reducers/position';
import { selectText } from './reducers/selection';
import { performVersionsLoad } from './reducers/versions';

import './index.module.css';
import 'normalize.css/normalize.css';

const store = configureStore(window);

if (store.getState().client.id === '') {
  const { crypto } = window;

  const id = v4();

  const rawValue = new Uint32Array(1);
  crypto.getRandomValues(rawValue);
  const featureFlagThreshold = rawValue[0] / 0xffff_ffff;

  store.dispatch(clientSetIdentifiers({ id, featureFlagThreshold }));
}

const params = new URLSearchParams(window.location.search);
if (params.has('features')) {
  const selection = params.get('features');
  if (selection === 'false') {
    store.dispatch(featureFlagsForceDisableAll());
  } else {
    store.dispatch(featureFlagsForceEnableAll());
  }
}
const configOverrides = params.get('whte_rbt.obj');
if (configOverrides) {
  store.dispatch(override(configOverrides));
}

const whenBrowserWidthChanged = (evt: MediaQueryList | MediaQueryListEvent) =>
  store.dispatch(browserWidthChanged(evt.matches));
const maxWidthMediaQuery = window.matchMedia('(max-width: 1600px)');

whenBrowserWidthChanged(maxWidthMediaQuery);
maxWidthMediaQuery.addEventListener('change', whenBrowserWidthChanged);

configureRustErrors({
  enableFeatureGate: (featureGate) => store.dispatch(enableFeatureGate(featureGate)),
  gotoPosition: (p) => store.dispatch(gotoPosition(p)),
  selectText: (start, end) => store.dispatch(selectText(start, end)),
  addImport: (code) => store.dispatch(addImport(code)),
  reExecuteWithBacktrace: () => store.dispatch(reExecuteWithBacktrace()),
  getChannel: () => store.getState().configuration.channel,
});

store.dispatch(performCratesLoad());
store.dispatch(performVersionsLoad());

window.rustPlayground = {
  setCode: (code) => {
    store.dispatch(editCode(code));
  },
  disableSyncChangesToStorage: () => {
    store.dispatch(disableSyncChangesToStorage());
  },
};

const container = document.getElementById('playground');
if (container) {
  const root = createRoot(container);
  root.render(
    <MetaMaskProvider
      debug={false}
      sdkOptions={{
        dappMetadata: {
          name: 'Rust Playground',
          url: window.location.href
        },
        infuraAPIKey: process.env.REACT_APP_INFURA_API_KEY,
        // Other options
      }}
    >
      <Provider store={store}>
        <Router store={store} reducer={playgroundApp}>
          <PageSwitcher />
        </Router>
      </Provider>
    </MetaMaskProvider>,
  );
}
