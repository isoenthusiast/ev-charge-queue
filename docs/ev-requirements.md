# EV charging scope and acceptance

Requested 4 October 2026, Malaysia. Reuse the tested starter to build a mobile web app.

| Requirement | Implementation |
| --- | --- |
| Users assigned to locations | location_members, composite key, per-location role |
| Multiple chargers per location | chargers with connector, kW, status |
| Users own cars | cars.user_id; booking ownership checked server-side |
| Half-hour reservations/release | bookings.slot_start, 30-minute grid, released history retained |
| Car mapped to charger/session | bookings holds car, owner, charger, planned and actual times |
| Location admins | scoped permissions; creator first admin; last-admin guard |
| Manual charger/session changes | reason-required admin forms and append-only application audit |
| User fault report and admin verification | pending → verified/dismissed; reporter and reviewer recorded |
| Faulty charger cannot be booked | serialized status check; UI disabled; repair re-enables |
| Mobile use | responsive cards, 46px controls, native date inputs; mobile browser tests |

Defaults: Malaysia timezone, reservations up to 14 days ahead, existing private accounts added by email, any account can create a location, no public signup. Verification cancels future bookings and ends active sessions to avoid stale reservations. Other users' vehicle plates are hidden from ordinary members. There is no walk-in waiting list, recurring booking, payments, remote charger control or energy billing.

Authorization is checked on every write and location read, including forged HTTP requests. Changes within a location lock the location row before checking membership and charger availability. Partial unique indexes independently reject double bookings and multiple active sessions. All queries use bindings/query builders.

Manual admin corrections can change recorded session state/start/end, but cannot place an active session on a faulty charger or cause overlapping reservations. To move a booking, cancel it and make a new reservation. Actual session timestamps cannot be future-dated or reversed.
