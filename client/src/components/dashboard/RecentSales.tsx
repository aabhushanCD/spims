import { ArrowUpRight, BadgeCheck, Clock3 } from "lucide-react";

import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  CardDescription,
} from "@/components/ui/card";

import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";

import { Badge } from "@/components/ui/badge";

const sales = [
  {
    invoice: "INV-1001",
    customer: "Ram Sharma",
    medicines: 3,
    amount: 2450,
    payment: "Paid",
    date: "10:15 AM",
  },
  {
    invoice: "INV-1002",
    customer: "Sita Rai",
    medicines: 1,
    amount: 680,
    payment: "Pending",
    date: "10:42 AM",
  },
  {
    invoice: "INV-1003",
    customer: "Hari Karki",
    medicines: 5,
    amount: 4320,
    payment: "Paid",
    date: "11:18 AM",
  },
  {
    invoice: "INV-1004",
    customer: "Aayush Nepal",
    medicines: 2,
    amount: 1280,
    payment: "Paid",
    date: "11:54 AM",
  },
  {
    invoice: "INV-1005",
    customer: "Bikash Thapa",
    medicines: 4,
    amount: 3650,
    payment: "Refund",
    date: "12:31 PM",
  },
];

export default function RecentSales() {
  return (
    <Card className="shadow-md">
      <CardHeader className="flex flex-row items-center justify-between">
        <div>
          <CardTitle>Recent Sales</CardTitle>

          <CardDescription>Latest pharmacy transactions</CardDescription>
        </div>

        <ArrowUpRight className="text-muted-foreground" />
      </CardHeader>

      <CardContent>
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Invoice</TableHead>

              <TableHead>Customer</TableHead>

              <TableHead>Medicines</TableHead>

              <TableHead>Amount</TableHead>

              <TableHead>Status</TableHead>

              <TableHead>Time</TableHead>
            </TableRow>
          </TableHeader>

          <TableBody>
            {sales.map((sale) => (
              <TableRow key={sale.invoice}>
                <TableCell className="font-medium">{sale.invoice}</TableCell>

                <TableCell>{sale.customer}</TableCell>

                <TableCell>{sale.medicines}</TableCell>

                <TableCell className="font-semibold">
                  Rs. {sale.amount.toLocaleString()}
                </TableCell>

                <TableCell>
                  {sale.payment === "Paid" && (
                    <Badge className="gap-1 bg-emerald-600">
                      <BadgeCheck size={12} />
                      Paid
                    </Badge>
                  )}

                  {sale.payment === "Pending" && (
                    <Badge variant="secondary" className="gap-1">
                      <Clock3 size={12} />
                      Pending
                    </Badge>
                  )}

                  {sale.payment === "Refund" && (
                    <Badge variant="destructive">Refund</Badge>
                  )}
                </TableCell>

                <TableCell className="text-muted-foreground">
                  {sale.date}
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </CardContent>
    </Card>
  );
}
