import { type IService } from '~/libs/interfaces/interfaces.js';
import {
  type GeolocationCacheService,
  type GeolocationLatLng,
} from '~/libs/packages/geolocation-cache/geolocation-cache.js';
import { HttpCode, HttpError, HttpMessage } from '~/libs/packages/http/http.js';
import { MailContent } from '~/libs/packages/mailer/libs/enums/enums.js';
import { FileVerificationStatus } from '~/packages/file-verification-status/libs/enums/enums.js';
import { type UsersTrucksService } from '~/packages/users-trucks/users-trucks.service';

import { UserGroupKey } from '../auth/libs/enums/enums.js';
import { DriverEntity } from '../drivers/driver.entity.js';
import { type DriverRepository } from '../drivers/driver.repository.js';
import {
  type DriverAddPayloadWithBusinessId,
  type DriverAddResponseWithGroup,
  type DriverCreateUpdateResponseDto,
  type DriverEntityT,
  type DriverGetAllResponseDto,
  type DriverGetDriversPayloadWithBusinessId,
  type DriverUpdatePayload,
  type DriverWithAvatarUrl,
  type DriverWithUserData,
} from '../drivers/libs/types/types.js';
import { type FileVerificationStatusService } from '../file-verification-status/file-verification-status.js';
import { type FilesService, S3PublicFolder } from '../files/files.js';
import { type MultipartParsedFile } from '../files/libs/types/types.js';
import { type GroupService } from '../groups/group.service.js';
import { TemplateName } from '../mail/libs/enums/enums.js';
import { type DriverCredentialsViewRenderParameter } from '../mail/libs/views/driver-credentials/libs/types/types.js';
import { mailService } from '../mail/mail.js';
import { type UserService } from '../users/user.service.js';
import { type UserEntityT } from '../users/users.js';
import { AuthApiPath } from './libs/enums/enums.js';
import {
  convertToDriverUser,
  getFullName,
  getFullPath,
  getPasswordLength,
  getRandomCharacter,
} from './libs/helpers/helpers.js';

class DriverService implements IService {
  private driverRepository: DriverRepository;

  private userService: UserService;

  private groupService: GroupService;

  private geolocationCacheService: GeolocationCacheService;

  private fileVerificationStatusService: FileVerificationStatusService;

  private usersTrucksService: UsersTrucksService;

  private filesService: FilesService;

  public constructor({
    driverRepository,
    userService,
    groupService,
    geolocationCacheService,
    usersTrucksService,
    fileVerificationStatusService,
    filesService,
  }: {
    driverRepository: DriverRepository;
    userService: UserService;
    groupService: GroupService;
    geolocationCacheService: GeolocationCacheService;
    usersTrucksService: UsersTrucksService;
    fileVerificationStatusService: FileVerificationStatusService;
    filesService: FilesService;
  }) {
    this.driverRepository = driverRepository;
    this.userService = userService;
    this.groupService = groupService;
    this.geolocationCacheService = geolocationCacheService;
    this.usersTrucksService = usersTrucksService;
    this.fileVerificationStatusService = fileVerificationStatusService;
    this.filesService = filesService;
  }

  public async checkIsVerifiedByUserId(userId: number): Promise<boolean> {
    const driver = await this.findByUserId(userId);

    if (!driver) {
      throw new HttpError({
        message: HttpMessage.DRIVER_DOES_NOT_EXIST,
        status: HttpCode.NOT_FOUND,
      });
    }

    return (
      driver.verificationStatus?.status === FileVerificationStatus.VERIFIED
    );
  }

  public async getGeolocationById(id: number): Promise<GeolocationLatLng> {
    const foundDriver = await this.findById(id);

    if (!foundDriver) {
      throw new HttpError({
        message: HttpMessage.DRIVER_DOES_NOT_EXIST,
        status: HttpCode.NOT_FOUND,
      });
    }

    const geolocation = this.geolocationCacheService.getCache(id);

    if (!geolocation) {
      throw new HttpError({
        message: HttpMessage.DRIVER_LOCATION_UNKNOWN,
        status: HttpCode.BAD_REQUEST,
      });
    }

    return geolocation;
  }

  public async findByLicenseFileId(
    driverLicenseFileId: number,
  ): Promise<DriverEntityT | null> {
    const [driver = null] = await this.driverRepository.find({
      driverLicenseFileId,
    });

    return driver ? driver.toObject() : null;
  }

  public async findById(id: number): Promise<DriverWithAvatarUrl | null> {
    const [driver = null] = await this.driverRepository.find({ id });

    return driver ? driver.toObject() : null;
  }

  public async findByUserId(
    userId: number,
  ): Promise<DriverWithAvatarUrl | null> {
    const [driver = null] = await this.driverRepository.find({ userId });

    return driver ? driver.toObject() : null;
  }

  public async findAllByBusinessId({
    businessId,
    query,
  }: DriverGetDriversPayloadWithBusinessId): Promise<DriverGetAllResponseDto> {
    const items = await this.driverRepository.findAllByBusinessId(
      businessId,
      query,
    );
    const total = await this.driverRepository.getTotal(businessId);

    return {
      items: items.map((item) => convertToDriverUser(item)),
      total,
    };
  }

