import { APIGatewayProxyEvent, APIGatewayProxyResult } from 'aws-lambda';
import {
    StravaEventData,
    StravaEventDataType,
    StravaPushVerification,
    getAccessToken,
    getActivity,
    updateActivity,
} from './strava';
import { getRouteTitle, identifyRoute } from './routes';
import { logger } from './logger';

const handleChallenge = (event: APIGatewayProxyEvent): APIGatewayProxyResult => {
    const qs = event.queryStringParameters ?? {};
    if (StravaPushVerification.safeParse(qs).success) {
        return {
            statusCode: 200,
            body: JSON.stringify({
                'hub.challenge': qs['hub.challenge'],
            }),
        };
    }

    return {
        statusCode: 403,
        body: JSON.stringify({
            message: 'Forbidden',
        }),
    };
};

const parseAndValidateBody = (bodyStr: string | null): StravaEventDataType => {
    const body = JSON.parse(bodyStr ?? '{}');
    const parsed = StravaEventData.safeParse(body);
    if (!parsed.success) {
        throw new Error(parsed.error.message);
    }

    return parsed.data as StravaEventDataType;
};

const handleEventReceived = async (event: APIGatewayProxyEvent): Promise<APIGatewayProxyResult> => {
    try {
        const body = parseAndValidateBody(event.body);

        if (body.aspect_type !== 'create') {
            return {
                statusCode: 204,
                body: '',
            };
        }

        const access_token = await getAccessToken();
        const activity = await getActivity({ id: body.object_id, access_token });
        const route = await identifyRoute(activity);

        if (!route) {
            return {
                statusCode: 204,
                body: '',
            };
        }

        const title = getRouteTitle(route, activity);
        const heartRate = activity?.average_heartrate;
        let description = null;

        if (heartRate) {
            const heartRateFloor = Math.floor(heartRate);
            description = `${heartRate <= 145 ? 'MAF ' : ''}❤️ ${heartRateFloor} bpm`;
        }

        await updateActivity({
            id: body.object_id,
            access_token,
            name: title,
            ...(description && { description }),
        });

        return {
            statusCode: 201,
            body: JSON.stringify({
                message: 'ok',
            }),
        };
    } catch (e) {
        logger.error(e);

        return {
            statusCode: 400,
            body: JSON.stringify({
                message: 'Bad Request',
            }),
        };
    }
};

export const lambdaHandler = async (event: APIGatewayProxyEvent): Promise<APIGatewayProxyResult> => {
    if (event.httpMethod === 'GET' && event.queryStringParameters?.['hub.challenge']) {
        return handleChallenge(event);
    }

    if (event.httpMethod === 'POST') {
        return handleEventReceived(event);
    }

    return {
        statusCode: 204,
        body: '',
    };
};
