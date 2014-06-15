# ReplayLastGoal

Automatically create and tweet a video with the latest goal at the world cup

## Install

    git clone https://github.com/xdamman/ReplayLastGoal.git
    npm install
    vim settings.json // edit this file with your parameters
    npm start

## How does it work?

It connects to a video live streaming and keeps a buffer of about one minute worth of video. When a given twitter account (by default @GoalFlash) tweets, it uses the buffer to generate a video of the goal and then tweet it!

## Like it? Love it? 
Share the love by [tweeting @xdamman](https://twitter.com/intent/tweet?status=%40xdamman%20Thanks%20for%20%40ReplayLastGoal!%20I%20love%20it!) or favoriting this repo!
Oh, and pull requests are more than welcome! :-)