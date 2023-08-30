import polyline from '@mapbox/polyline';
import lineMatch from 'linematch';
import { Activity, Route } from './strava';

const decodePolyline = (encoded: string) => polyline.decode(encoded);

const ROUTE_MATCHING_THRESHOLD = 0.005;

const doesRoutesMatch = (route1: string, route2: string) => {
    const route1Decoded = [decodePolyline(route1)];
    const route2Decoded = [decodePolyline(route2)];
    const result = lineMatch(route1Decoded, route2Decoded, ROUTE_MATCHING_THRESHOLD);
    return result.length === 0;
};

export const identifyRoute = (activity: Activity, routes: Route[]): Route | null => {
    const currentRoute = activity.map?.polyline ?? activity.map?.summary_polyline;
    if (!currentRoute) {
        return null;
    }

    for (const route of routes) {
        const routePolyline = route.map?.polyline ?? route.map?.summary_polyline;
        if (!routePolyline) {
            continue;
        }
        if (doesRoutesMatch(routePolyline, currentRoute)) {
            return route;
        }
    }
    return null;
};

export const calcuateEffortCount = (route: Route, activity?: Activity) => {
    const routePreviousEfforts = parseInt(route.description?.match(/Previous Efforts: (\d+)/)?.[1] ?? '0', 10);
    const effortCount = activity?.similar_activities?.effort_count ?? 0;
    return routePreviousEfforts + effortCount;
};

export const getRouteTitle = (route: Route, activity: Activity) => {
    const effortCount = calcuateEffortCount(route, activity);
    const title = `${route.name} #${effortCount}`;
    return title;
};
