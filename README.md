![Remix Auth Clerk](https://github.com/danestves/remix-auth-clerk/assets/31737273/82cde78a-a58c-4e14-bd1a-23fcf0da78d2)

<h1 align="center">
  💿 Remix Auth Clerk
</h1>

<div align="center">
  <p>
    <a href="https://github.com/danestves/remix-auth-clerk?tab=readme-ov-file#features"><strong>Explore Docs »</strong></a>
  </p>
</div>

```
npm install remix-auth-clerk
```

[![CI](https://img.shields.io/github/actions/workflow/status/danestves/remix-auth-clerk/main.yml?label=Build)](https://github.com/danestves/remix-auth-clerk/actions/workflows/main.yml)
[![Release](https://img.shields.io/npm/v/remix-auth-clerk.svg?&label=Release)](https://www.npmjs.com/package/remix-auth-clerk)
[![License](https://img.shields.io/badge/License-MIT-brightgreen.svg)](https://github.com/danestves/remix-auth-clerk/blob/main/LICENSE)

## Features

- **🔨 Supports multiple runtimes**: Node.js and Cloudflare Workers
- **🔒 Secure** -- SOC 2 Type 2, HIPAA, Bot & Brute force detection, Password leak protection and many more thanks to Clerk
- **🔌 Simple** -- easy to use and extend (_inside Clerk platform_)
- **📙 Use any database** -- save the information you need with any database that you want thanks to `remix-auth`
- **🚀 Remix Auth Foundation** -- an amazing authentication library for Remix.


## Supported runtimes

| Runtime    | Has Support |
| ---------- | ----------- |
| Node.js    | ✅          |
| Cloudflare | ✅          |

> [!NOTE]
> Remix Auth Clerk is only Remix v2.0+ compatible.

Let's see how we can implement the Strategy into our Remix App.

## Create an OAuth application in Clerk

You need to create an OAuth application in Clerk. You can do it via the [Backend API](https://clerk.com/docs/reference/backend-api/tag/OAuth-Applications) by providing a `callback_url`, a `name` and optionally the `scopes`.

> [!NOTE]
> In this context the name is used to help you identify your application and is not displayed anywhere publicly.

```bash
curl
 -X POST https://api.clerk.com/v1/oauth_applications \
 -H "Authorization: Bearer <CLERK_SECRET_KEY>"  \
 -H "Content-Type: application/json" \
 -d {"callback_url":"https://example.com/auth/clerk/callback", "name": "remix-auth-clerk-example-app", "scopes": "profile email public_metadata"}
```

Clerk will return the following:

```json
{
   "object":"oauth_application",
   "id":"oa_2O4BCh3zUONvWlZHtBXv6s6tm7u",
   "instance_id":"ins_2O4Ak02T4fDmKKv6tK5h0WJ8ou8",
   "name":"remix-auth-clerk-example-app",
   "client_id":"d9g4CT4WYiCBm7EU",
   "client_secret":"VVgbT7i6sPo7sTljq2zj12fjmg0jPL5k",
   "scopes":"profile email public_metadata",
   "callback_url":"https://example.com/auth/clerk/callback",
   "authorize_url":"https://clerk.your-domain.com/oauth/authorize",
   "token_fetch_url":"https://clerk.your-domain.com/oauth/token",
   "user_info_url":"https://clerk.your-domain.com/oauth/userinfo",
   "created_at":1680809847940,
   "updated_at":1680810135145
}
```

`clerk.your-domain.com` is the domain of your Clerk instance. Save it without the `https://` part and anyting after the `.com` or `.dev` part as you will need it later.

> [!WARNING]  
> Save the `client_id` and `client_secret` as you will need them later for security reasons.

## Session Storage

We'll require to initialize a new Cookie Session Storage to work with. This Session will store user data and everything related to authentication.

Create a file called `session.server.ts` wherever you want.<br />
Implement the following code and replace the `secrets` property with a strong string into your `.env` file.

```ts
// app/services/auth/session.server.ts
import { createCookieSessionStorage } from '@remix-run/node'

export const sessionStorage = createCookieSessionStorage({
  cookie: {
    name: '__session',
    sameSite: 'lax',
    path: '/',
    httpOnly: true,
    secrets: [process.env.SESSION_SECRET || 'secret'],
    secure: process.env.NODE_ENV === 'production',
  },
})

export const { getSession, commitSession, destroySession } = sessionStorage
```

## Strategy Instance

Now that we have everything set up, we can start implementing the Strategy Instance.

Create a file called `auth.server.ts` wherever you want.<br />
Implement the following code and replace the `secret` property with a strong string into your `.env` file.

```ts
// app/services/auth/config.server.ts
import { Authenticator } from 'remix-auth'
import { ClerkStrategy } from 'remix-auth-clerk'

import { sessionStorage } from './session.server'
import { db } from '~/db'

// Your interface must be anything that will return on the verify callback
type User = {
  id: string
}

export let authenticator = new Authenticator<User>(sessionStorage, {
  throwOnError: true,
})

authenticator.use(
  new ClerkStrategy(
    {
      domain: "clerk.your-domain.com",
      clientID: "d9g4CT4WYiCBm7EU",
      clientSecret: "VVgbT7i6sPo7sTljq2zj12fjmg0jPL5k",
      callbackURL: "https://example.com/auth/clerk/callback",
    },
    async ({ profile, accessToken, refreshToken, extraParams, request, context }) => {
      // Here you can do anything you want with the user data
      return {
         id: profile.id
      }
    },
  ),
)
```

## Auth Routes

Last but not least, we'll require to create the routes that will handle the authentication flow. Create the following files inside the `app/routes` folder.

### `login.ts`

```ts
/// app/routes/login.ts

import { authenticator } from '~/services/auth/config.server'

export async function loader({ request }: DataFunctionArgs) {
  return authenticator.authenticate('clerk', request, {
    successRedirect: '/private-routes',
    failureRedirect: '/',
  })
}
```

### `logout.ts`

```ts
/// app/routes/logout.ts
import { type ActionFunctionArgs, redirect } from "@remix-run/node";

import { authenticator } from "~/services/auth/config.server";

export async function loader() {
	throw redirect("/");
}

export async function action({ request }: ActionFunctionArgs) {
	return authenticator.logout(request, { redirectTo: "/" });
}
```

## Support

If you found this library helpful, please consider leaving us a ⭐ [star](https://github.com/danestves/remix-auth-clerk). It helps the repository grow and provides the necessary motivation to continue maintaining the project.

## License

Licensed under the [MIT license](https://github.com/danestves/remix-auth-clerk/blob/main/LICENSE).
