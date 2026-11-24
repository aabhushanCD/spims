import { Link } from "react-router";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import RelativeTime from "@/components/common/RelativeTime";
import { formatPercent } from "@/lib/format";
import type { ReorderRecommendation } from "../types/smart.types";

interface Props {
  recommendations: ReorderRecommendation[];
  canManage: boolean;
  isOwner: boolean;
  onApprove: (recommendation: ReorderRecommendation) => void;
  onReject: (recommendation: ReorderRecommendation) => void;
  onDelete: (recommendation: ReorderRecommendation) => void;
}

function statusVariant(status: ReorderRecommendation["status"]) {
  return status === "APPROVED"
    ? "default"
    : status === "REJECTED"
      ? "destructive"
      : "secondary";
}

export default function ReorderTable({
  recommendations,
  canManage,
  isOwner,
  onApprove,
  onReject,
  onDelete,
}: Props) {
  return (
    <Card>
      <CardContent className="p-0">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Medicine</TableHead>
              <TableHead className="text-right">Stock / ROP</TableHead>
              <TableHead className="text-right">Suggested</TableHead>
              <TableHead className="text-right">Confidence</TableHead>
              <TableHead>Supplier</TableHead>
              <TableHead>Status</TableHead>
              <TableHead>Generated</TableHead>
              <TableHead className="w-56">Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {recommendations.length === 0 ? (
              <TableRow>
                <TableCell colSpan={8} className="h-24 text-center">
                  No recommendations found.
                </TableCell>
              </TableRow>
            ) : (
              recommendations.map((recommendation) => {
                const supplier =
                  typeof recommendation.supplierId === "string"
                    ? recommendation.supplierId
                    : recommendation.supplierId?.companyName;

                return (
                  <TableRow key={recommendation._id}>
                    <TableCell>
                      <div className="font-medium">
                        {recommendation.medicineId.medicineName}
                      </div>
                      <div className="text-muted-foreground text-xs">
                        {recommendation.medicineId.strength}
                      </div>
                      <div className="text-muted-foreground mt-1 max-w-xs text-xs">
                        {recommendation.recommendationReason}
                      </div>
                    </TableCell>
                    <TableCell className="text-right">
                      {recommendation.currentStock} / {recommendation.reorderPoint}
                    </TableCell>
                    <TableCell className="text-right font-medium">
                      {recommendation.suggestedQuantity}
                    </TableCell>
                    <TableCell className="text-right">
                      {formatPercent(recommendation.confidenceScore)}
                    </TableCell>
                    <TableCell>{supplier ?? "-"}</TableCell>
                    <TableCell>
                      <Badge variant={statusVariant(recommendation.status)}>
                        {recommendation.status}
                      </Badge>
                      {recommendation.status === "REJECTED" &&
                        recommendation.rejectionReason && (
                          <p className="text-muted-foreground mt-1 max-w-32 text-xs">
                            {recommendation.rejectionReason}
                          </p>
                        )}
                    </TableCell>
                    <TableCell>
                      <RelativeTime value={recommendation.generatedAt} />
                    </TableCell>
                    <TableCell>
                      <div className="flex flex-wrap gap-1">
                        {recommendation.status === "PENDING" && (
                          <>
                            <Button
                              size="sm"
                              disabled={!canManage}
                              onClick={() => onApprove(recommendation)}
                            >
                              Approve
                            </Button>
                            <Button
                              size="sm"
                              variant="outline"
                              disabled={!canManage}
                              onClick={() => onReject(recommendation)}
                            >
                              Reject
                            </Button>
                          </>
                        )}

                        {recommendation.purchaseOrderId && (
                          <Button asChild size="sm" variant="outline">
                            <Link to="/purchase-orders">View PO</Link>
                          </Button>
                        )}

                        {isOwner && (
                          <Button
                            size="sm"
                            variant="ghost"
                            className="text-destructive"
                            onClick={() => onDelete(recommendation)}
                          >
                            Delete
                          </Button>
                        )}
                      </div>
                    </TableCell>
                  </TableRow>
                );
              })
            )}
          </TableBody>
        </Table>
      </CardContent>
    </Card>
  );
}
