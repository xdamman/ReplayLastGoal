# ReplayLastGoal

Automatically create and tweet a video with the latest goal at the world cup.

## How does it work?

It connects to a video live stream (that you need to provide) and keeps a buffer of about one minute worth of video. When a given twitter account (by default [@GoalFlash](https://twitter.com/GoalFlash)) tweets, it uses the buffer to generate a video of the goal and then tweet it. Videos are saved in the `videos/` directory.

*This is for personal use only. Please make sure that you get a legal live video stream and that you respect its terms of service.*

## Requirements

## A live video stream

There are a few public television channels in Europe who are live streaming the world cup. The only caveat is that your server needs to be in that country (but it's not too complicated to work around it using the cloud.)

Live streaming works either with Flash which is hard to reverse engineer or with HTML5 for mobile devices. So open the web page with the live stream with Safari and change your user agent to the iPad and you will be able to get the HTML5 version of the live stream. Then you can inspect network traffic to identify the URL of the live stream. It should end with the extension `.m3u8`. Use that URL in `settings.json`.


## Audio Video Converter
You need to have [avconv v10](http://libav.org/avconv.html) installed on your machine. On a Mac, it's a piece of cake. Install brew and then do `brew install avconv` and you are done.
On Ubuntu, it's a pain. [Those instructions](https://gist.github.com/xdamman/e3387e1adf51aeb021d0) should help you.


## Install

    git clone https://github.com/xdamman/ReplayLastGoal.git
    npm install
    vim settings.json // edit this file with your parameters
    npm start



## Like it? Love it? 
Share the love by [tweeting](https://twitter.com/intent/tweet?status=%40xdamman%20Thanks%20for%20%40ReplayLastGoal!%20I%20love%20it!) or favoriting this repo!
Oh, and pull requests are more than welcome! :-)

## Special thanks
Special thanks to Benjamin Goering ([@bengo](https://twitter.com/bengo)) for his help.

## TODO
(Pull requests welcome)
- [ ] Better test coverage
- [ ] More webhooks (e.g. HipChat)
- [ ] Generate image to send with the tweet (finding the right one might be tricky)
- [ ] Refactoring to start streaming the video of the goal as soon as we start recording
- [ ] Automatically create a video summary with all the goals after the game ends
- [ ] Automatically turn on/off the input stream when there is a match