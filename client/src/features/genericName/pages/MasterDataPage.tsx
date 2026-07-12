import { useState } from "react";

import MasterDataHeader from "../components/MasterDataHeader";
import MasterDataTable from "../components/MasterDataTable";
import MasterDataDialog from "../components/MasterDataDialog";

import type { MasterData, MasterDataConfig } from "../types/masterData.types";
import { useMasterData } from "../hooks/useMaterData";
import { useDeleteMasterData } from "../hooks/useDeleteMasterData";

interface Props {
  config: MasterDataConfig;
}

export default function MasterDataPage({ config }: Props) {
  const { data = [], isLoading } = useMasterData(config.resource);
  const deleteMutation = useDeleteMasterData(config.resource);
  const [dialogOpen, setDialogOpen] = useState(false);

  const [editingItem, setEditingItem] = useState<MasterData | null>(null);

  function handleEdit(item: MasterData) {
    setEditingItem(item);
    setDialogOpen(true);
  }

  function handleDelete(id: string) {
    deleteMutation.mutate(id);
  }

  function handleOpenChange(open: boolean) {
    setDialogOpen(open);

    if (!open) {
      setEditingItem(null);
    }
  }

  if (isLoading) {
    return <div>Loading...</div>;
  }

  return (
    <div className="space-y-6">
      <MasterDataHeader config={config} />

      <MasterDataTable
        data={data}
        onEdit={handleEdit}
        onDelete={handleDelete}
      />

      <MasterDataDialog
        config={config}
        open={dialogOpen}
        onOpenChange={handleOpenChange}
        editingItem={editingItem}
      />
    </div>
  );
}
