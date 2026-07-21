import { MoreHorizontal, Pencil, Trash2 } from "lucide-react";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";

import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

import { Button } from "@/components/ui/button";
import { useMedicines } from "../hooks/useMedicines";

export default function MedicineTable() {
  const { data: medicines = [], isLoading } = useMedicines();

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

                {/* <TableHead>Stock</TableHead> */}

                <TableHead>Action</TableHead>
              </TableRow>
            </TableHeader>

            <TableBody>
              {medicines.map((medicine) => (
                <TableRow key={medicine._id}>
                  <TableCell className="font-medium">
                    {medicine.medicineName}
                  </TableCell>

                  <TableCell>{medicine.genericName}</TableCell>
                  <TableCell>{medicine.strength}</TableCell>

                  <TableCell>{medicine.category}</TableCell>

                  <TableCell>{medicine.brand}</TableCell>

                  {/* <TableCell>
                    <span
                      className={`font-semibold ${
                        medicine.currentStock < 20 ? "text-red-600" : "text-foreground"
                      } `}
                    >
                      {medicine.currentStock}
                    </span>
                  </TableCell> */}

                  <TableCell>
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <Button variant="ghost" size="icon">
                          <MoreHorizontal size={18} />
                        </Button>
                      </DropdownMenuTrigger>

                      <DropdownMenuContent align="end">
                        <DropdownMenuItem>
                          <Pencil size={16} />
                          Edit
                        </DropdownMenuItem>

                        <DropdownMenuItem className="text-red-600">
                          <Trash2 size={16} />
                          Delete
                        </DropdownMenuItem>
                      </DropdownMenuContent>
                    </DropdownMenu>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>
      </CardContent>
    </Card>
  );
}