  public async create({
    payload,
    businessId,
    hostname,
    driverLicenseFileId,
  }: DriverAddPayloadWithBusinessId & {
    hostname: string;
    driverLicenseFileId: DriverEntity['driverLicenseFileId'];
  }): Promise<DriverAddResponseWithGroup> {
    const { email, lastName, firstName, phone, driverLicenseNumber, truckIds } =
      payload;

    const { result: doesDriverExist } = await this.driverRepository.checkExists(
      {
        driverLicenseNumber,
      },
    );

    if (doesDriverExist) {
      throw new HttpError({
        status: HttpCode.BAD_REQUEST,
        message: HttpMessage.DRIVER_LICENSE_ALREADY_EXISTS,
      });
    }

    const userByPhone = await this.userService.findByPhone(phone);

    if (userByPhone) {
      throw new HttpError({
        status: HttpCode.BAD_REQUEST,
        message: HttpMessage.USER_PHONE_ALREADY_EXISTS,
      });
    }

    const userByEmail = await this.userService.findByEmail(email);

    if (userByEmail) {
      throw new HttpError({
        status: HttpCode.BAD_REQUEST,
        message: HttpMessage.USER_EMAIL_ALREADY_EXISTS,
      });
    }

    const group = await this.groupService.findByKey(UserGroupKey.DRIVER);

    if (!group) {
      throw new HttpError({
        status: HttpCode.BAD_REQUEST,
        message: HttpMessage.INVALID_GROUP,
      });
    }

    const password = await this.generatePassword();

    const user = await this.userService.create({
      password,
      email,
      lastName,
      firstName,
      phone,
      groupId: group.id,
    });
    const driver = await this.driverRepository.create(
      DriverEntity.initializeNew({
        driverLicenseNumber,
        businessId,
        userId: user.id,
        driverLicenseFileId,
        avatarId: null,
      }),
    );

    const driverObject = driver.toObject();

    const emailData: DriverCredentialsViewRenderParameter = {
      name: getFullName(firstName, lastName),
      email: email,
      password: password,
      signInLink: getFullPath(hostname, AuthApiPath.SIGN_IN),
    };

    await mailService.sendPage(
      { to: email, subject: MailContent.SUBJECT },
      TemplateName.DRIVER_CREDENTIALS,
      emailData,
    );

    await this.usersTrucksService.addTrucksToDriver(user.id, truckIds);

    return {
      ...user,
      ...driverObject,
      group,
      possibleTruckIds: truckIds,
    };
  }

  private async generatePassword(): Promise<string> {
    const MIN_LENGTH = 6;
    const MAX_LENGTH = 20;
    const UPPER_CASE_CHARS = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ';
    const LOWER_CASE_CHARS = 'abcdefghijklmnopqrstuvwxyz';
    const NUMBER_CHARS = '0123456789';
    const HALF = 0.5;

    const passwordLength = getPasswordLength(MIN_LENGTH, MAX_LENGTH);

    const charSets = [LOWER_CASE_CHARS, UPPER_CASE_CHARS, NUMBER_CHARS].sort(
      () => Math.random() - HALF,
    );
    let password = '';

    for (const charSet of charSets) {
      password += getRandomCharacter(charSet);
    }

    for (let index = charSets.length; index < passwordLength; index++) {
      const characterSet = UPPER_CASE_CHARS + LOWER_CASE_CHARS + NUMBER_CHARS;

      password += getRandomCharacter(characterSet);
    }

    const hasDigit = /\d/.test(password);
    const hasUpperCaseLetter = /[A-Z]/.test(password);
    const hasLowerCaseLetter = /[a-z]/.test(password);

    if (!hasDigit || !hasUpperCaseLetter || !hasLowerCaseLetter) {
      return await this.generatePassword();
    }

    return password;
  }

  public async update({
    driverId,
    payload,
  }: {
    driverId: DriverUpdatePayload['driverId'];
    payload: DriverUpdatePayload['payload'] & {
      driverLicenseFileId: DriverEntity['driverLicenseFileId'];
    };
  }): Promise<DriverCreateUpdateResponseDto> {
    const { password, email, lastName, firstName, phone, driverLicenseNumber } =
      payload;

    const foundDriver = await this.findById(driverId);

    if (!foundDriver) {
      throw new HttpError({
        message: HttpMessage.DRIVER_DOES_NOT_EXIST,
        status: HttpCode.NOT_FOUND,
      });
    }

    const user = await this.userService.update(foundDriver.userId, {
      password,
      email,
      lastName,
      firstName,
      phone,
    });

    const driver = await this.driverRepository.update({
      id: foundDriver.id,
      payload: { driverLicenseNumber },
    });

    const driverObject = driver.toObject();

    return { ...user, ...driverObject };
  }

  public async delete(id: number): Promise<boolean> {
    const foundDriver = await this.findById(id);

    if (!foundDriver) {
      throw new HttpError({
        message: HttpMessage.DRIVER_DOES_NOT_EXIST,
        status: HttpCode.NOT_FOUND,
      });
    }

    const isDriverDeleted = await this.driverRepository.delete(id);

    if (isDriverDeleted) {
      return await this.userService.delete(foundDriver.userId);
    } else {
      throw new HttpError({
        message: HttpMessage.CANNOT_DELETE,
        status: HttpCode.BAD_REQUEST,
      });
    }
  }

  public async setAvatar(
    userId: UserEntityT['id'],
    parsedFile: MultipartParsedFile,
  ): Promise<DriverWithUserData> {
    const [driver = null] = await this.driverRepository.find({ userId });

    if (!driver) {
      throw new HttpError({
        status: HttpCode.BAD_REQUEST,
        message: HttpMessage.DRIVER_DOES_NOT_EXIST,
      });
    }

    const driverEntity = driver.toObjectWithAvatar();
    const { avatar, id } = driverEntity;

    if (avatar) {
      await this.filesService.update(avatar.id, parsedFile);

      return convertToDriverUser(driver);
    }

    const file = await this.filesService.create(
      parsedFile,
      S3PublicFolder.AVATARS,
    );
    const newDriver = await this.driverRepository.update({
      id,
      payload: { avatarId: file.id },
    });

    return convertToDriverUser(newDriver);
  }
}

export { DriverService };
