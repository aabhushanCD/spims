import type { AppError } from "../../../shared/error.ts";
import type { BackgroundJobRepo } from "../repo/background.repo.ts";

export class BackgroundJobService {
  constructor(
    private readonly backgroundJobRepo: BackgroundJobRepo,
    private readonly appError: typeof AppError,
  ) {}

  async scheduleJob(jobName: string, scheduledAt: Date = new Date()) {
    return await this.backgroundJobRepo.create({
      jobName,
      status: "PENDING",
      scheduledAt,
      startedAt: scheduledAt, // placeholder until schema makes startedAt optional — see note above
    });
  }

  async markStarted(id: string) {
    const job = await this.backgroundJobRepo.findById(id);
    if (!job) {
      throw this.appError.notFound("Background job not found");
    }
    return await this.backgroundJobRepo.update(id, {
      status: "IN_PROGRESS",
      startedAt: new Date(),
    });
  }

  async markCompleted(id: string) {
    const job = await this.backgroundJobRepo.findById(id);
    if (!job) {
      throw this.appError.notFound("Background job not found");
    }
    return await this.backgroundJobRepo.update(id, {
      status: "COMPLETED",
      completedAt: new Date(),
    });
  }

  async markFailed(id: string, errorMessage: string) {
    const job = await this.backgroundJobRepo.findById(id);
    if (!job) {
      throw this.appError.notFound("Background job not found");
    }
    return await this.backgroundJobRepo.update(id, {
      status: "FAILED",
      completedAt: new Date(),
      errorMessage,
    });
  }

  // Convenience wrapper: creates a job record, runs the given function,
  // and updates status based on the outcome — so callers (cron jobs, etc.)
  // don't have to manually call markStarted/markCompleted/markFailed
  // themselves every time. Re-throws the original error after logging it
  // so the caller's own error handling still runs.
  async runJob<T>(jobName: string, fn: () => Promise<T>): Promise<T> {
    const job = await this.scheduleJob(jobName);
    await this.markStarted(job._id.toString());

    try {
      const result = await fn();
      await this.markCompleted(job._id.toString());
      return result;
    } catch (error: any) {
      await this.markFailed(
        job._id.toString(),
        error?.message ?? "Unknown error",
      );
      throw error;
    }
  }

  async getById(id: string) {
    const job = await this.backgroundJobRepo.findById(id);
    if (!job) {
      throw this.appError.notFound("Background job not found");
    }
    return job;
  }

  async getAll() {
    return await this.backgroundJobRepo.findAll();
  }

  async getByJobName(jobName: string) {
    return await this.backgroundJobRepo.findByJobName(jobName);
  }

  async getByStatus(
    status: "PENDING" | "IN_PROGRESS" | "COMPLETED" | "FAILED",
  ) {
    return await this.backgroundJobRepo.findByStatus(status);
  }

  async getLatestRun(jobName: string) {
    const job = await this.backgroundJobRepo.findLatestByJobName(jobName);
    if (!job) {
      throw this.appError.notFound(`No runs found for job: ${jobName}`);
    }
    return job;
  }

  // Detects jobs stuck in IN_PROGRESS beyond a reasonable timeout — e.g. the
  // process crashed mid-job and never got to call markCompleted/markFailed.
  // Useful for an admin "stale job" dashboard or a periodic cleanup sweep.
  async getStaleJobs(timeoutMinutes: number = 60) {
    const inProgress = await this.backgroundJobRepo.findByStatus("IN_PROGRESS");
    const cutoff = Date.now() - timeoutMinutes * 60 * 1000;
    return inProgress.filter((job) => job.startedAt.getTime() < cutoff);
  }

  async delete(id: string) {
    const deleted = await this.backgroundJobRepo.delete(id);
    if (!deleted) {
      throw this.appError.notFound("Background job not found");
    }
    return deleted;
  }
}
