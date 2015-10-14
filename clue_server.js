var fs   = require( 'fs' );
var http = require( 'http' );
var sql = require( 'sqlite3');
var game = require( './game_utils.js');
//var utils = require( './url_utils.js' );

var playing = false;
var players = 0;
var readyPlayers = 0;
var gameMap;
var time = 5000;

function serverFun( req, res )
{
    // console.log( req );
    console.log( "The URL: '", req.url, "'" );
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
      // game.checkNewPlayerHelper( ipAddress, function( bool )
      //     {
      //     //   if ( bool ) {
      //     //     console.log("evaluated to true");
          //     req.url = "/newPlayer.html";
          //   }
          //   else if(playing) {
          //     req.url = "/play.html";
          //   }
          //   else {
          //     req.url = "/ready.html";
          //   }
       var file_worked = serveFile(req, res);
          //   if (!file_worked)
          //   {
          //     serveDynamic( req, res );
          //   }
          // });
        //console.log("check new player " + checkNewPlayer(ipAddress));
    }
    else
    {
        if(req.url.indexOf("add_player") >= 0)
        {
          addUser(req,res);
          var kvs=getFormValuesFromURL(req.url);
          session_id = ''+kvs.name_input;
          res.setHeader( "Set-Cookie",
                         [ 'session_id='+session_id] );
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
      console.log("Waiting");
      res.writeHead(200);
      var message = "readyPlayers: " + readyPlayers + "\nplayers: " + players;
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
      game.getPlayersFromTable( function( playerArray )
          {
            response_obj = playerArray;
            response_obj.push(time);
            res.writeHead( 200 );
            res.end( JSON.stringify( response_obj ) );
          });
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
      console.log(killer + " has murdered "+killed);
      game.kill(killer,killed);
    }
    else
    {
        res.writeHead( 404 );
        res.end( "Unknown URL: " + req.url );
    }
}

function selectRoomHelper(newX, newY, nameCookie, res)
{
  console.log(nameCookie);
  var db = new sql.Database('players.sqlite');
  db.all("UPDATE UsersPlaying SET xpos=" +
  // newX + ", ypos=" + newY + " WHERE ip = '" + ipAddress + "'");
  newX + ", ypos=" + newY + " WHERE playerName = '" + nameCookie + "'");
  res.writeHead(200);
  res.end("");
}

function addUser( req, res )
{
    var kvs = getFormValuesFromURL( req.url );
    var db = new sql.Database( 'players.sqlite' );
    var name = kvs[ 'name_input' ];
    var ipAddress = req.connection.remoteAddress;
    //console.log("In add user fxn");
    db.run( "INSERT INTO UsersPlaying(ip, playerName) VALUES ( ?, ? ) ", ipAddress, name,
              function (err)
              {
                  console.log("In DB insert query");
                  if(err)
                  {
                    console.log(err);
                  }
              } );
    players++;
}

function redirect(res, playingBool, messageString)
{
  console.log("redirect function playing bool:" + playingBool);
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
  var db = new sql.Database( 'players.sqlite' );
  db.run( "DELETE FROM UsersPlaying")
}

var server = http.createServer( serverFun );
server.listen( 8080 );
clearPlayers();
