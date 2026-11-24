type Schema = Record<string, unknown>;
type Operation = Record<string, unknown>;

const ref = (name: string): Schema => ({
  $ref: `#/components/schemas/${name}`,
});

const jsonBody = (schema: Schema, required = true): Record<string, unknown> => ({
  required,
  content: {
    "application/json": { schema },
  },
});

const ok = (description: string, schema?: Schema): Record<string, unknown> => ({
  description,
  ...(schema
    ? { content: { "application/json": { schema } } }
    : {}),
});

const errorResponse = (description: string): Record<string, unknown> => ({
  description,
  content: { "application/json": { schema: ref("Error") } },
});

const page = (item: Schema): Schema => ({
  type: "object",
  properties: {
    success: { type: "boolean" },
    data: {
      type: "object",
      properties: {
        items: { type: "array", items: item },
        nextCursor: { type: "string", nullable: true },
      },
    },
  },
});

interface OperationOptions {
  tag: string;
  summary: string;
  description?: string;
  params?: Schema[];
  query?: Schema[];
  body?: Schema;
  responses?: Record<string, unknown>;
  security?: Schema[];
  deprecated?: boolean;
}

function op(options: OperationOptions): Operation {
  const parameters = [...(options.params ?? []), ...(options.query ?? [])];

  return {
    tags: [options.tag],
    summary: options.summary,
    ...(options.description ? { description: options.description } : {}),
    ...(parameters.length > 0 ? { parameters } : {}),
    ...(options.body ? { requestBody: jsonBody(options.body) } : {}),
    responses:
      options.responses ??
      {
        200: ok("Success"),
        400: errorResponse("Validation failure or business rule violation"),
        401: errorResponse("Missing or invalid access token"),
        403: errorResponse("Role not allowed"),
      },
    ...(options.security ? { security: options.security } : {}),
    ...(options.deprecated ? { deprecated: true } : {}),
  };
}

const idParam: Schema = {
  name: "id",
  in: "path",
  required: true,
  schema: { type: "string", pattern: "^[a-fA-F0-9]{24}$" },
};

const medicineIdParam: Schema = {
  name: "medicineId",
  in: "path",
  required: true,
  schema: { type: "string", pattern: "^[a-fA-F0-9]{24}$" },
};

const userIdParam: Schema = {
  name: "userId",
  in: "path",
  required: true,
  schema: { type: "string", pattern: "^[a-fA-F0-9]{24}$" },
};

const supplierIdParam: Schema = {
  name: "supplierId",
  in: "path",
  required: true,
  schema: { type: "string", pattern: "^[a-fA-F0-9]{24}$" },
};

const itemIdParam: Schema = {
  name: "itemId",
  in: "path",
  required: true,
  schema: { type: "string", pattern: "^[a-fA-F0-9]{24}$" },
};

const cursorParam: Schema = {
  name: "cursor",
  in: "query",
  schema: { type: "string" },
  description: "Opaque cursor returned as `nextCursor` by the previous page.",
};

const limitParam: Schema = {
  name: "limit",
  in: "query",
  schema: { type: "integer", minimum: 1, maximum: 100, default: 20 },
};

const searchParam: Schema = {
  name: "search",
  in: "query",
  schema: { type: "string" },
};

const dateRangeParams: Schema[] = [
  { name: "from", in: "query", schema: { type: "string", format: "date-time" } },
  { name: "to", in: "query", schema: { type: "string", format: "date-time" } },
];

const roleParam: Schema = {
  name: "role",
  in: "path",
  required: true,
  schema: { type: "string", enum: ["owner", "pharmacist", "inventory_manager"] },
};

const isActiveParam: Schema = {
  name: "isActive",
  in: "path",
  required: true,
  schema: { type: "string", enum: ["true", "false"] },
};

const datePathParam: Schema = {
  name: "date",
  in: "path",
  required: true,
  schema: { type: "string", format: "date-time" },
};

const idBody = (): Schema => ({
  type: "object",
  additionalProperties: false,
  description: "The request body must be empty.",
});

const lookupRequest = (): Schema => ({
  type: "object",
  required: ["name"],
  properties: {
    name: { type: "string", minLength: 1, maxLength: 100 },
    description: { type: "string", maxLength: 500 },
    isActive: { type: "boolean", default: true },
  },
});

const lookupUpdateRequest = (): Schema => ({
  type: "object",
  properties: {
    name: { type: "string", minLength: 1, maxLength: 100 },
    description: { type: "string", maxLength: 500 },
    isActive: { type: "boolean" },
  },
});

const lookupPaths = (
  tag: string,
  collection: string,
  itemSchema: string,
  label: string,
): Record<string, Operation> => ({
  [`/${collection}`]: {
    get: op({
      tag,
      summary: `List ${label}`,
      responses: { 200: ok("Array of records", { type: "array", items: ref(itemSchema) }) },
    }),
    post: op({
      tag,
      summary: `Create a ${label.replace(/s$/, "")}`,
      body: lookupRequest(),
      responses: { 201: ok("Created", ref(itemSchema)), 409: errorResponse("Duplicate name") },
    }),
  },
  [`/${collection}/{id}`]: {
    get: op({
      tag,
      summary: `Get a ${label.replace(/s$/, "")}`,
      params: [idParam],
      responses: { 200: ok("Record", ref(itemSchema)), 404: errorResponse("Not found") },
    }),
    put: op({
      tag,
      summary: `Update a ${label.replace(/s$/, "")}`,
      params: [idParam],
      body: lookupUpdateRequest(),
      responses: { 200: ok("Updated", ref(itemSchema)), 404: errorResponse("Not found") },
    }),
    delete: op({
      tag,
      summary: `Delete a ${label.replace(/s$/, "")}`,
      params: [idParam],
      responses: {
        200: ok("Deleted", ref("Success")),
        404: errorResponse("Not found"),
        409: errorResponse("Referenced by a medicine"),
      },
    }),
  },
});

