// Touch display specific, DOM specific
var touchstartX = 0;
var touchstartY = 0;
var touchendX = 0;
var touchendY = 0;

// Get window size as [x, y]
function getWindowSize(axis){
  let win = window,
  doc = document,
  docElem = doc.documentElement,
  body = doc.getElementsByTagName('body')[0],
  x = win.innerWidth || docElem.clientWidth || body.clientWidth,
  y = win.innerHeight || docElem.clientHeight || body.clientHeight;
  return (axis == "x") ? x : y;
}

// Add events for keyboard and touch control. (- DOM specific)
function addListeners() {
  // check keys when they are pressed
  document.onkeydown = checkKey;

  // Touch user interface orientation
  document.addEventListener('touchstart', e => {
    touchstartX = e.changedTouches[0].screenX;
    touchstartY = e.changedTouches[0].screenY;
    e.preventDefault();
  });

  document.addEventListener('touchend', e => {
    touchendX = e.changedTouches[0].screenX;
    touchendY = e.changedTouches[0].screenY;
    checkDirection();
    e.preventDefault();
  });
}

// Write content to the document. (- DOM specific)
function writeToDocument(content){
  if(content.substring(0, 6) == "stats:"){
    document.getElementById("herohealth").innerHTML = content;
    return;
  }

  if(content.substring(0, 6) == "error:"){
    document.body.innerHTML = content;
    return;
  }

  document.getElementById("gameFieldDiv").innerHTML = content;
}

// Scroll to element (- DOM specific)
function scrollToElemId(id){
  try{
    document.getElementById(id).scrollIntoView({
        behavior: 'auto',
        block: 'center',
        inline: 'center'
    });
  } catch(e){
    consoleDebug("can't scroll!")
  }
}

// Enable Arrow Keys navigation (- DOM specific)
function checkKey(e) {
  let action = [];
  action[38] = () => {heroWalks(0, -1)}; /*Up key*/
  action[40] = () => {heroWalks(0, 1)};  /*Down key*/
  action[37] = () => {heroWalks(-1, 0)}; /*Left key*/
  action[39] = () => {heroWalks(1, 0)};  /*Right key*/

  action[87] = action[38]; /* W */
  action[83] = action[40]; /* A */
  action[65] = action[37]; /* S */
  action[68] = action[39]; /* D */

  e = e || window.event;
  if (action[e.keyCode]) {
    action[e.keyCode]();
  }
  e.preventDefault();
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
