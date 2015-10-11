var fs   = require( 'fs' );
var http = require( 'http' );
var sql = require( 'sqlite3');

var the_num = 0;

var playing = false;
var players = 0;
var readyPlayers = 0;

function getRandomInt(min, max)
{
  return Math.floor(Math.random() * (max-min))+min;
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

function addPlayer( req, res )
{
    var kvs = getFormValuesFromURL( req.url );
    var db = new sql.Database( 'players.sqlite' );
    var name = kvs[ 'name_input' ];
    var ipAddress = req.connection.remoteAddress;
    //console.log(ipAddress);
    db.run( "INSERT INTO Users(ip, playerName) VALUES ( ?, ? ) ", ipAddress, name,
              function (err) {
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
      map[i][a]= "";
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

function addUsersToMap(map)
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

function serverFun( req, res )
{
    // console.log( req );
    console.log( "The URL: '", req.url, "'" );
    var ipAddress = req.connection.remoteAddress;
    if(req.url === "/" | req.url === "")
    {
        if ( checkNewPlayer(ipAddress) ) {
          req.url = "/newPlayer.html";
        }
        else if(playing) {
          req.url = "/play.html";
        }
        else {
          req.url = "/ready.html";
        }
    }
    else if(req.url.indexOf("add_player") >= 0)
    {
        addPlayer(req,res);
        if(playing)
        {
          req.url = "/play.html";
        }
        else {
          req.url = "/ready.html"
        }
    }
    var file_worked = serveFile(req, res);
    if (file_worked)
    {
      return;
    }

    serveDynamic( req, res );
}


//how to actually return something using database?
function checkNewPlayer(address)
{
  var db = new sql.Database( 'players.sqlite' );
  var newPlayer=true;
  db.all("SELECT ip FROM Users",
    function( err, rows ) {
      if (err != null)
      {
        console.log(err);
        return;
      }
      for( var i = 0; i < rows; i++ )
      {
        //if(rows[i].ip === address)
        if(rows[i].ip === "INCORRECT STRING")
        {
          newPlayer = false;
          return newPlayer;
        }
      }
      newPlayer = true;
      // console.log("end of database function");
      return newPlayer;
  } );
  return newPlayer;
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
    if( req.url.indexOf( "ready?" ) >= 0 )
    {
      res.writeHead(200);
      readyPlayers++;
      playing = (readyPlayers == players);
      res.end("Readied up succesffuly");
      //make this redirect to play.html when playing is true [also constantly evaluate playing]
    }
    else
    {
        res.writeHead( 404 );
        res.end( "Unknown URL: "+req.url );
    }
}
//we need a function to clear the database

var server = http.createServer( serverFun );

server.listen( 8080 );
