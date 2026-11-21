import { describe, expect, it, vi } from "vitest";
import { BackgroundJobRepo } from "./background.repo.ts";

function buildRepo() {
  const save = vi.fn().mockResolvedValue({ _id: "job-1" });
  const model = function MockModel(this: { save: typeof save }) {
    this.save = save;
  };
  return { repo: new BackgroundJobRepo(model as never), save };
}

describe("BackgroundJobRepo.create", () => {
  it("saves once with the transaction session", async () => {
    const { repo, save } = buildRepo();
    const session = { id: "session-1" };

    await repo.create({ jobName: "expiry-check" }, session as never);

    expect(save).toHaveBeenCalledOnce();
    expect(save).toHaveBeenCalledWith({ session });
  });

  it("saves once without a session", async () => {
    const { repo, save } = buildRepo();

    await repo.create({ jobName: "expiry-check" });

    expect(save).toHaveBeenCalledOnce();
    expect(save).toHaveBeenCalledWith();
  });
});
