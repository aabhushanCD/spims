import { z } from "zod";

import { objectIdSchema } from "../../../shared/schema/objectId.schema.ts";

export const smartReorderIdParamSchema = z.object({ id: objectIdSchema });
export const smartReorderMedicineParamSchema = z.object({
  medicineId: objectIdSchema,
});
