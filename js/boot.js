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
var gates;
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
  xOffset:.8,
  yOffset: .6,
  direction:'right',
  },
  {
    angle: 90,
  xOffset: .72,
  yOffset: .7,
  direction:'down',
  }  ,
  {
    angle: 180,
  xOffset: .64,
  yOffset: .6,
  direction:'left',
  }  ,
  {
    angle: 270,
  xOffset: .72,
  yOffset: .5,
  direction:'up',
  }  
  ];
var arrowDown=false;
const RULES_TEXT = "Rules: Can't pass through the same color wall twice.";
var titleText;
var scoreText;
var hiScoreText;
var timerText;
var timerValue=0;
var cat1;
var wallData;
var wallBkgd;
var polygons;
var xScale = 1;
var yScale = 1;
var gateBkgd;
var gateData;