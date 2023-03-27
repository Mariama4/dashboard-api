import "reflect-metadata";
import { Container } from "inversify";
import { IConfigService } from "../config/config.service.interface";
import { IUsersRepository } from "./users.repository.interface";
import { IUserService } from "./users.service.interface";
import { TYPES } from "../types";
import { UserService } from "./users.service";
import { UserModel } from "@prisma/client";
import { User } from "./user.entity";

const ConfigServiceMock: IConfigService = {
  get: jest.fn(),
};

const UsersRepositoryMock: IUsersRepository = {
  find: jest.fn(),
  create: jest.fn(),
};

const container = new Container();
let configService: IConfigService;
let usersRepository: IUsersRepository;
let usersService: IUserService;

beforeAll(() => {
  container.bind<IUserService>(TYPES.IUserService).to(UserService);
  container
    .bind<IConfigService>(TYPES.IConfigService)
    .toConstantValue(ConfigServiceMock);
  container
    .bind<IUsersRepository>(TYPES.IUsersRepository)
    .toConstantValue(UsersRepositoryMock);

  configService = container.get<IConfigService>(TYPES.IConfigService);
  usersRepository = container.get<IUsersRepository>(TYPES.IUsersRepository);
  usersService = container.get<IUserService>(TYPES.IUserService);
});

// не рекомендуется использовать зависимые переменные в тесте, но из-за простого случая - допустимо
let createdUser: UserModel | null;

describe("User Service", () => {
  it("createUser", async () => {
    configService.get = jest.fn().mockReturnValueOnce("1");
    usersRepository.create = jest.fn().mockImplementationOnce(
      (user: User): UserModel => ({
        name: user.name,
        email: user.email,
        password: user.password,
        id: 1,
      })
    );
    createdUser = await usersService.createUser({
      email: "a@a.ru",
      name: "Антон",
      password: "1",
    });
    expect(createdUser?.id).toEqual(1);
    expect(createdUser?.password).not.toEqual("1");
  });

  it("validateUser - success", async () => {
    usersRepository.find = jest.fn().mockReturnValueOnce(createdUser);
    const res = await usersService.validateUser({
      email: "a@a.ru",
      password: "1",
    });
    expect(res).toBeTruthy();
  });

  it("validateUser - wrong password", async () => {
    usersRepository.find = jest.fn().mockReturnValueOnce(createdUser);
    const res = await usersService.validateUser({
      email: "a@a.ru",
      password: "2",
    });
    expect(res).toBeFalsy();
  });

  it("validateUser - wrong user", async () => {
    usersRepository.find = jest.fn().mockReturnValueOnce(null);
    const res = await usersService.validateUser({
      email: "a1@a.ru",
      password: "2",
    });
    expect(res).toBeFalsy();
  });
});
