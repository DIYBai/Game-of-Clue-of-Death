var fs   = require( 'fs' );
var http = require( 'http' );
var sql = require( 'sqlite3');
var game = require( './game_utils.js');

var playing = false;
var players = 0;
var readyPlayers = 0;
var gameMap;

function serverFun( req, res )
{
    // console.log( req );
    console.log( "The URL: '", req.url, "'" );
    var ipAddress = req.connection.remoteAddress;
    if(req.url === "/" | req.url === "")
    {
      game.checkNewPlayerHelper( ipAddress, function( bool )
          {
            if ( bool ) {
              console.log("evaluated to true");
              req.url = "/newPlayer.html";
            }
            else if(playing) {
              req.url = "/play.html";
            }
            else {
              req.url = "/ready.html";
            }
            var file_worked = serveFile(req, res);
            if (!file_worked)
            {
              serveDynamic( req, res );
            }
          });
        //console.log("check new player " + checkNewPlayer(ipAddress));
    }
    else
    {
        if(req.url.indexOf("add_player") >= 0)
        {
          game.addUser(req,res);
          if(playing)
          {
            req.url = "/play.html";
          }
          else {
            req.url = "/ready.html"
          }
        }

        var file_worked = serveFile(req, res);
        if (!file_worked)
        {
          serveDynamic( req, res );
        }
    }
}

function serveFile( req, res )
{
    var filename = "./" + req.url;
    try {
        var contents = fs.readFileSync( filename ).toString();
        res.writeHead( 200 );
        res.end( contents );
        return true;
    }
    catch( exp ) {
        return false;
    }
}

function serveDynamic( req, res )
{
    var kvs = getFormValuesFromURL( req.url );
    if( req.url.indexOf( "ready" ) >= 0 ) //since no variables are passed, there is no question mark in the url
    {
      res.writeHead(200);
      readyPlayers++;
      //if(readyPlayers == players)
      if(true) //temp testing
      {
        playing = true;
        game.initializeGame();
      }
      redirect(res, playing, "Readied up successfully");
    }
    else if (req.url.indexOf("waiting") >= 0 )
    {
      console.log("Waiting");
      res.writeHead(200);
      var message = "readyPlayers: " + readyPlayers + "\nplayers: " + players;
      redirect(res, playing, message);
    }
    else if( req.url.indexOf( "select_room?" ) >= 0 )
    {
        var newX = parseInt(kvs.i);
        var newY = parseInt(kvs.j);
        var ipAddress = req.connection.remoteAddress;
        console.log(newX + " | " + newY);
        var db = new sql.Database('players.sqlite');
        db.all("UPDATE UsersPlaying SET xpos=" +
        newX + ", ypos=" + newY + " WHERE ip = '" + ipAddress + "'");
    }
    else if( req.url.indexOf( "get_update?" ) >= 0 )
    {
      game.getPlayersFromTable( function( playerArray )
          {
            response_obj = playerArray;
            console.log("response_obj:" + response_obj);
            res.writeHead( 200 );
            res.end( JSON.stringify( response_obj ) );
          });
    }
    else
    {
        res.writeHead( 404 );
        res.end( "Unknown URL: " + req.url );
    }
}

function redirect(res, playingBool, messageString)
{
  console.log("redirect function playing bool:" + playingBool);
  // if (playingBool === true)
  if(true)  //temporary, for testing purposes
  {
    res.end("<html><body>" + messageString +
    "<script>" +
      "function goToPlay(){ " +
        "window.location = '/play.html';" +
      "}" +
      "window.setTimeout(goToPlay, 1000);" +
    "</script></body></html>")
  }
  else
  {
    res.end("<html><body>" + messageString +
    "<script>" +
      "function goToWait(){ " +
        "window.location = '/waiting';" +
      "}" +
      "window.setTimeout(goToWait, 1000);" +
    "</script></body></html>")
  }
}

function getFormValuesFromURL( url )
{
    var kvs = {};
    var parts = url.split( "?" );
    if( parts.length === 2 )
    {
        var key_value_pairs = parts[1].split( "&" );
        for( var i = 0; i < key_value_pairs.length; i++ )
        {
            var key_value = key_value_pairs[i].split( "=" );
            kvs[ key_value[0] ] = key_value[1];
        }
    }
    return kvs
}

var server = http.createServer( serverFun );

server.listen( 8080 );
