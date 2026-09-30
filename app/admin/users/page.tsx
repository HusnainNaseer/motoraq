import Link from "next/link";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import styles from "./users.module.css";

type UsersPageProps = {
  searchParams: Promise<{
    search?: string;
    role?: string;
    page?: string;
  }>;
};

const USERS_PER_PAGE = 20;

export default async function AdminUsersPage({
  searchParams,
}: UsersPageProps) {
  const supabase = await createClient();

  // Check authentication
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect("/login?redirect=/admin/users");
  }

  // Check admin role
  const { data: profile } = await supabase
    .from("profiles")
    .select("role")
    .eq("id", user.id)
    .single();

  if (profile?.role !== "admin") {
    redirect("/dashboard");
  }

  const params = await searchParams;

  const search = params.search?.trim() || "";
  const role = params.role || "all";

  let currentPage = Number(params.page) || 1;

  if (currentPage < 1) {
    currentPage = 1;
  }

  /*
   * Calculate the database range.
   *
   * Page 1 → 0 to 19
   * Page 2 → 20 to 39
   * Page 3 → 40 to 59
   */
  const from = (currentPage - 1) * USERS_PER_PAGE;
  const to = from + USERS_PER_PAGE - 1;

  // Build users query
  let query = supabase
    .from("profiles")
    .select(
      "id, full_name, role, created_at",
      { count: "exact" }
    )
    .order("created_at", {
      ascending: false,
    });

  // Search by name
  if (search) {
    query = query.ilike(
      "full_name",
      `%${search}%`
    );
  }

  // Filter by role
  if (role === "user" || role === "admin") {
    query = query.eq("role", role);
  }

  // Fetch only 20 users
  const {
    data: users,
    error,
    count,
  } = await query.range(from, to);

  if (error) {
    return (
      <main className={styles.adminPage}>
        <div className={styles.errorBox}>
          <h1>Something went wrong</h1>

          <p>
            We couldn't load the users.
            Please try again.
          </p>
        </div>
      </main>
    );
  }

  const totalUsers = count || 0;

  const totalPages = Math.max(
    1,
    Math.ceil(totalUsers / USERS_PER_PAGE)
  );

  /*
   * If someone enters a page number that doesn't exist,
   * send them back to the last available page.
   */
  if (currentPage > totalPages) {
    currentPage = totalPages;
  }

  const hasPreviousPage = currentPage > 1;
  const hasNextPage = currentPage < totalPages;

  /*
   * Preserve the current search/filter when changing pages.
   */
  function createPageUrl(page: number) {
    const queryParams = new URLSearchParams();

    if (search) {
      queryParams.set("search", search);
    }

    if (role !== "all") {
      queryParams.set("role", role);
    }

    queryParams.set("page", page.toString());

    return `/admin/users?${queryParams.toString()}`;
  }

  return (
    <main className={styles.adminPage}>
      {/* Header */}
      <header className={styles.adminHeader}>
        <div>
          <p className={styles.pageLabel}>
            Administration
          </p>

          <h1>
            Manage Users
          </h1>

          <p>
            Search and manage Motoraq user accounts.
          </p>
        </div>

        <Link
          href="/admin"
          className={styles.secondaryButton}
        >
          ← Admin Dashboard
        </Link>
      </header>

      {/* Filters */}
      <section className={styles.filterCard}>
        <form
          method="GET"
          className={styles.filterForm}
        >
          <div className={styles.filterField}>
            <label htmlFor="search">
              Search by name
            </label>

            <input
              id="search"
              name="search"
              type="search"
              placeholder="Enter user name..."
              defaultValue={search}
            />
          </div>

          <div className={styles.filterField}>
            <label htmlFor="role">
              Role
            </label>

            <select
              id="role"
              name="role"
              defaultValue={role}
            >
              <option value="all">
                All Roles
              </option>

              <option value="user">
                Users
              </option>

              <option value="admin">
                Admins
              </option>
            </select>
          </div>

          <button
            type="submit"
            className={styles.primaryButton}
          >
            Search
          </button>

          {(search || role !== "all") && (
            <Link
              href="/admin/users"
              className={styles.clearButton}
            >
              Clear
            </Link>
          )}
        </form>
      </section>

      {/* Results information */}
      <section className={styles.resultsHeader}>
        <div>
          <h2>
            Users
          </h2>

          <p>
            {totalUsers.toLocaleString()}{" "}
            {totalUsers === 1
              ? "user"
              : "users"}{" "}
            found
          </p>
        </div>

        <span>
          Page {currentPage} of {totalPages}
        </span>
      </section>

      {/* Users table */}
      {users && users.length > 0 ? (
        <section className={styles.tableCard}>
          <div className={styles.tableWrapper}>
            <table className={styles.adminTable}>
              <thead>
                <tr>
                  <th>
                    Name
                  </th>

                  <th>
                    Role
                  </th>

                  <th>
                    User ID
                  </th>

                  <th>
                    Joined
                  </th>

                  <th>
                    Actions
                  </th>
                </tr>
              </thead>

              <tbody>
                {users.map((user) => (
                  <tr key={user.id}>
                    <td>
                      <strong>
                        {user.full_name ||
                          "Unnamed User"}
                      </strong>
                    </td>

                    <td>
                      {user.role === "admin" ? (
                        <span
                          className={
                            styles.adminBadge
                          }
                        >
                          Admin
                        </span>
                      ) : (
                        <span
                          className={
                            styles.userBadge
                          }
                        >
                          User
                        </span>
                      )}
                    </td>

                    <td>
                      <span
                        className={
                          styles.userId
                        }
                      >
                        {user.id}
                      </span>
                    </td>

                    <td>
                      {new Date(
                        user.created_at
                      ).toLocaleDateString(
                        "en-PK",
                        {
                          day: "numeric",
                          month: "short",
                          year: "numeric",
                        }
                      )}
                    </td>

                    <td>
                      <div
                        className={
                          styles.tableActions
                        }
                      >
                        <Link
                          href={`/admin/users/${user.id}`}
                          className={
                            styles.actionLink
                          }
                        >
                          View
                        </Link>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </section>
      ) : (
        <section className={styles.emptyState}>
          <div className={styles.emptyIcon}>
            👤
          </div>

          <h3>
            No users found
          </h3>

          <p>
            Try changing your search or role filter.
          </p>

          <Link
            href="/admin/users"
            className={styles.secondaryButton}
          >
            View All Users
          </Link>
        </section>
      )}

      {/* Pagination */}
      {totalPages > 1 && (
        <nav
          className={styles.pagination}
          aria-label="Users pagination"
        >
          {hasPreviousPage ? (
            <Link
              href={createPageUrl(
                currentPage - 1
              )}
              className={styles.pageButton}
            >
              ← Previous
            </Link>
          ) : (
            <span
              className={`${styles.pageButton} ${styles.disabled}`}
            >
              ← Previous
            </span>
          )}

          <span className={styles.pageInfo}>
            Page {currentPage} of {totalPages}
          </span>

          {hasNextPage ? (
            <Link
              href={createPageUrl(
                currentPage + 1
              )}
              className={styles.pageButton}
            >
              Next →
            </Link>
          ) : (
            <span
              className={`${styles.pageButton} ${styles.disabled}`}
            >
              Next →
            </span>
          )}
        </nav>
      )}
    </main>
  );
}