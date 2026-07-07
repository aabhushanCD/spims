import mongoose from "mongoose";
import { AppError } from "../../shared/error.ts";
import { userRepository } from "../user/user.module.ts";
import NotificationModel from "./model/notification.model.ts";
import NotificationRecipientModel from "./model/notificationRecipient.model.ts";
import { NotificationRepo } from "./repo/notification.repo.ts";
import { NotificationRecipientRepo } from "./repo/notificationRecipient.repo.ts";
import { NotificationService } from "./services/notification.service.ts";
import { NotificationController } from "./controller/notification.controller.ts";

const notificationRepo = new NotificationRepo(NotificationModel);
const notificationRecipientRepo = new NotificationRecipientRepo(
  NotificationRecipientModel,
);
const notificationService = new NotificationService(
  notificationRepo,
  notificationRecipientRepo,
  userRepository,
  AppError,
  mongoose.connection,
);

const notificationController = new NotificationController(notificationService);

export {
  notificationController,
  notificationService,
  notificationRepo,
  notificationRecipientRepo,
};
