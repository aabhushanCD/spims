import { Document, model, Schema, Types } from "mongoose";

export interface IBackgroundJob extends Document {
  jobName: string;
  status: "PENDING" | "IN_PROGRESS" | "COMPLETED" | "FAILED";
  startedAt: Date;
  scheduledAt: Date;
  completedAt?: Date;
  errorMessage?: string;
}

const backgroundJobSchema = new Schema<IBackgroundJob>({
  jobName: { type: String, required: true },
  status: {
    type: String,
    enum: ["PENDING", "IN_PROGRESS", "COMPLETED", "FAILED"],
    required: true,
  },
  startedAt: { type: Date, required: true },
  scheduledAt: { type: Date, required: false },
  completedAt: { type: Date },
  errorMessage: { type: String },
});

const BackgroundJobModel = model<IBackgroundJob>(
  "BackgroundJob",
  backgroundJobSchema,
);

export default BackgroundJobModel;
