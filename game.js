var fieldWidth = 9;
var fieldHeight = 15;
var level = 1;
var maxLevel = 10;
var heroHealth = 100;
var heroPosition = [0, 0];

enterLevel(level, fieldWidth, fieldHeight);
addListeners();

// Add events for keyboard and touch control 
function addListeners(){
    // check keys when they are pressed
    document.onkeydown = checkKey;

    // Touch user interface orientation
    let touchstartX = 0;
    let touchstartY = 0;
    let touchendX = 0;
    let touchendY = 0;

    document.addEventListener('touchstart', e => {
        touchstartX = e.changedTouches[0].screenX;
        touchstartY = e.changedTouches[0].screenY;
        e.preventDefault();
    })

    document.addEventListener('touchend', e => {
        touchendX = e.changedTouches[0].screenX;
        touchendY = e.changedTouches[0].screenY;
        checkDirection();
        e.preventDefault();
    })
}

// Basic Health stat. (- writing html to document)
function writeHealthToDocument(){
  document.getElementById("herohealth").innerHTML = `health: ${heroHealth}%`;
}

// Draw obstacles (+)
function drawRandomObstacle(length){
  [x, y] = randomGroundTile();
  dx = getRandomInt(-1, 1);
  dy = getRandomInt(-1, 1);
  if (dx == 0 && dy == 0) dy = 1;
  while(getTileAt(x + dx, y + dy) != null){
    x += dx; y += dy;
    drawTileAt(`o_${level}`, x, y); 
  }
}

// Basic Hero Walking method (- global heroPosition)
function heroWalks(dx, dy) {
  writeHealthToDocument();
  let oldx = heroPosition[0];
  let oldy = heroPosition[1];
  let x = oldx + dx;
  let y = oldy + dy;

  // Out of game field
  if (x < 0 || y < 0 || y >= fieldHeight || x >= fieldWidth) {
    return;
  }
  
  let newTileId = xyId(x, y);
  let newTileContent = getTileAt(x, y);
  let typeOfTile = newTileContent[0];
  scrollToElemId(newTileId);

  if (typeOfTile == "s") {
    console.log("Walking down the stairs.");
    level++;
    if(level >= maxLevel){
      level = "win";
    }
    enterLevel(level, fieldWidth, fieldHeight);
    return;

  } else if (typeOfTile == "o") {
    console.log("Can't step on obstacles.");
    return;
    
  } else if (typeOfTile == "g") {
    // Ground. You can step on the ground.
    drawTileAt(newTileContent.join("_"), oldx, oldy);
    drawTileAt("h_1", x, y);

  } else if (typeOfTile == "m") {
    console.log("Stepped on a monster");
    [gtx, gty] = randomGroundTile();
    drawTileAt(getTileAt(gtx, gty).join("_"), oldx, oldy)
    heroPosition = [-2, -2];
    heroHealth -= 100;
    writeHealthToDocument();
    return;

  } else {
    console.log("Stepped on an unknown tile.");
  }
  heroPosition = [x, y];
}

// Draw an empty table with divs whose ids are like x_2_y_5 (- writing html)
function drawEmptyTable(level, cols, rows) {
  var tileContent = "g_" + level;
  if(level == "win") {
    tileContent = "win";
  }
  var result = "";
  for (let y = 0; y < rows; y++) {
    for (let x = 0; x < cols; x++) {
      result += `<div class="tile ${tileContent}" id="${xyId(x, y)}"><img src="${tileContent}.png"/></div>`;
    }
    result += "<br/>";
  }
  return result;
}

// Draw a tile with given content at x, y (- writing html)
function drawTileAt(tileContent, x, y) {
  elem = document.getElementById(xyId(x, y));
  elem.className = "tile " + tileContent;
  elem.innerHTML = `<img src="${tileContent}.png"/>`;
}

// Get tile content at x, y or [x, y] at once(- reading html)
function getTileAt(x, y){
  result = document.getElementById(xyId(x, y));
  if (result == undefined) return null;
  fullClassName = result.className;
  classNamePart = fullClassName.replace(/tile /, "");
  return classNamePart.split("_");
}

// get tile element ID for given x, y (+)
  function xyId(x, y) {
  return `x_${x}_y_${y}`;
}

