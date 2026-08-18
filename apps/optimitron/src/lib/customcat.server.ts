import { serverEnv } from "@/lib/env";

const CUSTOMCAT_API_BASE_URL = "https://customcat-beta.mylocker.net/api/v1";
const CUSTOMCAT_DEFAULT_SHIPPING_METHOD = "Economy";
const CUSTOMCAT_ORDER_SUCCESS_MESSAGE = "Order added successfully";

export const CUSTOMCAT_ENDPOINTS = {
  order: (externalId: string) =>
    `${CUSTOMCAT_API_BASE_URL}/order/${encodeURIComponent(externalId)}`,
  orderStatus: (externalId: string) =>
    `${CUSTOMCAT_API_BASE_URL}/order/status/${encodeURIComponent(externalId)}`,
  shippingMethods: `${CUSTOMCAT_API_BASE_URL}/shipping`,
  shippingQuote: (shippingId: string) =>
    `${CUSTOMCAT_API_BASE_URL}/shipping/${encodeURIComponent(shippingId)}`,
  webhook: `${CUSTOMCAT_API_BASE_URL}/webhook`,
  webhookById: (webhookId: string) =>
    `${CUSTOMCAT_API_BASE_URL}/webhook/${encodeURIComponent(webhookId)}`,
};

export const CUSTOMCAT_WEBHOOK_TOPICS = [
  "order-shipped",
  "order-partial-shipment",
  "product-created",
  "product-deleted",
  "product-updated",
  "design-rejected",
] as const;

type CustomCatRecord = Record<string, unknown>;

export type CustomCatWebhookTopic = (typeof CUSTOMCAT_WEBHOOK_TOPICS)[number];

export interface CustomCatConfig {
  apiToken: string;
  sandbox: boolean;
}

export interface CustomCatAddress {
  city: string;
  country: string;
  email: string;
  firstName: string;
  lastName: string;
  line1: string;
  line2?: string | null;
  phone: string;
  postalCode: string;
  state: string;
}

export interface SubmitCustomCatOrderInput {
  backDesignUrl: string;
  catalogSku: string | number;
  externalOrderId: string;
  frontDesignUrl: string;
  quantity?: number;
  shipping: CustomCatAddress;
  shippingMethod?: string;
}

export interface CustomCatOrderResult {
  message?: string;
  orderId?: string;
  customCatOrderId?: string;
  payload: Record<string, unknown>;
  response: unknown;
}

export interface CustomCatOrderStatus {
  ORDER_ID?: string;
  CUSTOMCAT_ORDER_ID?: string;
  ORDER_DATE?: string;
  ORDER_STATUS?: string;
  CUSTOMER_NAME?: string;
  CUSTOMER_ADDRESS1?: string;
  CUSTOMER_CITY?: string;
  CUSTOMER_STATE?: string;
  CUSTOMER_COUNTRY?: string;
  CUSTOMER_ZIP?: string;
  ORDER_TOTAL?: string;
  SHIPMENTS?: CustomCatRecord[];
  LINE_ITEMS?: CustomCatRecord[];
  response: unknown;
}

export interface CustomCatShippingMethod {
  SHIPPING_ID: string;
  SHIPPING_NAME: string;
}

export interface CustomCatShippingQuoteAddress {
  city: string;
  country: string;
  firstName: string;
  lastName: string;
  line1: string;
  line2?: string | null;
  postalCode: string;
  state: string;
}

export interface CustomCatShippingQuoteItemInput {
  catalogSku: string | number;
  quantity?: number;
}

export interface CustomCatShippingQuoteInput {
  items: CustomCatShippingQuoteItemInput[];
  shipping: CustomCatShippingQuoteAddress;
  shippingId?: string | number;
  shippingMethod?: string;
}

export interface CustomCatShippingQuoteResult {
  payload: Record<string, unknown>;
  response: unknown;
  shippingCost?: string;
  shippingId: string;
  shippingName?: string;
}

export interface CustomCatWebhookResult {
  payload?: Record<string, unknown>;
  response: unknown;
  topic?: string;
  url?: string;
  webhookId?: string;
}

export interface CustomCatWebhookListResult {
  response: unknown;
  webhooks: unknown[];
}

export function getCustomCatConfig(): CustomCatConfig {
  return {
    apiToken: serverEnv.CUSTOMCAT_API_TOKEN ?? "",
    sandbox: serverEnv.CUSTOMCAT_SANDBOX !== "0",
  };
}

