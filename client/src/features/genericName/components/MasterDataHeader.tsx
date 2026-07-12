import { Input } from "@/components/ui/input";
import { Search } from "lucide-react";

import type { MasterDataConfig } from "../types/masterData.types";
import MasterDataDialog from "./MasterDataDialog";
import PageHeader from "@/components/common/PageToolbar";
import { useState } from "react";

interface MasterDataHeaderProps {
  config: MasterDataConfig;
}

export default function MasterDataHeader({ config }: MasterDataHeaderProps) {
  const [search, setSearch] = useState("");
  return (
    <PageHeader
      title={config.pageTitle}
      description={`Manage ${config.entityName.toLowerCase()}`}
      searchPlaceholder={`Search ${config.entityName}...`}
      action={<MasterDataDialog config={config} />}
      searchValue={search}
      onSearchChange={setSearch}
    />
  );
}
