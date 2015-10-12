var the_grid     = document.getElementById( 'grid' );
var size = 6
var color = "yellow";
var myx = 0;
var myy = 0;

function pageLoaded()
{//if playing == true
    for( var i = 0; i < size; i++ )
    {
        var row_elem = document.createElement( 'tr' );
        for( var j = 0; j < size; j++ )
        {
            var cell_elem = document.createElement( 'td' );
            cell_elem.className="cell";
            cell_elem.innerHTML="this is naught but a test";
            cell_elem.width=80;
            cell_elem.height=80;
            cell_elem.x = i;
            cell_elem.y = j;
            cell_elem.id = "x"+i+"y"+j;
            cell_elem.addEventListener( 'mouseclick', selectRoom );
            // cell_elem.mouseenter = mousePixel;
            row_elem.appendChild( cell_elem );
        }
        the_grid.appendChild( row_elem );
        console.log("the_grid: "+the_grid);
    }
    window.setTimeout( pollServer, 100, -1 );
}
function selectRoom( evt )
{
    if( evt.buttons > 0 )
    {
        var cell = evt.target;
        //console.log( "mousePixel "+color );
        cell.style.backgroundColor = color;
        var xhr = new XMLHttpRequest();
        var url = "select_room?i=" + cell.i + "&j=" + cell.j;
        xhr.open( "get", url, true );
        xhr.send();
    }
}

function pollServer( most_recent_version )
{
    var xhr = new XMLHttpRequest();
    xhr.open( "get", "get_update?v="+most_recent_version, true );
    xhr.addEventListener( "load", Response );
    xhr.send();
}
function Response( evt )
{
    var xhr = evt.target;
    console.log( xhr.responseText );
    var room_data = JSON.parse( xhr.responseText );
    if( room_data.complete )
    {
      //players should be an element of room data. it should be an array of dictionaries containing elements x, y, and name
        var players = room_data.players;
        for( var i = 0; i < GRID_HEIGHT; i++ )
        {
            for( var j = 0; j < GRID_WIDTH; j++ )
            {
                //if (i-myx<2 && i-myx>-2 && j-myj<2 && j-myj>-2)
                {
                var cell = document.getElementById( "x"+i+"y"+j );
                //cell.style.backgroundColor = pixels[i][j];
                var room_stuff= "";
                //
                for (var player in players)
                {
                  if (player.x==i && player.y==j)
                  {
                    room_stuff += player.name;
                  }
                }
                cell.innerHTML = room_stuff;
                }
            }
        }

    }
    else
    {//i don't really know how this changes stuff works
        var changes = room_data.changes;
        for( var p = 0; p < changes.length; p++ )
        {
            var change = changes[ p ]
            console.log( change );
            var cell = document.getElementById( "x"+change.x+"y"+change.y );
            var room_stuff="";
            for (var player in changes)
            {
              if (player.x==i && player.y==j)
              {
                room_stuff += player.name;

              }
            }
            cell.innerHTML = room_stuff;
        }
    }
    window.setTimeout( pollServer, 100, pixel_data.version );
}
//maybe rename variables to prevent conflict
function mapHTML( map) //this function is obsolete
{
    var mapHTML = "<table><tbody>";
    for( var i = 0; i < size; i++ )
    {
      mapHTML += "<tr>";
      for( var a = 0; a < size; a++)
      {
        mapHTML += "<td width = '80' height = '80' style='border-style:" +
        " solid; text-align:center'>" + map[i][a] + "</td>";
      }
      mapHTML += "</tr>";
    }
    mapHTML += "</tbody></table>";
    //console.log("returning mapHTML: " + mapHTML)
    return mapHTML;
}














// function onPageLoad()
// {
//     window.setTimeout( sendUpdateReq, 1000 );
// }
//
// function sendUpdateReq()
// {
//     // alert( "SENDUPDATE" );
//     var xhr = new XMLHttpRequest();
//     xhr.addEventListener( "load", onResponse );
//     xhr.open( "get", "get_number", true );
//     xhr.send();
// }
//
// function gogogo()
// {
//     var radios = document.getElementsByName( 'team' );
//     var color = 'blue';
//     for( var i = 0; i < radios.length; i++ )
//     {
//         if( radios[i].checked && ( radios[i].value === 'red' ) )
//             color = 'red';
//     }
//
//     // alert( color );
//     var xhr = new XMLHttpRequest();
//     xhr.addEventListener( "load", onResponse );
//     xhr.open( "get", "gogogo?color="+color, true );
//     xhr.send();
// }
//
// function onResponse( evt )
// {
//     var xhr = evt.target;
//     console.log( "Response text: ", xhr.responseText );
//     var element = document.getElementById( 'the_number' );
//     element.innerHTML = xhr.responseText;
//     window.setTimeout( sendUpdateReq, 1000 );
// }