// Enable Arrow Keys navigation (- uses window)
function checkKey(e) {
    action = [];
    action[38] = () => {heroWalks(0, -1)}; /*UP*/
    action[40] = () => {heroWalks(0, 1)};  /*DN*/
    action[37] = () => {heroWalks(-1, 0)}; /*LT*/
    action[39] = () => {heroWalks(1, 0)};  /*RT*/
    e = e || window.event;
    if (action[e.keyCode]) {
      action[e.keyCode]();
    }
    e.preventDefault();
  }
  
// Enter a new level (- read html, use global heroPosition)
function enterLevel(level, fieldWidth, fieldHeight) {
  document.getElementById("gameFieldDiv").innerHTML = drawEmptyTable(level, fieldWidth, fieldHeight);
  
  // Win scenario
  if(level == "win"){
    return;
  }

  // Hero position is global: visible outside function
  // TODO: Fix the bug where the Hero is INVISIBLE for the User
  heroPosition = randomGroundTile();
  heroWalks(0, 0);

  // Draw obstacles
  for (let i = 0; i < level / 2; i++){
    drawRandomObstacle(level * 2);
  }

  // Put monsters at random places.
  // TODO: The hero must be able to kill monsters.
  for(let i = 0; i < level; i++){
    let xy = randomGroundTile();
    drawTileAt(`m_${level}`, xy[0], xy[1]);
  }
  // Draw stairs.
  xy = randomGroundTile();
  drawTileAt(`s_${level}`, xy[0], xy[1]);

  // Check if the Stairs is Accessible.
  counter = 100;
  while(!isStairsAccessible() && counter > 0){
    counter--;
    enterLevel(level, fieldWidth, fieldHeight);
  }
  if (!isStairsAccessible()){
    document.body.innerHTML = "The Game has become too tough :(";
  }
}

// Get a random tile which has Ground as its content. (- uses global fieldWidth, fieldHeight)
function randomGroundTile(){
  for(i = 0; i < fieldWidth * fieldHeight; i++){
    x = getRandomInt(0, fieldWidth - 1);
    y = getRandomInt(0, fieldHeight - 1);
    let tileContent = getTileAt(x, y);
    let typeOfTile = tileContent[0];
    if(typeOfTile == "g"){
      break;
    }
  }
  return [x, y];
}

// Get a random integer within given limits. (+)
function getRandomInt(min, max){
  min = Math.ceil(min);
  max = Math.ceil(max);
  return Math.floor(Math.random() * (max - min + 1)) + min;
}

// Check touch direction (+)
function checkDirection() {
  let dx = Math.abs(touchendX - touchstartX);
  let dy = Math.abs(touchendY - touchstartY);

  // Distance too low
  if (Math.max(dx, dy) < 64) return;

  if (dx >= dy && touchendX < touchstartX) {heroWalks(-1, 0)}; /*LT*/
  if (dx < dy  && touchendY < touchstartY) {heroWalks(0, -1)}; /*UP*/
  if (dx >= dy && touchendX > touchstartX) {heroWalks(1,  0)}; /*RT*/
  if (dx < dy  && touchendY > touchstartY) {heroWalks(0,  1)}; /*DN*/
}

// Check whether the hero will be able to get to the Stairs (+)
function isStairsAccessible(){
  checkedCells = [];
  checkedCells.push(heroPosition);
  checkCell(heroPosition, checkedCells);
  return checkedCells.indexOf("success") > -1;
}

// Check whether cell can be walked by the hero (+)
function checkCell(coord, checkedCells){
  checkedCells.push(coord.join(","));
  console.debug("checking cell " + coord);
  [x, y] = coord;
  [left,  right] = [ [x - 1, y], [x + 1, y] ];
  [upper, lower] = [ [x, y - 1], [x, y + 1] ];
  for(direction of [left, right, upper, lower]){
    if(checkedCells.indexOf(direction.join(",")) > -1) continue;
    tile = getTileAt(direction[0], direction[1]);
    console.debug(tile);
    if(tile == null) {
      continue;
    } 
    tileType = tile[0];
    if (tileType == "s"){
      checkedCells.push("success");
      return;
    } else if (tileType == "g"){
      checkCell(direction, checkedCells);
    }
  }
}

// Scroll to element (- uses document)
function scrollToElemId(id){
  document.getElementById(id).scrollIntoView({
      behavior: 'auto',
      block: 'center',
      inline: 'center'
  });
}
