//
var the_grid     = document.getElementById( 'grid' );
var size = 5;
var cell_select = null;
var my_name;
var my_player;
var move_speed=1;
// var myx = 0;
// var myy = 0;

function pageLoaded()
{
    for( var i = 0; i < size; i++ )
    {
        var row_elem = document.createElement( 'tr' );
        for( var j = 0; j < size; j++ )
        {
            var cell_elem = document.createElement( 'td' );
            cell_elem.className="cell";
            cell_elem.innerHTML="";
            cell_elem.width=80;
            cell_elem.height=80;
            cell_elem.x = i;
            cell_elem.y = j;
            cell_elem.id = "x"+i+"y"+j;
            cell_elem.addEventListener( 'click', selectRoom );
            row_elem.appendChild( cell_elem );
        }
        the_grid.appendChild( row_elem );
        //console.log("the_grid: " + the_grid);
        }
    pollForName();
    window.setTimeout( pollServer, 100 );
}

function selectRoom( evt )
{
    //if evt.target is within 1 block
    var x_diff = evt.target.x-my_player.xpos;
    var y_diff = evt.target.y-my_player.ypos;
    console.log(x_diff + " | " + y_diff);
    if ((x_diff <= move_speed)
     && (x_diff >= -move_speed)
    && (y_diff <= move_speed)
    && (y_diff >= -move_speed))
    {
      if (cell_select != null)
      {
        console.log("cell before: "+ cell_select.id);
        cell_select.style.backgroundColor="transparent";
      }
      cell_select = evt.target;
      console.log("cell " + cell_select.id + " is selected");
      {cell_select.style.backgroundColor = "red";}
      for( var i = 0; i < size; i++ )
      {
          for( var j = 0; j < size; j++ )
          {
              var all_cell = document.getElementById( "x"+i+"y"+j );
              if (all_cell != cell_select)
              {all_cell.style.backgroundColor = "transparent";}
          }
      }
      var xhr = new XMLHttpRequest();
      var url = "select_room?i=" + cell_select.x + "&j=" + cell_select.y;
      xhr.open( "get", url, true );
      xhr.send();
    }
}

function pollServer()
{
    var xhr = new XMLHttpRequest();
    console.log("polling");
    xhr.open( "get", "get_update?", true );
    xhr.addEventListener( "load", response );
    xhr.send();
}

function pollForName()
{
    var xhr = new XMLHttpRequest();
    console.log("polling for name");
    xhr.open( "get", "get_player?", true );
    xhr.addEventListener( "load", respondName );
    xhr.send();
}

function respondName( evt )
{
  var xhr = evt.target;
  var player = JSON.parse( xhr.responseText );
  my_name = player;
  console.log("my name: "+ my_name);
  //body.appendChild();
}

function response( evt )
{
    //console.log("response called");
    var xhr = evt.target;
    //console.log( xhr.responseText );
    var player_data = JSON.parse( xhr.responseText );
    //console.log(player_data);
    my_player = findMe(player_data, my_name);
    console.log("my player is: "+ my_player.playerName + " with xpos "+ my_player.xpos);
    for( var i = 0; i < size; i++ )
    {
        for( var j = 0; j < size; j++ )
        {
            var cell = document.getElementById( "x"+i+"y"+j );
            var cell_content= "";
            //for (var player in player_data)
            for(var k = 0; k < player_data.length; k++)
            {
              var player = player_data[k];
              //console.log(player.xpos + " | " + player.ypos);
              if (player.xpos == i && player.ypos == j)
              {
                cell_content += player.playerName;
              }
            }
            cell.innerHTML = cell_content;
            //cell.style.backgroundColor = "transparent";
            // if (cell_select)
            // {
            //   cell_select.style.backgroundColor="transparent";
            // }
            // else
            // {
            //   cell_select = null;
            // }
            //cell.addEventListener( 'onclick', selectRoom );
        }
    }
    //console.log("set timeout");
    window.setTimeout( pollServer, 1000 );
}

function findMe (players, name) //identifies which player is currently playing
{
  //var cookies= utils.parseCookies( req.headers );

  for (i = 0; i<players.length; i++)
  {
    var player = players[i];
    console.log (player.playerName + " | " + name)
    if (player.playerName==name)
    {
      return player;
    }
    //else catch error?
  }
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
