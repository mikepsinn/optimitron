# Cron schedules

`apps/optimitron/vercel.json` sets the production schedules. Times are UTC.
These schedules suit low traffic. They reduce daily calls from 681 to 79,
plus the unchanged weekly and monthly calls.

| Job | Schedule | Expected delay |
| --- | --- | --- |
| Scheduled task triggers | Daily, 10:00 | Up to one day; current hygiene jobs run at 09:00, 09:30, or Monday 10:00 |
| Push reminders | Hourly | Up to one hour, subject to user active hours |
| Point minting | Daily, 10:00 | Up to one day |
| Task funding recovery, expiration, and refunds | Hourly | Up to one hour |
| Task payout retries | Hourly | Up to one hour after a retry becomes due |
| Relationship aggregation | Daily, 08:00 | Up to one day |
| Referral hypercert publication | Daily, 10:00 | Up to one day |
| Politician alignment | Daily, 08:00 | Unchanged |
| Activity digest | Daily, 13:00 | Five minutes earlier |
| Attachment cleanup | Daily, 04:00 | Thirty minutes earlier |
| Downstream cache refresh | Sunday, 04:00 | Unchanged |
| Chain digest | First of month, 14:00 | Unchanged |

Hourly jobs share minute zero so they can share a database wake window.
With a five-minute idle timeout and no other traffic, 24 brief wake windows
would use about two active hours per day. Actual usage also depends on
requests, other applications, job duration, and compute size.

The trigger handler checks the interval since the last successful fire.
It catches up due schedules once; it does not replay each missed occurrence.
Review the daily cadence before adding time-sensitive triggers. An hourly
reminder check can miss a user's active window if that window is shorter
than an hour. Batch limits remain unchanged; review them if queues grow.

These schedules take effect on a production deployment. Compare Neon
CU-hours and active time over equal periods after deployment. Check overdue
jobs and queue age before lowering the frequency further.