export function isCustomCatConfigured(config: CustomCatConfig = getCustomCatConfig()) {
  return Boolean(config.apiToken);
}

function parseCustomCatIntegerString(value: unknown, fieldName = "CustomCat catalog_sku") {
  const parsed =
    typeof value === "number"
      ? value
      : typeof value === "string" && value.trim()
        ? Number(value.trim())
        : NaN;

  if (!Number.isSafeInteger(parsed) || parsed <= 0) {
    throw new Error(`${fieldName} must be a positive integer.`);
  }

  return String(parsed);
}

function getStringField(response: unknown, fieldName: string): string | undefined {
  if (!response || typeof response !== "object") return undefined;
  const record = response as CustomCatRecord;
  const value = record[fieldName];
  if (typeof value === "string" || typeof value === "number") return String(value);
  return undefined;
}

function getArrayField(response: unknown, fieldName: string): CustomCatRecord[] | undefined {
  if (!response || typeof response !== "object") return undefined;
  const record = response as CustomCatRecord;
  const value = record[fieldName];
  if (!Array.isArray(value)) return undefined;
  return value.filter(
    (item): item is CustomCatRecord =>
      !!item && typeof item === "object" && !Array.isArray(item),
  );
}

function getRequiredShippingPhone(shipping: CustomCatAddress) {
  const phone = shipping.phone?.trim();
  if (!phone) {
    throw new Error("shipping_phone is required before submitting CustomCat orders.");
  }
  return phone;
}

function parseOrderResult(
  response: unknown,
  payload: Record<string, unknown>,
): CustomCatOrderResult {
  return {
    message: getStringField(response, "MSG"),
    orderId: getStringField(response, "ORDER_ID"),
    customCatOrderId: getStringField(response, "CUSTOMCAT_ORDER_ID"),
    payload,
    response,
  };
}

function parseOrderStatus(response: unknown): CustomCatOrderStatus {
  const result: CustomCatOrderStatus = { response };
  for (const fieldName of [
    "ORDER_ID",
    "CUSTOMCAT_ORDER_ID",
    "ORDER_DATE",
    "ORDER_STATUS",
    "CUSTOMER_NAME",
    "CUSTOMER_ADDRESS1",
    "CUSTOMER_CITY",
    "CUSTOMER_STATE",
    "CUSTOMER_COUNTRY",
    "CUSTOMER_ZIP",
    "ORDER_TOTAL",
  ] as const) {
    const value = getStringField(response, fieldName);
    if (value) result[fieldName] = value;
  }
  const shipments = getArrayField(response, "SHIPMENTS");
  if (shipments) result.SHIPMENTS = shipments;
  const lineItems = getArrayField(response, "LINE_ITEMS");
  if (lineItems) result.LINE_ITEMS = lineItems;
  return result;
}

function parseShippingMethods(response: unknown): CustomCatShippingMethod[] {
  if (!Array.isArray(response)) return [];
  return response
    .map((item) => {
      if (!item || typeof item !== "object" || Array.isArray(item)) return null;
      const shippingId = getStringField(item, "SHIPPING_ID");
      const shippingName = getStringField(item, "SHIPPING_NAME");
      if (!shippingId || !shippingName) return null;
      return {
        SHIPPING_ID: shippingId,
        SHIPPING_NAME: shippingName,
      };
    })
    .filter((item): item is CustomCatShippingMethod => item !== null);
}

function getShippingCost(response: unknown): string | undefined {
  for (const fieldName of [
    "SHIPPING_COST",
    "SHIPPING_PRICE",
    "SHIPPING_TOTAL",
    "ORDER_SHIPPING",
    "PRICE",
    "COST",
    "TOTAL",
  ]) {
    const value = getStringField(response, fieldName);
    if (value) return value;
  }
  if (typeof response === "string" || typeof response === "number") return String(response);
  return undefined;
}

async function parseCustomCatResponse(response: Response, failurePrefix: string) {
  const text = await response.text();
  const parsedResponse = text ? tryParseJson(text) : null;

  if (!response.ok) {
    const message = response.headers.get("x-fail-message") ?? text;
    throw new Error(`${failurePrefix}: ${response.status} ${message}`.trim());
  }

  return parsedResponse;
}

function getWebhookId(response: unknown) {
  return getStringField(response, "WEBHOOK_ID") ?? getStringField(response, "webhook_id");
}

