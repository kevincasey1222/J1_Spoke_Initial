import { accountSteps } from './account';
import { accessSteps } from './access';
import { webhookSteps } from './webhooks';

const integrationSteps = [...accountSteps, ...accessSteps, ...webhookSteps];

export { integrationSteps };
