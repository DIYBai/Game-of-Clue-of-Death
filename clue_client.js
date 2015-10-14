var the_grid     = document.getElementById( 'grid' );
var size = 7;
var cell_select = null;
var my_name;
var is_killer;
var my_player;
var move_speed=1;
var lit_color="indigo";
var corpse_color="olive";
var moves=0;

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
  if (my_player && my_player.dead)
  {
    if (cell_select != null)
    {
      cell_select.style.backgroundColor="transparent";
    }
    console.log("you can't move because you're dead.")
    displayMessage("you have been MURDERED")
    return;
  }
    //if evt.target is within 1 block
    var x_diff = evt.target.x - my_player.xpos;
    var y_diff = evt.target.y - my_player.ypos;
    console.log(x_diff + " | " + y_diff);
    if ( (x_diff <=  move_speed) && (x_diff >= -move_speed) &&
         (y_diff <=  move_speed) && (y_diff >= -move_speed)
       && (x_diff == 0 || y_diff==0))
    {
      if (cell_select != null)
      {
        console.log("cell before: " + cell_select.id);
        cell_select.style.backgroundColor=lit_color;
      }
      cell_select = evt.target;
      console.log("cell " + cell_select.id + " is selected");
      cell_select.style.backgroundColor = "red";
      for( var i = 0; i < size; i++ )
      {
          for( var j = 0; j < size; j++ )
          {
              var all_cell = document.getElementById( "x" + i + "y" + j );
              if (all_cell != cell_select)
              {
                //all_cell.style.backgroundColor = "transparent";
              }
          }
      }
      var xhr = new XMLHttpRequest();
      var url = "select_room?i=" + cell_select.x + "&j=" + cell_select.y;
      xhr.open( "get", url, true );
      xhr.send();
    }
}

function killPlayer( evt )
{
  var victim = evt.target.victim
  var buttons  = document.getElementById( 'kill_buttons' );
  if(!is_killer)
  {
    while (buttons.hasChildNodes())
    {
      buttons.removeChild(buttons.firstChild);
    }
  }
  else {
    buttons.removeChild(evt.target);
  }
  console.log (victim + "has been SLAIN");
  var xhr = new XMLHttpRequest();
  var url = "get_murder?killer=" + my_player.playerName+ "&killed=" + victim;
  xhr.open( "get", url, true );
  xhr.addEventListener( "load", respondMurder );
  xhr.send();
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
  var reponse = JSON.parse( xhr.responseText );
  my_name = reponse[0];
  is_killer = reponse[1];
  console.log("my name: "+ my_name + " is me killer? "+ is_killer);
  if(is_killer)
  {
    displayMessage("You are the MURDERER. Kill all other players to win.");
    window.setTimeout(displayMessage, 10000, "");
  }
  else
  {
    displayMessage("You are innocent. Discover the murderer and kill them. But beware, if you kill another innocent, you become a murderer yourself.");
    window.setTimeout(displayMessage, 10000, "");
  }
}

function respondMurder( evt )
{
  var xhr = evt.target;
  var reponse = JSON.parse( xhr.responseText );
  displayMessage(response + " has DIED");
  window.setTimeout(displayMessage, 5000, "");
}

function displayMessage(messageString)
{
  var msg = document.getElementById("message");
  msg.innerHTML = messageString;
  console.log("message should be changed to " + messageString);
}

function response( evt )
{
    //console.log("response called");
    var xhr = evt.target;
    //console.log( xhr.responseText );
    var player_data = JSON.parse( xhr.responseText );
    var display = player_data.splice(player_data.length-1,1);
    //var just_players = player_data.slice(0,player_data.length-1,1);
    //console.log("just_players: "+just_players);
    var new_me = findMe(player_data, my_name);
    if (my_player && (new_me.xpos != my_player.xpos || new_me.ypos != my_player.ypos))
    {
      moves++;
    }
    my_player = new_me;
    if (!my_player.dead && moves>2)
    {
        drawButtons(player_data);
    }
    else
    {
      var buttons  = document.getElementById( 'kill_buttons' );
      while (buttons.hasChildNodes())
      {
        buttons.removeChild(buttons.firstChild);
      }
    }
    //console.log("my player is: "+ my_player.playerName + " with xpos "+ my_player.xpos);
    for( var i = 0; i < size; i++ )
    {
        for( var j = 0; j < size; j++ )
        {
            var cell = document.getElementById( "x"+i+"y"+j );
            var cell_content= "";
            //for (var player in player_data)
            for(var k = 0; k < player_data.length; k++)
            {
              if (i==my_player.xpos || j==my_player.ypos ||my_player.dead)
              {
                if (cell.style.backgroundColor!="red")
                {
                  cell.style.backgroundColor=lit_color;
                }
                cell.style.borderColor="red";
                var player = player_data[k];
                if (player.xpos == i && player.ypos == j)
                {
                  if (player.dead)
                  {
                    //var corpse = document.createElement( 'span' );
                    //corpse.innerHTML = player.playerName;
                    //corpse.style.color=corpse_color;
                  //  console.log("we should see the corpse of " + corpse.innerHTML);
                    //cell.appendChild(corpse);
                    cell_content += "<div style='color:olive'>" + player.playerName +"</div>";
                  }
                  else
                  {
                    cell_content += player.playerName;
                  }
                  cell_content +="<br>";
                }
              }
              else {
                cell.style.backgroundColor="transparent";
                cell.style.borderColor="transparent";
              }
            }
            cell.innerHTML = cell_content;
          }
      }
    var seconds = player_data[player_data.length-1]/1000;
    document.getElementById("time").innerHTML = display;
    window.setTimeout( pollServer, 1000 );
}

function findMe (players, name) //identifies which player is currently playing
{
  //var cookies= utils.parseCookies( req.headers );

  for (i = 0; i<players.length; i++)
  {
    var player = players[i];
    //console.log (player.playerName + " | " + name)
    if (player.playerName==name)
    {
      return player;
    }
    //else catch error?
  }
}
function drawButtons(victims)
{
  console.log("drawing buttons!");
  var buttons  = document.getElementById( 'kill_buttons' );
  while (buttons.hasChildNodes())
  {
    buttons.removeChild(buttons.firstChild);
  }
  for( var i = 0; i < victims.length; i++ )
  {
    var victim=victims[i];
    if (victim.playerName != my_player.playerName)
    {
      var x_diff = victim.xpos - my_player.xpos;
      var y_diff = victim.ypos - my_player.ypos;
      //console.log(x_diff + " | " + y_diff);
      if ( (x_diff <=  move_speed) && (x_diff >= -move_speed) &&
           (y_diff <=  move_speed) && (y_diff >= -move_speed)
         && (x_diff == 0 || y_diff==0))
      {
        console.log("button "+victim.playerName);
        var button = document.createElement( 'button' );
        button.innerHTML="murder "+ victim.playerName +"?";
        button.victim = victim.playerName;
        button.addEventListener( 'click', killPlayer );
        buttons.appendChild(button);
      }
    }
  }
}
