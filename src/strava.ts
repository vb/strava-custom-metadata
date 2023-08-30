import { z } from 'zod';
import strava, { AthleteRouteResponse, DetailedActivityResponse } from 'strava-v3';
import { environment } from './environment';
export interface Activity extends DetailedActivityResponse {
    similar_activities?: {
        effort_count: number;
    };
    average_heartrate?: number;
}

export type Route = AthleteRouteResponse;

export const StravaPushVerification = z.object({
    'hub.mode': z.literal('subscribe'),
    'hub.verify_token': z.literal(environment.STRAVA_VERIFY_TOKEN),
    'hub.challenge': z.string(),
});

export const StravaEventData = z.object({
    aspect_type: z.union([z.literal('create'), z.literal('update'), z.literal('delete')]),
    event_time: z.number(),
    object_id: z.number(),
    object_type: z.union([z.literal('activity'), z.literal('athlete')]),
    owner_id: z.number(),
    subscription_id: z.number(),
    updates: z.object({
        title: z.string().optional(),
        type: z.string().optional(),
        private: z.boolean().optional(),
    }),
});

export type StravaEventDataType = z.infer<typeof StravaEventData>;

export const getAccessToken = async () => {
    const response = await strava.oauth.refreshToken(environment.STRAVA_REFRESH_TOKEN);
    return response.access_token;
};

export const getActivity = async (args: { id: number; access_token: string }): Promise<Activity> => {
    const activity = await strava.activities.get(args);
    return activity;
};

export const getRoutes = async (args: { access_token: string }): Promise<Route[]> => {
    const routes = await strava.athlete.listRoutes(args);
    return routes;
};

export const updateActivity = async (args: {
    id: number;
    access_token: string;
    name?: string;
    description?: string;
}): Promise<Activity> => {
    const activity = await strava.activities.update(args);
    return activity;
};
