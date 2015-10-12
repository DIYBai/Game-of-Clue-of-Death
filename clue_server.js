var fs   = require( 'fs' );
var http = require( 'http' );
var sql = require( 'sqlite3');

var playing = false;
var players = 0;
var readyPlayers = 0;

function serverFun( req, res )
{
    // console.log( req );
    console.log( "The URL: '", req.url, "'" );
    var ipAddress = req.connection.remoteAddress;
    if(req.url === "/" | req.url === "")
    {
      checkNewPlayerHelper( ipAddress, function( b )
          {
            if ( b ) {
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
          addUser(req,res);
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

function checkNewPlayerHelper( param, callback ) {
    var db = new sql.Database('players.sqlite');
    db.all( 'SELECT ip FROM Users', function( err, rows )
        {
            for(var i = 0; i < rows.length; i++)
            {
              if (rows[i].ip == param)
              {
                  callback( false )
                  return;
              }
            }
            callback( true );
        } );
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
      playing = (readyPlayers == players);
      redirect(res, playing, "Readied up successfully");
    }
    else if (req.url.indexOf("waiting") >= 0 )
    {
      console.log("Waiting");
      res.writeHead(200);
      var message = "readyPlayers: " + readyPlayers + "\nplayers: " + players;
      redirect(res, playing, message);
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
    res.end("<html><body>" + mesasgeString +
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

function addUser( req, res )
{
    var kvs = getFormValuesFromURL( req.url );
    var db = new sql.Database( 'players.sqlite' );
    var name = kvs[ 'name_input' ];
    var ipAddress = req.connection.remoteAddress;
    //console.log(ipAddress);
    db.run( "INSERT INTO Users(ip, playerName) VALUES ( ?, ? ) ", ipAddress, name,
              function (err)
              {
                  if(err)
                  {
                    console.log(err);
                  }
              } );
    players++;
}


function generate(size)
{
    var map = [];
    for (var i=0; i<size; i++)
    {
      map.push([]);
      for (var a=0; a<size; a++)
      {
        map[i][a] = "";
        //map[i].push("");   //does the above work? I think it wouldn't because the empty array doesn't have any valid indices
      }
    }
    var items = Math.floor(size * size/5);
    //right now, this may introduce overlap
    //could fix it by creating array of possible locations, then randomly selecting an index, using that position, then splicing that position out of possible locations
    for (var t=0; t<items; t++)
    {
      x = getRandomInt(0, size)
      y = getRandomInt(0, size)
      map[x][y] = "xXx";
    }
    return map;
}

//what does this function do? -DB
function initializeUsers(map)
{
  var center = map.length/2
}

function updatePlayerLocation(map)
{
  var db = new sql.Database( 'players.sqlite' );
  db.all("SELECT * FROM Users",
    function( err, rows ) {
      if (err != null)
      {
        console.log(err);
        return;
      }
      for( var i = 0; i < rows; i++ )
      {
        var x = rows[i].xpos;
        var y = rows[i].ypos
        map[x][y].player.push(rows[i].playerName);  //changed field name because 'name' may be reserved -DB

        //maybe add a field to map[x][y] (AKA a cell) to indicate player and items
        //instead of JUST being represented by a string -DB
      }
  } );
}

function getRandomInt(min, max)
{
  return Math.floor(Math.random() * (max-min))+min;
}


//we need a function to clear the database

var server = http.createServer( serverFun );

server.listen( 8080 );
