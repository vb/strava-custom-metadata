import strava from 'strava-v3';
import { Activity, getAccessToken, getRoutes } from '../strava';
import { calcuateEffortCount, identifyRoute } from '../routes';

const counter: Record<string, number> = {};

const processPreviousActivities = async () => {
    const access_token = await getAccessToken();
    const previousActivities: Activity[] = await strava.athlete.listActivities({ per_page: 100, access_token });
    const routes = await getRoutes({ access_token });

    const activitiesSorted = previousActivities.sort((a, b) => (a.start_date_local > b.start_date_local ? 1 : -1));

    for (const activity of activitiesSorted) {
        const route = await identifyRoute(activity, routes);

        console.log('Processing activity', activity.id);
        if (!route || route.name == null) continue;

        counter[route.name] = (counter[route.name] ?? 0) + 1;

        const previousEfforts = calcuateEffortCount(route);
        const totalEfforts = previousEfforts + counter[route.name];
        const name = `${route.name} #${totalEfforts}`;

        await strava.activities.update({
            id: activity.id,
            access_token,
            name,
        });
    }
};

processPreviousActivities();
