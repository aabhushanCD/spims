import {
  Table,
  TableHeader,
  TableHead,
  TableRow,
  TableBody,
  TableCell,
} from "@/components/ui/table";

import { Badge } from "@/components/ui/badge";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { ChevronLeft, ChevronRight } from "lucide-react";
import { useState } from "react";

interface InventoryTableProps {
  inventory: any;
}
const ITEMS_PER_PAGE = 10;
export function InventoryTable({ inventory }: InventoryTableProps) {
  const [currentPage, setCurrentPage] = useState<number>(1);

  const items = inventory?.data ?? [];

  const totalItems = items.length;
  const totalPages = Math.ceil(totalItems / ITEMS_PER_PAGE);

  const startIndex = (currentPage - 1) * ITEMS_PER_PAGE;
  const endIndex = startIndex + ITEMS_PER_PAGE;

  const currentItems = items.slice(startIndex, endIndex);

  return (
    <Card className="overflow-hidden">
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>Medicine ID</TableHead>
            <TableHead>Medicine Name</TableHead>
            <TableHead>Current</TableHead>
            <TableHead>Reserved</TableHead>
            <TableHead>Available</TableHead>
            <TableHead>Status</TableHead>
            <TableHead>Updated</TableHead>
          </TableRow>
        </TableHeader>

        <TableBody>
          {currentItems.length > 0 ? (
            currentItems.map((item: any) => (
              <TableRow key={item.id}>
                <TableCell className="font-medium">
                  {item?.medicineId._id}
                </TableCell>

                <TableCell>{item?.medicineId.medicineName}</TableCell>
                <TableCell>{item?.currentStock}</TableCell>

                <TableCell>{item?.reservedStock}</TableCell>

                <TableCell>{item?.availableStock}</TableCell>

                <TableCell>
                  {item.availableStock === 0 ? (
                    <Badge variant="destructive">Out of Stock</Badge>
                  ) : item.availableStock < 20 ? (
                    <Badge variant="secondary">Low Stock</Badge>
                  ) : (
                    <Badge>In Stock</Badge>
                  )}
                </TableCell>

                <TableCell>
                  {new Date(item.lastUpdated).toLocaleDateString()}
                </TableCell>
              </TableRow>
            ))
          ) : (
            <TableRow>
              <TableCell colSpan={7} className="h-24 text-center">
                No inventory found.
              </TableCell>
            </TableRow>
          )}
        </TableBody>
      </Table>
      {/* Pagination */}
      {totalItems > 0 && (
        <div className="flex items-center justify-between border-t px-4 py-3">
          <p className="text-muted-foreground text-sm">
            Showing {startIndex + 1}–{Math.min(endIndex, totalItems)} of{" "}
            {totalItems}
          </p>

          <div className="flex items-center gap-2">
            <Button
              variant="outline"
              size="sm"
              disabled={currentPage === 1}
              onClick={() => setCurrentPage((page) => page - 1)}
            >
              <ChevronLeft className="mr-1 h-4 w-4" />
              Previous
            </Button>

            <span className="text-sm">
              Page {currentPage} of {totalPages}
            </span>

            <Button
              variant="outline"
              size="sm"
              disabled={currentPage === totalPages}
              onClick={() => setCurrentPage((page) => page + 1)}
            >
              Next
              <ChevronRight className="ml-1 h-4 w-4" />
            </Button>
          </div>
        </div>
      )}
    </Card>
  );
}
