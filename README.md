# ReplayLastGoal

Automatically create and tweet a video with the latest goal at the world cup.

*Notice: It is your responsiblity to make sure that you stay within the limits of "Fair Use". Laws might be different in your country. The author and contributors of this project decline all responsibility.*
*For reference: Copyright Disclaimer Under Section 107 of the Copyright Act 1976, allowance is made for "fair use" for purposes such as criticism, comment, news reporting, teaching, scholarship, and research. Fair use is a use permitted by copyright statute that might otherwise be infringing. Non-profit, educational or personal use tips the balance in favor of fair use.*

## Try it!

Just follow [@ReplayLastGoal](https://twitter.com/ReplayLastGoal) on Twitter.

## Webhooks

You can add webhooks to automatically receive a notification when a goal is scored along with the animated gif and a link to the video replay. We support classic webhooks, Hipchat and Slack. Go to 
http://ReplayLastGoal.com/hooks/add to configure them.

![ReplayLastGoal notification in Slack](http://recordit.co/tzCHgF6TE9.gif)


## How does it work?

It connects to a video live stream (that you need to provide) and keeps a buffer of about one minute worth of video. When a given twitter account tweets (by default [@GoalFlash](https://twitter.com/GoalFlash)), it uses the buffer to generate a video of the goal and then tweets it. Videos are saved in the `videos/` directory.

## Press & testimonials
- ReplayLastGoal lets you relive the agony and ecstasy of the World Cup in GIFs - [TheNextWeb](http://thenextweb.com/shareables/2014/06/20/replay-last-goal-lets-relive-agony-ecstasy-world-cup-gifs/)
- ReplayLastGoal Instantly Tweets Video Of The Latest World Cup Goal - [Techcrunch](http://techcrunch.com/2014/06/24/replaylastgoal-instantly-tweets-video-of-the-latest-world-cup-goal/)
- Missed a World Cup gooooooooooaaaaalll? A new Twitter bot will catch you up - [NiemanLab](http://www.niemanlab.org/2014/06/missed-a-world-cup-gooooooooooaaaaalll-a-new-twitter-bot-will-catch-you-up/)
- [Best of the reactions on Twitter](https://storify.com/xdamman/replay-last-goal-reactions)
- [Reactions to the take down notice from FIFA](https://storify.com/xdamman/replaylastgoal-reactions-to-fifa-takedown-notice)

## Requirements

## A live video stream

There are a few public television channels in Europe who are live streaming the world cup. The only caveat is that your server needs to be in that country (but it's not too complicated to work around it using the cloud.)

Live streaming works either with Flash which is hard to reverse engineer or with HTML5 for mobile devices. So open the web page with the live stream with Safari and change your user agent to the iPad and you will be able to get the HTML5 version of the live stream. Then you can inspect network traffic to identify the URL of the live stream. It should end with the extension `.m3u8`. Use that URL in `settings.json`.


## Audio Video Converter
You need to have [ffmpeg 2.2x](https://ffmpeg.org/) installed on your machine. On a Mac, it's a piece of cake. Install brew and then do `brew install ffmpeg` and you are done.
On Ubuntu, it's a pain. [This bash script](https://gist.github.com/xdamman/e4f713c8cd1a389a5917) should help you.


## Install

    git clone https://github.com/xdamman/ReplayLastGoal.git
    npm install

Edit `settings.json` and save it as `settings.development.json` (or `settings.production.json` for production environment as set by the `NODE_ENV` variable.)

You are now ready to start the application:

    npm start



## Like it? Love it? 
Share the love by [tweeting](https://twitter.com/intent/tweet?status=%40xdamman%20Thanks%20for%20%40ReplayLastGoal!%20I%20love%20it!) or favoriting this repo!
Oh, and pull requests are more than welcome! :-)

## Contributors
- [Laurent VB](https://github.com/xdamman/ReplayLastGoal/pull/1) (facebook integration)
- [Jonathan Kupferman](https://github.com/xdamman/ReplayLastGoal/pull/2) (better gif quality)

Special thanks to Benjamin Goering ([@bengo](https://twitter.com/bengo)) for his help.

## TODO
(Pull requests welcome)
- [ ] Better pin point when the goal happens in the 20s window to trim down the duration of the video and gif (we could use a VU meter to identify when the sound level peaks)
- [x] Support for multichannels when there is more than one match at once
- [ ] Better test coverage
- [ ] Interface to manage webhooks and allow anyone to add their own webhook
- [ ] [Hipchat Add On](https://www.hipchat.com/docs/apiv2/addons) 
- [ ] Slack add on
- [x] Generate image to send with the tweet (finding the right one might be tricky)
- [ ] Refactoring to start streaming the video of the goal as soon as we start recording
- [ ] Automatically turn on/off the input stream when there is a match
- [ ] Automatically create a video summary with all the goals after the game ends
