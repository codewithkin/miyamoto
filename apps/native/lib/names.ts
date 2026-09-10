/**
 * The name to address someone by, from the full name Google gave us.
 *
 * Returns null rather than guessing badly: a Master saying "user123 —" or
 * "someone@example.com —" is worse than not using a name at all. So is
 * mangling one, which is why a name is only recased when it arrived all
 * lower-case ("kin" -> "Kin"); "McKenzie" passes through as written. The
 * known miss: a full name that *starts* with a lower-case particle ("de la
 * Cruz") becomes "De". Google display names lead with the given name, so it
 * is rare enough not to special-case.
 */
export function firstName(fullName: string | null | undefined): string | null {
  const first = fullName?.trim().split(/\s+/)[0];
  if (!first) return null;
  // An email or handle standing in for a name, or something too long to be one.
  if (first.includes("@") || /\d/.test(first) || first.length > 20) return null;
  return first === first.toLowerCase()
    ? first.charAt(0).toUpperCase() + first.slice(1)
    : first;
}
