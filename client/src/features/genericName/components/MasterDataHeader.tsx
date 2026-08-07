import type { MasterDataConfig } from "../types/masterData.types";
import PageHeader from "@/components/common/PageToolbar";
import { Button } from "@/components/ui/button";
import { useState } from "react";

interface MasterDataHeaderProps {
  config: MasterDataConfig;
  onAdd: () => void;
}

export default function MasterDataHeader({
  config,
  onAdd,
}: MasterDataHeaderProps) {
  const [search, setSearch] = useState("");
  return (
    <PageHeader
      title={config.pageTitle}
      description={`Manage ${config.entityName.toLowerCase()}`}
      searchPlaceholder={`Search ${config.entityName}...`}
      action={
        <Button type="button" onClick={onAdd}>
          Add {config.entityName}
        </Button>
      }
      searchValue={search}
      onSearchChange={setSearch}
    />
  );
}
