//constants
var CELL_SIZE = 10;
var DIRECTION_RIGHT = 0;
var DIRECTION_DOWN = 1;
var DIRECTION_LEFT = 2;
var DIRECTION_UP = 3;

var KEY_RIGHT = 39;
var KEY_DOWN = 40;
var KEY_LEFT = 37;
var KEY_UP = 38;

function Settings()
{
	this.boardColor = "#EEEEEE";
	this.snakeColor = "#330066";
	this.foodColors = ["#cc0256", "#e22882", "#009e49", "#60dd49", "#ff7f1e", "#ff0093", "#ffcc1e", "#f93a2b"];
};


/**
 * Contains info about the game board
 */
function SnakeGame()
{
	this.context = $(".snake__body")[0].getContext("2d");
	this.width = $(".snake__body").width();
	this.height = $(".snake__body").height();
	
	this.settings = new Settings();
	
	this.boardColor = this.settings.boardColor;
	this.score = 0;
	this.gameSpeed = 60;
	
	this.snake = new Snake(this.settings.snakeColor);
	this.showBoard();
	this.food = null;
	this.generateFood();
};

SnakeGame.prototype.startGame = function()
{
	if(typeof game_loop != "undefined") 
		clearInterval(game_loop);
	
	$(".snake__score").html("Score: " + this.score);

	this.addKeyListener();
	
	var gameInstance = this;
	game_loop = setInterval(function(){gameInstance.progressGame();}, this.gameSpeed);
};
SnakeGame.prototype.addKeyListener = function()
{
	var gameInstance = this;
	$(document).keydown(function(e){
		gameInstance.snake.handleTurn(e);
	});
};
SnakeGame.prototype.handleSnakeEat = function()
{
	this.score++;		
	$(".snake__score").html("Score: " + this.score);

	if (this.gameSpeed > 30){
		this.increaseGameSpeed();
	}

	this.generateFood();
};
SnakeGame.prototype.increaseGameSpeed = function()
{
	this.gameSpeed -= 2;
	if(typeof game_loop != "undefined") 
		clearInterval(game_loop);
	var gameInstance = this;
	game_loop = setInterval(function(){gameInstance.progressGame();}, this.gameSpeed);
};
SnakeGame.prototype.generateFood = function()
{
	this.food = {
		x: Math.round(Math.random()*(this.width-CELL_SIZE)/CELL_SIZE), 
		y: Math.round(Math.random()*(this.height-CELL_SIZE)/CELL_SIZE), 
	};
	if (this.snake.isCoordinatePartOfSnake(this.food)){
		this.generateFood();
		return;
	}
	var pos = parseInt(Math.random() * this.settings.foodColors.length, 10);
	var foodColor = this.settings.foodColors[pos];

	this.paintCell(this.food, foodColor);
};
SnakeGame.prototype.showBoard = function(x, y)
{
	this.context.fillStyle = this.settings.boardColor;
	this.context.fillRect(0, 0, this.width, this.height);
};
SnakeGame.prototype.progressGame = function()
{
	var nextSnakePos = this.snake.getNextSnakeHead();

	//If the random position is at the snake, try again.
	if(this.snake.willDieIfEatingPos(nextSnakePos, this.width/CELL_SIZE, this.height/CELL_SIZE))
	{
		if(typeof game_loop != "undefined") 
			clearInterval(game_loop);
		
		this.animateDeath();

		return;
	}
	
	// Check if eating food
	if(nextSnakePos.x == this.food.x && nextSnakePos.y == this.food.y)
	{
		this.handleSnakeEat();
	}
	else
	{
		var tail = this.snake.positionArray.pop(); //pops out the last cell
		this.clearCell(tail);
	}
	this.paintCell(nextSnakePos, this.snake.color);
	
	this.snake.positionArray.unshift(nextSnakePos); //adds nextSnakePos to the snake
	
};
SnakeGame.prototype.animateDeath = function()
{
	var textX = this.width / 2;
	var textY = this.height / 2;
	this.context.font = "30pt Calibri";
	this.context.textAlign = "center";
	this.context.fillStyle = "red";
	this.context.fillText("DEAD!", textX, textY-35);
	this.context.fillText("Score: " + this.score, textX, textY+10);

	
	$("#start-button").removeAttr("disabled");

};
SnakeGame.prototype.paintCell = function(coordinate, color)
{
	this.context.fillStyle = color;
	this.context.fillRect(coordinate.x * CELL_SIZE, coordinate.y * CELL_SIZE, CELL_SIZE, CELL_SIZE);
	this.context.strokeStyle = this.boardColor;
	this.context.strokeRect(coordinate.x * CELL_SIZE, coordinate.y * CELL_SIZE, CELL_SIZE, CELL_SIZE);
};
SnakeGame.prototype.clearCell = function(coordinate)
{
	this.context.fillStyle = this.boardColor;
	this.context.fillRect(coordinate.x * CELL_SIZE, coordinate.y * CELL_SIZE, CELL_SIZE, CELL_SIZE);
};



