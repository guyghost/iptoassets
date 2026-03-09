# IPMS -- Product Requirements Document

## Vision

IPMS (Intellectual Property Management System) is a modern, workflow-driven platform for managing intellectual property assets throughout their lifecycle. It enables IP teams to track patents, trademarks, copyrights, and design rights from initial draft through filing, grant, and expiration -- with deadline management, document handling, and portfolio organization built in.

## Target Users

### Personas

| Persona | Role | Key Needs |
|---------|------|-----------|
| **IP Manager** | Day-to-day portfolio operations | Asset CRUD, deadline tracking, status updates, portfolio views |
| **Patent Attorney** | Legal review and filing | Document review/approval workflows, filing workflow orchestration, status transitions |
| **Innovation Lead** | Strategic oversight | Portfolio analytics, asset grouping, high-level status dashboards |
| **Legal Ops** | Process and compliance | Deadline compliance, workflow automation, audit trails, reporting |

## Core Features (MVP)

### Asset Management
- Create, read, update, and delete IP assets (patents, trademarks, copyrights, design rights)
- Track asset status through lifecycle: draft -> filed -> published -> granted -> expired/abandoned
- Associate assets with jurisdictions and organizations
- Validate all status transitions against domain rules

### Deadline Tracking
- Create deadlines linked to specific assets (renewal, response, filing, review, custom)
- Mark deadlines as completed
- List deadlines by asset for at-a-glance tracking

### Document Management
- Upload and associate documents with assets (filing, correspondence, certificate, evidence, other)
- Document approval workflow: uploaded -> under-review -> approved/rejected
- Rejected documents can be resubmitted for review

### Portfolio Grouping
- Create named portfolios to organize assets
- Add/remove assets from portfolios
- View portfolio contents

## Future Features

| Feature | Description |
|---------|-------------|
| **Portfolio Analytics** | Asset counts by status, type, jurisdiction; deadline compliance rates; portfolio health scores |
| **AI Patent Analysis** | Automated prior art search, claim analysis, patentability assessment |
| **RBAC** | Role-based access control with granular permissions per organization |
| **Multi-tenant** | Full tenant isolation with per-organization data boundaries |
| **Notifications** | Email/in-app alerts for approaching deadlines, status changes, review requests |
| **Audit Log** | Immutable record of all entity changes with user attribution |
| **External Integrations** | Patent office APIs (USPTO, EPO, WIPO), document storage (S3), identity providers |

## Success Metrics

| Metric | Target |
|--------|--------|
| Asset creation to filing time | < 5 business days |
| Missed deadline rate | < 2% |
| Document review turnaround | < 48 hours |
| System uptime | 99.9% |
| User adoption (active weekly users / total users) | > 80% |
| Portfolio coverage (assets in at least one portfolio) | > 95% |
