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

export async function fetchUsers({
  instance,
  jobState,
}: IntegrationStepExecutionContext<IntegrationConfig>) {
  const apiClient = createAPIClient(instance.config);

  const accountEntity = (await jobState.getData(ACCOUNT_ENTITY_KEY)) as Entity;

  await apiClient.iterateUsers(async (user) => {
    const userEntity = await jobState.addEntity(
      createIntegrationEntity({
        entityData: {
          source: user,
          assign: {
            _type: 'at_spoke_user',
            _class: 'User',
            _key: user.id,
            username: user.displayName,
            name: user.displayName,
            displayName: user.displayName,
            email: user.email,
            isEmailVerified: user.isEmailVerified,
            isProfileCompleted: user.isProfileCompleted,
            status: user.status,
            memberships: user.memberships,
          },
        },
      }),
    );

    await jobState.addRelationship(
      createDirectRelationship({
        _class: RelationshipClass.HAS,
        from: accountEntity,
        to: userEntity,
      }),
    );
  });
}

export async function fetchGroups({
  instance,
  jobState,
}: IntegrationStepExecutionContext<IntegrationConfig>) {
  const apiClient = createAPIClient(instance.config);

  const accountEntity = (await jobState.getData(ACCOUNT_ENTITY_KEY)) as Entity;

  await apiClient.iterateGroups(async (group) => {
    const groupEntity = await jobState.addEntity(
      createIntegrationEntity({
        entityData: {
          source: group,
          assign: {
            _type: 'at_spoke_group',
            _class: 'UserGroup',
            _key: group.id,
            email: group.email,
            name: group.name,
            displayName: group.name,
            description: group.description,
            org: group.org,
            webLink: group.permalink,
          },
        },
      }),
    );

    await jobState.addRelationship(
      createDirectRelationship({
        _class: RelationshipClass.HAS,
        from: accountEntity,
        to: groupEntity,
      }),
    );

    for (const user of group.users || []) {
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
    }
  });
}

export const accessSteps: IntegrationStep<IntegrationConfig>[] = [
  {
    id: 'fetch-users',
    name: 'Fetch Users',
    entities: [
      {
        resourceName: 'Account',
        _type: 'at_spoke_account',
        _class: 'Account',
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
        _type: 'at_spoke_account_has_group',
        _class: RelationshipClass.HAS,
        sourceType: 'at_spoke_account',
        targetType: 'at_spoke_group',
      },
      {
        _type: 'at_spoke_group_has_user',
        _class: RelationshipClass.HAS,
        sourceType: 'at_spoke_group',
        targetType: 'at_spoke_user',
      },
    ],
    dependsOn: ['fetch-account'],
    executionHandler: fetchUsers,
  },
  {
    id: 'fetch-groups',
    name: 'Fetch UserGroups',
    entities: [
      {
        resourceName: 'Account',
        _type: 'at_spoke_account',
        _class: 'Account',
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
        _type: 'at_spoke_account_has_group',
        _class: RelationshipClass.HAS,
        sourceType: 'at_spoke_account',
        targetType: 'at_spoke_group',
      },
      {
        _type: 'at_spoke_group_has_user',
        _class: RelationshipClass.HAS,
        sourceType: 'at_spoke_group',
        targetType: 'at_spoke_user',
      },
    ],
    dependsOn: ['fetch-users'],
    executionHandler: fetchGroups,
  },
];
