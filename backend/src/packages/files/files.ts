import { database, schema } from '~/libs/packages/database/database.js';
import { logger } from '~/libs/packages/logger/logger.js';
import { s3ClientService } from '~/libs/packages/s3-client-service/s3-client-service.js';

import { FilesController } from './files.controller.js';
import { FilesRepository } from './files.repository.js';
import { FilesService } from './files.service.js';

const filesRepository = new FilesRepository(database, schema.files);
const filesService = new FilesService(filesRepository, s3ClientService, logger);

const filesController = new FilesController(logger, filesService);

export {
  avatarInputDefaultsConfig,
  fileInputDefaultsConfig,
} from './libs/config/config.js';
export { S3PublicFolder } from './libs/enums/s3-public-folder.enum.js';
export { filesController, filesService };
export { FilesService } from './files.service.js';
export { filesValidationPlugin } from './files-validation.app-plugin.js';
export { FilesValidationStrategy } from './libs/enums/enums.js';
export { getFilePublicUrl } from './libs/helpers/get-file-public-url.helper.js';
export { type FastifyFileValidationFunction } from './libs/types/types.js';
