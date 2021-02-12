import http from 'http';
import axios, { AxiosInstance } from 'axios';

import {
  GraphObjectLookupKey,
  IntegrationProviderAuthenticationError,
} from '@jupiterone/integration-sdk-core';

import { IntegrationConfig } from './types';

export type ResourceIteratee<T> = (each: T) => Promise<void> | void;

// Providers often supply types with their API libraries.

type AtSpokeUser = {
  id: string;
  displayName: string;
  email: string;
  isEmailVerified?: boolean;
  isProfileCompleted?: boolean;
  status?: string;
  profile?: object;
  memberships?: string[];
  startDate?: string;
};

type AtSpokeGroup = {
  id: string;
  name: string;
  slug: string;
  description: string;
  keywords: string[];
  icon: string;
  color: string;
  status: string;
  goals: object;
  agentList: AtSpokeAgentListItem[];
  createdAt: string;
  updatedAt: string;
  owner: string;
  org: string;
  email: string;
  permalink: string;
  settings?: object;
  users?: Pick<AtSpokeUser, 'id'>[];
};

type AtSpokeAgentListItem = {
  timestamps?: object;
  status: string;
  teamRole: string;
  user: AtSpokeUser;
};

/*
import { Opaque } from 'type-fest';
export type AcmeUser = Opaque<any, 'AcmeUser'>;
export type AcmeGroup = Opaque<any, 'AcmeGroup'>;
*/

/**
 * An APIClient maintains authentication state and provides an interface to
 * third party data APIs.
 *
 * It is recommended that integrations wrap provider data APIs to provide a
 * place to handle error responses and implement common patterns for iterating
 * resources.
 */
export class APIClient {
  constructor(readonly config: IntegrationConfig) {}

  getClient(): AxiosInstance {
    const client = axios.create({
      headers: {
        get: {
          client: 'JupiterOne-Spoke Integration client',
          'Content-Type': 'application/json',
          'Api-Key': this.config.apiKey,
        },
      },
    });
    return client;
  }

  public async verifyAuthentication(): Promise<void> {
    // the most light-weight request possible to validate
    // authentication works with the provided credentials, throw an err if
    // authentication fails
    try {
      const reply = await this.getClient().get(
        'https://api.askspoke.com/api/v1/whoami',
      );
      if (reply.status != 200) {
        throw new IntegrationProviderAuthenticationError({
          endpoint: 'https://api.askspoke.com/api/v1/whoami',
          status: reply.status,
          statusText: 'Received HTTP status other than 200',
        });
      }
    } catch (err) {
      throw new IntegrationProviderAuthenticationError({
        cause: err,
        endpoint: 'https://api.askspoke.com/api/v1/whoami',
        status: err.status,
        statusText: err.statusText,
      });
    }
  }

  /**
   * Iterates each user resource in the provider.
   *
   * @param iteratee receives each resource to produce entities/relationships
   */
  public async iterateUsers(
    iteratee: ResourceIteratee<AtSpokeUser>,
  ): Promise<void> {
    // TODO paginate an endpoint, invoke the iteratee with each record in the
    // page
    //
    // The provider API will hopefully support pagination. Functions like this
    // should maintain pagination state, and for each page, for each record in
    // the page, invoke the `ResourceIteratee`. This will encourage a pattern
    // where each resource is processed and dropped from memory.

    let reply;
    try {
      reply = await this.getClient().get(
        'https://api.askspoke.com/api/v1/users',
      );
      if (reply.status != 200) {
        throw new IntegrationProviderAuthenticationError({
          endpoint: 'https://api.askspoke.com/api/v1/users',
          status: reply.status,
          statusText: 'Received HTTP status other than 200',
        });
      }
    } catch (err) {
      throw new IntegrationProviderAuthenticationError({
        cause: err,
        endpoint: 'https://api.askspoke.com/api/v1/users',
        status: err.status,
        statusText: err.statusText,
      });
    }

    const users: AtSpokeUser[] = reply.data.results;
    //to do: add try

    for (const user of users) {
      await iteratee(user);
    }
  }

  /**
   * Iterates each group resource in the provider.
   *
   * @param iteratee receives each resource to produce entities/relationships
   */
  public async iterateGroups(
    iteratee: ResourceIteratee<AtSpokeGroup>,
  ): Promise<void> {
    // TODO paginate an endpoint, invoke the iteratee with each record in the
    // page
    //
    // The provider API will hopefully support pagination. Functions like this
    // should maintain pagination state, and for each page, for each record in
    // the page, invoke the `ResourceIteratee`. This will encourage a pattern
    // where each resource is processed and dropped from memory.

    let reply;
    try {
      reply = await this.getClient().get(
        'https://api.askspoke.com/api/v1/teams',
      );
      if (reply.status != 200) {
        throw new IntegrationProviderAuthenticationError({
          endpoint: 'https://api.askspoke.com/api/v1/teams',
          status: reply.status,
          statusText: 'Received HTTP status other than 200',
        });
      }
    } catch (err) {
      throw new IntegrationProviderAuthenticationError({
        cause: err,
        endpoint: 'https://api.askspoke.com/api/v1/teams',
        status: err.status,
        statusText: err.statusText,
      });
    }

    const groups: AtSpokeGroup[] = reply.data.results;
    //to do: add try

    for (const group of groups) {
      if (group.users === undefined) {
        group.users = [];
      }
      for (const agent of group.agentList) {
        group.users.push(agent.user);
      }
      await iteratee(group);
    }
  }
}

export function createAPIClient(config: IntegrationConfig): APIClient {
  return new APIClient(config);
}
