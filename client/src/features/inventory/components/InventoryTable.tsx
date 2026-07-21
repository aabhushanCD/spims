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
import { useInventory } from "../hooks/useInventory";
import LoadingSpinner from "@/components/common/LoadingSpinner";

export function InventoryTable() {
  const { data: inventory, isLoading, error } = useInventory();
  if (isLoading) {
    return <LoadingSpinner />;
  }
  if (error) {
    return (
      <div className="text-center text-red-500">
        Error loading inventory data.
      </div>
    );
  }
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
          {inventory?.data?.map((item: any) => (
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
          ))}
        </TableBody>
      </Table>
    </Card>
  );
}
