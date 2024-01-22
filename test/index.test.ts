import { createCookieSessionStorage } from "@remix-run/node";
import { ClerkStrategy } from "../src";
import { AuthenticateOptions } from "remix-auth";
import fetchMock, { enableFetchMocks } from "jest-fetch-mock";

enableFetchMocks();

const BASE_OPTIONS: AuthenticateOptions = {
  name: "clerk",
  sessionKey: "user",
  sessionErrorKey: "error",
  sessionStrategyKey: "strategy",
};

describe(ClerkStrategy, () => {
  let verify = jest.fn();
  let sessionStorage = createCookieSessionStorage({
    cookie: { secrets: ["s3cr3t"] },
  });

  beforeEach(() => {
    jest.resetAllMocks();
    fetchMock.resetMocks();
  });

  test("should allow changing the scope", async () => {
    let strategy = new ClerkStrategy(
      {
        domain: "test.fake.clerk.com",
        clientID: "CLIENT_ID",
        clientSecret: "CLIENT_SECRET",
        callbackURL: "https://example.app/callback",
        scopes: "custom",
      },
      verify,
    );

    let request = new Request("https://example.app/auth/clerk");

    try {
      await strategy.authenticate(request, sessionStorage, BASE_OPTIONS);
    } catch (error) {
      if (!(error instanceof Response)) throw error;
      let location = error.headers.get("Location");

      if (!location) throw new Error("No redirect header");

      let redirectUrl = new URL(location);

      expect(redirectUrl.searchParams.get("scope")).toBe("custom");
    }
  });

  test("should have the scope `openid profile email` as default", async () => {
    let strategy = new ClerkStrategy(
      {
        domain: "test.fake.clerk.com",
        clientID: "CLIENT_ID",
        clientSecret: "CLIENT_SECRET",
        callbackURL: "https://example.app/callback",
      },
      verify,
    );

    let request = new Request("https://example.app/auth/clerk");

    try {
      await strategy.authenticate(request, sessionStorage, BASE_OPTIONS);
    } catch (error) {
      if (!(error instanceof Response)) throw error;
      let location = error.headers.get("Location");

      if (!location) throw new Error("No redirect header");

      let redirectUrl = new URL(location);

      expect(redirectUrl.searchParams.get("scope")).toBe(
        "profile email public_metadata",
      );
    }
  });

  test("should correctly format the authorization URL", async () => {
    let strategy = new ClerkStrategy(
      {
        domain: "test.fake.clerk.com",
        clientID: "CLIENT_ID",
        clientSecret: "CLIENT_SECRET",
        callbackURL: "https://example.app/callback",
      },
      verify,
    );

    let request = new Request("https://example.app/auth/clerk");

    try {
      await strategy.authenticate(request, sessionStorage, BASE_OPTIONS);
    } catch (error) {
      if (!(error instanceof Response)) throw error;

      let location = error.headers.get("Location");

      if (!location) throw new Error("No redirect header");

      let redirectUrl = new URL(location);

      expect(redirectUrl.hostname).toBe("test.fake.clerk.com");
      expect(redirectUrl.pathname).toBe("/oauth/authorize");
    }
  });

  test("should allow additional search params", async () => {
    let strategy = new ClerkStrategy(
      {
        domain: "test.fake.clerk.com",
        clientID: "CLIENT_ID",
        clientSecret: "CLIENT_SECRET",
        callbackURL: "https://example.app/callback",
      },
      verify,
    );

    let request = new Request("https://example.app/auth/clerk?test=1");
    try {
      await strategy.authenticate(request, sessionStorage, BASE_OPTIONS);
    } catch (error) {
      if (!(error instanceof Response)) throw error;
      let location = error.headers.get("Location");

      if (!location) throw new Error("No redirect header");

      let redirectUrl = new URL(location);

      expect(redirectUrl.searchParams.get("test")).toBe("1");
    }
  });
});
