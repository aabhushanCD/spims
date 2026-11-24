import { useState } from "react";
import { Link } from "react-router";
import { Eye, Plus } from "lucide-react";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import PageHeader from "@/components/common/PageToolbar";
import LoadingSpinner from "@/components/common/LoadingSpinner";
import RelativeTime from "@/components/common/RelativeTime";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { getApiErrorMessage } from "@/api/getApiErrorMessage";
import CreateStocktakeDialog from "../components/CreateStocktakeDialog";
import { useStocktakes } from "../hooks/useStocktakes";
import type { StocktakeStatus } from "../types/stocktake.types";

const statuses: StocktakeStatus[] = [
  "DRAFT",
  "IN_PROGRESS",
  "COMPLETED",
  "CANCELLED",
];

export default function StocktakesPage() {
  const [status, setStatus] = useState<StocktakeStatus | "ALL">("ALL");
  const [createOpen, setCreateOpen] = useState(false);
  const stocktakes = useStocktakes(
    status === "ALL" ? {} : { status },
  );

  if (stocktakes.isLoading) {
    return <LoadingSpinner />;
  }

  return (
    <div className="space-y-6">
      <PageHeader
        title="Stocktakes"
        description="Count physical stock and apply variances."
        action={
          <div className="flex flex-wrap items-center gap-2">
            <Select
              value={status}
              onValueChange={(value) =>
                setStatus(value as StocktakeStatus | "ALL")
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

            <Button onClick={() => setCreateOpen(true)}>
              <Plus className="mr-2 h-4 w-4" />
              Start stocktake
            </Button>
          </div>
        }
      />

      {stocktakes.isError ? (
        <div className="text-destructive rounded-lg border p-6 text-center text-sm">
          {getApiErrorMessage(stocktakes.error, "Failed to load stocktakes.")}
        </div>
      ) : (
        <Card>
          <CardContent className="p-0">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Number</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Items</TableHead>
                  <TableHead>Started</TableHead>
                  <TableHead>Completed</TableHead>
                  <TableHead className="w-16" />
                </TableRow>
              </TableHeader>
              <TableBody>
                {(stocktakes.data?.items.length ?? 0) === 0 ? (
                  <TableRow>
                    <TableCell colSpan={6} className="h-24 text-center">
                      No stocktakes found.
                    </TableCell>
                  </TableRow>
                ) : (
                  stocktakes.data?.items.map((stocktake) => (
                    <TableRow key={stocktake._id}>
                      <TableCell className="font-medium">
                        {stocktake.stocktakeNumber}
                      </TableCell>
                      <TableCell>
                        <Badge
                          variant={
                            stocktake.status === "COMPLETED"
                              ? "default"
                              : stocktake.status === "CANCELLED"
                                ? "destructive"
                                : "secondary"
                          }
                        >
                          {stocktake.status}
                        </Badge>
                      </TableCell>
                      <TableCell>{stocktake.items.length}</TableCell>
                      <TableCell>
                        <RelativeTime value={stocktake.createdAt} />
                      </TableCell>
                      <TableCell>
                        {stocktake.completedAt ? (
                          <RelativeTime value={stocktake.completedAt} />
                        ) : (
                          "-"
                        )}
                      </TableCell>
                      <TableCell>
                        <Button asChild variant="ghost" size="icon">
                          <Link
                            to={`/stocktakes/${stocktake._id}`}
                            aria-label={`View ${stocktake.stocktakeNumber}`}
                          >
                            <Eye className="h-4 w-4" />
                          </Link>
                        </Button>
                      </TableCell>
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
          </CardContent>
        </Card>
      )}

      {createOpen && (
        <CreateStocktakeDialog onOpenChange={setCreateOpen} />
      )}
    </div>
  );
}
