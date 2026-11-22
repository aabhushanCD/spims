import { useMutation, useQueryClient } from "@tanstack/react-query";
import { toast } from "react-toastify";

import { getApiErrorMessage } from "@/api/getApiErrorMessage";
import { customerService } from "../services/customer.service";
import type { CustomerForm } from "../types/customer.types";
import { customerKeys } from "./useCustomers";

export function useCreateCustomer() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: customerService.createCustomer,
    onSuccess: () => {
      toast.success("Customer created");
      queryClient.invalidateQueries({ queryKey: customerKeys.all });
    },
    onError: (error) => {
      toast.error(getApiErrorMessage(error, "Failed to create customer"));
    },
  });
}

export function useUpdateCustomer() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({
      id,
      data,
    }: {
      id: string;
      data: Partial<CustomerForm>;
    }) => customerService.updateCustomer(id, data),
    onSuccess: (_customer, variables) => {
      toast.success("Customer updated");
      queryClient.invalidateQueries({ queryKey: customerKeys.all });
      queryClient.invalidateQueries({
        queryKey: customerKeys.detail(variables.id),
      });
    },
    onError: (error) => {
      toast.error(getApiErrorMessage(error, "Failed to update customer"));
    },
  });
}

export function useDeleteCustomer() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: customerService.deleteCustomer,
    onSuccess: () => {
      toast.success("Customer deleted");
      queryClient.invalidateQueries({ queryKey: customerKeys.all });
    },
    onError: (error) => {
      toast.error(getApiErrorMessage(error, "Failed to delete customer"));
    },
  });
}
