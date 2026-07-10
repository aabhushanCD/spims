import { useMutation } from "@tanstack/react-query";
import { authServices } from "../services/authServices";
import { toast } from "react-toastify";

export const useRegister = () => {
  return useMutation({
    mutationFn: authServices.registerService,
    onSuccess: () => {
      toast.success("Registration successful! Please log in.");
      return true;
    },
    onError: (error) => {
      toast.error("Registration failed. Please try again.");
      console.error("Registration failed:", error);
      return false;
    },
  });
};
