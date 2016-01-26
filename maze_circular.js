window.onload=function(){
//// 0. Describe




window.demoDescription = "implement DFS to create a maze";

//// 1. Define Space and Form
var colors = {
  a1: '#87D2FF', //azul
  a2: '#FFD2AF', //salmão
  a3: '#87BED2', //meio-meio
  a4: '#FFCC87', //creme
  c1: "#ff2d5d",
  c2: "#42dc8e",
  c3: "#2e43eb",
  c4: "#ffe359",
  b1: "#96bfed",
  b2: "#f5ead6",
  b3: "#222266",
  b4: "#e2e6ef"
};


var gridSizeRow = 5;
var gridSizeCol = 16;
var gridRatio = gridSizeRow/gridSizeCol;
var markerRatio = 8*gridRatio;

//the space where the maze will be "printed"
var spaceGrid = new CanvasSpace("canvas", "#223").display();
var form = new Form(spaceGrid);
var bound = new Rectangle().to(spaceGrid.size);
var center = new Vector(spaceGrid.size.$divide(2));
var mouse = new Vector(spaceGrid.size.x / 2, spaceGrid.size.y / 1.35, 60);
var spaceSize = spaceGrid.size.magnitude() / 2;

//the space where we can see the DFS calculating the maze i.e. erasing walls and marking visited cells
var formDFS = new Form(spaceGrid);



var grid = new Grid(spaceGrid.size.$multiply(0.1, 0.1)).to(spaceGrid.size.$multiply(0.9, 0.9)).init(gridSizeCol, gridSizeRow, "stretch", "stretch");
var gridFind = new Grid(spaceGrid.size.$multiply(0.1, 0.1)).to(spaceGrid.size.$multiply(0.9, 0.9)).init(gridSizeCol, gridSizeRow, "stretch", "stretch");
// Use grid.generate() to specify a callback function to render each grid cell
var map = new gridMap(grid, "make");
var findMap = new gridMap(gridFind, "find");


//debug
var debug = false;
var dL = spaceGrid.size.$multiply(0.0001).y; //debug text start




var getCellPoints = function (grid,row,column) {
  // translates from a rectangular grid to a cricular grid
  // returns a array of points of the cell

  //tenho que confirmar, o top e o bottom parecem trocados
  // 0 bottom left
  // 1 top l
  // 2 t rigth
  // 3 b r

  //each circle = a row
  //radius / nr of rows
  //each arc of the circle = columns
  //360º / nr of columns
  //in the map the West and East side are connect

  //calculate the cell
  //size*row = radious

  //

  var radius = grid.clone().moveTo(grid.x,center.y).distance(center);
  var radiusSeg = radius / (grid.rows);
  var rotateInc = 360/grid.columns;

  var rotateAngle = rotateInc*(column)*Const.deg_to_rad;
  var rotateAngleNext = rotateInc*(column+1)*Const.deg_to_rad;

  var rowCircle = new Circle(center).setRadius(radiusSeg*(row)+0.1);
  var rowCircleNext = new Circle(center).setRadius(radiusSeg*(row+1));

  var startPoint = new Point(center.x, center.y-(radiusSeg*(row))-1);
  var endPoint = new Point(center.x,center.y-(radiusSeg*(row+1))-1);

  var colLine = new Line(startPoint).to(endPoint).rotate2D(rotateAngle,center);
  var colLineNext = new Line(startPoint).to(endPoint).rotate2D(rotateAngleNext,center);

  var intPoint = rowCircle.intersectLine(colLine, get_pts=true)[0]; //não está a funcional mas até agora nao faz falta
  var intPointNext = rowCircle.intersectLine(colLineNext, get_pts=true)[0]; //não está a funcional mas até agora nao faz falta

  var intPointPrev = rowCircleNext.intersectLine(colLine, get_pts=true)[0]; //bad name
  var intPointNextPrev = rowCircleNext.intersectLine(colLineNext, get_pts=true)[0]; //bad name


  //var cellPointSet = [new Point(colLine.$getAt(0)),new Point(colLine.$getAt(1)),new Point(colLineNext.$getAt(1)),new Point(colLineNext.$getAt(0))];
  var cellPointSet = new PointSet(center).to(new Point(colLine.$getAt(0))).to(new Point(colLine.$getAt(1))).to(new Point(colLineNext.$getAt(1))).to(new Point(colLineNext.$getAt(0)));

  return cellPointSet;
};




//****************************
//**                        **
//**   Draw Circular Maze   **
//**                        **
//****************************
//circular
  //generate functions, how to draw each grid
  grid.generate(function(size, position, row, column, type) {
    //var color = colors["abc".charAt(Math.floor(Math.random() * 3)) + Math.ceil(Math.random() * 4)];


    //var colorRow = colors["c" + (1+(row % 4))];
    //var colorCol = colors["c" + (1+(column % 4))];
    //var color = colorRow;
    var color = colors.a1;
    var colorRow = colorCol = color;

    var cellPoints = getCellPoints(this,row,column);

    cellPt0 = cellPoints.points[0];
    cellPt1 = cellPoints.points[1];
    cellPt2 = cellPoints.points[2];
    cellPt3 = cellPoints.points[3];

    var rigthWall = new Line (cellPt2).to(cellPt3);
    var leftWall = new Line (cellPt0).to(cellPt1);

    //top and left as straigth Lines to simplify
    var topLine = new Line (cellPt3).to(cellPt0);
    var bottomLine = new Line (cellPt1).to(cellPt2);


    //top and bottom as arc
    var rotateInc = 360/grid.columns;
    var rotateAngle = rotateInc*Const.deg_to_rad;
    var rad90 = -90*Const.deg_to_rad;

    var topWall = new Curve(center).to(cellPt3).to(topLine.midpoint()).to(cellPt0).bspline(50);
    var bottomWall = new Curve(center).to(cellPt1).to(bottomLine.midpoint()).to(cellPt2).bezier(50);

    var cellMap = map.map[row][column];
    var cellObj = [ //Paredes
      {
        start: rad90+(rotateAngle*column), //N
        end: rad90+(rotateAngle*(column+1)),
        radius: cellPt0.distance(center),
        viewOn: cellMap.N
      }, {
        start: rad90+(rotateAngle*column), //S
        end: rad90+(rotateAngle*(column+1)),
        radius: cellPt1.distance(center),
        viewOn: cellMap.S
      }, {
        line: rigthWall, //E
        viewOn: cellMap.E
      }, {
        line: leftWall, //O
        viewOn: cellMap.O
      }
    ];
    //Draw it
    //lines
    for (var i = 2; i < cellObj.length; i++) {
      form.stroke(colors.b3, 1).fill(false).line(cellObj[i].line);
      if (cellObj[i].viewOn) {
        formDFS.stroke(color, 2).fill(color).line(cellObj[i].line);
      }
      form.stroke(false).fill(color).point(center, halfsize = 1, isCircle = true);
    }
    //curves
    for (var j = 0; j < 2; j++) {

      var curve = cellObj[j];
      var c=document.getElementById("canvas");
      var ctx=c.getContext("2d");

      if (curve.viewOn) {
        formDFS.stroke(color, 2).fill(color);
        ctx.beginPath();
        ctx.arc(center.x,center.y,curve.radius,curve.start,curve.end);
        ctx.stroke();


      }
      //form.stroke(false).fill(color).point(center, halfsize = 1, isCircle = true);
    }
/*
  //  var color = colors.a1;
    var cell = new Rectangle(position).resizeTo(size);
    var cellMap2 = map.map[row][column];
    var cellObj2 = [ //Paredes
      {
        line: cell.sides()[0], //N
        viewOn: cellMap2.N
      }, {
        line: cell.sides()[2], //S
        viewOn: cellMap2.S
      }, {
        line: cell.sides()[1], //E
        viewOn: cellMap2.E
      }, {
        line: cell.sides()[3], //O
        viewOn: cellMap2.O
      }
    ];
    //Draw it
    for (var k = 0; k < cellObj2.length; k++) {
      if (cellObj[k].viewOn) {
        formDFS.stroke(color, 1).fill(color).line(cellObj2[k].line);
      }
    //  form.stroke(false).fill(color).points(cell.toPointSet().points, halfsize = 2, isCircle = true);
    //  form.fill(colors.b1).font(9).text(position.$add(5, 12), row + ", " + column);
    }
*/
  }.bind(grid));


/*
// only for debugging
gridFind.generate(function(size, position, row, column, type, isOccupied) {
  //var color = colors["a" + Math.ceil(Math.random() * 4)];

  var color = colors.a1;
  var cell = new Rectangle(position).resizeTo(size);
  var cellMap = map.map[row][column];
  var cellObj = [ //Paredes
    {
      line: cell.sides()[0], //N
      viewOn: cellMap.N
    }, {
      line: cell.sides()[2], //S
      viewOn: cellMap.S
    }, {
      line: cell.sides()[1], //E
      viewOn: cellMap.E
    }, {
      line: cell.sides()[3], //O
      viewOn: cellMap.O
    }
  ];
  //Draw it
  for (var i = 0; i < cellObj.length; i++) {
    if (cellObj[i].viewOn) {
      formDFS.stroke(color, 1).fill(color).line(cellObj[i].line);
    }
    form.stroke(false).fill(color).points(cell.toPointSet().points, halfsize = 2, isCircle = true);
    form.fill(colors.b1).font(9).text(position.$add(5, 12), row + ", " + column);
  }
}.bind(gridFind));
*/

//****************************
//**                        **
//**   Draw Tracing Route   **
//**                        **
//****************************


gridFind.generate(function(size, position, row, column, type, isOccupied) {
  //var color = colors["a" + Math.ceil(Math.random() * 4)];
  var color = colors.a2;
  var colorRow = colorCol = color;

  var neighboursCells = [];
  var nextPt;
for( var j = 0; j <= 3; j++) {
  switch (j) {
    case 0: //N top
        nextPt = getCellPoints(this,row-1,column);
        neighboursCells.push(nextPt.centroid());
        break;
    case 1: //E rigth
        nextPt = getCellPoints(this,row,column+1);
        neighboursCells.push(nextPt.centroid());
        break;
    case 2: //S bottom
        nextPt = getCellPoints(this,row+1,column);
        neighboursCells.push(nextPt.centroid());
        break;
    case 3: //O left
        nextPt = getCellPoints(this,row,column-1);
        neighboursCells.push(nextPt.centroid());
        break;
    default: ""

  }
}
  var cellPoints = getCellPoints(this,row,column);
  var centerCell = cellPoints.centroid();
  var cellPt0 = cellPoints.points[0];
  var cellPt1 = cellPoints.points[1];
  var cellPt2 = cellPoints.points[2];
  var cellPt3 = cellPoints.points[3];

  var leftWall = new Line (cellPt0).to(cellPt1); //
  var rigthWall = new Line (cellPt2).to(cellPt3); //

  //top and left as straigth Lines to simplify
  var bottomWall = new Line (cellPt1).to(cellPt2); //
  var topWall = new Line (cellPt3).to(cellPt0); //



  var cellMap = findMap.map[row][column];
  var cellObj = [ //Paredes
    {
      line: [new Line(centerCell).to(topWall.midpoint()), new Line(topWall.midpoint()).to(neighboursCells[0])], //N top, working
      viewOn: cellMap.N //vermelho 0
    }, {
      line: [new Line(centerCell).to(bottomWall.midpoint()), new Line(bottomWall.midpoint()).to(neighboursCells[2])], //S bottom
      viewOn: cellMap.S //verde 1
    }, {
      line: [new Line(centerCell).to(rigthWall.midpoint()), new Line(rigthWall.midpoint()).to(neighboursCells[1])], //E rigth, working
      viewOn: cellMap.E //azul 2
    }, {
      line: [new Line(centerCell).to(leftWall.midpoint()), new Line(leftWall.midpoint()).to(neighboursCells[3])], //O left
      viewOn: cellMap.O //amarelo 3
    }
  ];
  //Draw it
  for (var i = 0; i < cellObj.length; i++) {
    if (!cellObj[i].viewOn) {
      //form.stroke(colors["c"+"1234".charAt(i)], 2, "round").fill(color).lines(cellObj[i].line);
      form.stroke(color, 2, "round").fill(color).lines(cellObj[i].line);
    }
  }
  //form.fill(colors.b1).font(9).text(position.$add(5, 12), row + ", " + column);
}.bind(gridFind));


//only for debugging
/*gridFind.generate(function(size, position, row, column, type, isOccupied) {
  //var color = colors["a" + Math.ceil(Math.random() * 4)];
  var color = colors.a1;
  //var cellMap = findMap.map[row][column];
  //if (cellMap.visited) {
  //var cell = new Rectangle(position).resizeTo(size);
  //form.fill(color).stroke(false).rect(cell)
  //}
  var cell = new Rectangle(position).resizeTo(size);
  var cellMap = findMap.map[row][column];
  var cellObj = [ //Paredes
    {
      line: cell.sides()[0].getPerpendicular(0.5, len = size.$divide(2), reverse = false), //N
      viewOn: cellMap.N
    }, {
      line: cell.sides()[2].getPerpendicular(0.5, len = size.$divide(2), reverse = false), //S
      viewOn: cellMap.S
    }, {
      line: cell.sides()[1].getPerpendicular(0.5, len = size.$divide(2), reverse = false), //E
      viewOn: cellMap.E
    }, {
      line: cell.sides()[3].getPerpendicular(0.5, len = size.$divide(2), reverse = false), //O
      viewOn: cellMap.O
    }
  ];
  //Draw it
  for (var i = 0; i < cellObj.length; i++) {
    if (!cellObj[i].viewOn) {
      form.stroke(color, 2, "round").fill(color).line(cellObj[i].line);
    }
  }
  //form.fill(colors.b1).font(9).text(position.$add(5, 12), row + ", " + column);
}.bind(gridFind));
*/

//**************************************************************************
// gridMap object
//  as an map array and a grid object to represent it
//**************************************************************************
function gridMap(aGrid, kind) {
  this.map = []; //2d array [row][columns]
  //fill this.map array with object {N,E,S,O,visited} -> cell walls as booleans
  for (var i = 0; i < aGrid.rows; i++) { //row
    var thisColumn = [];
    for (var j = 0; j < aGrid.columns; j++) { //column
      thisColumn.push({
        N: true,
        E: true,
        S: true,
        O: true,
        visited: false
      });
    }
    this.map.push(thisColumn);

  }

  this.reset = function() {
    this.map = [];
    for (var i = 0; i < aGrid.rows; i++) { //row
      var thisColumn = [];
      for (var j = 0; j < aGrid.columns; j++) { //column
        thisColumn.push({
          N: true,
          E: true,
          S: true,
          O: true,
          visited: false
        });
      }
      this.map.push(thisColumn);

    }
  };

  this.grid = aGrid;

  this.kind = kind; //"make" or "find"

  this.rows = this.map.length; //aGrid.rows;

  this.columns = this.map[0].length; //aGrid.columns

  this.moveOptions = function(r, c, kind, mazeMap) {
    temp = [
      [c, r - 1], //N
      [c + 1, r], //E
      [c, r + 1], //S
      [c - 1, r] //O
    ];
    ns = [];
    for (var i = 0; i < temp.length; i++) {
      var n = temp[i];

      switch (kind) {
        case "make":
          //options inside the limits and not visited
          var condition = (n[0] >= 0 && n[0] < this.columns && n[1] >= 0 && n[1] < this.rows) && !this.map[n[1]][n[0]].visited;

          //#####  debug
          if (debug) {
            console.log("cell " + r + ", " + c + " nextC " + n[1] + ", " + n[0] + " | cond=" + condition);
          }

          break;

        case "find":
          //using options that aren't a wall in mazeMap and that were not visited in this map.
          var mapCell = mazeMap.map[r][c];
          var wall = "NESO".charAt(i);
          var condition = !mapCell[wall] && !this.map[n[1]][n[0]].visited;

          //#####  debug
          if (debug) {
            if (kind == "find") {
              console.log("cell " + r + ", " + c + " nextC " + n[1] + ", " + n[0] + " | " + wall + " " + mapCell[wall] + " | c=" + condition);
            }
          }

          break;
      }
      if (condition) {
        ns.push({
          row: n[1],
          col: n[0],
          NESO: "NESO".charAt(i)
        });
      }
    }
    if (debug) {
      console.log("--------------------------");
    }

    return ns;
  };

  this.drawGrid = function() {
    this.grid.create();
  };

  this.positionToCell = function (x, y) {
    // translate from pixels to row, column
    //returns a object with properties row col
    //pt distance to center => row
    //pt angle to column0 line => column
    //
    var radius = this.grid.clone().moveTo(this.grid.x,center.y).distance(center);
    var radiusSeg = radius / (this.grid.rows);
    var rotateInc = 360/this.grid.columns;

    var rotateAngle = rotateInc*Const.deg_to_rad;

    var pt = new Vector(x,y);

    //row
    var distanceToCenter = pt.distance(center); //number in pixels
    var row = Math.floor(distanceToCenter/radiusSeg);

    if (row > this.grid.rows-1) {row = this.grid.rows-1;}

    //column
    var anglePt = pt.angle(center)*Const.rad_to_deg;

    var calc = 0;
        if ((anglePt < -90) && (anglePt >= -180) ) {
      calc = (anglePt+270);
      } else if (anglePt == -90) {
        calc = 0;
    }
    else {
       calc = anglePt-90;
    }
    anglePt = calc;

    var columns = this.grid.columns;
    var col = (Math.ceil((anglePt-rotateInc)/rotateInc)+columns)%columns;


    return {row:row, col:col};

  };

}
//end gridMap

//DFS

//randomize startpoint, endpoint
var startRow = Math.floor(Math.random() * grid.rows);
var startCol = Math.floor(Math.random() * grid.columns);

var endRow = Math.floor(Math.random() * grid.rows);
var endCol = Math.floor(Math.random() * grid.columns);

//a rectangle representig the cell where we start, invisable
var startRectCell = map.grid.cellToRectangle(startCol, startRow);
var startCircCell = getCellPoints(map.grid, startRow, startCol);
var startCircCenter = startCircCell.centroid();
//experiment: draw the find tracing route as a curve
var curveFind = new Curve(startCircCenter);


//******************************************************************************************
//******************************************************************************************
//**                                                                                      **
//**   DFS function, recursive, diferent exit conditions to Make a maze and Find a path   **
//**                                                                                      **
//******************************************************************************************
//******************************************************************************************
function mazeDFS(thisMap, row, col, kind, stack, rowEnd, colEnd, mazeMap) {
  if (debug) {
    console.log("\n" + kind + " (" + row + ", " + col + ") stack: " + stack.length);
  }

  //###########################
  //## the cell where we are ##
  //###########################
  var cell = thisMap.map[row][col];

  if (debug) {
    //markers for debug
    if (cell.visited) {
      var colorMark = colors.a4; //yellow, as already been visited
      var widthMark = 1;
    } else {
      var colorMark = colors.b1; //ligth blue, visited for the first time
      var widthMark = 1;
    } //a dif color for 1st or 2nd time pass

  }
  //########################
  //##  mark as visited   ##
  //########################
  cell.visited = true; //mark as visited

  //######################
  //##   move options   ##
  //######################
  //wich way can we go?
  switch (kind) {
    case "make":
      {
        var moveOpt = thisMap.moveOptions(row, col, "make");
        break;
      }
    case "find":
      {
        var moveOpt = thisMap.moveOptions(row, col, "find", mazeMap);
        break;
      }
  }
  if (debug) {
    //markers for debug
    if ((moveOpt.length >= 2)) { // a dif color for archor (archor for the last cell visited with more than one route option)
      var colorMark = colors.a1;
      var widthMark = 1;
    }
    //draw the markers
    //## ligth blue, visited only one time
    //## yellow, has already been visited
    //## pink, archor/shortcut cell
    rectCell = thisMap.grid.cellToRectangle(col, row); //rectangle of current cell
    if (cell.visited) {
      formDFS.fill(colors.b3).stroke(false).rect(rectCell.resizeCenterTo(rectCell.length() / 20))
    }
    formDFS.fill(false).stroke(colorMark, widthMark).circle(new Circle(rectCell.center).setRadius(rectCell.length() / 40)); //circle marking the cells visited
  }
  //######################################
  //## we reached a dead-end, move back ##
  //######################################
  if (moveOpt.length == 0) {

    var nextCell = stack.pop(); //last cell visited
    if (debug) {
      console.log("mv: " + moveOpt.length + " poped: " + nextCell.row + ", " + nextCell.col + " " + nextCell.NESO);
    }



    if (kind == "find") {
      //###########################
      //## rebuilding the walls  ##
      //###########################
      //each cell as walls so 2 walls to erase
      var nextCellMap = thisMap.map[nextCell.row][nextCell.col]; //and the next cell wall too
      nextCellMap[nextCell.NESO] = true; //this cell wall
      cell["SONE".charAt("NESO".indexOf(nextCell.NESO))] = true;

      //experiment drwa a cruve to trace the path
      //curve to trace path
      curveFind.disconnect(1);

    }


  } else {
    //########################
    //##    move forward    ##
    //########################

    //choose randomly between our move options
    var nextCell = moveOpt[Math.ceil(Math.random() * moveOpt.length) - 1];

    //save on stackMap
    //only need to save when moveOptions.length >= 2, save stack memory for bigger mazes
    //moveOptions.length = 0  dead-end
    //moveOptions.length = 1  only one way, no need to saven
    //moveOptions.length >= 2 in this case we still have routes to explore

    //if (kind=="make" && (moveOpt.length >2)) {

    stack.push({
      row: row,
      col: col,
      NESO: nextCell.NESO
    });
    if (debug) {
      console.log("mv: " + moveOpt.length + " pushed: " + row + ", " + col);
    }
    //} else { //find
    //   stack.push({row:row,col:col, NESO:nextCell.NESO});
    //push points to curve

    if (kind == "find") {
      var centerPoint = getCellPoints(thisMap.grid,row,col).centroid();
      curveFind.to(centerPoint);
      //console.log(centerPoint, curveFind)
    }
    //########################
    //## erasing the walls  ##
    //########################
    //each cell as walls so 2 walls to erase
    cell[nextCell.NESO] = false; //this cell wall
    var nextCellMap = thisMap.map[nextCell.row][nextCell.col]; //and the next cell wall too
    nextCellMap["SONE".charAt("NESO".indexOf(nextCell.NESO))] = false;

  }


  //debug
  if (debug) {
    form.fill(colors.a1);
      //form.text(new Point(20, dL += 10), "stack: " + stackMap);
    form.text(new Point(20, dL += 10), "next: " + nextCell.row + ", " + nextCell.col + ", " + nextCell.NESO);
  }

  //recusive exit condition
  switch (kind) {
    case "make":
      {
        var condition = (stack.length === 0);
        break;
      }
    case "find":
      {
        var condition = ((nextCell.row == rowEnd) && (nextCell.col == colEnd));
        break;
      }
  }

  if (condition) {
    stack = []; //reset stack
    var nextCenterPoint = getCellPoints(thisMap.grid, nextCell.row, nextCell.col).centroid();
    curveFind.to(nextCenterPoint);
    return;
  }

  //###################################
  //##  call recursive to next cell  ##
  //###################################
  // not working with this metod of maps: setTimout for animation, velocity depends of the size of the grid.

  switch (kind) {
    case "make":
      {
        return mazeDFS(thisMap, nextCell.row, nextCell.col, "make", stack);
      }
    case "find":
      {


        return mazeDFS(thisMap, nextCell.row, nextCell.col, "find", stack, rowEnd, colEnd, mazeMap);

      }
  }
}


//draw the whole thing

spaceGrid.add({

  animate: function(time, fps, context) {

    //desenhar a primeira vez
    var stackMap = [];
    //form.stroke(false).fill(colors.b4).rect(grid); //background of the grid

    mazeDFS(map, startRow, startCol, "make", stackMap);
     //start-point marker
    var startMarker = getCellPoints(grid,startRow, startCol).centroid();
    var startMarkerSize = 5 + (markerRatio*(startRow));
    form.fill(colors.a2).stroke(colors.a2).circle(new Circle(startMarker).setRadius(startMarkerSize));

    //velocity = Math.ceil(map.grid.cell.size.magnitude())
    map.drawGrid(); // draw grid cells (via generate() callback)
    map.grid.rotate2D(Const.one_degree / 20, map.grid.centrer);
  },

  onMouseAction: function(type, x, y, evt) {
    var isEndMarked = false;
    if (type == "move") {
        }

    if (type == "drag") {}

    if (type == "down") {
      //
      //if (!isEndMarked) {
      spaceGrid.clear();

      //start-point marker
      var startMarker = getCellPoints(grid,startRow, startCol).centroid();
      var startMarkerSize = 5 + (markerRatio*(startRow));
      form.fill(colors.a2).stroke(colors.a2).circle(new Circle(startMarker).setRadius(startMarkerSize));

      map.drawGrid(); // draw grid cells (via generate() callback)

      mouse.set(x, y);
      //var mouseCell = grid.positionToCell(mouse);

      //end-point marker
      var mouseCell = findMap.positionToCell(mouse.x, mouse.y);

      var endMarker = getCellPoints(grid,mouseCell.row, mouseCell.col).centroid();
      var endMarkerSize = 5 + (markerRatio*(mouseCell.row));
      form.fill(colors.a3).stroke(colors.a3).circle(new Circle(endMarker).setRadius(endMarkerSize));

      //calcular o caminho
      stackFind = [];
      mazeDFS(findMap, startRow, startCol, "find", stackFind, mouseCell.row, mouseCell.col, map);


    }
    if (type == "up") {

      //draw experiment curve path

      var pts = curveFind.points;
      //formDFS.fill(false).stroke(colors.a1, 2,"round").curve(new Curve().to(pts).catmullRom() );
      //formDFS.fill(false).stroke(colors.a1, 2, "round").curve(new Curve().to(pts).bspline());
      //console.log(pts.toString());
      //formDFS.fill(colors.a4).points(pts); //point that map the trace
      //formDFS.fill(false).stroke(colors.c4, 2, "round").curve(curveFind).to(pts).bspline();
      formDFS.fill(false).stroke(colors.a2, 2, "round").curve(new Curve(startCircCenter).to(pts).bspline(50)); //trace route
      //findMap.drawGrid();

      //var curveLen = curveFind.count();
      //curveFind.disconnect(curveLen);
      //tentar resetar a curva
      curveFind = new PointSet(); //var curveFind = new Curve(startCircCenter);
      findMap.reset();


    }
  }

});
spaceGrid.bindMouse();

// 4. Start playing

//.refresh(false);
spaceGrid.play();
spaceGrid.pause();

};//]]>
