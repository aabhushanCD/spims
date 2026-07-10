import { useMutation } from "@tanstack/react-query";
import { authServices } from "../services/authServices";
import { useNavigate } from "react-router";
import { toast } from "react-toastify";
import { useAuth } from "../context/authContext";

export function useLogin() {
  const navigate = useNavigate();
  const {setCurrentUser} = useAuth();
  return useMutation({
    mutationFn: authServices.loginService,

    onSuccess(user) {
      setCurrentUser(user);
      toast.success("Login successful!");
      navigate("/");
    },

    onError(error) {
      toast.error("Login failed. Please try again.");
      console.log("Login failed", error);
    },
  });
}
