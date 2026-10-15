# Role-Based Access Control (RBAC)

Added per the Oct 14, 2026 meeting: the operations / fulfillment team should
be able to work on sales without seeing the Buy button, the Events page, or the
Recommendations page. Admins keep full access and everyone now lands on the
Inventory page by default.

## Roles

| Role          | Can Buy | Events | Inventory | Recommendations | Default landing |
| ------------- | :-----: | :----: | :-------: | :-------------: | --------------- |
| `admin`       |   ✅    |   ✅   |    ✅     |       ✅        | `/inventories`  |
| `fulfillment` |   ❌    |   ❌   |    ✅     |       ❌        | `/inventories`  |
| `buyer`       |   ✅    |   ✅   |    ✅     |       ✅        | `/inventories`  |

- `buyer` is reserved for a future dedicated buying role (noted in the meeting);
  it currently behaves like `admin`. Trim its `pages` in
  `src/configs/permissions.ts` when that role is fleshed out.
- Roles are **object-driven**, not hardcoded per user. The permission map lives
  in `src/configs/permissions.ts`.

## Where the role is stored

The role lives on the Supabase user at **`app_metadata.role`**:

- It travels inside the session JWT, so the frontend reads it with **zero extra
  network calls** (`src/hooks/useRole.ts`).
- `app_metadata` can only be written with the **service role** (not by the user),
  so it cannot be tampered with from the browser.
- No new database table or schema change was required.

If a user has **no** role set, they default to **`admin`** (`DEFAULT_ROLE` in
`permissions.ts`). This preserves existing behavior for all current users.

## How to assign a role

Run this in the Supabase SQL editor (or via a service-role connection).
Replace the email with the real operations-team address.

```sql
-- Make a user a fulfillment (operations) user
update auth.users
set raw_app_meta_data =
  coalesce(raw_app_meta_data, '{}'::jsonb) || jsonb_build_object('role', 'fulfillment')
where email = 'OPS_PERSON@example.com';
```

```sql
-- Revert a user back to admin (clear the role)
update auth.users
set raw_app_meta_data = raw_app_meta_data - 'role'
where email = 'OPS_PERSON@example.com';
```

```sql
-- Verify
select email, raw_app_meta_data->>'role' as role
from auth.users
order by created_at;
```

> After changing a role, the user must sign out and back in (or let the token
> refresh) for the new role to appear in their session JWT.

## Frontend touch points

- `src/configs/permissions.ts` — role → permission map (edit here to change rules).
- `src/hooks/useRole.ts` — reads role from the session, exposes
  `{ role, permissions, canBuy, defaultPath, canAccess(page) }`.
- `src/components/auth/RequirePage.tsx` — route guard; redirects to the role's
  default path when a page isn't allowed.
- `src/router.tsx` — guards `/events`, `/events/:id`, `/recommendations`;
  default landing is `/inventories`.
- `src/components/dashboard/sidebar.dashboard.tsx` — hides nav items.
- Buy button gating — `PurchaseModalProvider` (choke point), `trades.page.tsx`,
  `MapWithListings.tsx` / `listingsMapView.columns.tsx`.
