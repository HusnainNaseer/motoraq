"use client";

import { useState, useTransition } from "react";
import Link from "next/link";
import { toggleFavorite } from "./action";

type Props = {
  carId: number;
  initialSaved: boolean;
  isLoggedIn: boolean;
  // Where to come back to after logging in, e.g. "/cars/12"
  redirectTo: string;
};

export default function FavoriteButton({
  carId,
  initialSaved,
  isLoggedIn,
  redirectTo,
}: Props) {
  const [saved, setSaved] = useState(initialSaved);
  const [error, setError] = useState("");
  const [pending, startTransition] = useTransition();

  if (!isLoggedIn) {
    return (
      <Link
        className="favorite-button"
        href={`/login?redirect=${encodeURIComponent(redirectTo)}`}
      >
        ♡ Save
      </Link>
    );
  }

  function handleClick() {
    setError("");

    const next = !saved;
    setSaved(next); // update right away, undo if the server says no

    startTransition(async () => {
      const result = await toggleFavorite(carId);

      if (!result.ok) {
        setSaved(!next);
        setError(result.error);
        return;
      }

      setSaved(result.saved);
    });
  }

  return (
    <>
      <button
        type="button"
        className="favorite-button"
        onClick={handleClick}
        disabled={pending}
        aria-pressed={saved}
      >
        {saved ? "♥ Saved" : "♡ Save"}
      </button>

      {error && <p role="alert">{error}</p>}
    </>
  );
}