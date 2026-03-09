declare const __brand: unique symbol;

export type Brand<T, B extends string> = T & { readonly [__brand]: B };

export type AssetId = Brand<string, "AssetId">;
export type DeadlineId = Brand<string, "DeadlineId">;
export type DocumentId = Brand<string, "DocumentId">;
export type PortfolioId = Brand<string, "PortfolioId">;
export type OrganizationId = Brand<string, "OrganizationId">;
export type StatusChangeEventId = Brand<string, "StatusChangeEventId">;
