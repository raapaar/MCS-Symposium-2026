# V2 prototype rules and receipt review

Rules syntax was compiled by the local Firestore emulator. Positive and negative
cases were run against `demo-mcs-v2`; no live Firebase project was used.
The default database and existing client SDK are retained. Remote instance edition
was not verified, and no schema provisioning/migration was attempted.

## Schema/access analysis

All existing public collections use published-only reads. Their managers issue
unfiltered collection reads and date/order sorting, which remain available to
active staff, legacy admins and superusers. Legacy content document shapes are
retained rather than retroactively rejecting existing records.

New public catalogue queries filter merchandise by `published == true`.
Customer order queries filter `ownerId == auth.uid`; staff may list all orders.
Appearance is an explicit public, non-secret document. Accounts, service registers
and handover records have separate rules; staff cannot edit ownership settings.
Role documents are checked on the server and in Firestore, including suspension.

Every new create/update path calls a domain validator. All new strings, numbers,
map values and allowed fields are bounded. Order ownership, price, quantity and
creation time cannot change after booking. Staff and customer updates use separate
field allowlists and transitions. The customer cannot mark an order paid.

## Attack review

| Attempt | Result/evidence |
| --- | --- |
| Public list leaking drafts | Rejected: unfiltered merchandise query/draft get; published query succeeds. |
| Read another customer's order | Rejected; owner-scoped query succeeds; staff list succeeds. |
| Create with a forged owner | Rejected. |
| Change owner after creation | Rejected by update allowlist. |
| Forge unit/total price or use negative values | Rejected against current published product and bounded arithmetic. |
| Quantity zero, fractional or over 25 | Rejected by rules/model tests. |
| Omit a required field | Rejected on create and update. |
| Oversized text on create/update | Rejected for tested contact, product description and register notes; other new strings have explicit bounds reviewed in source. |
| Add undefined order fields | Rejected by exact field allowlist. |
| Submit a receipt before confirmation | Rejected by rules and Worker. |
| Mark customer booking paid directly | Rejected. Staff verification succeeds only from awaiting_verification. |
| Change price while verifying | Rejected by immutable-field allowlist. |
| Reopen paid booking as customer | Rejected. |
| Receipt path belonging to another owner | Rejected by rules and Worker. |
| Timestamp chosen in the past | Rejected on create; creation time cannot be updated. |
| Out-of-range location coordinates | Rejected. No location is required. |
| Self-promote through users collection | Rejected. Staff cannot provision privileged roles. |
| Staff edit of appearance or private ownership register | Rejected; superuser valid writes succeed. |
| Customer read of another account document | Rejected. Superuser account management is explicitly authorized by the requested product scope. |
| Superuser disabling/editing its own role through the app | Rejected. New superuser provisioning is reserved for the controlled departmental process. |
| Suspended staff listing orders or downloading receipts | Rejected. |
| Path traversal in receipt API | Rejected before storage access. |
| JPEG/PNG/PDF MIME spoofing | Invalid signatures rejected. Signature checks are not malware scanning. |
| Public/cached receipt access | No public receipt route; private bucket binding; downloads use private/no-store, Authorization variance, nosniff and attachment headers. |
| Guessing a private storage key | The API accepts a booking ID, reads its authorized record, and derives the stored path. It does not serve caller-supplied object paths. |
| Subcollections and unspecified paths | Default-denied: no recursive/wildcard grant applies to them. Source reviewed. |
| Vote/counter replay | Not applicable; this implementation does not accept client-written visit counters. |
| Query mismatch | Actual catalogue, owner-order and staff queries tested; legacy content query structure preserved. |
| Application integration bypass | Worker verifies Firebase JWTs and uses caller-scoped Firestore REST reads; positive/negative API tests use signed test JWTs and mocked service replies. Real-service acceptance remains required. |

## Remaining review boundaries

The tests establish the selected prototype behaviors, not exhaustive security.
Existing legacy content writes retain their previous broad staff-edit schemas.
They have not been comprehensively hardened by this overhaul. Staff are trusted to
verify the bank transaction before choosing Paid. Uploading bytes alone neither
changes payment state nor confirms bank settlement.

The private bucket must be provisioned with public access disabled. Before actual
release, review retention, deletion/orphan cleanup, abuse controls and the existing
dependency advisories with the department's operators. Account access suspension
removes staff privileges; it does not delete the Firebase Auth identity. Domain
records do not renew a domain, and handover records do not automatically transfer
credentials or change superuser roles.

No live deployment, remote rules validation/deployment, account change, billing
change or provider-secret configuration was performed.