/**
 * Contains information about the current snake
 */
function Snake(snakeColor) {
	var START_SNAKE_LENGTH = 5;

	this.color = snakeColor;

	this.direction = DIRECTION_RIGHT;
	this.positionArray = [];
	for(var i = START_SNAKE_LENGTH-1; i>=0; i--)
	{
		this.positionArray.push({x: i, y:0});
	}
	this.turnQueue = [];
};
Snake.prototype.getNextSnakeHead = function(){
	var newX = this.positionArray[0].x;
	var newY = this.positionArray[0].y;

	//Turn, but prevent from turning back
	if (this.turnQueue.length > 0) {
		var key = this.turnQueue.pop();
		if(key == KEY_LEFT && this.direction != DIRECTION_RIGHT) 
			this.direction = DIRECTION_LEFT;
		else if(key == KEY_UP && this.direction != DIRECTION_DOWN) 
			this.direction = DIRECTION_UP;
		else if(key == KEY_RIGHT && this.direction != DIRECTION_LEFT) 
			this.direction = DIRECTION_RIGHT;
		else if(key == KEY_DOWN && this.direction != DIRECTION_UP) 
			this.direction = DIRECTION_DOWN;
	}
	
	if(this.direction == DIRECTION_RIGHT) 
		newX++;
	else if(this.direction == DIRECTION_LEFT)
		newX--;
	else if(this.direction == DIRECTION_UP)
		newY--;
	else if(this.direction == DIRECTION_DOWN)
		newY++;
	return {x: newX, y: newY};
};
Snake.prototype.willDieIfEatingPos = function(coordinate, boardWidth, boardHeight){
	if (coordinate.x < 0 || coordinate.y < 0 || coordinate.x >= boardWidth || coordinate.y >= boardHeight){
		return true;
	}
	
	if (this.isCoordinatePartOfSnake(coordinate, boardWidth, boardHeight)){
		//if its the tail, you won't die since it will move
		if(this.positionArray[this.positionArray.length-1].x == coordinate.x && this.positionArray[this.positionArray.length-1].y == coordinate.y)
			return false;
		return true;
	}

	return false;
};
Snake.prototype.isCoordinatePartOfSnake = function(coordinate, boardWidth, boardHeight){
	for(var i = 0; i < this.positionArray.length; i++)
	{
		if(this.positionArray[i].x == coordinate.x && this.positionArray[i].y == coordinate.y)
			return true;
	}

	return false;
};
Snake.prototype.handleTurn = function(event){
	/* The reason for having a queue is that it shouldn't be possible to torn twice during one time unit. 
	 * That could make you turn around and biting yourself in the neck.*/
	var key = event.which;
	if (this.turnQueue.length > 1) {
		return;
	}
	this.turnQueue.unshift(key);
};

function startGame(){
	$("#start-button").attr("disabled", "disabled");
	var snakeGame = new SnakeGame();
	snakeGame.startGame();
}