function buildWebhookResult(
  response: unknown,
  payload?: Record<string, unknown>,
): CustomCatWebhookResult {
  return {
    payload,
    response,
    topic: getStringField(response, "TOPIC") ?? getStringField(response, "topic"),
    url: getStringField(response, "URL") ?? getStringField(response, "url"),
    webhookId: getWebhookId(response),
  };
}

export async function submitCustomCatOrder(
  input: SubmitCustomCatOrderInput,
  config: CustomCatConfig = getCustomCatConfig(),
): Promise<CustomCatOrderResult> {
  if (!config.apiToken) {
    throw new Error("CUSTOMCAT_API_TOKEN is required before submitting shirt orders.");
  }

  const catalogSku = parseCustomCatIntegerString(input.catalogSku);
  const shippingPhone = getRequiredShippingPhone(input.shipping);
  const payload = {
    api_key: config.apiToken,
    shipping_first_name: input.shipping.firstName,
    shipping_last_name: input.shipping.lastName,
    shipping_address1: input.shipping.line1,
    shipping_address2: input.shipping.line2 ?? "",
    shipping_city: input.shipping.city,
    shipping_state: input.shipping.state,
    shipping_zip: input.shipping.postalCode,
    shipping_country: input.shipping.country,
    shipping_email: input.shipping.email,
    shipping_phone: shippingPhone,
    shipping_method: input.shippingMethod ?? CUSTOMCAT_DEFAULT_SHIPPING_METHOD,
    items: [
      {
        catalog_sku: String(catalogSku),
        design_url: input.frontDesignUrl,
        design_url_back: input.backDesignUrl,
        quantity: input.quantity ?? 1,
      },
    ],
    sandbox: config.sandbox ? "1" : "0",
  };

  const response = await fetch(CUSTOMCAT_ENDPOINTS.order(input.externalOrderId), {
    body: JSON.stringify(payload),
    headers: { "Content-Type": "application/json" },
    method: "POST",
  });
  const parsedResponse = await parseCustomCatResponse(response, "CustomCat order failed");
  const result = parseOrderResult(parsedResponse, payload);

  if (result.message !== CUSTOMCAT_ORDER_SUCCESS_MESSAGE) {
    throw new Error(
      `CustomCat order failed: unexpected MSG ${JSON.stringify(result.message)}`,
    );
  }

  return result;
}

export async function getCustomCatOrderStatus(
  externalId: string,
  config: CustomCatConfig = getCustomCatConfig(),
): Promise<CustomCatOrderStatus> {
  if (!config.apiToken) {
    throw new Error("CUSTOMCAT_API_TOKEN is required before checking shirt order status.");
  }

  const url = new URL(CUSTOMCAT_ENDPOINTS.orderStatus(externalId));
  url.searchParams.set("api_key", config.apiToken);

  const response = await fetch(url.toString(), { method: "GET" });
  const parsedResponse = await parseCustomCatResponse(
    response,
    "CustomCat order status failed",
  );
  return parseOrderStatus(parsedResponse);
}

export async function getCustomCatShippingMethods(
  config: CustomCatConfig = getCustomCatConfig(),
): Promise<CustomCatShippingMethod[]> {
  if (!config.apiToken) {
    throw new Error("CUSTOMCAT_API_TOKEN is required before checking shipping methods.");
  }

  const url = new URL(CUSTOMCAT_ENDPOINTS.shippingMethods);
  url.searchParams.set("api_key", config.apiToken);

  const response = await fetch(url.toString(), { method: "GET" });
  const parsedResponse = await parseCustomCatResponse(
    response,
    "CustomCat shipping methods failed",
  );
  return parseShippingMethods(parsedResponse);
}

