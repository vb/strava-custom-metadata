import z from 'zod';

const environmentSchema = z.object({
    STRAVA_REFRESH_TOKEN: z.string(),
    STRAVA_CLIENT_ID: z.string(),
    STRAVA_CLIENT_SECRET: z.string(),
    STRAVA_VERIFY_TOKEN: z.string(),
});

export const environment = environmentSchema.parse(process.env);
