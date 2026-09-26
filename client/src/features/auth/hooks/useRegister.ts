import { useMutation } from "@tanstack/react-query";
import { authServices } from "../services/authServices";
import { toast } from "react-toastify";
import axios from "axios";
import { useNavigate } from "react-router";

export const useRegister = () => {
  const navigate = useNavigate();
  return useMutation({
    mutationFn: authServices.registerService,
    onSuccess: () => {
      toast.success("Registration successful!" + "\n" + "Please log in.");
      navigate("/login");
      return true;
    },
    onError: (error) => {
      console.error("Registration failed:", error);
      if (axios.isAxiosError(error)) {
        toast.error(
          "Registration failed. Please try again." +
            "\n" +
            error.response?.data?.message || "Unknown error",
        );
        return;
      }
    },
  });
};
