import {
  createDirectRelationship,
  createIntegrationEntity,
  Entity,
  IntegrationStep,
  IntegrationStepExecutionContext,
  RelationshipClass,
  IntegrationMissingKeyError,
} from '@jupiterone/integration-sdk-core';

import { createAPIClient } from '../client';
import { IntegrationConfig } from '../types';
import { ACCOUNT_ENTITY_KEY } from './account';

export async function fetchRequests({
  instance,
  jobState,
}: IntegrationStepExecutionContext<IntegrationConfig>) {
  const apiClient = createAPIClient(instance.config);

  const accountEntity = (await jobState.getData(ACCOUNT_ENTITY_KEY)) as Entity;

  await apiClient.iterateRequests(async (request) => {
    const requestEntity = await jobState.addEntity(
      createIntegrationEntity({
        entityData: {
          source: request,
          assign: {
            _type: 'at_spoke_request',
            _class: 'Record',
            _key: request.id,
            name: request.subject,
            displayName: request.subject,
            webLink: request.permalink,
            email: request.email,
            status: request.status,
            requester: request.requester,
            onwer: request.owner,
            requestType: request.requestType,
          },
        },
      }),
    );

    await jobState.addRelationship(
      createDirectRelationship({
        _class: RelationshipClass.HAS,
        from: accountEntity,
        to: requestEntity,
      }),
    );
  });
}

export async function fetchRequestTypes({
  instance,
  jobState,
}: IntegrationStepExecutionContext<IntegrationConfig>) {
  const apiClient = createAPIClient(instance.config);

  const accountEntity = (await jobState.getData(ACCOUNT_ENTITY_KEY)) as Entity;

  await apiClient.iterateRequestTypes(async (requestType) => {
    const requestTypeEntity = await jobState.addEntity(
      createIntegrationEntity({
        entityData: {
          source: requestType,
          assign: {
            _type: 'at_spoke_request_type',
            _class: 'Record',
            _key: requestType.id,
            name: requestType.title,
            displayName: requestType.title,
            description: requestType.description,
            status: requestType.status,
          },
        },
      }),
    );

    await jobState.addRelationship(
      createDirectRelationship({
        _class: RelationshipClass.HAS,
        from: accountEntity,
        to: requestTypeEntity,
      }),
    );

    //Todo: associate requests with request types
    /*    for (const request of group.users || []) {
      const userEntity = await jobState.findEntity(user.id);

      if (!userEntity) {
        throw new IntegrationMissingKeyError(
          `Expected user with key to exist (key=${user.id})`,
        );
      }

      await jobState.addRelationship(
        createDirectRelationship({
          _class: RelationshipClass.HAS,
          from: groupEntity,
          to: userEntity,
        }),
      );
    } */
  });
}

export const requestSteps: IntegrationStep<IntegrationConfig>[] = [
  {
    id: 'fetch-requests',
    name: 'Fetch Requests',
    entities: [
      {
        resourceName: 'atSpoke Account',
        _type: 'at_spoke_account',
        _class: 'Account',
      },
      {
        resourceName: 'atSpoke Request',
        _type: 'at_spoke_request',
        _class: 'Record',
      },
    ],
    relationships: [
      {
        _type: 'at_spoke_account_has_request',
        _class: RelationshipClass.HAS,
        sourceType: 'at_spoke_account',
        targetType: 'at_spoke_request',
      },
    ],
    dependsOn: ['fetch-account'],
    executionHandler: fetchRequests,
  },
  /*{
    id: 'fetch-request-types',
    name: 'Fetch Request Types',
    entities: [
      {
        resourceName: 'atSpoke Account',
        _type: 'at_spoke_account',
        _class: 'Account',
      },
      {
        resourceName: 'atSpoke Request',
        _type: 'at_spoke_request',
        _class: 'Record',
      },
      {
        resourceName: 'atSpoke Request Type',
        _type: 'at_spoke_request_type',
        _class: '',
      },
    ],
    relationships: [
      {
        _type: 'at_spoke_account_has_user',
        _class: RelationshipClass.HAS,
        sourceType: 'at_spoke_account',
        targetType: 'at_spoke_user',
      },
      {
        _type: 'at_spoke_account_has_request_type',
        _class: RelationshipClass.HAS,
        sourceType: 'at_spoke_account',
        targetType: 'at_spoke_request_type',
      },
      {
        _type: 'at_spoke_request_type_has_request',
        _class: RelationshipClass.HAS,
        sourceType: 'at_spoke_request__type',
        targetType: 'at_spoke_request',
      },
    ],
    dependsOn: ['fetch-requests'],
    executionHandler: fetchRequestTypes,
  },*/
];
