import {
  OAuth2Profile,
  OAuth2Strategy,
  OAuth2StrategyVerifyParams,
} from "remix-auth-oauth2";
import type { StrategyVerifyCallback } from "remix-auth";

export interface ClerkStrategyOptions {
  domain: string;
  clientID: string;
  clientSecret: string;
  callbackURL: string;
  scopes?: ClerkScope[] | string;
}

/**
 * @see https://clerk.com/docs/reference/backend-api/tag/OAuth-Applications#operation/CreateOAuthApplication!path=scopes&t=request
 */
export type ClerkScope =
  | "profile"
  | "email"
  | "public_metadata"
  | "private_metadata"
  | string;

export interface ClerkProfile extends OAuth2Profile {
  _json?: ClerkUserInfo;
}

export interface ClerkExtraParams extends Record<string, unknown> {
  id_token?: string;
  scope: string;
  expires_in: number;
  token_type: "Bearer";
}

interface ClerkUserInfo {
  object?: "oauth_user_info";
  instance_id?: string;
  email?: string;
  email_verified?: boolean;
  family_name?: string;
  given_name?: string;
  name?: string;
  username?: string;
  picture?: string;
  user_id?: string;
  public_metadata?: Record<string, unknown>;
  private_metadata?: Record<string, unknown>;
  unsafe_metadata?: Record<string, unknown>;
}

export const ClerkStrategyDefaultName = "clerk";
export const ClerkStrategyDefaultScope: ClerkScope =
  "profile email public_metadata";
export const ClerkStrategyScopeSeperator = " ";

export class ClerkStrategy<User> extends OAuth2Strategy<
  User,
  ClerkProfile,
  ClerkExtraParams
> {
  name = ClerkStrategyDefaultName;

  private userInfoURL: string;

  constructor(
    options: ClerkStrategyOptions,
    verify: StrategyVerifyCallback<
      User,
      OAuth2StrategyVerifyParams<ClerkProfile, ClerkExtraParams>
    >,
  ) {
    super(
      {
        authorizationURL: `https://${options.domain}/oauth/authorize`,
        tokenURL: `https://${options.domain}/oauth/token`,
        clientID: options.clientID,
        clientSecret: options.clientSecret,
        callbackURL: options.callbackURL,
      },
      verify,
    );

    this.userInfoURL = `https://${options.domain}/oauth/userinfo`;
    this.scope = this.getScope(options.scopes);
  }

  // Allow users the option to pass a scope string, or typed array
  private getScope(scopes: ClerkStrategyOptions["scopes"]) {
    if (!scopes) {
      return ClerkStrategyDefaultScope;
    } else if (typeof scopes === "string") {
      return scopes;
    }

    return scopes.join(ClerkStrategyScopeSeperator);
  }

  protected authorizationParams(params: URLSearchParams) {
    params.set("scopes", this.scope || ClerkStrategyDefaultScope);

    return params;
  }

  protected async userProfile(accessToken: string): Promise<ClerkProfile> {
    let profile: ClerkProfile = {
      provider: ClerkStrategyDefaultName,
    };

    let response = await fetch(this.userInfoURL, {
      headers: { Authorization: `Bearer ${accessToken}` },
    });
    let data: ClerkUserInfo = await response.json();

    profile._json = data;

    if (data.user_id) {
      profile.id = data.user_id;
    }

    if (data.name) {
      profile.displayName = data.name;
    }

    if (data.family_name || data.given_name) {
      profile.name = {};

      if (data.family_name) {
        profile.name.familyName = data.family_name;
      }

      if (data.given_name) {
        profile.name.givenName = data.given_name;
      }
    }

    if (data.email) {
      profile.emails = [{ value: data.email }];
    }

    if (data.picture) {
      profile.photos = [{ value: data.picture }];
    }

    return profile;
  }
}
