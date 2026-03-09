# IPMS -- Domain Model

## Bounded Contexts

| Context | Responsibility | Key Entities |
|---------|---------------|-------------|
| **Assets** | IP asset lifecycle management | IPAsset |
| **Deadlines** | Due date tracking and completion | Deadline |
| **Documents** | Document storage and approval | Document |
| **Portfolio** | Logical grouping of assets | Portfolio |
| **Analytics** | Reporting and metrics (future) | -- |

## Entities

### IPAsset

| Field | Type | Description |
|-------|------|-------------|
| `id` | `AssetId` (branded string) | Unique identifier (UUID) |
| `title` | `string` | Human-readable name |
| `type` | `IPType` | `"patent"` \| `"trademark"` \| `"copyright"` \| `"design-right"` |
| `jurisdiction` | `Jurisdiction` | `{ code: string, name: string }` |
| `status` | `AssetStatus` | `"draft"` \| `"filed"` \| `"published"` \| `"granted"` \| `"expired"` \| `"abandoned"` |
| `filingDate` | `Date \| null` | When the asset was filed |
| `expirationDate` | `Date \| null` | When the asset expires |
| `owner` | `string` | Responsible person or entity |
| `organizationId` | `OrganizationId` (branded string) | Tenant scope |
| `createdAt` | `Date` | Creation timestamp |
| `updatedAt` | `Date` | Last modification timestamp |

### Deadline

| Field | Type | Description |
|-------|------|-------------|
| `id` | `DeadlineId` | Unique identifier (UUID) |
| `assetId` | `AssetId` | Associated asset |
| `type` | `DeadlineType` | `"renewal"` \| `"response"` \| `"filing"` \| `"review"` \| `"custom"` |
| `title` | `string` | Description of the deadline |
| `dueDate` | `Date` | When the deadline is due |
| `completed` | `boolean` | Whether the deadline has been met |
| `organizationId` | `OrganizationId` | Tenant scope |

### Document

| Field | Type | Description |
|-------|------|-------------|
| `id` | `DocumentId` | Unique identifier (UUID) |
| `assetId` | `AssetId` | Associated asset |
| `name` | `string` | Document name |
| `type` | `DocumentType` | `"filing"` \| `"correspondence"` \| `"certificate"` \| `"evidence"` \| `"other"` |
| `url` | `string` | Location of the document |
| `uploadedAt` | `Date` | Upload timestamp |
| `status` | `DocumentStatus` | `"uploaded"` \| `"under-review"` \| `"approved"` \| `"rejected"` |
| `organizationId` | `OrganizationId` | Tenant scope |

### Portfolio

| Field | Type | Description |
|-------|------|-------------|
| `id` | `PortfolioId` | Unique identifier (UUID) |
| `name` | `string` | Portfolio name |
| `description` | `string` | Purpose or scope |
| `assetIds` | `readonly AssetId[]` | Member assets |
| `owner` | `string` | Responsible person |
| `organizationId` | `OrganizationId` | Tenant scope |

## Value Objects

| Value Object | Package | Description |
|-------------|---------|-------------|
| `AssetId`, `DeadlineId`, `DocumentId`, `PortfolioId`, `OrganizationId` | `shared/brand.ts` | Branded string types preventing accidental misuse of IDs |
| `Result<T, E>` | `shared/result.ts` | Discriminated union for success/failure -- replaces exceptions for domain errors |
| `Jurisdiction` | `shared/types.ts` | `{ code: string, name: string }` -- represents a legal jurisdiction |
| `IPType`, `AssetStatus`, `DeadlineType`, `DocumentType`, `DocumentStatus` | `shared/types.ts` | Const-derived union types for exhaustive type checking |

## Status Transitions

### Asset Lifecycle

```
             +-------+
             | draft |
             +---+---+
                 |
          +------+------+
          v             v
       +------+    +---------+
       | filed |    |abandoned|
       +--+---+    +---------+
          |
     +----+----+
     v         v
+---------+ +-------+
|published| |granted|
+----+----+ +---+---+
     |          |
     v          v
 +-------+  +-------+
 |granted|  |expired|
 +---+---+  +-------+
     |
     v
 +-------+
 |expired|
 +-------+

Terminal states: expired, abandoned
Any non-terminal state (except granted) can transition to abandoned.
```

Valid transitions:

| From | To |
|------|-----|
| `draft` | `filed`, `abandoned` |
| `filed` | `published`, `granted`, `abandoned` |
| `published` | `granted`, `abandoned` |
| `granted` | `expired` |
| `expired` | (terminal) |
| `abandoned` | (terminal) |

### Document Approval

```
+----------+     +--------------+     +----------+
| uploaded | --> | under-review | --> | approved |
+----------+     +------+-------+     +----------+
                        |
                        v
                  +----------+
                  | rejected | ---> (back to under-review)
                  +----------+
```

| From | To |
|------|-----|
| `uploaded` | `under-review` |
| `under-review` | `approved`, `rejected` |
| `approved` | (terminal) |
| `rejected` | `under-review` |

### Filing Workflow

```
+-------+     +--------+     +----------+     +-----------+
| draft | --> | review | --> | approved | --> | submitted |
+-------+     +----+---+     +----------+     +-----------+
                   |
                   v
              +----------+
              | rejected | ---> (back to review)
              +----------+
```

## Domain Rules / Invariants

1. **Non-empty titles**: Asset title, deadline title, document name, and portfolio name must be non-empty (after trimming).
2. **Non-empty owner**: Asset owner and portfolio owner must be non-empty.
3. **Valid jurisdiction**: Jurisdiction code and name are both required.
4. **Non-empty document URL**: Documents must have a URL.
5. **Status transition validation**: Asset status changes must follow the defined transition graph. Invalid transitions return an error.
6. **Document status transition validation**: Document status changes follow their own transition graph.
7. **Deadline idempotency**: A deadline that is already completed cannot be completed again.
8. **Portfolio uniqueness**: An asset cannot be added to a portfolio it is already in. Removing an asset not in the portfolio is an error.
9. **ID format**: All entity IDs must be valid UUIDs (validated via branded type parsers).
10. **Organization scoping**: All repository operations are scoped by `OrganizationId` -- entities from different organizations are isolated.
11. **Immutable entities**: All entity interfaces use `readonly` fields. Updates produce new objects rather than mutating existing ones.
12. **New assets start in draft**: The `createAsset` function always sets initial status to `"draft"`.
13. **New documents start as uploaded**: The `createDocument` function always sets initial status to `"uploaded"`.
14. **New deadlines start incomplete**: The `createDeadline` function always sets `completed` to `false`.
