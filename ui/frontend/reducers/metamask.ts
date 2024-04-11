import { PayloadAction, createSlice } from '@reduxjs/toolkit';

import { Account, AccountState } from '../types';

const initialState: AccountState = {
    account: null,
  };

const slice = createSlice({
  name: 'account',
  initialState,
  reducers: {
    setAccount: (state, action: PayloadAction<Account | null>) => {
      state.account = action.payload;
    },
  },
});

export const { setAccount } = slice.actions;

export default slice.reducer;
