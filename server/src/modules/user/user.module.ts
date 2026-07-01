import { UserController } from "./controller/user.controller.js";
import { User } from "./model/user.model.js";
import { UserRepository } from "./repo/user.repo.js";
import { UserService } from "./service/user.service.js";

const userRepository = new UserRepository(User);
const userService = new UserService(userRepository);
const userController = new UserController(userService);

export { userRepository, userService, userController };
