var fs   = require( 'fs' );
var http = require( 'http' );
var sql = require( 'sqlite3');
var game = require( './game_utils.js');
var db = new sql.Database('players.sqlite');
//var utils = require( './url_utils.js' );

var playing = false;
var players = 0;
var readyPlayers = 0;
var gameMap;
var time = 5000;
var winCondition = -1;

function serverFun( req, res )
{
    //console.log( "The URL: '", req.url, "'" );
    var ipAddress = req.connection.remoteAddress;
    var cookies = game.parseCookies( req.headers );

    var session_id = '';
    if( 'session_id' in cookies )
    {
        session_id = cookies.session_id;
    }
    res.setHeader( "Set-Cookie",
                   [ 'session_id='+session_id] );
    if(req.url === "/" | req.url === "" | req.url === "/index.html")
    {
      req.url = "/newPlayer.html";
      var file_worked = serveFile(req, res);
    }
    else
    {
        if(req.url.indexOf("add_player") >= 0)
        {
          addUser(req,res, function(successful){
            console.log("success:" + successful);
            if(successful)
            {
              var kvs=getFormValuesFromURL(req.url);
              session_id = ''+kvs.name_input;
              try
              {
                res.setHeader( "Set-Cookie",
                             [ 'session_id='+session_id] );
              }
              catch(exp) {};
              if(playing)
              {
                req.url = "/play.html";
              }
              else {
                req.url = "/ready.html"
              }
            }
            else {
              req.url = "/newPlayer.html"
            }
            var file_worked = serveFile(req, res);
          });
        }
        else {
          var file_worked = serveFile(req, res);
          if (!file_worked)
          {
            serveDynamic( req, res );
          }
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
      if(readyPlayers == players)
      //if(true) //temp testing
      {
        playing = true;
        game.initializeGame();
        changeTime();
      }
      redirect(res, playing, "Waiting for other players");
    }
    else if (req.url.indexOf("waiting") >= 0 )
    {
      res.writeHead(200);
      var message = "Players: " + players + "\nPlayers left to join: " + (players - readyPlayers);
      redirect(res, playing, message);
    }
    else if( req.url.indexOf( "select_room?" ) >= 0 )
    {
        var newX = parseInt(kvs.i);
        var newY = parseInt(kvs.j);
        var nameCookie = req.headers.cookie.substring(11);
        console.log(nameCookie);
        setTimeout(selectRoomHelper, time, newX, newY, nameCookie, res);
    }
    else if( req.url.indexOf( "get_update?" ) >= 0 )
    {
      if(winCondition == -1)
      {
        game.getPlayersFromTable( function( playerArray )
          {
            response_obj = playerArray;
            response_obj.push(time);
            res.writeHead( 200 );
            res.end( JSON.stringify( response_obj ) );
          });
      }
      else
      {
        var response_obj = [];
        var returnString = "";
        if(winCondition = 0)
        {
          returnString = "EVERYONE IS DEAD! EVERYONE LOSES!";
        }
        if(winCondition = 1)
        {
          returnString = "THE MURDERER IS DEAD! THE INNOCENTS WIN!";
        }
        if(winCondition = 2)
        {
          returnString = "THE INNOCENTS ARE DEAD! THE MURDERER WINS!";
        }
        response_obj.push(returnString);
        res.writeHead(200);
        res.end(JSON.stringify(response_obj));
      }
    }
    else if ( req.url.indexOf( "get_player?" ) >= 0 )
    {
      var name = req.headers.cookie.substring(11);

      res.writeHead(200);
      game.getKiller(name, function(is_killer){
        var response_obj = [];
        response_obj.push(name);
        response_obj.push(is_killer);
        console.log("get player response object: " + response_obj[0] + response_obj[1]);
        res.end( JSON.stringify(response_obj));
      } );

    }
    else if (req.url.indexOf( "get_murder?" ) >= 0 )
    {
      var killer = (kvs.killer);
      var killed = (kvs.killed);

      console.log(killer + " has murdered " + killed);
      game.kill(killer, killed, function(winState)
      {
        winCondition = winState;
      });
    }
    else
    {
        res.writeHead( 404 );
        res.end( "Unknown URL: " + req.url );
    }
}

function selectRoomHelper(newX, newY, nameCookie, res)
{
  //console.log(nameCookie);
  var name = nameCookie;
  db.all("UPDATE UsersPlaying SET xpos=" +
  // newX + ", ypos=" + newY + " WHERE ip = '" + ipAddress + "'");
  newX + ", ypos=" + newY + " WHERE playerName = '" + name + "'");
  res.writeHead(200);
  res.end("");
}

function addUser( req, res, callback )
{
    var kvs = getFormValuesFromURL( req.url );
    var name = kvs[ 'name_input' ];
    var ipAddress = req.connection.remoteAddress;
    //console.log("In add user fxn");
    db.run( "INSERT INTO UsersPlaying(ip, playerName) VALUES ( ?, ? ) ", ipAddress, name,
              function (err)
              {
                  if(err)
                  {
                    console.log(err);
                    callback(false);
                  }
                  else {
                    console.log("successfully added player");
                    players++;
                    callback(true);
                  }
              } );
}

function redirect(res, playingBool, messageString)
{
  if (playingBool === true)
  //if(true)  //temporary, for testing purposes
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

function changeTime()
{
  if (time > 0)
  {
    time = time - 500;
  }
  else {
    time = 5000;
  }
  //console.log(time);
  setTimeout(changeTime, 500)
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

function clearPlayers()
{
  db.run( "DELETE FROM UsersPlaying")
}

var server = http.createServer( serverFun );
server.listen( 4444 );
clearPlayers();
