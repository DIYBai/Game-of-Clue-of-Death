var the_grid     = document.getElementById( 'grid' );
var size = 5;
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
            cell_elem.innerHTML="BLANK";
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
    window.setTimeout( pollServer, 100 );
}

function selectRoom( evt )
{
    var cell = evt.target;
    console.log("cell " + cell.id + " should be yellow");
    cell.style.backgroundColor = "yellow";
    var xhr = new XMLHttpRequest();
    var url = "select_room?i=" + cell.x + "&j=" + cell.y;
    xhr.open( "get", url, true );
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

function response( evt )
{
    console.log("response called");
    var xhr = evt.target;
    //console.log( xhr.responseText );
    var player_data = JSON.parse( xhr.responseText );
    //console.log(player_data);
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
            cell.style.backgroundColor = "black";
            //cell.addEventListener( 'onclick', selectRoom );
        }
    }
    console.log("set timeout");
    window.setTimeout( pollServer, 1000 );
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
