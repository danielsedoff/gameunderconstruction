// Technical globals
var debugEnabled = true;
var maxIterations = 100;

// Game globals, non-DOM
var fieldWidth = 32;
var fieldHeight = 32;
var croppedWidth = 9;
var croppedHeight = 9;
var level = 1;
var maxLevel = 10;
var heroHealth = 100;
var heroPosition = [0, 0];
var gameField = makeGameField();
var heroTile = "h_r";

redraw(gameField);
addListeners();
enterLevel(level, fieldWidth, fieldHeight);

// Create an empty two-dimensional array (+)
function makeGameField(){
  let gameField = [];
  for(let y = 0; y < fieldHeight; y++) {
    gameField[y] = [];
    for (let x = 0; x < fieldWidth; x++) {
      gameField[y][x] = "";
    }
  }
  return gameField;
}

// Draw obstacles (+)
function drawRandomObstacle(length){
  let [x, y] = randomGroundTile();
  let dx = getRandomInt(-1, 1);
  let dy = getRandomInt(-1, 1);
  if (dx == 0 && dy == 0) dy = 1;
  while(getTileAt(x + dx, y + dy) != null){
    x += dx; y += dy;
    consoleDebug(`Drawing random obstacle, x: ${x} y: ${y}`);
    changeTileAt(`o_${level}`, x, y); 
  }
}

// Basic Hero Walking method (+)
function heroWalks(dx, dy) {
  writeStatsToDocument();
  let oldx = heroPosition[0];
  let oldy = heroPosition[1];
  let x = oldx + dx;
  let y = oldy + dy;
  
  let newTileContent = getTileAt(x, y);
  if(newTileContent == null) return;
  let typeOfTile = newTileContent[0];
  scrollToElemId(`x_${heroPosition[1]}_y_${heroPosition[1]}`);

  if (typeOfTile == "s") {
    consoleDebug("Walking down the stairs.");
    level++;
    if(level >= maxLevel){
      level = "win";
    }
    enterLevel(level, fieldWidth, fieldHeight);
    return;

  } else if (typeOfTile == "o") {
    consoleDebug("Can't step on obstacles.");
    return;
    
  } else if (typeOfTile == "g") {
    // Ground. You can step on the ground.
    changeTileAt(newTileContent.join("_"), oldx, oldy);
    if(dx != 0) {
      heroTile = dx < 0 ? "h_l" : "h_r";
    }
    changeTileAt(heroTile, x, y);
    redrawCropAroundHero(croppedWidth, croppedHeight);

  } else if (typeOfTile == "m") {
    consoleDebug("Stepped on a monster");
    [gtx, gty] = randomGroundTile();
    changeTileAt(getTileAt(gtx, gty).join("_"), oldx, oldy);
    redrawCropAroundHero(croppedWidth, croppedHeight);
    heroPosition = [-2, -2];
    heroHealth -= 100;
    writeStatsToDocument();
    return;

  } else {
    consoleDebug("Stepped on an unknown tile.");
  }
  heroPosition = [x, y];
}

// Draw an empty field with ground or 'WIN' tiles (+)
function getEmptyFIeld(currentLevel, cols, rows) {
  for (let y = 0; y < rows; y++) {
    for (let x = 0; x < cols; x++) {
      let tileContent = "g_" + currentLevel;
      // Need some mud to avoid dull scenery
      if(getRandomInt(0, 12) == 6) {
        tileContent = "g_m"
      }
      if(currentLevel == "win") {
        tileContent = "win";
      }
      gameField[y][x] = tileContent;
      consoleDebug("Drawing an empty table: x, y" + [x, y]);
    }
  }
}

// Draw a tile with given content at x, y (+)
function changeTileAt(tileContent, x, y) {
  gameField[y][x] = tileContent;
}

// Get tile content at x, y or [x, y] at once(+)
function getTileAt(x, y){
  try {
    let tileContent = gameField[y][x];
    return (tileContent).split("_");
  } catch (e) {
    return null;
  }
}

