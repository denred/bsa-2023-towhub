import { createSlice } from '@reduxjs/toolkit';

import { DataStatus } from '~/libs/enums/enums.js';
import { type HttpError } from '~/libs/packages/http/http.js';
import {
  type AuthUser,
  type SocketErrorValues,
  type ValueOf,
} from '~/libs/types/types.js';

import {
  authorizeDriverSocket,
  getCurrent,
  logOut,
  resetAuthorizedDriverSocket,
  signIn,
  signUp,
} from './actions.js';

type State = {
  error: HttpError | null;
  dataStatus: ValueOf<typeof DataStatus>;
  socketDriverAuthStatus: ValueOf<typeof DataStatus>;
  socketDriverAuthErrorMessage: SocketErrorValues | null;
  user: AuthUser | null;
};

const initialState: State = {
  error: null,
  dataStatus: DataStatus.IDLE,
  socketDriverAuthStatus: DataStatus.IDLE,
  socketDriverAuthErrorMessage: null,
  user: null,
};

const { reducer, actions, name } = createSlice({
  initialState,
  name: 'auth',
  reducers: {
    clearAuthServerError: (store) => {
      store.error = null;
    },
  },
  extraReducers(builder) {
    builder.addCase(resetAuthorizedDriverSocket, (state) => {
      state.socketDriverAuthStatus = DataStatus.IDLE;
    });
    builder.addCase(signUp.pending, (state) => {
      state.dataStatus = DataStatus.PENDING;
    });
    builder.addCase(signUp.fulfilled, (state, action) => {
      state.error = null;
      state.user = action.payload;
      state.dataStatus = DataStatus.FULFILLED;
    });
    builder.addCase(authorizeDriverSocket.pending, (state) => {
      state.socketDriverAuthStatus = DataStatus.PENDING;
      state.socketDriverAuthErrorMessage = null;
    });
    builder.addCase(authorizeDriverSocket.rejected, (state, action) => {
      state.socketDriverAuthStatus = DataStatus.REJECTED;
      state.socketDriverAuthErrorMessage = action.payload ?? null;
    });
    builder.addCase(authorizeDriverSocket.fulfilled, (state) => {
      state.socketDriverAuthStatus = DataStatus.FULFILLED;
      state.socketDriverAuthErrorMessage = null;
    });
    builder.addCase(signUp.rejected, (state, { payload }) => {
      state.dataStatus = DataStatus.REJECTED;
      state.error = payload ?? null;
    });
    builder.addCase(signIn.pending, (state) => {
      state.dataStatus = DataStatus.PENDING;
    });
    builder.addCase(signIn.fulfilled, (state, action) => {
      state.error = null;
      state.user = action.payload;
      state.dataStatus = DataStatus.FULFILLED;
    });
    builder.addCase(signIn.rejected, (state, { payload }) => {
      state.dataStatus = DataStatus.REJECTED;
      state.error = payload ?? null;
    });
    builder.addCase(getCurrent.pending, (state) => {
      state.dataStatus = DataStatus.PENDING;
    });
    builder.addCase(getCurrent.fulfilled, (state, action) => {
      state.user = action.payload;
      state.dataStatus = DataStatus.FULFILLED;
    });
    builder.addCase(getCurrent.rejected, (state) => {
      state.dataStatus = DataStatus.REJECTED;
    });
    builder.addCase(logOut.pending, (state) => {
      state.dataStatus = DataStatus.PENDING;
    });
    builder.addCase(logOut.fulfilled, (state) => {
      state.user = initialState.user;
      state.dataStatus = DataStatus.FULFILLED;
      state.socketDriverAuthStatus = DataStatus.IDLE;
    });
    builder.addCase(logOut.rejected, (state, { payload }) => {
      state.dataStatus = DataStatus.REJECTED;
      state.error = payload ?? null;
    });
  },
});

export { actions, name, reducer };
