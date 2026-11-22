import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";

import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";

import { useMedicineList } from "../hooks/useMedicineList";

interface Props {
  search?: string;
}

export default function MedicineTable({ search = "" }: Props) {
  const {
    data,
    isLoading,
    isFetchingNextPage,
    hasNextPage,
    fetchNextPage,
  } = useMedicineList(search);

  const medicines = data?.pages.flatMap((page) => page.items) ?? [];

  if (isLoading) {
    return <div>Loading...</div>;
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>Medicine List</CardTitle>
      </CardHeader>

      <CardContent>
        <div className="overflow-x-auto">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Medicine</TableHead>

                <TableHead>Generic Name</TableHead>
                <TableHead>Strength</TableHead>

                <TableHead>Category</TableHead>

                <TableHead>Brand</TableHead>
              </TableRow>
            </TableHeader>

            <TableBody>
              {medicines.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={5} className="h-24 text-center">
                    No medicines found.
                  </TableCell>
                </TableRow>
              ) : (
                medicines.map((medicine) => (
                  <TableRow key={medicine._id}>
                    <TableCell className="font-medium">
                      {medicine.medicineName}
                    </TableCell>

                    <TableCell>{medicine.genericName}</TableCell>
                    <TableCell>{medicine.strength}</TableCell>

                    <TableCell>{medicine.category}</TableCell>

                    <TableCell>{medicine.brand}</TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </div>

        <div className="mt-4 flex items-center justify-between">
          <p className="text-muted-foreground text-sm">
            Showing {medicines.length} medicine
            {medicines.length === 1 ? "" : "s"}
          </p>

          <Button
            variant="outline"
            size="sm"
            disabled={!hasNextPage || isFetchingNextPage}
            onClick={() => fetchNextPage()}
          >
            {isFetchingNextPage
              ? "Loading…"
              : hasNextPage
                ? "Load more"
                : "No more medicines"}
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}
