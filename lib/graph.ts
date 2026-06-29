// Microsoft Graph helpers: refresh the per-user OAuth token and query Outlook.

const TENANT = process.env.MICROSOFT_TENANT_ID || 'common';
const TOKEN_URL = `https://login.microsoftonline.com/${TENANT}/oauth2/v2.0/token`;
const GRAPH = 'https://graph.microsoft.com/v1.0';

const GRAPH_SCOPES =
  'openid profile email offline_access User.Read Mail.Read';

export type MsTokenRow = {
  user_id: string;
  refresh_token: string | null;
  access_token: string | null;
  expires_at: string | null;
  scope: string | null;
};

export type GraphMessage = {
  id: string;
  internetMessageId?: string;
  subject?: string;
  bodyPreview?: string;
  webLink?: string;
  sentDateTime?: string;
  receivedDateTime?: string;
  from?: { emailAddress?: { name?: string; address?: string } };
  toRecipients?: { emailAddress?: { name?: string; address?: string } }[];
  ccRecipients?: { emailAddress?: { name?: string; address?: string } }[];
};

// Returns a valid access token, refreshing via the refresh token if the cached
// one is missing or close to expiry. Persists the rotated token back via
// `persist`. Throws if Graph credentials aren't configured or refresh fails.
export async function getValidAccessToken(
  token: MsTokenRow,
  persist: (next: {
    access_token: string;
    refresh_token: string;
    expires_at: string;
    scope: string;
  }) => Promise<void>
): Promise<string> {
  const clientId = process.env.MICROSOFT_CLIENT_ID;
  const clientSecret = process.env.MICROSOFT_CLIENT_SECRET;
  if (!clientId || !clientSecret) {
    throw new Error(
      'Microsoft Graph is not configured (MICROSOFT_CLIENT_ID / MICROSOFT_CLIENT_SECRET missing).'
    );
  }

  const stillValid =
    token.access_token &&
    token.expires_at &&
    new Date(token.expires_at).getTime() - Date.now() > 2 * 60 * 1000;
  if (stillValid) return token.access_token as string;

  if (!token.refresh_token) {
    throw new Error(
      'No Microsoft refresh token stored for this user — sign out and sign in again to grant mailbox access.'
    );
  }

  const body = new URLSearchParams({
    client_id: clientId,
    client_secret: clientSecret,
    grant_type: 'refresh_token',
    refresh_token: token.refresh_token,
    scope: GRAPH_SCOPES,
  });

  const res = await fetch(TOKEN_URL, {
    method: 'POST',
    headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
    body,
  });
  if (!res.ok) {
    const detail = await res.text();
    throw new Error(`Token refresh failed (${res.status}): ${detail}`);
  }
  const json = await res.json();
  const next = {
    access_token: json.access_token as string,
    refresh_token: (json.refresh_token as string) || token.refresh_token,
    expires_at: new Date(
      Date.now() + (json.expires_in ?? 3600) * 1000
    ).toISOString(),
    scope: (json.scope as string) || GRAPH_SCOPES,
  };
  await persist(next);
  return next.access_token;
}

// Search the signed-in user's mailbox for messages involving `email`.
// Uses Graph $search which scans sender/recipients/body.
export async function searchMessagesByContact(
  accessToken: string,
  email: string,
  top = 25
): Promise<GraphMessage[]> {
  const select =
    'id,internetMessageId,subject,bodyPreview,webLink,sentDateTime,receivedDateTime,from,toRecipients,ccRecipients';
  const url =
    `${GRAPH}/me/messages?$search=${encodeURIComponent(`"${email}"`)}` +
    `&$top=${top}&$select=${select}`;

  const res = await fetch(url, {
    headers: {
      Authorization: `Bearer ${accessToken}`,
      // $search returns results ordered by relevance; no $orderby allowed.
      Prefer: 'outlook.body-content-type="text"',
    },
  });
  if (!res.ok) {
    const detail = await res.text();
    throw new Error(`Graph search failed (${res.status}): ${detail}`);
  }
  const json = await res.json();
  return (json.value ?? []) as GraphMessage[];
}
