import { MASTER_DATA } from "../types/masterData.types";
import MasterDataPage from "./MasterDataPage";

export default function UnitPage() {
  return <MasterDataPage config={MASTER_DATA.units} />;
}
