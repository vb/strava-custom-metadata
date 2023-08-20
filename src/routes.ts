import polyline from '@mapbox/polyline';
import lineMatch from 'linematch';
import routes from '../routes.json';
import { Activity } from './strava';

type StaticRoute = {
    name: string;
    encodedPolyline: string;
    previousEfforts?: number;
};

const decodePolyline = (encoded: string) => polyline.decode(encoded);

const ROUTE_MATCHING_THRESHOLD = 0.005;

const doesRoutesMatch = (route1: string, route2: string) => {
    const route1Decoded = [decodePolyline(route1)];
    const route2Decoded = [decodePolyline(route2)];
    const result = lineMatch(route1Decoded, route2Decoded, ROUTE_MATCHING_THRESHOLD);
    return result.length === 0;
};

export const identifyRoute = (activity: Activity): StaticRoute | null => {
    const currentRoute = activity.map?.polyline ?? activity.map?.summary_polyline;
    if (!currentRoute) {
        return null;
    }

    for (const route of routes) {
        if (doesRoutesMatch(route.encodedPolyline, currentRoute)) {
            return route;
        }
    }
    return null;
};

export const calcuateEffortCount = (route: StaticRoute, activity?: Activity) => {
    const routePreviousEfforts = Number(route?.previousEfforts ?? 0);
    const effortCount = activity?.similar_activities?.effort_count ?? 0;
    return routePreviousEfforts + effortCount;
};

export const getRouteTitle = (route: StaticRoute, activity: Activity) => {
    const effortCount = calcuateEffortCount(route, activity);
    const title = `${route.name} #${effortCount}`;
    return title;
};
