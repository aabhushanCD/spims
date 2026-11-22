import { useMemo, useState } from "react";
import { Download, Loader2 } from "lucide-react";
import { toast } from "react-toastify";

import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import LoadingSpinner from "@/components/common/LoadingSpinner";
import PageHeader from "@/components/common/PageToolbar";
import { getApiErrorMessage } from "@/api/getApiErrorMessage";
import { dashboardService } from "@/features/dashboard/services/dashboard.service";
import type { CsvExportType } from "@/features/dashboard/types/dashboard";
import { formatCurrency, formatPercent } from "@/lib/format";
import {
  usePurchaseAnalytics,
  useRangeReport,
  useSalesAnalytics,
  useSalesByCashier,
  useSalesByCategory,
  useSupplierAnalytics,
  useTopSelling,
} from "../hooks/useReports";
import {
  buildReportRangeParams,
  csvFilename,
  defaultReportRange,
} from "../lib/reportRange";

const defaultRange = defaultReportRange();
const currentYear = new Date().getFullYear();

export default function ReportsPage() {
  const [fromDate, setFromDate] = useState(defaultRange.from);
  const [toDate, setToDate] = useState(defaultRange.to);
  const [year, setYear] = useState(String(currentYear));
  const [exporting, setExporting] = useState<CsvExportType | null>(null);

  const rangeResult = useMemo(() => {
    try {
      return { params: buildReportRangeParams(fromDate, toDate), error: null };
    } catch (error) {
      return {
        params: null,
        error:
          error instanceof Error ? error.message : "Choose a valid date range",
      };
    }
  }, [fromDate, toDate]);

  const from = rangeResult.params?.from ?? "";
  const to = rangeResult.params?.to ?? "";
  const enabled = Boolean(rangeResult.params);

  const parsedYear = Number(year);
  const validYear =
    Number.isInteger(parsedYear) && parsedYear >= 2000 && parsedYear <= 2100
      ? parsedYear
      : currentYear;

  const range = useRangeReport(from, to, enabled);
  const cashier = useSalesByCashier(from, to, enabled);
  const category = useSalesByCategory(from, to, enabled);
  const topSelling = useTopSelling(10);
  const suppliers = useSupplierAnalytics();
  const sales = useSalesAnalytics(validYear);
  const purchases = usePurchaseAnalytics();

  const isLoading =
    range.isLoading ||
    cashier.isLoading ||
    category.isLoading ||
    topSelling.isLoading ||
    suppliers.isLoading ||
    sales.isLoading ||
    purchases.isLoading;

  const hasError =
    range.isError ||
    cashier.isError ||
    category.isError ||
    topSelling.isError ||
    suppliers.isError ||
    sales.isError ||
    purchases.isError;

  async function downloadCsv(type: CsvExportType) {
    if (type !== "inventory" && !enabled) {
      toast.error("Choose a valid date range before exporting");
      return;
    }

    setExporting(type);
    try {
      const blob =
        type === "inventory"
          ? await dashboardService.exportCsv(type)
          : await dashboardService.exportCsv(type, from, to);
      const url = URL.createObjectURL(blob);
      const anchor = document.createElement("a");
      anchor.href = url;
      anchor.download = csvFilename(
        type,
        fromDate,
        toDate,
      );
      document.body.appendChild(anchor);
      anchor.click();
      anchor.remove();
      URL.revokeObjectURL(url);
    } catch (error) {
      toast.error(getApiErrorMessage(error, `Failed to export ${type}`));
    } finally {
      setExporting(null);
    }
  }

  if (isLoading) {
    return <LoadingSpinner />;
  }

  return (
    <div className="space-y-6 p-6">
      <PageHeader
        title="Reports"
        description="Sales, profit, cashier, category, inventory, and supplier reporting."
        action={
          <div className="flex flex-wrap gap-2">
            {(["sales", "purchases", "returns", "inventory"] as CsvExportType[]).map(
              (type) => (
                <Button
                  key={type}
                  variant="outline"
                  size="sm"
                  disabled={
                    exporting === type ||
                    (type !== "inventory" && !enabled)
                  }
                  onClick={() => void downloadCsv(type)}
                >
                  {exporting === type ? (
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  ) : (
                    <Download className="mr-2 h-4 w-4" />
                  )}
                  {type}
                </Button>
              ),
            )}
          </div>
        }
      />

      <div className="flex flex-wrap items-end gap-3">
        <div className="w-44 space-y-1">
          <label className="text-muted-foreground text-xs">From</label>
          <Input
            type="date"
            value={fromDate}
            onChange={(event) => setFromDate(event.target.value)}
          />
        </div>
        <div className="w-44 space-y-1">
          <label className="text-muted-foreground text-xs">To</label>
          <Input
            type="date"
            value={toDate}
            onChange={(event) => setToDate(event.target.value)}
          />
        </div>
        <div className="w-36 space-y-1">
          <label className="text-muted-foreground text-xs">Sales year</label>
          <Input
            type="number"
            min={2000}
            max={2100}
            value={year}
            onChange={(event) => setYear(event.target.value)}
          />
        </div>
      </div>

      <p className="text-muted-foreground text-xs">
        Range reports use browser-local dates. Month/year cards use the server
        reporting timezone (`REPORTING_TIMEZONE`, Asia/Kathmandu by default).
      </p>

      {rangeResult.error && (
        <p className="text-destructive text-sm">{rangeResult.error}</p>
      )}

      {hasError && (
        <div className="text-destructive rounded-lg border border-destructive/40 p-3 text-sm">
          Some report data could not be loaded. Cards and tables may be
          incomplete.
        </div>
      )}

      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-5">
        <Metric label="Sales" value={formatCurrency(range.data?.totalSales ?? 0)} />
        <Metric label="VAT" value={formatCurrency(range.data?.totalVat ?? 0)} />
        <Metric
          label="Refunds (net)"
          value={formatCurrency(
            (range.data?.refunds.grossRefunds ?? 0) -
              (range.data?.refunds.refundVat ?? 0),
          )}
        />
        <Metric
          label="Gross profit"
          value={formatCurrency(range.data?.profit.grossProfit ?? 0)}
        />
        <Metric
          label="Margin"
          value={formatPercent(range.data?.profit.marginPercent ?? 0)}
        />
      </div>

      <div className="grid gap-4 lg:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle>Sales by cashier</CardTitle>
          </CardHeader>
          <CardContent className="p-0">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Cashier</TableHead>
                  <TableHead className="text-right">Sales</TableHead>
                  <TableHead className="text-right">Orders</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {(cashier.data?.length ?? 0) === 0 ? (
                  <TableRow>
                    <TableCell colSpan={3} className="h-20 text-center">
                      No sales in this range.
                    </TableCell>
                  </TableRow>
                ) : (
                  cashier.data?.map((row) => (
                    <TableRow key={row.cashierId}>
                      <TableCell>{row.cashierName}</TableCell>
                      <TableCell className="text-right">
                        {formatCurrency(row.total)}
                      </TableCell>
                      <TableCell className="text-right">{row.count}</TableCell>
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Sales by category</CardTitle>
          </CardHeader>
          <CardContent className="p-0">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Category</TableHead>
                  <TableHead className="text-right">Qty</TableHead>
                  <TableHead className="text-right">Total</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {(category.data?.length ?? 0) === 0 ? (
                  <TableRow>
                    <TableCell colSpan={3} className="h-20 text-center">
                      No sales in this range.
                    </TableCell>
                  </TableRow>
                ) : (
                  category.data?.map((row) => (
                    <TableRow key={row.categoryId}>
                      <TableCell>{row.categoryName}</TableCell>
                      <TableCell className="text-right">{row.quantity}</TableCell>
                      <TableCell className="text-right">
                        {formatCurrency(row.total)}
                      </TableCell>
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Top selling medicines (all time)</CardTitle>
        </CardHeader>
        <CardContent className="p-0">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Medicine</TableHead>
                <TableHead>Strength</TableHead>
                <TableHead className="text-right">Units</TableHead>
                <TableHead className="text-right">Revenue</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {(topSelling.data?.length ?? 0) === 0 ? (
                <TableRow>
                  <TableCell colSpan={4} className="h-20 text-center">
                    No top-selling data.
                  </TableCell>
                </TableRow>
              ) : (
                topSelling.data?.map((row) => (
                  <TableRow key={row.medicineId}>
                    <TableCell className="font-medium">
                      {row.medicineName}
                    </TableCell>
                    <TableCell>{row.strength}</TableCell>
                    <TableCell className="text-right">
                      {row.totalQuantitySold}
                    </TableCell>
                    <TableCell className="text-right">
                      {formatCurrency(row.totalRevenue)}
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      <div className="grid gap-4 lg:grid-cols-3">
        <Card>
          <CardHeader>
            <CardTitle>Sales {sales.data?.year ?? year}</CardTitle>
          </CardHeader>
          <CardContent className="space-y-1 text-sm">
            <p>
              Total: {formatCurrency(sales.data?.totalSales ?? 0)}
            </p>
            <p>VAT: {formatCurrency(sales.data?.totalVat ?? 0)}</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Purchases</CardTitle>
          </CardHeader>
          <CardContent className="space-y-1 text-sm">
            <p>
              This month: {formatCurrency(purchases.data?.totalPurchases ?? 0)}
            </p>
            <p className="text-muted-foreground text-xs">
              All-time status counts
            </p>
            {purchases.data?.purchasesByStatus.map((row) => (
              <p key={row.status} className="text-muted-foreground">
                {row.status}: {row.count}
              </p>
            ))}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Suppliers</CardTitle>
          </CardHeader>
          <CardContent className="space-y-1 text-sm">
            <p>Active: {suppliers.data?.activeSuppliers ?? 0}</p>
            <p>Inactive: {suppliers.data?.inactiveSuppliers ?? 0}</p>
            <p>Total: {suppliers.data?.total ?? 0}</p>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}

function Metric({ label, value }: { label: string; value: string }) {
  return (
    <Card>
      <CardContent className="p-4">
        <p className="text-muted-foreground text-xs">{label}</p>
        <p className="text-xl font-semibold">{value}</p>
      </CardContent>
    </Card>
  );
}