export async function getCustomCatShippingQuote(
  input: CustomCatShippingQuoteInput,
  config: CustomCatConfig = getCustomCatConfig(),
): Promise<CustomCatShippingQuoteResult> {
  if (!config.apiToken) {
    throw new Error("CUSTOMCAT_API_TOKEN is required before checking shipping quotes.");
  }
  if (!input.items.length) {
    throw new Error("At least one item is required before checking CustomCat shipping quotes.");
  }

  const shippingMethods = await getCustomCatShippingMethods(config);
  const requestedShippingId =
    input.shippingId === undefined ? undefined : String(input.shippingId);
  const shippingMethod =
    (requestedShippingId
      ? shippingMethods.find((method) => method.SHIPPING_ID === requestedShippingId)
      : shippingMethods.find(
          (method) =>
            method.SHIPPING_NAME.toLowerCase() ===
            (input.shippingMethod ?? CUSTOMCAT_DEFAULT_SHIPPING_METHOD).toLowerCase(),
        )) ?? null;

  if (!shippingMethod && !requestedShippingId) {
    throw new Error(
      `CustomCat shipping method ${input.shippingMethod ?? CUSTOMCAT_DEFAULT_SHIPPING_METHOD} was not found.`,
    );
  }

  const shippingId = shippingMethod?.SHIPPING_ID ?? requestedShippingId;
  if (!shippingId) {
    throw new Error("CustomCat shipping_id is required before checking shipping quotes.");
  }

  const payload = {
    api_key: config.apiToken,
    shipping_first_name: input.shipping.firstName,
    shipping_last_name: input.shipping.lastName,
    shipping_address1: input.shipping.line1,
    shipping_address2: input.shipping.line2 ?? "",
    shipping_city: input.shipping.city,
    shipping_state: input.shipping.state,
    shipping_zip: input.shipping.postalCode,
    shipping_country: input.shipping.country,
    items: input.items.map((item) => ({
      catalog_sku: String(item.catalogSku),
      quantity: item.quantity ?? 1,
    })),
  };

  const response = await fetch(CUSTOMCAT_ENDPOINTS.shippingQuote(shippingId), {
    body: JSON.stringify(payload),
    headers: { "Content-Type": "application/json" },
    method: "POST",
  });
  const parsedResponse = await parseCustomCatResponse(
    response,
    "CustomCat shipping quote failed",
  );

  return {
    payload,
    response: parsedResponse,
    shippingCost: getShippingCost(parsedResponse),
    shippingId,
    shippingName: shippingMethod?.SHIPPING_NAME,
  };
}

export async function listCustomCatWebhooks(
  config: CustomCatConfig = getCustomCatConfig(),
): Promise<CustomCatWebhookListResult> {
  if (!config.apiToken) {
    throw new Error("CUSTOMCAT_API_TOKEN is required before listing CustomCat webhooks.");
  }

  const url = new URL(CUSTOMCAT_ENDPOINTS.webhook);
  url.searchParams.set("api_key", config.apiToken);

  const response = await fetch(url.toString(), { method: "GET" });
  const parsedResponse = await parseCustomCatResponse(
    response,
    "CustomCat webhook list failed",
  );

  return {
    response: parsedResponse,
    webhooks: Array.isArray(parsedResponse) ? parsedResponse : [],
  };
}

export async function createCustomCatWebhook(
  topic: CustomCatWebhookTopic,
  url: string,
  config: CustomCatConfig = getCustomCatConfig(),
): Promise<CustomCatWebhookResult> {
  if (!config.apiToken) {
    throw new Error("CUSTOMCAT_API_TOKEN is required before creating CustomCat webhooks.");
  }

  const payload = {
    api_key: config.apiToken,
    topic,
    url,
  };
  const response = await fetch(CUSTOMCAT_ENDPOINTS.webhook, {
    body: JSON.stringify(payload),
    headers: { "Content-Type": "application/json" },
    method: "POST",
  });
  const parsedResponse = await parseCustomCatResponse(
    response,
    "CustomCat webhook create failed",
  );
  return buildWebhookResult(parsedResponse, payload);
}

export async function updateCustomCatWebhook(
  webhookId: string,
  url: string,
  config: CustomCatConfig = getCustomCatConfig(),
): Promise<CustomCatWebhookResult> {
  if (!config.apiToken) {
    throw new Error("CUSTOMCAT_API_TOKEN is required before updating CustomCat webhooks.");
  }

  const payload = {
    api_key: config.apiToken,
    url,
  };
  const response = await fetch(CUSTOMCAT_ENDPOINTS.webhookById(webhookId), {
    body: JSON.stringify(payload),
    headers: { "Content-Type": "application/json" },
    method: "PUT",
  });
  const parsedResponse = await parseCustomCatResponse(
    response,
    "CustomCat webhook update failed",
  );
  return buildWebhookResult(parsedResponse, payload);
}

function tryParseJson(value: string) {
  try {
    return JSON.parse(value) as unknown;
  } catch {
    return value;
  }
}
