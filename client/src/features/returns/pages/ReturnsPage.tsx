import { useDeferredValue, useState } from "react";

import { getApiErrorMessage } from "@/api/getApiErrorMessage";
import LoadingSpinner from "@/components/common/LoadingSpinner";
import PageHeader from "@/components/common/PageToolbar";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { useReturns } from "../hooks/useReturns";
import ReturnTable from "../components/ReturnTable";
import type { ReturnStatus } from "../types/return.types";

const statuses: ReturnStatus[] = [
  "PENDING",
  "APPROVED",
  "COMPLETED",
  "REJECTED",
  "CANCELLED",
  "REVERSED",
];

export default function ReturnsPage() {
  const [search, setSearch] = useState("");
  const [status, setStatus] = useState<ReturnStatus | "ALL">("ALL");
  const deferredSearch = useDeferredValue(search);

  const returns = useReturns({
    ...(deferredSearch ? { search: deferredSearch } : {}),
    ...(status === "ALL" ? {} : { status }),
  });

  if (returns.isLoading) {
    return <LoadingSpinner />;
  }

  return (
    <div className="space-y-6">
      <PageHeader
        title="Returns"
        description="Review, approve, complete, and reverse customer returns."
        searchPlaceholder="Search return number..."
        searchValue={search}
        onSearchChange={setSearch}
        action={
          <Select
            value={status}
            onValueChange={(value) =>
              setStatus(value as ReturnStatus | "ALL")
            }
          >
            <SelectTrigger className="w-40">
              <SelectValue placeholder="Status" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="ALL">All statuses</SelectItem>
              {statuses.map((value) => (
                <SelectItem key={value} value={value}>
                  {value}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        }
      />

      {returns.isError ? (
        <div className="text-destructive rounded-lg border p-6 text-center text-sm">
          {getApiErrorMessage(returns.error, "Failed to load returns.")}
        </div>
      ) : (
        <ReturnTable
          returns={returns.data?.items ?? []}
          isLoading={returns.isLoading}
        />
      )}
    </div>
  );
}
