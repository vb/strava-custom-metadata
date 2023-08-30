# Strava Custom Metadata

<img width="617" alt="Screenshot 2023-08-20 at 17 04 51" src="https://github.com/vb/strava-custom-metadata/assets/1597781/f2951880-7e3f-4990-bc40-29c229d7b4a1">


This repo contains a function that will update your Strava activity title with the name of the route you ran and how many times you've run it.

## Prerequisites

- Strava account
- Strava app. Create one [here](https://www.strava.com/settings/api)
- Strava refresh token with the `activity:read_all` and `activity:write` scope. Read more [here](https://developers.strava.com/docs/authentication)
- AWS account
  - AWS cli
  - SAM cli

## How it works

### Executing the script

- This is supposed to be run as an AWS Lambda function
- Via Stravas Webhook API, the script is triggered whenever a new activity is created

### Identifiying a route

- Identify your most common running routes and save them as routes in Strava
- The script compares the polyline of your activity to the polylines of your routes with the help of the `linematch` package
- If the activity matches a route, the script will update the title of the activity with the name of the route and how many times you've run it

## Setup

- Create a Strava app at https://www.strava.com/settings/api
- Create a new AWS Lambda function
- Add the following environment variables to your Lambda function:
  - `STRAVA_CLIENT_ID`: The Client ID of your Strava app
  - `STRAVA_CLIENT_SECRET`: The Client Secret of your Strava app
  - `STRAVA_REFRESH_TOKEN`: The Refresh Token of your Strava app
- Add an API Gateway trigger to your Lambda function
- Create a new API Gateway API
- Create a new POST method on your API Gateway API
- Add a new Lambda Proxy integration to your POST method

## Registering the webhook

```bash
curl --location 'https://www.strava.com/api/v3/push_subscriptions' \
--header 'Authorization: Bearer {your token}' \
--form 'client_id="{your client id}"' \
--form 'client_secret="{your client secret}"' \
--form 'callback_url="{url to AWS lambda function}"' \
--form 'verify_token="{needs to match the STRAVA_VERIFY_TOKEN environment variable}"'
```


## Useful snippets

### Process previous activites
  
```bash
npx ts-node src/scripts/processPreviousActivities.ts
```

### Tail logs

```bash
aws logs tail {fn name} --follow
```

### Set AWS environment variables

```bash
aws lambda update-function-configuration --function-name {fn name} --environment Variables='{key1=value1,key2=value2}'
```


## Todo 

- [ ] Support for detecting interval training
- [ ] Support for setting title and description according to a template (e.g. "Ran {route} for the {nth} time")
