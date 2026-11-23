import { describe, expect, it } from "vitest";
import { http, HttpResponse } from "msw";

import { server } from "@/test/mocks/server";
import { userService } from "./user.service";

describe("userService", () => {
  it("fetches aggregate user stats from the dedicated endpoint", async () => {
    server.use(
      http.get("/api/users/stats", () =>
        HttpResponse.json({
          success: true,
          data: {
            total: 12,
            active: 9,
            inactive: 3,
            byRole: { owner: 1, pharmacist: 11 },
          },
        }),
      ),
    );

    await expect(userService.getUserStats()).resolves.toEqual({
      total: 12,
      active: 9,
      inactive: 3,
      byRole: { owner: 1, pharmacist: 11 },
    });
  });

  it("omits a blank search from the user list request", async () => {
    let search: string | null = "unset";

    server.use(
      http.get("/api/users", ({ request }) => {
        search = new URL(request.url).searchParams.get("search");
        return HttpResponse.json({
          success: true,
          data: { items: [], nextCursor: null },
        });
      }),
    );

    await userService.getUsersPage({ search: "   " });

    expect(search).toBeNull();
  });
});
