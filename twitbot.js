/*
every 20 minutes, retweets the latest hashtag (each hashtag has a different chance of being rt),
and gives a countdown with a hashtag that is a synonym of excited from wordnik (although the synonyms
are not that great)
and responds to the latest mention, asking which starter is the best (it's froakie), or responds to a response to 
that question
*/

// DEBUG
var debug =false;		// if we don't want it to post to Twitter! Useful for debugging!

// Twitter stuff
var Twit = require('twit');
var T = new Twit(require('./config.js'));			// POINT TO YOUR TWITTER KEYS

var hashtags = ["#pokemonxy","#pokemon","#teamfroakie","#teamchespin","#teamfennekin"];
var tag = 0;
function retweetXY() {
var query = {q: hashtags[tag], count: 10, result_type: "recent"};
	T.get('search/tweets', query, function (error, data) {
	  // If our search request to the server had no errors...
	//  console.log(/*error, */data);
	  if (!error) {
	  	// ...then we grab the ID of the tweet we want to retweet...
		
		var count = 0;
			while(data.statuses[count].lang!="en" && data.statuses[count].retweeted)
				count +=1;
		var retweetId = data.statuses[count].id_str;
		// ...and then we tell Twitter we want to retweet it!
		if(!debug){
			T.post('statuses/retweet/' + retweetId, { }, function (error, response) {
				if (response) {
					console.log('Success! Check your bot, it should have retweeted something.')
				}
				// If there was an error with our Twitter call, we print it out here.
				if (error) {
					console.log('There was an error with Twitter:', error);
				}
			})
		}
		else{
			console.log(data.statuses[count].text);
		}
	  }
	  // However, if our original search request had an error, we want to print it out here.
	  else {
	  	console.log('There was an error with your hashtag search:', error);
	  }
	});
}

function respondToMention() {
console.log("respondToMention");
	T.get('statuses/mentions_timeline', { count:10, include_rts:0 },  function (err, reply) {
		  if (err !== null) {
			console.log('Error: ', err);
		  }
		  else {
		  if(reply[0]){
				mention = reply[0];
				if(mention){
					mentionId = mention.id_str;
					mentioner = '@' + mention.user.screen_name;
					var tweet =  mentioner + " ";
					if(mention.text=="#teamfroakie"){
						tweet += "Good choice!";
					}
					else if(mention.text=="teamchespin"){
						tweet += "My Charmander will scorch you!";
					}
					else if(mention.text=="teamfennekin"){
						tweet += "My Froakie will douse your flames!";
					}
					else
						tweet += "#teamfroakie #teamchespin or #teamfennekin?";
						
					if (debug) 
						console.log(tweet);
					else
						T.post('statuses/update', {status: tweet, in_reply_to_status_id: mentionId }, function(err, reply) {
							if (err !== null) {
								console.log('Error: ', err);
							}
							else {
								console.log('Tweeted: ', tweet);
							}
						});
				}
		  }
		  }
	});
}

function retweet() {
console.log("runBot");
		var rand = Math.random();
 		if(rand <= .60) {      
			tag = 0;
			retweetXY();
		} 
		else if (rand <= 0.75) {
			tag = 2;
			retweetXY();
		} 
		else if (rand <= 0.85){
			tag=1;
			retweetXY();
		}
		else if(rand <= .95){
			tag=3;
			retweetXY();
		}
		else{
			tag = 5;
			retweetXY();
		}
		
	}
	
var monthDays = [31,28,31,30,31,30,31,31,30,31,30,31];
var releaseDay=285;

function countdown(hashtag){
console.log("countdown");
	var date = new Date();
	var m = date.getMonth();
	var d = date.getDate();
	var hour = date.getHours();
	var min = date.getMinutes();
	var sec = date.getSeconds();

	var today = 0;
	for(var ii=0;ii<m;ii++){
		today+=monthDays[ii];
	}
	today+=d;
	var tweetText = "";
	if(releaseDay>today){
	tweetText=(releaseDay-today-1) + " days, " 
				  + (23-hour) + " hours, " 
				  + (59-min) + " minutes, and "
				  + (60-sec) + " seconds left!";
	}
	else{
	tweetText="It's been "+(releaseDay-today)*-1 + " days, " 
				  + (hour) + " hours, " 
				  + (min) + " minutes, and "
				  + (sec) + " seconds since Pokemon X and Pokemon Y were released!";
	}
	tweetText += " #"+hashtag;
				  
 	if (debug) 
		console.log(tweetText);
	else
		T.post('statuses/update', {status: tweetText }, function(err, reply) {
			if (err !== null) {
				console.log('Error: ', err);
			}
			else {
				console.log('Tweeted: ', tweetText);
			}
		});
		
}

function runBot(){
var wordnik = require('wordnik');
var apiKey = 'cd654cb06c0759970e69f04141e0881073b3b64c48c066926';
var request = require('request');
var inflection = require('inflection');
var url="http://api.wordnik.com/v4/word.json/excite/relatedWords?api_key="+apiKey;

request(url,function(err, response, data) {
		if (err != null) return;		// bail if no data
		data = eval(data);
		
		var words = [];
		for (var i = 0; i < data.length; i++) {
			if(data[i].relationshipType=="synonym"){
				words = data[i].words;
			}
		}
		var index = Math.floor(Math.random()*words.length);
		countdown(words[index]);
		retweet();
		respondToMention();
	});
}
// Run the bot
runBot();

setInterval(runBot, 1000 * 60*20);
