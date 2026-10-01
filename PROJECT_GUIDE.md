# Motoraq Project Guide

An alphabetically organized project reference for the current Motoraq source. It documents what is implemented, how the main user flows work, and what must be configured outside this repository. It is a guide to the current code, not a product specification.

## Contents

- [A. Admin experience](#a-admin-experience)
- [B. Buyer experience](#b-buyer-experience)
- [C. Commands](#c-commands)
- [D. Data model](#d-data-model)
- [E. Environment setup](#e-environment-setup)
- [F. Features and routes](#f-features-and-routes)
- [G. Getting started](#g-getting-started)
- [I. Images and storage](#i-images-and-storage)
- [K. Known gaps and external dependencies](#k-known-gaps-and-external-dependencies)
- [L. Listing management](#l-listing-management)
- [N. Navigation and shared layout](#n-navigation-and-shared-layout)
- [P. Project structure](#p-project-structure)
- [R. Roles and access control](#r-roles-and-access-control)
- [S. Stack and architecture](#s-stack-and-architecture)
- [T. Testing and current verification](#t-testing-and-current-verification)
- [U. User workflows](#u-user-workflows)

## A. Admin experience

The admin area is protected by authentication and a `profiles.role === "admin"` check.

- `/admin` shows total user and car counts, the five most recent car listings, and links to user and car management.
- `/admin/cars` lists all cars in a table. It supports make/model/location search, location, fuel, transmission, minimum and maximum price filters, and pagination of 20 cars per page. Admins can view, delete, and follow an edit link for a car.
- `/admin/users` supports search by full name, filtering by `user` or `admin` role, and pagination of 20 profiles per page. The current table has a View link, but its destination is not implemented; see [Known gaps](#k-known-gaps-and-external-dependencies).

The `deleteAdminCar` server action rechecks the logged-in user and admin role before deleting a car.

## B. Buyer experience

Visitors can browse the home page, search the marketplace, filter and sort results, and open individual car detail pages. A detail page includes available photos, price, mileage, year, fuel type, transmission, description, location, listing date, listing ID, and seller name when available.

The current application does not implement checkout, purchase, or a direct buyer-to-seller messaging flow. Selling calls to action send guests to login with a redirect to the listing form.

## C. Commands

Run these from the project root:

| Command | Purpose |
| --- | --- |
| `npm ci` | Install dependencies from `package-lock.json`. |
| `npm run dev` | Start the Next.js development server. |
| `npm run dev -- --port 3001` | Start development on a chosen port when 3000 is occupied. |
| `npm run lint` | Run ESLint across the project. |
| `npm run build` | Create a production build and run the Next.js build checks. |
| `npm run start` | Serve a successful production build. |

## D. Data model

The application expects these Supabase tables and fields. Database migrations or SQL schema files are not included in this repository, so these are inferred from the queries and writes in the app.

| Table | Fields used by the application |
| --- | --- |
| `profiles` | `id`, `full_name`, `role`, `created_at`. The profile ID is expected to match the authenticated Supabase user ID. |
| `cars` | `id`, `user_id`, `make`, `model`, `year`, `price`, `mileage`, `fuel_type`, `transmission`, `location`, `description`, `created_at`. |
| `car_images` | `id`, `car_id`, `image_url`, `created_at`. `image_url` stores a storage object path, not a permanent public URL. |

The car form requires make, model, year, price, mileage, and location. Year is limited to 1900-2100; price and mileage must be non-negative. Fuel type defaults to Petrol, transmission defaults to Manual, and description and photos are optional.

## E. Environment setup

Create a local `.env.local` file with the project's Supabase public connection settings:

```env
NEXT_PUBLIC_SUPABASE_URL=your-supabase-project-url
NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY=your-supabase-publishable-key
```

Do not commit real credentials. The repository contains no `.env.example`; the variable names above are read in `lib/supabase/client.ts` and `lib/supabase/server.ts`.

Supabase must be configured separately with the expected tables, authentication settings, storage bucket, and Row Level Security policies. A profile row with a role is required for admin detection and for the dashboard's profile information.

## F. Features and routes

| Route | Purpose | Access |
| --- | --- | --- |
| `/` | Home, search entry point, and latest six cars | Public |
| `/cars` | Filtered, sorted, paginated marketplace; six cars per page | Public |
| `/cars/[id]` | Car details and seller information | Public |
| `/login` | Email/password sign-in; supports a `redirect` query parameter | Public |
| `/register` | Supabase account registration with full name metadata | Public |
| `/dashboard` | Seller overview, totals, quick links, and recent listings | Signed in |
| `/dashboard/cars` | Current user's listings with view, edit, and delete actions | Signed in |
| `/dashboard/cars/add` | Create a listing and upload up to 10 photos | Signed in |
| `/dashboard/cars/[id]/edit` | Edit an owned listing and manage its photos | Signed in and listing owner |
| `/admin` | Admin totals, recent listings, and management links | Admin |
| `/admin/cars` | Search and manage all listings | Admin |
| `/admin/users` | Search and browse profiles by role | Admin |
| `error.tsx`, `loading.tsx`, `not-found.tsx` | Shared error, loading, and not-found UI | Framework states |

## G. Getting started

1. Install a Node.js version supported by the installed Next.js release and npm.
2. Run `npm ci` from the project root.
3. Add the Supabase URL and publishable key to `.env.local`.
4. Configure the Supabase project as described in [Environment setup](#e-environment-setup) and [Data model](#d-data-model).
5. Start the app with `npm run dev` and open `http://localhost:3000`.
6. Use `npm run lint` and `npm run build` for code and production-build checks.

## I. Images and storage

Car photos use the Supabase Storage bucket named `car-images`. The app uploads objects under a path shaped like `user-id/car-id/timestamp-filename`, then records that path in `car_images.image_url`.

- The add and edit forms accept image files only and allow up to 10 photos per listing.
- The app creates signed URLs that expire after 60 minutes when displaying stored photos.
- Removing a photo deletes the storage object and then its `car_images` row.
- The repository does not create the bucket or define its access policies; configure both in Supabase.

## K. Known gaps and external dependencies

These notes describe the current source and should be revisited as the product changes.

- The repository has no Supabase migrations or schema/bootstrap scripts. Table definitions, profile provisioning, storage setup, and policies must be managed externally.
- Registration sends `full_name` as Supabase user metadata. The code assumes a corresponding `profiles` row exists; profile creation logic is not present here.
- The admin car page links to `/admin/cars/new`, but no page for that route exists.
- The admin users table links to `/admin/users/[id]`, but no detail route exists and there is no role-change action in the current app.
- The admin car table links to the seller edit route. That edit page filters by the current user's ID, so an admin cannot use it to edit another user's car unless they own it. Admin deletion is implemented separately.
- Listing creation uploads the car row before uploading photos. If a later photo upload fails, the listing or earlier uploads can remain; there is no transaction or automatic rollback.
- There is no automated test script in `package.json`, and no purchase, payment, or messaging workflow is present.

## L. Listing management

Seller listing fields are make, model, year, price, mileage, fuel type, transmission, location, description, and photos. Listing creation and editing use Supabase from client components. The file `app/dashboard/cars/actions.ts` also exports server actions for add, update, and delete; the add/edit pages currently perform their writes directly through the client, while the My Cars page uses the delete server action.

The marketplace supports:

- Search across make and model.
- Fuel type and transmission filters.
- Minimum and maximum price.
- Sorting by newest, price low-to-high, price high-to-low, or year newest-first.
- Six listings per page with previous/next navigation.

The admin car manager additionally filters by location and returns 20 listings per page.

## N. Navigation and shared layout

The root layout supplies the shared header, navigation, page content, and footer. The header checks the current Supabase user and profile role. Logged-in users see dashboard links and a grouped Sell Your Car / Logout action area; admins also see admin navigation. Guests see login and registration links.

The navigation and page styling use global CSS plus CSS Modules. Responsive rules are distributed across the page stylesheets. The shared header wraps at tablet widths, and home-page car cards use a single flexible column on narrow screens. Page-specific dashboard, form, detail, and admin styles also include responsive breakpoints; admin tables scroll inside their table wrappers.

## P. Project structure

```text
app/
  admin/                 Admin dashboard, car manager, user manager, actions
  cars/                  Marketplace and dynamic car details
  dashboard/             Seller dashboard and car listing workflows
  login/                 Sign-in page
  register/              Registration page
  error.tsx              App error boundary UI
  globals.css            Global base styles
  home.module.css        Home-page styles
  layout.module.css      Shared header and footer styles
  layout.tsx             Root layout, metadata, session and role lookup
  loading.tsx            Loading UI
  navigation.tsx         Client-side shared navigation and logout
  not-found.tsx          Not-found UI
  page.tsx               Home page
lib/supabase/
  client.ts               Browser Supabase client
  server.ts               Cookie-aware server Supabase client
public/                   Public static assets
```

## R. Roles and access control

- **Guest:** can view the marketplace and car details; protected dashboard routes redirect to login.
- **User/seller:** can manage their own listings. Listing updates and deletes include the current user ID in the query; edit loading also checks ownership.
- **Admin:** role is read from `profiles.role`. Admin pages check the role on the server, and the admin delete action checks it again before deleting.

The app's client-side Supabase operations must also be protected by correct Row Level Security policies. Do not rely on hidden buttons or client checks as authorization. The database policies are not included in this repository.

## S. Stack and architecture

- Next.js 16 App Router with React 19 and TypeScript 5.
- Supabase Auth, Postgres queries, and Storage through `@supabase/ssr` and `@supabase/supabase-js`.
- Server Components are used for most route data loading; login, registration, navigation, and listing forms use client components where interactive state or browser uploads are required.
- `next.config.ts` enables the React Compiler.
- TypeScript path alias `@/*` resolves from the project root.
- Styling uses `app/globals.css` and route-level CSS Modules. Tailwind is installed, but the current pages primarily use the existing CSS files.

## T. Testing and current verification

There is no `test` script in `package.json`. Available project checks are `npm run lint` and `npm run build`.

At the time this guide was prepared, `npm run build` passed. The full lint command reported existing JSX apostrophe and explicit-`any` errors in admin/dashboard page files, plus `<img>` optimization warnings. Run the commands again before release because code and tool versions may have changed.

## U. User workflows

### Buyer workflow

1. Open `/` or `/cars`.
2. Search, filter, sort, and page through available cars.
3. Open a car to review its details, photos, and seller name.
4. Account creation, purchasing, and messaging are not required for browsing; purchasing and messaging are not implemented.

### Guest-to-seller workflow

1. Choose a Sell Your Car link while signed out.
2. Sign in or register; the login flow accepts a redirect back to `/dashboard/cars/add`.
3. Complete the listing fields and optionally select up to 10 images.
4. The app inserts the car, uploads each image, stores image paths, then navigates to `/dashboard/cars`.

### Registered seller workflow

1. Sign in with email and password.
2. Review listing totals and recent cars on `/dashboard`.
3. Open `/dashboard/cars` to view, edit, or delete owned listings.
4. In the edit screen, update vehicle fields, remove existing photos, and add more photos.
5. Logout from the shared header; Supabase signs out and the app returns to `/`.

### Admin workflow

1. Sign in with an account whose `profiles.role` is `admin`.
2. Open `/admin` to view total users, total cars, recent listings, and management links.
3. Use `/admin/cars` to search and filter all listings, view a listing, or delete it.
4. Use `/admin/users` to search profiles, filter by role, and page through results. User details and role changes are not yet implemented.
