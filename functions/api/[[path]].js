import {handleApiRequest} from '../../src/worker/index.js';

export async function onRequest(context) {
    return handleApiRequest(context.request, context.env, context);
}
