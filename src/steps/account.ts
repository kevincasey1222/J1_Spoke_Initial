import {
  createIntegrationEntity,
  IntegrationStep,
  IntegrationStepExecutionContext,
} from '@jupiterone/integration-sdk-core';

import { IntegrationConfig } from '../types';

export const ACCOUNT_ENTITY_KEY = 'at_spoke_account';

export async function fetchAccountDetails({
  instance,
  jobState,
}: IntegrationStepExecutionContext<IntegrationConfig>) {
  const name = `atSpoke - ${instance.name}`;
  const accountEntity = await jobState.addEntity(
    createIntegrationEntity({
      entityData: {
        source: {
          id: 'atSpoke',
          name: 'atSpoke Account',
        },
        assign: {
          _key: `at-spoke-account:${instance.id}`,
          _type: ACCOUNT_ENTITY_KEY,
          _class: 'Account',
          name,
          displayName: name,
        },
      },
    }),
  );

  await jobState.setData(ACCOUNT_ENTITY_KEY, accountEntity);
}

export const accountSteps: IntegrationStep<IntegrationConfig>[] = [
  {
    id: 'fetch-account',
    name: 'Fetch Account Details',
    entities: [
      {
        resourceName: 'atSpoke Account',
        _type: ACCOUNT_ENTITY_KEY,
        _class: 'Account',
      },
    ],
    relationships: [],
    dependsOn: [],
    executionHandler: fetchAccountDetails,
  },
];
