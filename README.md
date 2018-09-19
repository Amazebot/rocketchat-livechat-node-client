# rocketchat-livechat-node-client
Connect to Rocket.Chat livechat as a guest and respond to events in it's stream via the Node JS SDK

## Setup

1. Add a user for this app, with `bot` and `livechat-manager` roles
2. Add credentials to `.env` following the `.env.example`
3. Install dependencies with `npm install`
4. Compile the source with `npm run build`

## Run

1. Log into Rocket.Chat as a livechat agent
2. Run app using `npm start`
3. Open new livechat room and chat with the created guest
4. See the callback log sent messages

## Customise

1. Replace demo usage of `.registerGuest` method for your integrations
2. Call `.registerGuest` with guest details and a callback for their messages
3. Recompile source `npm run build`
4. You can also run from source, using `npm run dev`
