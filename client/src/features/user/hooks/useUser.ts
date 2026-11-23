import { useInfiniteQuery, useQuery } from "@tanstack/react-query";
import { userService, type UserListParams } from "../services/user.service";

const allUsersKey = ["users"] as const;

export const userKeys = {
  all: allUsersKey,
  list: (params: UserListParams) =>
    [...allUsersKey, "list", params] as const,
  stats: [...allUsersKey, "stats"] as const,
  detail: (userId: string) =>
    [...allUsersKey, "detail", userId] as const,
};

export const useGetAllUsers = () => {
  return useQuery({
    queryKey: [...userKeys.all, "all"],
    queryFn: userService.getAllUsers,
  });
};

export const useUserList = (params: UserListParams = {}) => {
  return useInfiniteQuery({
    queryKey: userKeys.list(params),
    queryFn: ({ pageParam }) =>
      userService.getUsersPage({ ...params, cursor: pageParam }),
    initialPageParam: undefined as string | undefined,
    getNextPageParam: (lastPage) => lastPage.nextCursor ?? undefined,
  });
};

export const useUserSearch = (search: string) => {
  return useQuery({
    queryKey: [...userKeys.all, "search", search],
    queryFn: () => userService.getUsersPage({ search }),
  });
};

export const useUserStats = () => {
  return useQuery({
    queryKey: userKeys.stats,
    queryFn: userService.getUserStats,
  });
};

export const useGetUserById = (userId: string) => {
  return useQuery({
    queryKey: userKeys.detail(userId),
    queryFn: () => userService.getUser(userId),
    enabled: Boolean(userId),
  });
};
