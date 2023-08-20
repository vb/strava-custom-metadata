/* eslint-disable @typescript-eslint/no-explicit-any */
const routesActual = jest.requireActual('../../src/routes');
const stravaActual = jest.requireActual('../../src/strava');

import { APIGatewayProxyResult } from 'aws-lambda';
import { lambdaHandler } from '../../src';
import { expect, describe, it } from '@jest/globals';

const stravaEvent = (type: string, id: number) =>
    `{"aspect_type":"${type}","event_time":1,"object_id":${id},"object_type":"activity","owner_id":3,"subscription_id":4,"updates":{"title":"Test"}}`;

let mockUpdateActivity: jest.Mock;

jest.mock('../../src/logger', () => ({
    logger: {
        log: jest.fn(),
        error: jest.fn(),
    },
}));

jest.mock('../../src/routes', () => ({
    ...routesActual,
    identifyRoute: (args: any) => {
        const { id } = args;
        if (id === 1) {
            return Promise.resolve({
                name: 'Route',
                previousEfforts: 10,
            });
        }
        if (id === 2) {
            return Promise.resolve(null);
        }
        if (id === 3) {
            return Promise.resolve({
                name: 'Another Route',
                previousEfforts: 31,
            });
        }
    },
}));

jest.mock('../../src/environment', () => ({
    environment: {
        STRAVA_VERIFY_TOKEN: 'test',
    },
}));

jest.mock('../../src/strava', () => ({
    ...stravaActual,
    getAccessToken: () => Promise.resolve('123'),
    getActivity: (args: any) => {
        const { id } = args;
        if (id === 1) {
            return Promise.resolve({
                id: 1,
                name: 'Test',
                description: 'Test',
                similar_activities: {
                    effort_count: 2,
                },
                average_heartrate: 100,
            });
        }
        if (id === 2) {
            return Promise.resolve({
                id: 2,
                name: 'Test',
                description: 'Test',
                similar_activities: {
                    effort_count: 1,
                },
                average_heartrate: 1,
            });
        }
        if (id === 3) {
            return Promise.resolve({
                id: 3,
                name: 'Test',
                description: 'Test',
                similar_activities: {
                    effort_count: 23,
                },
                average_heartrate: 100,
            });
        }
    },
    updateActivity: (args: any) => {
        mockUpdateActivity = jest.fn();
        return mockUpdateActivity(args);
    },
}));

describe('Handler', function () {
    beforeEach(() => {
        jest.clearAllMocks();
    });

    it('Returns 204 on a GET request', async () => {
        const event = {
            httpMethod: 'GET',
            body: '',
        } as any;

        const result: APIGatewayProxyResult = await lambdaHandler(event);
        expect(result.statusCode).toEqual(204);
    });

    it('Returns the hub.challange if correct hub.verify_token', async () => {
        const event = {
            httpMethod: 'GET',
            body: '',
            queryStringParameters: {
                'hub.mode': 'subscribe',
                'hub.challenge': 'challenge',
                'hub.verify_token': 'test',
            },
        } as any;

        const result: APIGatewayProxyResult = await lambdaHandler(event);
        expect(result.statusCode).toEqual(200);
        expect(result.body).toEqual(
            JSON.stringify({
                'hub.challenge': 'challenge',
            })
        );
    });

    it('Returns 400 if invalid hub.verify_token', async () => {
        const event = {
            httpMethod: 'GET',
            body: '',
            queryStringParameters: {
                'hub.mode': 'subscribe',
                'hub.challenge': 'challenge',
                'hub.verify_token': 'wrong token',
            },
        } as any;

        const result: APIGatewayProxyResult = await lambdaHandler(event);
        expect(result.statusCode).toEqual(403);
        expect(result.body).toEqual(
            JSON.stringify({
                message: 'Forbidden',
            })
        );
    });

    it('return 400 if invalid POST request', async () => {
        const event = {
            httpMethod: 'POST',
            body: '',
        } as any;

        const result: APIGatewayProxyResult = await lambdaHandler(event);
        expect(result.statusCode).toEqual(400);
        expect(result.body).toEqual(
            JSON.stringify({
                message: 'Bad Request',
            })
        );
    });

    it('validates POST body', async () => {
        const event = {
            httpMethod: 'POST',
            body: stravaEvent('invalid', 2),
        } as any;

        const result: APIGatewayProxyResult = await lambdaHandler(event);
        expect(result.statusCode).toEqual(400);
        expect(result.body).toEqual(
            JSON.stringify({
                message: 'Bad Request',
            })
        );
    });

    it('ignores aspect_type update', async () => {
        const event = {
            httpMethod: 'POST',
            body: stravaEvent('update', 2),
        } as any;

        const result: APIGatewayProxyResult = await lambdaHandler(event);
        expect(result.statusCode).toEqual(204);
        expect(result.body).toEqual('');
    });

    it('ignores aspect_type delete', async () => {
        const event = {
            httpMethod: 'POST',
            body: stravaEvent('delete', 2),
        } as any;

        const result: APIGatewayProxyResult = await lambdaHandler(event);
        expect(result.statusCode).toEqual(204);
        expect(result.body).toEqual('');
    });

    it('create event', async () => {
        const event = {
            httpMethod: 'POST',
            body: stravaEvent('create', 1),
        } as any;

        const result: APIGatewayProxyResult = await lambdaHandler(event);
        expect(mockUpdateActivity).toBeCalledWith({
            access_token: '123',
            description: 'MAF ❤️ 100 bpm',
            id: 1,
            name: 'Route #12',
        });
        expect(result.statusCode).toEqual(201);
        expect(result.body).toEqual(JSON.stringify({ message: 'ok' }));
    });

    it('create event again', async () => {
        const event = {
            httpMethod: 'POST',
            body: stravaEvent('create', 3),
        } as any;

        const result: APIGatewayProxyResult = await lambdaHandler(event);
        expect(mockUpdateActivity).toBeCalledWith({
            access_token: '123',
            description: 'MAF ❤️ 100 bpm',
            id: 3,
            name: 'Another Route #54',
        });
        expect(result.statusCode).toEqual(201);
        expect(result.body).toEqual(JSON.stringify({ message: 'ok' }));
    });

    it('ignores activity without predefined route', async () => {
        const event = {
            httpMethod: 'POST',
            body: stravaEvent('create', 2),
        } as any;

        const result: APIGatewayProxyResult = await lambdaHandler(event);
        expect(result.statusCode).toEqual(204);
    });
});
