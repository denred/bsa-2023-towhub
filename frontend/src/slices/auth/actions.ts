import { createAction, createAsyncThunk } from '@reduxjs/toolkit';

import { type AuthMode } from '~/libs/enums/enums.js';
import { getErrorMessage } from '~/libs/helpers/helpers.js';
import { type HttpError } from '~/libs/packages/http/http.js';
import { ClientToServerEvent } from '~/libs/packages/socket/socket.js';
import { StorageKey } from '~/libs/packages/storage/storage.js';
import {
  type AsyncThunkConfig,
  type AuthUser,
  type SocketErrorValues,
  type UserEntityObjectWithGroupAndBusinessT,
  type UserEntityObjectWithGroupT,
  type ValueOf,
} from '~/libs/types/types.js';
import {
  type BusinessSignUpRequestDto,
  type CustomerSignUpRequestDto,
  type UserSignInRequestDto,
  type UserSignInResponseDto,
} from '~/packages/users/users.js';

import {
  ServerToClientResponseStatus,
  SocketError,
} from '../socket/libs/enums/enums.js';
import { name as sliceName } from './auth.slice.js';

const signUp = createAsyncThunk<
  UserEntityObjectWithGroupT | UserEntityObjectWithGroupAndBusinessT,
  {
    payload: CustomerSignUpRequestDto | BusinessSignUpRequestDto;
    mode: ValueOf<typeof AuthMode>;
  },
  AsyncThunkConfig<HttpError>
>(
  `${sliceName}/sign-up`,
  async ({ payload, mode }, { extra, rejectWithValue }) => {
    const { authApi, localStorage } = extra;

    try {
      const result = await authApi.signUp(payload, mode);
      await localStorage.set(StorageKey.TOKEN, result.accessToken);

      return result;
    } catch (error_: unknown) {
      const error = error_ as HttpError;

      return rejectWithValue({ ...error, message: error.message });
    }
  },
);

const resetAuthorizedDriverSocket = createAction(
  `${sliceName}/reset-authorized-driver-socket`,
);

const authorizeDriverSocket = createAsyncThunk<
  null,
  number,
  AsyncThunkConfig<SocketErrorValues>
>(
  `${sliceName}/socket-driver-authorize`,
  async (userId, { extra, rejectWithValue }) => {
    const { socketClient } = extra;

    const result = await socketClient.emitWithAck({
      event: ClientToServerEvent.AUTHORIZE_DRIVER,
      eventPayload: {
        userId,
      },
    });

    if (!result) {
      return rejectWithValue(SocketError.UNKNOWN_ERROR);
    }

    if (result.status !== ServerToClientResponseStatus.OK && result.message) {
      return rejectWithValue(result.message);
    }

    return null;
  },
);

const signIn = createAsyncThunk<
  UserSignInResponseDto,
  UserSignInRequestDto,
  AsyncThunkConfig<HttpError>
>(`${sliceName}/sign-in`, async (signInPayload, { extra, rejectWithValue }) => {
  const { authApi, localStorage } = extra;

  try {
    const result = await authApi.signIn(signInPayload);
    await localStorage.set(StorageKey.TOKEN, result.accessToken);

    return result;
  } catch (error_: unknown) {
    const error = error_ as HttpError;

    return rejectWithValue({ ...error, message: error.message });
  }
});

const getCurrent = createAsyncThunk<
  AuthUser,
  undefined,
  AsyncThunkConfig<HttpError>
>(`${sliceName}/current`, async (_, { extra }) => {
  const { authApi, notification, localStorage } = extra;

  try {
    return await authApi.getCurrentUser();
  } catch (error) {
    notification.warning(getErrorMessage(error));
    await localStorage.drop(StorageKey.TOKEN);
    throw error;
  }
});

const logOut = createAsyncThunk<
  unknown,
  undefined,
  AsyncThunkConfig<HttpError>
>(`${sliceName}/logout`, async (_, { extra, rejectWithValue }) => {
  const { authApi, notification, localStorage } = extra;

  try {
    await authApi.logOut();
    await localStorage.drop(StorageKey.TOKEN);
  } catch (error_: unknown) {
    const error = error_ as HttpError;
    notification.warning(getErrorMessage(error));

    return rejectWithValue({ ...error, message: error.message });
  }
});

export {
  authorizeDriverSocket,
  getCurrent,
  logOut,
  resetAuthorizedDriverSocket,
  signIn,
  signUp,
};
