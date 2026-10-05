// Alfred webhook intake.
//
// Alfred v1 signs deliveries but does not document the scheme, so the body is
// never trusted on its own. A delivery is used only for its event id: the
// event is fetched back from `GET /v1/events/{id}` with our own credentials,
// and that authenticated copy is what gets applied. A forged delivery can
// therefore only make us read an event that does not exist (404, dropped).

/** The minimum an incoming delivery must carry to be worth fetching back. */
export function readEventId(rawBody: string): string | null {
  let parsed: unknown;
  try {
    parsed = JSON.parse(rawBody);
  } catch {
    return null;
  }
  const id = (parsed as { id?: unknown } | null)?.id;
  // Alfred ids are opaque (`evt_…`); bound the shape so it is safe in a URL path.
  return typeof id === 'string' && /^[A-Za-z0-9_-]{1,128}$/.test(id) ? id : null;
}