// Enter a new level (+)
function enterLevel(level, fieldWidth, fieldHeight) {
  getEmptyFIeld(level, fieldWidth, fieldHeight);

  // Win scenario
  if(level == "win"){
    redrawCropAroundHero(croppedWidth, croppedHeight);
    return;
  }

  // Draw obstacles
  for (let i = 0; i < maxObstacles(fieldHeight, fieldWidth); i++){
    drawRandomObstacle(level * 2);
    consoleDebug("Another random obstacle set...");
  }

  // Put monsters at random places.
  // TODO: The hero must be able to kill monsters.
  for(let i = 0; i < maxMonsters(level, fieldWidth, fieldHeight); i++){
    let xy = randomGroundTile();
    changeTileAt(`m_${level}`, xy[0], xy[1]);
    consoleDebug("Putting a monster at x, y: " + xy);
  }

  // Add stairs to the game field.
  let xy = randomGroundTile();
  changeTileAt(`s_${level}`, xy[0], xy[1]);

  // Hero position is global: visible outside function
  // TODO: Fix the bug where the Hero is INVISIBLE for the User
  heroPosition = randomGroundTile();
  heroWalks(0, 0);

  // Check if the Stairs is Accessible.
  let counter = maxIterations;
  while(!isStairsAccessible() && counter > 0){
    counter--;
    enterLevel(level, fieldWidth, fieldHeight);
    consoleDebug("Inaccessible stairs. Rebuilding...");
  }
  
  if (!isStairsAccessible()){
    writeToDocument("error: the game has become too tough :(");
  }
  redrawCropAroundHero(croppedWidth, croppedHeight);
}

// Get a random tile which has Ground as its content. (+)
function randomGroundTile(){
  let x, y, tileContent, typeOfTile;
  for(i = 0; i < fieldWidth * fieldHeight; i++){
    consoleDebug("Searching for a random Ground tile...");
    x = getRandomInt(0, fieldWidth - 1);
    y = getRandomInt(0, fieldHeight - 1);
    tileContent = getTileAt(x, y);
    typeOfTile = tileContent[0];
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

// Check whether the hero is able to get to the Stairs (+)
function isStairsAccessible(){
  checkedCells = [];
  checkedCells.push(heroPosition);
  checkCell(heroPosition, checkedCells);
  return checkedCells.indexOf("success") > -1;
}

// Check whether cell can be walked by the hero (+)
function checkCell(coord, checkedCells){
  checkedCells.push(coord.join(","));
  consoleDebug("checking cell " + coord);
  let [x, y] = coord;
  let [left,  right] = [ [x - 1, y], [x + 1, y] ];
  let [upper, lower] = [ [x, y - 1], [x, y + 1] ];
  for(let direction of [left, right, upper, lower]){
    if(checkedCells.indexOf(direction.join(",")) > -1) continue;
    let tile = getTileAt(direction[0], direction[1]);
    consoleDebug("tile at x, y " + [x, y] + " is " + tile);
    if(tile == null) {
      continue;
    } 
    let tileType = tile[0];
    if (tileType == "s"){
      checkedCells.push("success");
      return;
    } else if (tileType == "g"){
      checkCell(direction, checkedCells);
    }
  }
}

// Write to log if the global debug setting is on (+)
function consoleDebug(content){
  if(debugEnabled) console.debug(content);
}

// Push the game field into actual drawing (- HTML builder)
function redraw(field){
  let result = "";
  for(let y = 0; y < field.length; y++){
    for(let x = 0; x < field[0].length; x++){
      result += `<div class="tile ${field[y][x]}" id="x_${x}_y_${y}">` + 
      `<img src="images/${field[y][x]}.png"/></div>`
    }
    result += "<br>";
  }
  return result;
}

// Basic Health stat. (- writing html to document)
function writeStatsToDocument(){
  writeToDocument(`stats: health: ${heroHealth}%; level: ${level} of ${maxLevel}`);
}

// Get a (Width x Height) rectangle with the hero in it
function cropField(heroX, heroY, cropWidth, cropHeight){
  let minx = heroX - Math.floor(cropWidth / 2);
  let miny = heroY - Math.floor(cropHeight / 2);
  let maxx = minx + cropWidth;
  let maxy = miny + cropHeight;

  let cropped = [];
  for (let y = miny; y <= maxy; y++) {
    let line = [];
    for (let x = minx; x <= maxx; x++) {
      if (x < 0 || x >= fieldWidth || y < 0 || y >= fieldHeight) {
        line.push("o_a");
      } else {
        line.push(gameField[y][x]);
      }
    }
    cropped.push(line);
  }
  return cropped;
} 

// Redraw a (Width x Height) rectangle around the Hero
function redrawCropAroundHero(width, height){
  let [hp0, hp1] = heroPosition;
  writeToDocument(redraw (cropField(hp0, hp1, width, height)));
}

// What is the max number of monsters to show?
function maxMonsters(level, width, height){
  let totalMaxMonsters = (width * height) / 16;
  return Math.floor(totalMaxMonsters / (maxLevel - level));
}

function maxObstacles(a, b){
  return Math.floor(Math.sqrt(Math.min(a, b)));
}
