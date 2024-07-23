var scale = 1.5;

if (navigator.userAgent.match(/Android/i)
 || navigator.userAgent.match(/webOS/i)
 || navigator.userAgent.match(/iPhone/i)
 || navigator.userAgent.match(/iPad/i)
 || navigator.userAgent.match(/iPod/i)
 || navigator.userAgent.match(/BlackBerry/i)
 || navigator.userAgent.match(/Windows Phone/i)) {
scale = 1.5;
}
var walls;
var WIDTH = 560 * scale;
var HEIGHT = 560 * scale;
var graphics;
var leftKey;
var	rightKey;
var	upKey;
var	downKey;
var	spaceKey;
var score = 0;
var timer = 0;
var timerInterval = 50;
var nextBlockNum;
var highScore;
var highScorer;
var arrowRight;
var arrowLeft;
var arrowUp;
var arrowDown;
var player;
var arrows =new Array(4);
var arrowStats = [
  {
    angle: 0,
  yOffset: 20,
  xOffset: 630,
  direction:'right',
  },
  {
    angle: 90,
  yOffset: 30,
  xOffset: -20,
  direction:'down',
  }  ,
  {
    angle: 180,
  yOffset: 20,
  xOffset: 550,
  direction:'left',
  }  ,
  {
    angle: 270,
  yOffset: -30,
  xOffset: -20,
  direction:'up',
  }  
  ];
var arrowDown=false;