import { type MapServiceParameters } from '~/libs/packages/map/libs/types/types.js';
import { type MapService } from '~/libs/packages/map/map.package.js';
import { type notification } from '~/libs/packages/notification/notification.js';
import { type socket as socketClient } from '~/libs/packages/socket/socket.js';
import { type LocalStorage } from '~/libs/packages/storage/storage.js';
import { type authApi } from '~/packages/auth/auth.js';
import { type businessApi } from '~/packages/business/business.js';
import { type driverApi } from '~/packages/driver/driver.js';
import { type driversApi } from '~/packages/drivers/drivers.js';
import { type filesApi } from '~/packages/files/files.js';
import { type ordersApi } from '~/packages/orders/orders.js';
import { type truckApi } from '~/packages/trucks/trucks.js';
import { type userApi } from '~/packages/users/users.js';
import { type reducer as authReducer } from '~/slices/auth/auth.js';
import { type reducer as businessReducer } from '~/slices/business/business.js';
import { type reducer as driverReducer } from '~/slices/driver/driver.js';
import { type reducer as driversReducer } from '~/slices/drivers/drivers.js';
import { type reducer as filesReducer } from '~/slices/files/files.js';
import { type reducer as orderReducer } from '~/slices/orders/order.js';
import { type reducer as socketReducer } from '~/slices/socket/socket.js';
import { type reducer as truckReducer } from '~/slices/trucks/trucks.js';

type RootReducer = {
  auth: ReturnType<typeof authReducer>;
  trucks: ReturnType<typeof truckReducer>;
  files: ReturnType<typeof filesReducer>;
  business: ReturnType<typeof businessReducer>;
  driver: ReturnType<typeof driverReducer>;
  orders: ReturnType<typeof orderReducer>;
  drivers: ReturnType<typeof driversReducer>;
  socket: ReturnType<typeof socketReducer>;
};

type ExtraArguments = {
  authApi: typeof authApi;
  userApi: typeof userApi;
  filesApi: typeof filesApi;
  notification: typeof notification;
  truckApi: typeof truckApi;
  localStorage: typeof LocalStorage;
  businessApi: typeof businessApi;
  ordersApi: typeof ordersApi;
  mapServiceFactory: (parameters: MapServiceParameters) => Promise<MapService>;
  driversApi: typeof driversApi;
  driverApi: typeof driverApi;
  socketClient: typeof socketClient;
};

export { type ExtraArguments, type RootReducer };