export const swaggerSpec: Record<string, unknown> = {
  openapi: "3.0.3",
  info: {
    title: "SPIMS API",
    version: "1.0.0",
    description:
      "Smart Pharmacy Inventory Management System REST API. Authentication uses the httpOnly `token` cookie; unsafe methods also require the `X-CSRF-Token` header echoed from the `csrfToken` cookie. Use **Authorize** after signing in so the browser sends cookies with requests.",
  },
  servers: [
    { url: "/api", description: "Current server" },
    { url: "http://localhost:3000/api", description: "Local development" },
  ],
  tags: [
    { name: "Authentication", description: "Registration, login, sessions, and password reset." },
    { name: "Configuration", description: "Public workspace configuration." },
    { name: "Users", description: "User administration and audit." },
    { name: "Medicines", description: "Medicine catalog and lookup tables." },
    { name: "Suppliers", description: "Supplier management." },
    { name: "Purchases", description: "Purchase orders, items, and receiving." },
    { name: "Inventory", description: "Aggregate stock, reservations, and movements." },
    { name: "Sales", description: "Sales, sale items, and returns." },
    { name: "Batches", description: "Batch stock, FEFO availability, and disposal." },
    { name: "Smart reorders", description: "Reorder recommendations." },
    { name: "Notifications", description: "Inbox, preferences, dispatch, and retries." },
    { name: "Dashboard", description: "Dashboard and reporting analytics." },
  ],
  components: {
    securitySchemes: {
      cookieAuth: {
        type: "apiKey",
        in: "cookie",
        name: "token",
        description: "Access-token cookie set by `POST /auth/login` or `/auth/refresh`.",
      },
      csrfHeader: {
        type: "apiKey",
        in: "header",
        name: "X-CSRF-Token",
        description: "Required for POST/PUT/PATCH/DELETE requests; echo the `csrfToken` cookie.",
      },
    },
    schemas: {
      Error: {
        type: "object",
        properties: {
          success: { type: "boolean", example: false },
          message: { type: "string" },
          code: { type: "string", nullable: true },
          errors: { type: "object", additionalProperties: true },
        },
      },
      Success: {
        type: "object",
        properties: {
          success: { type: "boolean", example: true },
          message: { type: "string" },
          data: { type: "object", additionalProperties: true },
        },
      },
      Paginated: {
        type: "object",
        properties: {
          success: { type: "boolean" },
          data: {
            type: "object",
            properties: {
              items: { type: "array", items: { type: "object", additionalProperties: true } },
              nextCursor: { type: "string", nullable: true },
            },
          },
        },
      },
      Lookup: {
        type: "object",
        properties: {
          _id: { type: "string" },
          name: { type: "string" },
          description: { type: "string", nullable: true },
          isActive: { type: "boolean" },
        },
      },
      Preferences: {
        type: "object",
        properties: {
          language: { type: "string", enum: ["en", "ne"] },
          calendarMode: { type: "string", enum: ["auto", "bs", "ad", "both"] },
        },
      },
      PublicUser: {
        type: "object",
        properties: {
          _id: { type: "string" },
          name: { type: "string" },
          email: { type: "string", format: "email" },
          role: { type: "string", enum: ["owner", "pharmacist", "inventory_manager"] },
          isActive: { type: "boolean" },
          emailVerified: { type: "boolean" },
          provider: { type: "string", enum: ["local", "google"] },
          lastLogin: { type: "string", format: "date-time", nullable: true },
          preferences: ref("Preferences"),
          createdAt: { type: "string", format: "date-time" },
          updatedAt: { type: "string", format: "date-time" },
        },
      },
      Customer: {
        type: "object",
        properties: {
          _id: { type: "string" },
          name: { type: "string" },
          phone: { type: "string", nullable: true },
          email: { type: "string", format: "email", nullable: true },
          address: { type: "string", nullable: true },
          isActive: { type: "boolean" },
        },
      },
      Payment: {
        type: "object",
        properties: {
          _id: { type: "string" },
          saleId: { type: "string" },
          returnId: { type: "string", nullable: true },
          type: { type: "string", enum: ["PAYMENT", "REFUND", "REFUND_REVERSAL"] },
          method: { type: "string" },
          amount: { type: "number" },
          reference: { type: "string", nullable: true },
          performedBy: { type: "object", additionalProperties: true },
          paidAt: { type: "string", format: "date-time" },
        },
      },
      PurchaseReturn: {
        type: "object",
        properties: {
          _id: { type: "string" },
          purchaseOrderId: { type: "object", additionalProperties: true },
          supplierId: { type: "object", additionalProperties: true },
          returnNumber: { type: "string" },
          status: {
            type: "string",
            enum: ["PENDING", "APPROVED", "REJECTED", "CANCELLED", "COMPLETED"],
          },
          returnReason: { type: "string" },
          returnedBy: { type: "string" },
          returnDate: { type: "string", format: "date-time" },
          refundAmount: { type: "number" },
          completedAt: { type: "string", format: "date-time", nullable: true },
          items: { type: "array", items: { type: "object", additionalProperties: true } },
        },
      },
      Medicine: {
        type: "object",
        properties: {
          _id: { type: "string" },
          medicineName: { type: "string" },
          genericNameId: { type: "string" },
          categoryId: { type: "string" },
          brandId: { type: "string" },
          manufacturer: { type: "string", nullable: true },
          barcode: { type: "string", nullable: true },
          unitId: { type: "string" },
          dosageForm: { type: "string", nullable: true },
          strength: { type: "string" },
          reorderLevel: { type: "number", nullable: true },
          description: { type: "string", nullable: true },
          isActive: { type: "boolean" },
        },
      },
      Supplier: {
        type: "object",
        properties: {
          _id: { type: "string" },
          companyName: { type: "string" },
          contactPerson: { type: "string" },
          email: { type: "string", format: "email" },
          phone: { type: "string" },
          address: { type: "string" },
          leadTime: { type: "number" },
          status: { type: "string", enum: ["active", "inactive"] },
          reliabilityScore: { type: "number", minimum: 0, maximum: 100 },
        },
      },
      Inventory: {
        type: "object",
        properties: {
          _id: { type: "string" },
          medicineId: ref("Medicine"),
          currentStock: { type: "number" },
          reservedStock: { type: "number" },
          availableStock: { type: "number" },
          version: { type: "number" },
        },
      },
      Batch: {
        type: "object",
        properties: {
          _id: { type: "string" },
          medicineId: ref("Medicine"),
          purchaseOrderId: { type: "string" },
          batchNumber: { type: "string" },
          manufacturingDate: { type: "string", format: "date-time", nullable: true },
          expiryDate: { type: "string", format: "date-time" },
          purchasePrice: { type: "number" },
          sellingPrice: { type: "number" },
          quantityReceived: { type: "number" },
          quantityRemaining: { type: "number" },
          isExpired: { type: "boolean" },
          isActive: { type: "boolean" },
        },
      },
      PurchaseOrder: {
        type: "object",
        properties: {
          _id: { type: "string" },
          supplierId: ref("Supplier"),
          orderDate: { type: "string", format: "date-time" },
          expectedDeliveryDate: { type: "string", format: "date-time", nullable: true },
          invoiceNumber: { type: "string" },
          invoiceFile: { type: "string" },
          totalAmount: { type: "number" },
          receivedDate: { type: "string", format: "date-time", nullable: true },
          status: { type: "string", enum: ["pending", "approved", "received", "cancelled"] },
          VAT: { type: "number" },
          discount: { type: "number" },
        },
      },
      PurchaseOrderItem: {
        type: "object",
        properties: {
          _id: { type: "string" },
          purchaseOrderId: { type: "string" },
          medicineId: { type: "string" },
          quantity: { type: "number" },
          purchasePrice: { type: "number" },
        },
      },
      Sale: {
        type: "object",
        properties: {
          _id: { type: "string" },
          invoiceNumber: { type: "string" },
          customerName: { type: "string" },
          customerId: { type: "string", nullable: true },
          subTotal: { type: "number" },
          vatRate: { type: "number" },
          VAT: { type: "number" },
          discount: { type: "number" },
          totalAmount: { type: "number" },
          paymentMethod: { type: "string", enum: ["CASH", "CARD", "QR", "Mobile Banking", "CREDIT"] },
          cashierId: { type: "string" },
          saleDate: { type: "string", format: "date-time" },
          status: {
            type: "string",
            enum: ["COMPLETED", "PARTIALLY_RETURNED", "RETURNED", "CANCELLED", "PENDING"],
          },
          idempotencyKey: { type: "string", nullable: true },
        },
      },
      SaleItem: {
        type: "object",
        properties: {
          _id: { type: "string" },
          salesId: { type: "string" },
          batchId: { type: "string" },
          medicineId: { type: "string" },
          quantity: { type: "number" },
          unitPrice: { type: "number" },
          purchasePrice: { type: "number", nullable: true },
          discount: { type: "number" },
          totalPrice: { type: "number" },
          returnedQuantity: { type: "number" },
        },
      },
      Return: {
        type: "object",
        properties: {
          _id: { type: "string" },
          salesId: { type: "string" },
          returnNumber: { type: "string" },
          status: {
            type: "string",
            enum: [
              "PENDING",
              "APPROVED",
              "REJECTED",
              "CANCELLED",
              "COMPLETED",
              "REVERSED",
            ],
          },
          returnReason: { type: "string" },
          returnedBy: { type: "string" },
          returnDate: { type: "string", format: "date-time" },
          refundAmount: { type: "number" },
          returnItems: {
            type: "array",
            items: {
              type: "object",
              properties: {
                saleItemId: { type: "string" },
                quantity: { type: "number" },
                unitPrice: { type: "number" },
                discount: { type: "number" },
                VAT: { type: "number" },
                medicineId: { type: "string" },
                batchId: { type: "string" },
                refundAmount: { type: "number" },
                restockingFee: { type: "number" },
                condition: { type: "string", enum: ["GOOD", "DAMAGED", "EXPIRED", "OPENED"] },
                remarks: { type: "string", nullable: true },
              },
            },
          },
        },
      },
      StockMovement: {
        type: "object",
        properties: {
          _id: { type: "string" },
          medicineId: { type: "object", additionalProperties: true },
          batchId: { type: "object", additionalProperties: true, nullable: true },
          movementType: { type: "string" },
          referenceType: { type: "string" },
          referenceId: { type: "string", nullable: true },
          quantity: { type: "number" },
          performedBy: { type: "object", additionalProperties: true, nullable: true },
          remarks: { type: "string", nullable: true },
          createdAt: { type: "string", format: "date-time" },
        },
      },
      Notification: {
        type: "object",
        properties: {
          _id: { type: "string" },
          title: { type: "string" },
          message: { type: "string" },
          type: { type: "string", enum: ["Email", "SMS", "InApp"] },
          status: { type: "string" },
          recipients: { type: "array", items: { type: "object", additionalProperties: true } },
          createdAt: { type: "string", format: "date-time" },
        },
      },
      SmartReorder: {
        type: "object",
        properties: {
          _id: { type: "string" },
          medicineId: { type: "string" },
          supplierId: { type: "string" },
          suggestedQuantity: { type: "number" },
          confidenceScore: { type: "number" },
          recommendationReason: { type: "string" },
          generatedAt: { type: "string", format: "date-time" },
          status: { type: "string", enum: ["PENDING", "APPROVED", "REJECTED"] },
          WADS: { type: "number" },
          demandStdDev: { type: "number" },
          adjustedLeadTime: { type: "number" },
          safetyStock: { type: "number" },
          reorderPoint: { type: "number" },
          currentStock: { type: "number" },
          expiryRiskUnits: { type: "number" },
        },
      },
      StockOperationRequest: {
        type: "object",
        required: ["quantity", "batchId", "referenceId", "referenceType", "movementType"],
        properties: {
          quantity: { type: "number", minimum: 0.01 },
          batchId: { type: "string" },
          referenceId: { type: "string" },
          referenceType: {
            type: "string",
            enum: ["PURCHASE_ORDER", "PURCHASE", "SALE", "RETURN", "SALES_RETURN", "ADJUSTMENT", "RESERVE", "RELEASE", "SYSTEM"],
          },
          movementType: { type: "string", enum: ["PURCHASE", "RETURN", "SALE", "EXPIRED", "ADJUSTMENT"] },
          remarks: { type: "string" },
        },
      },
      ReserveRequest: {
        type: "object",
        required: ["quantity", "referenceId", "referenceType"],
        properties: {
          quantity: { type: "number", minimum: 0.01 },
          batchId: { type: "string" },
          referenceId: { type: "string" },
          referenceType: { type: "string", enum: ["RESERVE", "RELEASE", "SALE", "PURCHASE_ORDER"] },
          remarks: { type: "string" },
        },
      },
      SaleCreateRequest: {
        type: "object",
        required: ["customerName", "paymentMethod", "saleDate", "items"],
        properties: {
          customerName: { type: "string", minLength: 1, maxLength: 100 },
          paymentMethod: { type: "string", enum: ["CASH", "CARD", "QR", "Mobile Banking", "CREDIT"] },
          saleDate: { type: "string", format: "date-time" },
          discount: { type: "number", minimum: 0, default: 0 },
          items: {
            type: "array",
            minItems: 1,
            items: {
              type: "object",
              required: ["medicineId", "quantity"],
              properties: {
                medicineId: { type: "string" },
                batchId: { type: "string", description: "Optional; FEFO chooses when omitted." },
                quantity: { type: "integer", minimum: 1 },
                discountPercentage: { type: "number", minimum: 0, maximum: 100, default: 0 },
              },
            },
          },
        },
      },
      ReturnCreateRequest: {
        type: "object",
        required: ["salesId", "returnReason", "returnDate", "items"],
        properties: {
          salesId: { type: "string" },
          returnReason: { type: "string" },
          returnedBy: { type: "string", description: "Validated as an ObjectId; the movement actor comes from the JWT." },
          returnDate: { type: "string", format: "date-time" },
          items: {
            type: "array",
            minItems: 1,
            items: {
              type: "object",
              required: ["saleItemId", "quantity"],
              properties: {
                saleItemId: { type: "string" },
                quantity: { type: "integer", minimum: 1 },
                condition: { type: "string", enum: ["GOOD", "DAMAGED", "EXPIRED", "OPENED"], default: "GOOD" },
                remarks: { type: "string" },
              },
            },
          },
        },
      },
      BatchCreateRequest: {
        type: "object",
        required: ["medicineId", "purchaseOrderId", "batchNumber", "expiryDate", "purchasePrice", "sellingPrice", "quantityReceived"],
        properties: {
          medicineId: { type: "string" },
          purchaseOrderId: { type: "string" },
          batchNumber: { type: "string" },
          manufacturingDate: { type: "string", format: "date-time" },
          expiryDate: { type: "string", format: "date-time" },
          purchasePrice: { type: "number", minimum: 0 },
          sellingPrice: { type: "number", minimum: 0 },
          quantityReceived: { type: "number", minimum: 0 },
          quantityRemaining: { type: "number", minimum: 0 },
          isExpired: { type: "boolean" },
          isActive: { type: "boolean" },
        },
      },
      BatchUpdateRequest: {
        type: "object",
        properties: {
          batchNumber: { type: "string" },
          manufacturingDate: { type: "string", format: "date-time" },
          expiryDate: { type: "string", format: "date-time" },
          purchasePrice: { type: "number", minimum: 0 },
          sellingPrice: { type: "number", minimum: 0 },
          quantityRemaining: { type: "number", minimum: 0 },
          isActive: { type: "boolean" },
        },
      },
      AuditLog: {
        type: "object",
        properties: {
          _id: { type: "string" },
          actorId: { type: "string", nullable: true },
          actorRole: { type: "string", nullable: true },
          action: { type: "string" },
          entityType: { type: "string" },
          entityId: { type: "string", nullable: true },
          status: { type: "string", enum: ["SUCCESS", "FAILURE"] },
          ip: { type: "string", nullable: true },
          userAgent: { type: "string", nullable: true },
          metadata: { type: "object", additionalProperties: true },
          createdAt: { type: "string", format: "date-time" },
        },
      },
    },
  },
  security: [{ cookieAuth: [] }],
  paths: {
    "/medicines": {
      get: op({
        tag: "Medicines",
        summary: "List medicines with inventory",
        query: [
          cursorParam,
          limitParam,
          searchParam,
          { name: "isActive", in: "query", schema: { type: "boolean" } },
          { name: "categoryId", in: "query", schema: { type: "string" } },
          { name: "brandId", in: "query", schema: { type: "string" } },
          { name: "genericNameId", in: "query", schema: { type: "string" } },
          { name: "unitId", in: "query", schema: { type: "string" } },
        ],
        responses: { 200: ok("Paginated medicines", page(ref("Medicine"))) },
      }),
      post: op({
        tag: "Medicines",
        summary: "Create a medicine",
        body: {
          type: "object",
          required: ["medicineName", "genericNameId", "categoryId", "brandId", "unitId", "strength"],
          properties: {
            medicineName: { type: "string", maxLength: 200 },
            genericNameId: { type: "string" },
            categoryId: { type: "string" },
            brandId: { type: "string" },
            unitId: { type: "string" },
            manufacturer: { type: "string", maxLength: 100 },
            barcode: { type: "string", maxLength: 50 },
            dosageForm: { type: "string", maxLength: 100 },
            strength: { type: "string", maxLength: 100 },
            reorderLevel: { type: "number", minimum: 0 },
            description: { type: "string", maxLength: 500 },
            isActive: { type: "boolean", default: true },
          },
        },
        responses: { 201: ok("Created", ref("Medicine")), 409: errorResponse("Duplicate name/strength/brand or barcode") },
      }),
    },
    "/medicines/{id}": {
      get: op({ tag: "Medicines", summary: "Get a medicine", params: [idParam], responses: { 200: ok("Medicine", ref("Medicine")), 404: errorResponse("Not found") } }),
      put: op({
        tag: "Medicines",
        summary: "Update a medicine",
        params: [idParam],
        body: {
          type: "object",
          properties: {
            medicineName: { type: "string" },
            genericNameId: { type: "string" },
            categoryId: { type: "string" },
            brandId: { type: "string" },
            unitId: { type: "string" },
            manufacturer: { type: "string" },
            barcode: { type: "string" },
            dosageForm: { type: "string" },
            strength: { type: "string" },
            reorderLevel: { type: "number", minimum: 0 },
            description: { type: "string" },
            isActive: { type: "boolean" },
          },
        },
        responses: { 200: ok("Updated", ref("Medicine")), 404: errorResponse("Not found") },
      }),
      delete: op({ tag: "Medicines", summary: "Deactivate a medicine", params: [idParam], responses: { 200: ok("Deactivated"), 404: errorResponse("Not found") } }),
    },
    "/medicines/search": {
      get: op({
        tag: "Medicines",
        summary: "Search active medicines by literal substring",
        query: [{ name: "query", in: "query", required: true, schema: { type: "string" } }],
        responses: { 200: ok("Matching medicines", { type: "array", items: ref("Medicine") }) },
      }),
    },
    "/units": {
      get: op({ tag: "Medicines", summary: "List units", responses: { 200: ok("Units", { type: "array", items: { type: "object", additionalProperties: true } }) } }),
      post: op({ tag: "Medicines", summary: "Create a unit", body: lookupRequest(), responses: { 201: ok("Created") } }),
    },
    "/units/{id}": {
      get: op({ tag: "Medicines", summary: "Get a unit", params: [idParam], responses: { 200: ok("Unit") } }),
      put: op({ tag: "Medicines", summary: "Update a unit", params: [idParam], body: lookupUpdateRequest(), responses: { 200: ok("Updated") } }),
      delete: op({ tag: "Medicines", summary: "Delete a unit", params: [idParam], responses: { 200: ok("Deleted", ref("Success")), 409: errorResponse("Referenced by a medicine") } }),
    },
    ...lookupPaths("Medicines", "categories", "Lookup", "categories"),
    ...lookupPaths("Medicines", "brands", "Lookup", "brands"),
    ...lookupPaths("Medicines", "generic-names", "Lookup", "generic names"),

    "/suppliers": {
      get: op({ tag: "Suppliers", summary: "List suppliers", responses: { 200: ok("Suppliers", { type: "array", items: ref("Supplier") }) } }),
      post: op({ tag: "Suppliers", summary: "Create a supplier", body: ref("Supplier"), responses: { 201: ok("Created", ref("Supplier")), 409: errorResponse("Duplicate email or phone") } }),
    },
    "/suppliers/{id}": {
      get: op({ tag: "Suppliers", summary: "Get a supplier", params: [idParam], responses: { 200: ok("Supplier", ref("Supplier")), 404: errorResponse("Not found") } }),
      put: op({ tag: "Suppliers", summary: "Update a supplier", params: [idParam], body: ref("Supplier"), responses: { 200: ok("Updated", ref("Supplier")), 404: errorResponse("Not found") } }),
      delete: op({ tag: "Suppliers", summary: "Delete a supplier", params: [idParam], responses: { 200: ok("Deleted", ref("Success")), 409: errorResponse("Open purchase orders exist") } }),
    },

    "/customers": {
      get: op({
        tag: "Sales",
        summary: "List customers",
        query: [cursorParam, limitParam, searchParam, { name: "isActive", in: "query", schema: { type: "boolean" } }],
        responses: { 200: ok("Paginated customers", page(ref("Customer"))) },
      }),
      post: op({
        tag: "Sales",
        summary: "Create a customer",
        body: {
          type: "object",
          required: ["name"],
          properties: {
            name: { type: "string", maxLength: 100 },
            phone: { type: "string", maxLength: 20 },
            email: { type: "string", format: "email", maxLength: 200 },
            address: { type: "string", maxLength: 250 },
            isActive: { type: "boolean", default: true },
          },
        },
        responses: { 201: ok("Created", ref("Customer")) },
      }),
    },
    "/customers/{id}": {
      get: op({ tag: "Sales", summary: "Get a customer", params: [idParam], responses: { 200: ok("Customer", ref("Customer")), 404: errorResponse("Not found") } }),
      put: op({ tag: "Sales", summary: "Update a customer", params: [idParam], body: { type: "object", properties: { name: { type: "string" }, phone: { type: "string" }, email: { type: "string", format: "email" }, address: { type: "string" }, isActive: { type: "boolean" } } }, responses: { 200: ok("Updated", ref("Customer")), 404: errorResponse("Not found") } }),
      delete: op({ tag: "Sales", summary: "Delete a customer", params: [idParam], responses: { 200: ok("Deleted", ref("Success")), 404: errorResponse("Not found") } }),
    },

    "/config": {
      get: op({
        tag: "Configuration",
        summary: "Public workspace configuration",
        security: [],
        responses: {
          200: ok("Workspace configuration", {
            type: "object",
            properties: {
              reportingTimeZone: {
                type: "string",
                example: "Asia/Kathmandu",
              },
            },
          }),
        },
      }),
    },

    "/auth/register": {
      post: op({
        tag: "Authentication",
        summary: "Register a pharmacist account",
        security: [],
        body: {
          type: "object",
          required: ["name", "email", "password"],
          properties: {
            name: { type: "string", maxLength: 100 },
            email: { type: "string", format: "email" },
            password: { type: "string", minLength: 6, format: "password" },
          },
        },
        responses: { 201: ok("Verification email sent"), 409: errorResponse("Email already exists") },
      }),
    },
    "/auth/login": {
      post: op({
        tag: "Authentication",
        summary: "Sign in and set auth cookies",
        security: [],
        body: {
          type: "object",
          required: ["email", "password"],
          properties: {
            email: { type: "string", format: "email" },
            password: { type: "string", format: "password" },
          },
        },
        responses: {
          200: ok(
            "Authenticated; sets token and refreshToken cookies",
            ref("PublicUser"),
          ),
          401: errorResponse("Invalid email or password"),
          423: errorResponse("Account locked; Retry-After is set"),
        },
      }),
    },
    "/auth/refresh": {
      post: op({
        tag: "Authentication",
        summary: "Rotate the refresh token",
        security: [],
        responses: {
          200: ok("New cookies and rotated session", ref("PublicUser")),
          401: errorResponse("Invalid refresh token"),
        },
      }),
    },
    "/auth/logout": {
      post: op({ tag: "Authentication", summary: "Logout and revoke the current access token", security: [], responses: { 200: ok("Logged out") } }),
    },
    "/auth/logout-all": {
      post: op({ tag: "Authentication", summary: "Revoke every session", responses: { 200: ok("All sessions revoked") } }),
    },
    "/auth/verify-email": {
      post: op({ tag: "Authentication", summary: "Verify an email address", security: [], body: { type: "object", required: ["token"], properties: { token: { type: "string" } } }, responses: { 200: ok("Verified") } }),
    },
    "/auth/resend-verification": {
      post: op({ tag: "Authentication", summary: "Resend the verification email", security: [], body: { type: "object", required: ["email"], properties: { email: { type: "string", format: "email" } } }, responses: { 200: ok("Generic message") } }),
    },
    "/auth/forgot-password": {
      post: op({ tag: "Authentication", summary: "Request a password reset", security: [], body: { type: "object", required: ["email"], properties: { email: { type: "string", format: "email" } } }, responses: { 200: ok("Generic message") } }),
    },
    "/auth/reset-password": {
      post: op({ tag: "Authentication", summary: "Reset a password with a token", security: [], body: { type: "object", required: ["token", "password"], properties: { token: { type: "string" }, password: { type: "string", minLength: 6, format: "password" } } }, responses: { 200: ok("Password reset"), 400: errorResponse("Invalid or expired token") } }),
    },
    "/auth/me": {
      get: op({ tag: "Authentication", summary: "Current user", responses: { 200: ok("Current user", ref("PublicUser")) } }),
    },
    "/auth/me/preferences": {
      patch: op({
        tag: "Authentication",
        summary: "Update the current user's localization preferences",
        body: {
          type: "object",
          properties: {
            language: { type: "string", enum: ["en", "ne"] },
            calendarMode: { type: "string", enum: ["auto", "bs", "ad", "both"] },
          },
        },
        responses: {
          200: ok("Updated preferences", ref("PublicUser")),
          400: errorResponse("Invalid or empty preferences"),
          401: errorResponse("Unauthorized"),
        },
      }),
    },
    "/auth/sessions": {
      get: op({ tag: "Authentication", summary: "List active sessions", responses: { 200: ok("Sessions", { type: "array", items: { type: "object", additionalProperties: true } }) } }),
    },
    "/auth/sessions/{id}": {
      delete: op({ tag: "Authentication", summary: "Revoke a session", params: [idParam], responses: { 200: ok("Session revoked"), 404: errorResponse("Session not found") } }),
    },

    "/users": {
      get: op({ tag: "Users", summary: "List users", query: [cursorParam, limitParam, searchParam, { name: "role", in: "query", schema: { type: "string", enum: ["owner", "pharmacist", "inventory_manager"] } }, { name: "isActive", in: "query", schema: { type: "boolean" } }], responses: { 200: ok("Paginated users", page(ref("PublicUser"))) } }),
      post: op({ tag: "Users", summary: "Create a user (owner only)", body: { type: "object", required: ["name", "email", "password", "role"], properties: { name: { type: "string" }, email: { type: "string", format: "email" }, password: { type: "string", minLength: 6 }, role: { type: "string", enum: ["owner", "pharmacist", "inventory_manager"] } } }, responses: { 201: ok("Created", ref("PublicUser")), 403: errorResponse("Owner only") } }),
    },
    "/users/{id}": {
      get: op({ tag: "Users", summary: "Get a user", params: [idParam], responses: { 200: ok("User", ref("PublicUser")), 404: errorResponse("Not found") } }),
      put: op({ tag: "Users", summary: "Update a user (owner only)", params: [idParam], body: { type: "object", properties: { name: { type: "string" }, email: { type: "string", format: "email" }, password: { type: "string", minLength: 6 }, role: { type: "string", enum: ["owner", "pharmacist", "inventory_manager"] }, phone: { type: "string" }, isActive: { type: "boolean" } } }, responses: { 200: ok("Updated", ref("PublicUser")), 404: errorResponse("Not found") } }),
      delete: op({ tag: "Users", summary: "Delete a user (owner only)", params: [idParam], body: idBody(), responses: { 200: ok("Deleted", ref("Success")), 404: errorResponse("Not found") } }),
    },
    "/users/active": { get: op({ tag: "Users", summary: "List active users", responses: { 200: ok("Users", { type: "array", items: ref("PublicUser") }) } }) },
    "/users/inactive": { get: op({ tag: "Users", summary: "List inactive users", responses: { 200: ok("Users", { type: "array", items: ref("PublicUser") }) } }) },
    "/users/role/{role}": { get: op({ tag: "Users", summary: "List users by role", params: [roleParam], responses: { 200: ok("Users") } }) },
    "/users/role/{role}/status/{isActive}": { get: op({ tag: "Users", summary: "List users by role and status", params: [roleParam, isActiveParam], responses: { 200: ok("Users") } }) },
    "/users/role/{role}/last-login/{date}": { get: op({ tag: "Users", summary: "List users by role and last login", params: [roleParam, datePathParam], responses: { 200: ok("Users") } }) },
    "/users/status/{isActive}/last-login/{date}": { get: op({ tag: "Users", summary: "List users by status and last login", params: [isActiveParam, datePathParam], responses: { 200: ok("Users") } }) },
    "/users/last-login/{date}": { get: op({ tag: "Users", summary: "List users since a last-login date", params: [datePathParam], responses: { 200: ok("Users") } }) },
    "/users/{id}/toggleUserActivation": { patch: op({ tag: "Users", summary: "Toggle activation (owner only)", params: [idParam], responses: { 200: ok("Toggled"), 404: errorResponse("Not found") } }) },
    "/users/{id}/role": { patch: op({ tag: "Users", summary: "Change role (owner only)", params: [idParam], body: { type: "object", required: ["role"], properties: { role: { type: "string", enum: ["owner", "pharmacist", "inventory_manager"] } } }, responses: { 200: ok("Updated", ref("PublicUser")) } }) },
    "/users/{id}/reset-password": { post: op({ tag: "Users", summary: "Send an admin reset link (owner only)", params: [idParam], body: idBody(), responses: { 200: ok("Reset link sent"), 503: errorResponse("Email delivery unavailable") } }) },
    "/users/{id}/force-logout": { post: op({ tag: "Users", summary: "Revoke all sessions (owner only)", params: [idParam], body: idBody(), responses: { 200: ok("Sessions revoked") } }) },
    "/audit": {
      get: op({
        tag: "Users",
        summary: "Read audit rows (owner only)",
        query: [cursorParam, limitParam, { name: "action", in: "query", schema: { type: "string" } }, { name: "actorId", in: "query", schema: { type: "string" } }, { name: "entityType", in: "query", schema: { type: "string" } }, { name: "entityId", in: "query", schema: { type: "string" } }, { name: "status", in: "query", schema: { type: "string", enum: ["SUCCESS", "FAILURE"] } }, ...dateRangeParams],
        responses: { 200: ok("Paginated audit rows", page(ref("AuditLog"))) },
      }),
    },

    "/purchases": {
      get: op({ tag: "Purchases", summary: "List purchase orders", query: [cursorParam, limitParam, searchParam, { name: "status", in: "query", schema: { type: "string", enum: ["pending", "approved", "received", "cancelled"] } }, { name: "supplierId", in: "query", schema: { type: "string" } }, ...dateRangeParams], responses: { 200: ok("Paginated purchase orders", page(ref("PurchaseOrder"))) } }),
      post: op({ tag: "Purchases", summary: "Create a purchase order", body: { type: "object", required: ["supplierId", "orderDate", "invoiceNumber", "items"], properties: { supplierId: { type: "string" }, orderDate: { type: "string", format: "date-time" }, expectedDeliveryDate: { type: "string", format: "date-time" }, invoiceNumber: { type: "string" }, invoiceFile: { type: "string" }, discount: { type: "number", minimum: 0 }, VAT: { type: "number", minimum: 0, maximum: 100, default: 13 }, items: { type: "array", minItems: 1, items: { type: "object", required: ["medicineId", "quantity", "purchasePrice"], properties: { medicineId: { type: "string" }, quantity: { type: "number", minimum: 1 }, purchasePrice: { type: "number", minimum: 0 } } } } } }, responses: { 201: ok("Created", ref("PurchaseOrder")) } }),
    },
    "/purchases/{id}": {
      get: op({ tag: "Purchases", summary: "Get a purchase order with items", params: [idParam], responses: { 200: ok("Purchase order", ref("PurchaseOrder")), 404: errorResponse("Not found") } }),
      delete: op({ tag: "Purchases", summary: "Delete a purchase order", params: [idParam], responses: { 200: ok("Deleted"), 409: errorResponse("Received or batched orders cannot be deleted") } }),
    },
    "/purchases/{id}/cancel": { patch: op({ tag: "Purchases", summary: "Cancel a purchase order", params: [idParam], responses: { 200: ok("Cancelled"), 400: errorResponse("Already received") } }) },
    "/purchases/{id}/approve": { patch: op({ tag: "Purchases", summary: "Approve a purchase order", params: [idParam], responses: { 200: ok("Approved"), 400: errorResponse("Not pending or empty") } }) },
    "/purchases/{id}/receive": { post: op({ tag: "Purchases", summary: "Receive goods and create batches", params: [idParam], body: { type: "object", required: ["items"], properties: { items: { type: "array", minItems: 1, items: { type: "object", required: ["medicineId", "batchNumber", "expiryDate", "sellingPrice", "quantityReceived"], properties: { medicineId: { type: "string" }, batchNumber: { type: "string" }, manufacturingDate: { type: "string", format: "date-time" }, expiryDate: { type: "string", format: "date-time" }, sellingPrice: { type: "number" }, quantityReceived: { type: "number" }, remarks: { type: "string" } } } } } }, responses: { 200: ok("Received"), 400: errorResponse("Receive validation failed") } }) },
    "/purchases/{id}/recalculate": { patch: op({ tag: "Purchases", summary: "Recalculate and persist totals", params: [idParam], responses: { 200: ok("Recalculated") } }) },
    "/purchases/{id}/items": {
      get: op({ tag: "Purchases", summary: "List purchase items", params: [idParam], responses: { 200: ok("Items", { type: "array", items: ref("PurchaseOrderItem") }) } }),
      post: op({ tag: "Purchases", summary: "Add a purchase item", params: [idParam], body: { type: "object", required: ["medicineId", "quantity", "purchasePrice"], properties: { medicineId: { type: "string" }, quantity: { type: "number" }, purchasePrice: { type: "number" } } }, responses: { 201: ok("Added") } }),
    },
    "/purchases/{id}/items/{itemId}": {
      patch: op({ tag: "Purchases", summary: "Update a purchase item", params: [idParam, itemIdParam], body: { type: "object", properties: { quantity: { type: "number" }, purchasePrice: { type: "number" } } }, responses: { 200: ok("Updated") } }),
      delete: op({ tag: "Purchases", summary: "Remove a purchase item", params: [idParam, itemIdParam], responses: { 200: ok("Removed") } }),
    },
    "/purchases/supplier/{supplierId}": { get: op({ tag: "Purchases", summary: "List purchase orders for a supplier", params: [supplierIdParam], responses: { 200: ok("Purchase orders"), 404: errorResponse("Supplier not found") } }) },

    "/purchase-returns": {
      get: op({
        tag: "Purchases",
        summary: "List purchase returns",
        query: [cursorParam, limitParam, { name: "status", in: "query", schema: { type: "string", enum: ["PENDING", "APPROVED", "REJECTED", "CANCELLED", "COMPLETED"] } }, { name: "supplierId", in: "query", schema: { type: "string" } }, { name: "purchaseOrderId", in: "query", schema: { type: "string" } }, ...dateRangeParams],
        responses: { 200: ok("Paginated purchase returns", page(ref("PurchaseReturn"))) },
      }),
      post: op({
        tag: "Purchases",
        summary: "Create a pending supplier return",
        body: {
          type: "object",
          required: ["purchaseOrderId", "returnReason", "returnDate", "items"],
          properties: {
            purchaseOrderId: { type: "string" },
            returnReason: { type: "string", maxLength: 500 },
            returnDate: { type: "string", format: "date-time" },
            items: {
              type: "array",
              minItems: 1,
              items: {
                type: "object",
                required: ["batchId", "quantity"],
                properties: {
                  batchId: { type: "string" },
                  quantity: { type: "integer", minimum: 1 },
                  remarks: { type: "string", maxLength: 500 },
                },
              },
            },
          },
        },
        responses: { 201: ok("Created", ref("PurchaseReturn")), 400: errorResponse("Batch/order/quantity invalid") },
      }),
    },
    "/purchase-returns/{id}": {
      get: op({ tag: "Purchases", summary: "Get a purchase return", params: [idParam], responses: { 200: ok("Purchase return", ref("PurchaseReturn")), 404: errorResponse("Not found") } }),
    },
    "/purchase-returns/{id}/approve": { patch: op({ tag: "Purchases", summary: "Approve a purchase return", params: [idParam], responses: { 200: ok("Approved"), 409: errorResponse("Not pending") } }) },
    "/purchase-returns/{id}/reject": { patch: op({ tag: "Purchases", summary: "Reject a purchase return", params: [idParam], responses: { 200: ok("Rejected"), 409: errorResponse("Not pending") } }) },
    "/purchase-returns/{id}/cancel": { patch: op({ tag: "Purchases", summary: "Cancel a purchase return", params: [idParam], responses: { 200: ok("Cancelled"), 409: errorResponse("Not pending") } }) },
    "/purchase-returns/{id}/complete": { patch: op({ tag: "Purchases", summary: "Deduct batch stock and complete", params: [idParam], responses: { 200: ok("Completed"), 409: errorResponse("Not approved or insufficient stock") } }) },

    "/inventory": {
      get: op({ tag: "Inventory", summary: "List inventory rows", query: [cursorParam, limitParam, searchParam, { name: "stockStatus", in: "query", schema: { type: "string" } }, { name: "medicineId", in: "query", schema: { type: "string" } }], responses: { 200: ok("Paginated inventory", page(ref("Inventory"))) } }),
      post: op({ tag: "Inventory", summary: "Create an inventory row from batch truth", body: { type: "object", required: ["medicineId"], properties: { medicineId: { type: "string" }, reservedStock: { type: "number", minimum: 0 } } }, responses: { 201: ok("Created", ref("Inventory")), 409: errorResponse("Duplicate medicine") } }),
    },
    "/inventory/{id}": {
      get: op({ tag: "Inventory", summary: "Get an inventory row", params: [idParam], responses: { 200: ok("Inventory", ref("Inventory")), 404: errorResponse("Not found") } }),
      patch: op({ tag: "Inventory", summary: "Update reserved stock only", params: [idParam], body: { type: "object", required: ["reservedStock"], properties: { reservedStock: { type: "number", minimum: 0 } } }, responses: { 200: ok("Updated", ref("Inventory")) } }),
      delete: op({ tag: "Inventory", summary: "Delete an inventory row", params: [idParam], responses: { 200: ok("Deleted"), 409: errorResponse("Stock or reservations remain") } }),
    },
    "/inventory/medicine/{medicineId}": { get: op({ tag: "Inventory", summary: "Get inventory by medicine", params: [medicineIdParam], responses: { 200: ok("Inventory", ref("Inventory")), 404: errorResponse("Not found") } }) },
    "/inventory/medicines/search": { get: op({ tag: "Inventory", summary: "Search sellable medicines", query: [{ name: "query", in: "query", required: true, schema: { type: "string" } }], responses: { 200: ok("Matches") } }) },
    "/inventory/movements": { get: op({ tag: "Inventory", summary: "List stock movements", query: [cursorParam, limitParam, { name: "medicineId", in: "query", schema: { type: "string" } }, { name: "batchId", in: "query", schema: { type: "string" } }, { name: "referenceId", in: "query", schema: { type: "string" } }, { name: "movementType", in: "query", schema: { type: "string" } }, { name: "referenceType", in: "query", schema: { type: "string" } }, ...dateRangeParams], responses: { 200: ok("Paginated movements", page(ref("StockMovement"))) } }) },
    "/inventory/movements/{id}": { get: op({ tag: "Inventory", summary: "Get a movement", params: [idParam], responses: { 200: ok("Movement", ref("StockMovement")), 404: errorResponse("Not found") } }) },
    "/inventory/{medicineId}/increase": { post: op({ tag: "Inventory", summary: "Increase batch and aggregate stock", params: [medicineIdParam], body: ref("StockOperationRequest"), responses: { 200: ok("Increased") } }) },
    "/inventory/{medicineId}/decrease": { post: op({ tag: "Inventory", summary: "Decrease batch and aggregate stock", params: [medicineIdParam], body: ref("StockOperationRequest"), responses: { 200: ok("Decreased"), 409: errorResponse("Insufficient batch stock") } }) },
    "/inventory/{medicineId}/reserve": { post: op({ tag: "Inventory", summary: "Reserve stock", params: [medicineIdParam], body: ref("ReserveRequest"), responses: { 200: ok("Reserved"), 400: errorResponse("Exceeds available stock") } }) },
    "/inventory/{medicineId}/release": { post: op({ tag: "Inventory", summary: "Release reserved stock", params: [medicineIdParam], body: ref("ReserveRequest"), responses: { 200: ok("Released"), 400: errorResponse("Exceeds reserved stock") } }) },
    "/inventory/{medicineId}/sync": { post: op({ tag: "Inventory", summary: "Recompute the aggregate from batches", params: [medicineIdParam], body: { type: "object", properties: { remarks: { type: "string" } } }, responses: { 200: ok("Synced") } }) },

    "/sales": {
      get: op({ tag: "Sales", summary: "List sales", query: [cursorParam, limitParam, searchParam, { name: "status", in: "query", schema: { type: "string" } }, { name: "cashierId", in: "query", schema: { type: "string" } }, ...dateRangeParams], responses: { 200: ok("Paginated sales", page(ref("Sale"))) } }),
      post: op({ tag: "Sales", summary: "Create a sale with FEFO allocation", body: ref("SaleCreateRequest"), responses: { 201: ok("Created", ref("Sale")), 400: errorResponse("Empty cart, invalid discount, or insufficient stock") } }),
    },
    "/sales/{id}": {
      get: op({ tag: "Sales", summary: "Get a sale with items", params: [idParam], responses: { 200: ok("Sale with items", ref("Sale")), 404: errorResponse("Not found") } }),
      patch: op({ tag: "Sales", summary: "Update customer name or payment method", params: [idParam], body: { type: "object", properties: { customerName: { type: "string" }, paymentMethod: { type: "string", enum: ["CASH", "CARD", "QR", "Mobile Banking", "CREDIT"] } } }, responses: { 200: ok("Updated", ref("Sale")) } }),
      delete: op({ tag: "Sales", summary: "Delete a sale and restore stock", params: [idParam], responses: { 200: ok("Deleted"), 409: errorResponse("Returns exist") } }),
    },
    "/sales/{id}/invoice": {
      get: op({
        tag: "Sales",
        summary: "Print-ready invoice payload",
        params: [idParam],
        responses: { 200: ok("Sale, populated items, payments, summary", { type: "object", additionalProperties: true }), 404: errorResponse("Not found") },
      }),
    },
    "/sales/{id}/payments": {
      get: op({
        tag: "Sales",
        summary: "Payment ledger and outstanding balance",
        params: [idParam],
        responses: { 200: ok("Payments and summary", { type: "object", additionalProperties: true }) },
      }),
      post: op({
        tag: "Sales",
        summary: "Record a settlement",
        params: [idParam],
        body: {
          type: "object",
          required: ["amount", "method"],
          properties: {
            amount: { type: "number", minimum: 0.01 },
            method: { type: "string", enum: ["CASH", "CARD", "QR", "Mobile Banking", "CREDIT"] },
            reference: { type: "string", maxLength: 200 },
            idempotencyKey: { type: "string", minLength: 8, maxLength: 200 },
          },
        },
        responses: { 201: ok("Payment recorded", ref("Payment")), 400: errorResponse("Overpayment") },
      }),
    },
    "/sale-items": { get: op({ tag: "Sales", summary: "List sale items", responses: { 200: ok("Sale items", { type: "array", items: ref("SaleItem") }) } }) },
    "/sale-items/sales/{salesId}": { get: op({ tag: "Sales", summary: "List items for a sale", params: [{ name: "salesId", in: "path", required: true, schema: { type: "string" } }], responses: { 200: ok("Sale items") } }) },
    "/sale-items/{id}": {
      get: op({ tag: "Sales", summary: "Get a sale item", params: [idParam], responses: { 200: ok("Sale item", ref("SaleItem")), 404: errorResponse("Not found") } }),
      patch: op({ tag: "Sales", summary: "Correct a line price or discount", params: [idParam], body: { type: "object", properties: { unitPrice: { type: "number", minimum: 0 }, discount: { type: "number", minimum: 0 } } }, responses: { 200: ok("Updated"), 409: errorResponse("Returned lines cannot be corrected") } }),
    },
    "/returns": {
      get: op({ tag: "Sales", summary: "List returns", query: [cursorParam, limitParam, searchParam, { name: "status", in: "query", schema: { type: "string" } }, { name: "salesId", in: "query", schema: { type: "string" } }, ...dateRangeParams], responses: { 200: ok("Paginated returns", page(ref("Return"))) } }),
      post: op({ tag: "Sales", summary: "Create a return quote", body: ref("ReturnCreateRequest"), responses: { 201: ok("Created", ref("Return")), 400: errorResponse("Invalid quantity or date") } }),
    },
    "/returns/{id}": {
      get: op({ tag: "Sales", summary: "Get a return", params: [idParam], responses: { 200: ok("Return", ref("Return")), 404: errorResponse("Not found") } }),
      patch: op({ tag: "Sales", summary: "Update the return reason", params: [idParam], body: { type: "object", properties: { returnReason: { type: "string" } } }, responses: { 200: ok("Updated"), 409: errorResponse("Only PENDING returns can be edited") } }),
    },
    "/returns/{id}/approve": { patch: op({ tag: "Sales", summary: "Approve a return (owner/inventory manager)", params: [idParam], responses: { 200: ok("Approved"), 409: errorResponse("Invalid transition") } }) },
    "/returns/{id}/reject": { patch: op({ tag: "Sales", summary: "Reject a return (owner/inventory manager)", params: [idParam], responses: { 200: ok("Rejected"), 409: errorResponse("Invalid transition") } }) },
    "/returns/{id}/cancel": { patch: op({ tag: "Sales", summary: "Cancel a pending return", params: [idParam], responses: { 200: ok("Cancelled"), 409: errorResponse("Invalid transition") } }) },
    "/returns/{id}/complete": { patch: op({ tag: "Sales", summary: "Complete a return and apply stock/refund", params: [idParam], responses: { 200: ok("Completed"), 409: errorResponse("Invalid transition or quantity exceeded") } }) },
    "/returns/{id}/reverse": {
      patch: op({
        tag: "Sales",
        summary: "Reverse a completed return",
        description: "Owner/inventory manager. Deducts GOOD stock again, restores returned quantities, and reverses the refund ledger entry.",
        params: [idParam],
        body: { type: "object", properties: { reversalReason: { type: "string", minLength: 3, maxLength: 500 } } },
        responses: { 200: ok("Reversed", ref("Return")), 409: errorResponse("Not completed or already reversed") },
      }),
    },

    "/batches": {
      get: op({ tag: "Batches", summary: "List batches", query: [cursorParam, limitParam, searchParam, { name: "medicineId", in: "query", schema: { type: "string" } }, { name: "isExpired", in: "query", schema: { type: "boolean" } }, { name: "isActive", in: "query", schema: { type: "boolean" } }, { name: "expiringInDays", in: "query", schema: { type: "integer", minimum: 0 } }], responses: { 200: ok("Paginated batches", page(ref("Batch"))) } }),
      post: op({ tag: "Batches", summary: "Create a batch", body: ref("BatchCreateRequest"), responses: { 201: ok("Created", ref("Batch")) } }),
    },
    "/batches/{id}": {
      get: op({ tag: "Batches", summary: "Get a batch", params: [idParam], responses: { 200: ok("Batch", ref("Batch")), 404: errorResponse("Not found") } }),
      patch: op({ tag: "Batches", summary: "Update a batch", params: [idParam], body: ref("BatchUpdateRequest"), responses: { 200: ok("Updated", ref("Batch")) } }),
      delete: op({ tag: "Batches", summary: "Delete a zero-stock batch", params: [idParam], responses: { 200: ok("Deleted"), 409: errorResponse("Stock or references remain") } }),
    },
    "/batches/medicine/{medicineId}": { get: op({ tag: "Batches", summary: "List all batches for a medicine", params: [medicineIdParam], responses: { 200: ok("Batches", { type: "array", items: ref("Batch") }) } }) },
    "/batches/medicine/{medicineId}/available": { get: op({ tag: "Batches", summary: "List sellable batches", params: [medicineIdParam], responses: { 200: ok("Available batches", { type: "array", items: ref("Batch") }) } }) },
    "/batches/expired": { get: op({ tag: "Batches", summary: "List batches past expiry", responses: { 200: ok("Expired batches", { type: "array", items: ref("Batch") }) } }) },
    "/batches/expired/awaiting-disposal": { get: op({ tag: "Batches", summary: "List flagged expired batches with stock", responses: { 200: ok("Batches awaiting disposal") } }) },
    "/batches/low-stock": { get: op({ tag: "Batches", summary: "List low-stock batches", query: [{ name: "threshold", in: "query", schema: { type: "number", minimum: 0, default: 10 } }], responses: { 200: ok("Low-stock batches") } }) },
    "/batches/mark-expired": { post: op({ tag: "Batches", summary: "Flag expired batches", responses: { 200: ok("Flagged") } }) },
    "/batches/{id}/deduct": { post: op({ tag: "Batches", summary: "Deduct batch stock", params: [idParam], body: { type: "object", required: ["quantity"], properties: { quantity: { type: "integer", minimum: 1 }, remarks: { type: "string" } } }, responses: { 200: ok("Deducted"), 409: errorResponse("Insufficient stock") } }) },
    "/batches/{id}/increase": { post: op({ tag: "Batches", summary: "Increase batch stock", params: [idParam], body: { type: "object", required: ["quantity"], properties: { quantity: { type: "integer", minimum: 1 }, remarks: { type: "string" } } }, responses: { 200: ok("Increased"), 409: errorResponse("Exceeds received quantity") } }) },
    "/batches/{id}/adjust": { post: op({ tag: "Batches", summary: "Set batch stock to an absolute quantity", params: [idParam], body: { type: "object", required: ["quantity"], properties: { quantity: { type: "integer", minimum: 0 }, remarks: { type: "string" } } }, responses: { 200: ok("Adjusted") } }) },
    "/batches/{id}/history": { get: op({ tag: "Batches", summary: "Batch metadata and movements", params: [idParam], responses: { 200: ok("History") } }) },
    "/batches/{id}/confirm-disposal": { post: op({ tag: "Batches", summary: "Dispose expired stock", params: [idParam], body: { type: "object", properties: { remarks: { type: "string" } } }, responses: { 200: ok("Disposed"), 400: errorResponse("Batch is not expired or has no stock") } }) },

    "/smart-reorders": { get: op({ tag: "Smart reorders", summary: "List recommendations", responses: { 200: ok("Recommendations") } }) },
    "/smart-reorders/pending": { get: op({ tag: "Smart reorders", summary: "List pending recommendations", responses: { 200: ok("Pending") } }) },
    "/smart-reorders/medicine/{medicineId}": { get: op({ tag: "Smart reorders", summary: "Recommendations for a medicine", params: [medicineIdParam], responses: { 200: ok("Recommendations"), 404: errorResponse("Medicine not found") } }) },
    "/smart-reorders/{id}": {
      get: op({ tag: "Smart reorders", summary: "Get a recommendation", params: [idParam], responses: { 200: ok("Recommendation", ref("SmartReorder")), 404: errorResponse("Not found") } }),
      delete: op({ tag: "Smart reorders", summary: "Delete a recommendation (owner only)", params: [idParam], responses: { 200: ok("Deleted"), 404: errorResponse("Not found") } }),
    },
    "/smart-reorders/{id}/approve": { patch: op({ tag: "Smart reorders", summary: "Approve a recommendation", params: [idParam], responses: { 200: ok("Approved"), 400: errorResponse("Not pending") } }) },
    "/smart-reorders/{id}/reject": { patch: op({ tag: "Smart reorders", summary: "Reject a recommendation", params: [idParam], responses: { 200: ok("Rejected"), 400: errorResponse("Not pending") } }) },
    "/smart-reorders/generate": { post: op({ tag: "Smart reorders", summary: "Generate recommendations for all medicines", body: { type: "object", additionalProperties: true }, responses: { 200: ok("Generation results") } }) },
    "/smart-reorders/generate/{medicineId}": { post: op({ tag: "Smart reorders", summary: "Generate a recommendation for one medicine", params: [medicineIdParam], responses: { 201: ok("Recommendation", ref("SmartReorder")), 400: errorResponse("Not below reorder point or no history") } }) },

    "/notifications": {
      get: op({ tag: "Notifications", summary: "List all notifications", query: [cursorParam, limitParam], responses: { 200: ok("Paginated notifications", page(ref("Notification"))) } }),
      post: op({ tag: "Notifications", summary: "Create and dispatch a notification", body: { type: "object", required: ["title", "message", "type", "userIds"], properties: { title: { type: "string", maxLength: 200 }, message: { type: "string", maxLength: 5000 }, type: { type: "string", enum: ["Email", "SMS", "InApp"] }, userIds: { type: "array", minItems: 1, maxItems: 500, items: { type: "string" } } } }, responses: { 201: ok("Created"), 404: errorResponse("Recipient not found") } }),
    },
    "/notifications/me": { get: op({ tag: "Notifications", summary: "Current user's inbox", query: [cursorParam, limitParam], responses: { 200: ok("Inbox") } }) },
    "/notifications/me/read-all": { patch: op({ tag: "Notifications", summary: "Mark all own notifications read", responses: { 200: ok("Updated") } }) },
    "/notifications/me/{id}/read": { patch: op({ tag: "Notifications", summary: "Mark one notification read", params: [idParam], responses: { 200: ok("Marked read"), 404: errorResponse("Not found") } }) },
    "/notifications/preferences/me": {
      get: op({ tag: "Notifications", summary: "Get own preferences", responses: { 200: ok("Preferences") } }),
      patch: op({ tag: "Notifications", summary: "Update own preferences", body: { type: "object", properties: { email: { type: "boolean" }, sms: { type: "boolean" } } }, responses: { 200: ok("Updated") } }),
    },
    "/notifications/preferences/{userId}": {
      get: op({ tag: "Notifications", summary: "Get another user's preferences (self or owner)", params: [userIdParam], responses: { 200: ok("Preferences"), 403: errorResponse("Forbidden") } }),
      patch: op({ tag: "Notifications", summary: "Update another user's preferences (owner only)", params: [userIdParam], body: { type: "object", properties: { email: { type: "boolean" }, sms: { type: "boolean" } } }, responses: { 200: ok("Updated"), 403: errorResponse("Forbidden") } }),
    },
    "/notifications/user/{userId}": { get: op({ tag: "Notifications", summary: "Another user's inbox (role hierarchy)", params: [userIdParam], query: [cursorParam, limitParam], responses: { 200: ok("Inbox"), 403: errorResponse("Lower role") } }) },
    "/notifications/{id}": {
      get: op({ tag: "Notifications", summary: "Notification detail (owner/pharmacist)", params: [idParam], responses: { 200: ok("Notification", ref("Notification")), 404: errorResponse("Not found") } }),
      delete: op({ tag: "Notifications", summary: "Delete a notification", params: [idParam], responses: { 200: ok("Deleted"), 404: errorResponse("Not found") } }),
    },
    "/notifications/{id}/dispatch": { post: op({ tag: "Notifications", summary: "Dispatch eligible recipients (owner/pharmacist)", params: [idParam], query: [{ name: "force", in: "query", schema: { type: "string", enum: ["true", "false", "1", "0"] } }], responses: { 200: ok("Dispatched"), 404: errorResponse("Not found") } }) },
    "/notifications/{id}/retry": { post: op({ tag: "Notifications", summary: "Force-retry failed recipients (owner/pharmacist)", params: [idParam], responses: { 200: ok("Retried"), 404: errorResponse("Not found") } }) },

    "/dashboard": { get: op({ tag: "Dashboard", summary: "Combined cached dashboard payload", responses: { 200: ok("Dashboard") } }) },
    "/dashboard/summary": { get: op({ tag: "Dashboard", summary: "Headline metrics", responses: { 200: ok("Summary") } }) },
    "/dashboard/reorder": { get: op({ tag: "Dashboard", summary: "Reorder widget", responses: { 200: ok("Reorder summary") } }) },
    "/dashboard/expiry": { get: op({ tag: "Dashboard", summary: "Expiry widget", responses: { 200: ok("Expiry summary") } }) },
    "/dashboard/recent-activity": { get: op({ tag: "Dashboard", summary: "Recent stock movements", query: [{ name: "limit", in: "query", schema: { type: "integer", minimum: 1, default: 10 } }], responses: { 200: ok("Recent activity") } }) },
    "/dashboard/system-health": { get: op({ tag: "Dashboard", summary: "Stale background jobs", responses: { 200: ok("System health") } }) },
    "/dashboard/notifications": { get: op({ tag: "Dashboard", summary: "Notification delivery counts", responses: { 200: ok("Notification summary") } }) },
    "/dashboard/profit": { get: op({ tag: "Dashboard", summary: "COGS-based profit", responses: { 200: ok("Profit summary") } }) },
    "/dashboard/sales-comparison": { get: op({ tag: "Dashboard", summary: "Month-over-month sales", responses: { 200: ok("Sales comparison") } }) },
    "/dashboard/suppliers": { get: op({ tag: "Dashboard", summary: "Supplier counts", responses: { 200: ok("Supplier analytics") } }) },
    "/dashboard/sales": { get: op({ tag: "Dashboard", summary: "Yearly sales analytics", query: [{ name: "year", in: "query", schema: { type: "integer", minimum: 2000, maximum: 2100 } }], responses: { 200: ok("Sales analytics") } }) },
    "/dashboard/purchases": { get: op({ tag: "Dashboard", summary: "Purchase analytics", responses: { 200: ok("Purchase analytics") } }) },
    "/dashboard/inventory": { get: op({ tag: "Dashboard", summary: "Inventory analytics", responses: { 200: ok("Inventory analytics") } }) },
    "/dashboard/top-selling": { get: op({ tag: "Dashboard", summary: "Top-selling medicines", query: [{ name: "limit", in: "query", schema: { type: "integer", minimum: 1, default: 10 } }], responses: { 200: ok("Top-selling medicines") } }) },
  },
};

export const openApiSpec = swaggerSpec;
