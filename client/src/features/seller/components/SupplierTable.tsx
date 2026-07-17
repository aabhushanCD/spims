import { MoreHorizontal, Pencil, Trash2 } from "lucide-react";

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

import type { Supplier } from "../types/supplier.types";
import SupplierStatusBadge from "./SupplierStatusBadge";
import { useDeleteSupplier } from "../hooks/useDeleteSupplier";
import AddSupplierDialog from "./AddSupplierDialog";

interface Props {
  suppliers: Supplier[];

  isLoading: boolean;

  onEdit: (supplier: Supplier) => void;
}

export default function SupplierTable({ suppliers, isLoading, onEdit }: Props) {
  const deleteSupplier = useDeleteSupplier();

  if (isLoading) {
    return <p>Loading...</p>;
  }

  return (
    <div className="bg-background rounded-lg border">
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>Name</TableHead>

            <TableHead>Contact Person</TableHead>

            <TableHead>Phone</TableHead>

            <TableHead>Email</TableHead>

            <TableHead>Status</TableHead>

            <TableHead className="w-16" />
          </TableRow>
        </TableHeader>

        <TableBody>
          {suppliers.map((supplier) => (
            <TableRow key={supplier._id}>
              <TableCell>{supplier.companyName}</TableCell>

              <TableCell>{supplier.contactPerson}</TableCell>

              <TableCell>{supplier.phone}</TableCell>

              <TableCell>{supplier.email}</TableCell>

              <TableCell>
                <SupplierStatusBadge active={supplier.status === "active"} />
              </TableCell>

              <TableCell>
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <Button variant="ghost" size="icon">
                      <MoreHorizontal className="h-4 w-4" />
                    </Button>
                  </DropdownMenuTrigger>

                  <DropdownMenuContent align="end">
                    <DropdownMenuItem onClick={() => onEdit(supplier)}>
                      <Pencil className="mr-2 h-4 w-4" />
                      Edit
                    </DropdownMenuItem>

                    <DropdownMenuItem
                      className="text-red-500"
                      onClick={() => deleteSupplier.mutate(supplier._id)}
                    >
                      <Trash2 className="mr-2 h-4 w-4" />
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
  );
}
