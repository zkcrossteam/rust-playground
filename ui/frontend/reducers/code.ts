import { PayloadAction, createSlice } from '@reduxjs/toolkit';

import { performFormat } from './output/format';
import { performGistLoad } from './output/gist';

const initialState: string = `extern crate zkwasm_rust_sdk;
use self::zkwasm_rust_sdk::{require, wasm_input};

use wasm_bindgen::prelude::*;

#[wasm_bindgen]
pub unsafe fn zkexec(a: u64, b: u64) -> u64 {
    a+b
}

#[wasm_bindgen]
pub unsafe fn zkmain() -> u64 {
    let a = wasm_input(1);
    let b = wasm_input(1);

    let c = wasm_input(0);

    require(a+b == c);

    0
}`;

const slice = createSlice({
  name: 'code',
  initialState,
  reducers: {
    editCode: (_state, action: PayloadAction<string>) => action.payload,

    addMainFunction: (state) => `${state}\n\n${initialState}`,

    addImport: (state, action: PayloadAction<string>) => action.payload + state,

    addCrateType: (state, action: PayloadAction<string>) =>
      `#![crate_type = "${action.payload}"]\n${state}`,

    enableFeatureGate: (state, action: PayloadAction<string>) =>
      `#![feature(${action.payload})]\n${state}`,
  },
  extraReducers: (builder) => {
    builder
      .addCase(performGistLoad.pending, () => '')
      .addCase(performGistLoad.fulfilled, (_state, action) => action.payload.code)
      .addCase(performFormat.fulfilled, (_state, action) => action.payload.code);
  },
});

export const { editCode, addMainFunction, addImport, addCrateType, enableFeatureGate } =
  slice.actions;

export default slice.reducer;
