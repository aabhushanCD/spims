import { useQuery } from "@tanstack/react-query";
import { userService } from "../services/user.service";

export const useGetAllUsers = () => {
  return useQuery({
    queryKey: ["users"],
    queryFn: userService.getAllUsers,
  });
};

export const useGetUserById = (userId: string) => {
  return useQuery({
    queryKey: ["users", userId],
    queryFn: () => userService.getUser(userId),
  });
}
