/*
vers    date        changes
0.1     02.27.13    1st release
0.1.1   02.28.13    added some math
0.1.2   03.19.13    added more math, added construction options/grid
*/
//fix string replace for multiple occurrencies and fix object structure
//fix zoom!wtf
  //save some IE trouble with console
if (typeof console === "undefined"){
  console={};
  console.log = function(){ return; };
}

var patterndraw = patterndraw || {};

patterndraw.rph = patterndraw.rph || {}; // saves the components of the drawing

//set some defaulst settings 
patterndraw.settings = {
  constopt: false, // show construction lines?
  constptopt: false, // show construction points?
  gridopt: false, // show grid?
  units: 28.346, // cm as default units
  drawArea: "drawing2",
  height: 550,
  width: 700,
  messages: true, // enable or disable debug console notifications
  grid: {
    dist: [1, 5], //sets grid units
    color: "white",
    width: 1
  },
  zoom: 1,
  fit: true //ignore scale and centers drawing 
};

  //update or intialize settings values
patterndraw.init = function(settings){
  for(var key in settings)
    if(patterndraw.settings.hasOwnProperty(key)) patterndraw.settings[key] = settings[key];
};

  //help changing units
patterndraw.settings.setinches = function(){
  patterndraw.settings.units = 72;
};
patterndraw.settings.setcm = function(){
  patterndraw.settings.units = 28.346;
};

patterndraw.message = function(message){
  if(patterndraw.settings.messages) console.log(message);
};

  // draw a pattern file with a set of measurements
patterndraw.drawpattern = function( pattern, meas ){

    //process measurements
  if ( !meas ) { alert("Please enter a number in each measurement box."); return; }
    //process points
  pt = patterndraw.draw.calcPoints( pattern, meas );
  patterndraw.message("patterndraw.settings.units = " + patterndraw.settings.units);

    // generate svg elements
  var svgElms = patterndraw.svg.generate( pattern.title );

  patterndraw.rph.drawing = Raphael( patterndraw.settings.drawArea, patterndraw.settings.width, patterndraw.settings.height );

  var grid = patterndraw.rph.drawing.grid(),
    constLines = patterndraw.rph.drawing.constopt( pattern.construction ),
    patt = patterndraw.rph.drawing.pattern( pattern.main ),
    constPoints = patterndraw.rph.drawing.constptopt(pt);

    // generate final svg string
  if (!patterndraw.settings.gridopt) { grid.hide(); } // add the grid
  if (!patterndraw.settings.constopt) { constLines.hide(); } // add the construction lines
  if (!patterndraw.settings.constptopt) { constPoints.hide(); } // add the construction points

    //center element
  var gridBox = grid.getBBox();
  patterndraw.rph.drawing.setViewBox(-20, -20, gridBox.width, gridBox.height, false );

    //return object
  var drawing = {
    'grid': grid,
    'constLines': constLines,
    'constPoints': constPoints,
    'hideGrid': function(){ this.grid.hide(); },
    'showGrid': function(){ this.grid.show(); },
    'hideConstLines': function(){ this.constLines.hide(); },
    'showConstLines': function(){ this.constLines.show(); },
    'hideConstPoints': function(){ this.constPoints.hide(); },
    'showConstPoints': function(){ this.constPoints.show(); }
  };
  return drawing;
};


/////////////////////////////////////////
/////////////////////////////////////////
//////////////    DRAW    ///////////////
/////// general drawing functions ///////

patterndraw.draw = patterndraw.draw || {};

  //loop throught the pattern files and eval sequencially every point string
  // and return it as an object
patterndraw.draw.calcPoints = function ( pattern, meas ) {
  var pt = {}, i;

    //initialize global limits
  patterndraw.svg.settings.maxx = 0;
  patterndraw.svg.settings.maxy = 0;
  patterndraw.svg.settings.minx = 0;
  patterndraw.svg.settings.miny = 0;

  for (i in pattern.points) {

    var ltr = i; // name of the point
    pt[ltr] = {};

    patterndraw.message('evalx = ' + pattern.points[i].x);
    patterndraw.message('evaly = ' + pattern.points[i].y);

    // the + unary removes leading zeroes
    var evalx = +eval( pattern.points[i].x );
    var evaly = +eval( pattern.points[i].y );

    pt[ltr].x = evalx;
    pt[ltr].y = evaly;

      //update global limits so we can center the drawing
    patterndraw.svg.settings.maxx = Math.max(patterndraw.svg.settings.maxx, pt[ltr].x);
    patterndraw.svg.settings.minx = Math.min(patterndraw.svg.settings.minx, pt[ltr].x);
    patterndraw.svg.settings.maxy = Math.max(patterndraw.svg.settings.maxy, pt[ltr].y);
    patterndraw.svg.settings.miny = Math.min(patterndraw.svg.settings.miny, pt[ltr].y);

    patterndraw.message(ltr + ".x: " + pattern.points[i].x + " = " + pt[ltr].x);
    patterndraw.message(ltr + ".y: " + pattern.points[i].y + " = " + pt[ltr].y);
    patterndraw.message("Point "+ ltr +" maxx: " + patterndraw.svg.settings.maxx + ", maxy: " + patterndraw.svg.settings.maxy + ", minx: " +
      patterndraw.svg.settings.minx + ", miny: " + patterndraw.svg.settings.miny);
  }
  //patterndraw.message(pt);
  return pt;
};

  //process pattern mesurements return measurements object or false if error
patterndraw.draw.getMeas = function( measurements ) {
  var measValid = true,
    meas = {},
    pmd = measurements;

  patterndraw.message("getMeas");

  pmd.map( function(item) {
    var measnum = $("#"+item).val(); //<------------ jquery
    if ( measnum !== "" && isNaN(measnum) === false ) {
      meas[item] = measnum;
      patterndraw.message("meas."+item+": " + measnum);
    } else { measValid = false; }
  });
  patterndraw.message("measValid is " + measValid);

  return measValid ? meas : false;
};

  //return svg object for the construction lines
Raphael.fn.constopt = function( construction ){
  patterndraw.message('got to here!');

  var svgconststr, block = this.set(), i, j;
  for ( i in construction ) {
    var line = {};
    if( construction[i].type == 'path'){
      var svgStr = "";
      for (j in construction[i].d){
        svgStr += construction[i].d[j][0];
        for (var k=1; k < construction[i].d[j].length; k++){
          var eval0 = eval( construction[i].d[j][k][0] );
          var eval1 = eval( construction[i].d[j][k][1] );
          eval0 *= patterndraw.settings.units;
          eval1 *= patterndraw.settings.units;

          svgStr += eval0 + "," + eval1;
        }
      }
      line = this.path(svgStr);
    } else if (construction[i].type == 'text') { 
      line = this.text(construction[i].content)
    }
    for (j in construction[i].drawattr){
      var evaled = eval( construction[i].drawattr[j] );
      evaled *= patterndraw.settings.units;
      patterndraw.message("og: " + construction[i].drawattr[j] + "ev: " + evaled);
      line.attr({j: evaled});
    }
    var l;
    for ( l in construction[i].appearanceattr ){
      line.attr(l, construction[i].appearanceattr[l]);
    }
    block.push(line);
  }

  return block;
};

  //return raphael object for the construction points
Raphael.fn.constptopt = function( points ){
  var i, block = this.set();
  for (i in points){
    var ltr = i,
      x = points[ltr].x * patterndraw.settings.units,
      y = points[ltr].y * patterndraw.settings.units;

      var point = this.circle(x, y, 3).attr({'fill':'#000000'});
      block.push(point);
      var text = this.text( x, y, ltr + ": (" + points[ltr].x.toFixed(3) + ", " + points[ltr].y.toFixed(3) + ")" )
        .attr({'fill':'#000000'});
      block.push(text);
  }
  return block;
};

  //generate pattern
Raphael.fn.pattern = function ( pattern ) {
  var block, i , j;
  block = this.set();
  for (i in pattern){

    for ( j in pattern[i].drawattr ){
      var evaled = eval( pattern[i].drawattr[j] );
      evaled *= patterndraw.settings.units;
    }

    switch ( pattern[i].type ){
      case "path":
        var pathStr = '', path;
        for (j in pattern[i].d){
          pathStr += pattern[i].d[j][0]; //first element is string for move or line
          for ( var k=1; k< pattern[i].d[j].length; k++ ){ //iterate the rest elements (points)
            var evalx = eval( pattern[i].d[j][k][0]),
              evaly = eval( pattern[i].d[j][k][1]);
            evalx *= patterndraw.settings.units;
            evaly *= patterndraw.settings.units;
            pathStr += evalx + ',' + evaly;
          }
        }
        path = this.path(pathStr);
        block.push(path);
      break;
      case "text":
      break;
    }
    return block;
  }

 /* if (patterndraw.rph.grid) patterndraw.rph.grid.remove();
  var grid = this.set(),
    numx = patterndraw.svg.settings.svgw / ( patterndraw.settings.units * patterndraw.settings.zoom ),
    numy = patterndraw.svg.settings.svgh / ( patterndraw.settings.units * patterndraw.settings.zoom );
*/
  return block;
};

Raphael.fn.grid = function () {
  if (patterndraw.rph.grid) patterndraw.rph.grid.remove();
  var grid = this.set(), pathStr,
    numx = patterndraw.svg.settings.svgw / patterndraw.settings.units,
    numy = patterndraw.svg.settings.svgh / patterndraw.settings.units;
      //vertical
  for ( var i=0; i<numx; i++){
    pathStr = 'M' + (i * patterndraw.settings.units) + ',0' +
      'l0,' + patterndraw.svg.settings.svgh;
    var line = this.path(pathStr);
    if ( i%10 === 0){
      line.attr({'stroke-width':2,'stroke':'#aaaaff', 'fill':'none'});
    } else if(i%5 === 0){
      line.attr({'stroke-width':1,'stroke':'#aaaaff', 'fill':'none'});
    } else {
      line.attr({'stroke-width':0.25,'stroke':'#aaaaff', 'fill':'none'});
    }
    grid.push(line);
  }
    //horizontal
  for (var j=0; j<numy; j++){
    pathStr = "M0," + j*patterndraw.settings.units +
     "l" + patterndraw.svg.settings.svgw  + ",0 ";
    var line = this.path(pathStr);
    if ( j%10 === 0 ){
      line.attr({'stroke-width':2,'stroke':'#aaaaff', 'fill':'none'});
    } else if ( j%5 === 0 ) {
      line.attr({'stroke-width':1,'stroke':'#aaaaff', 'fill':'none'});
    } else {
      line.attr({'stroke-width':0.25,'stroke':'#aaaaff', 'fill':'none'});;
    }
    grid.push(line);
  }
  return grid;
};

/////////////////////////////////////////
/////////////////////////////////////////
///    ORIGINAL DRAWING FUNCTIONS    ////
//////////// (just in case) /////////////


  //return a svg grid stringe
patterndraw.draw.grid = function(){
  var grid = "<g>",
    numx = patterndraw.svg.settings.svgw / patterndraw.settings.units,
    numy = patterndraw.svg.settings.svgh / patterndraw.settings.units;

  for (var i=0; i<numx; i++){
    grid += "<path d=\"";
    grid += "M " + i * patterndraw.settings.units + ",0 ";
    grid += "l " + "0," + patterndraw.svg.settings.svgh + " ";
    if (i%10 === 0){
        grid += "\" stroke-width=\"2\" stroke=\"#aaaaff\" fill=\"none\" />";
    }
    else if (i%5 === 0) {
        grid += "\" stroke-width=\"1\" stroke=\"#aaaaff\" fill=\"none\" />";
    }
    else {
        grid += "\" stroke-width=\"0.25\" stroke=\"#aaaaff\" fill=\"none\" />";
    }
  }
  for (var j=0; j<numy; j++){
    grid += "<path d=\"";
    grid += "M 0," + j*patterndraw.settings.units;
    grid += " l " + patterndraw.svg.settings.svgw  + ",0 ";
    if (j%10 === 0){
      grid += "\" stroke-width=\"2\" stroke=\"#aaaaff\" fill=\"none\" />";
    }
    else if (j%5 === 0) {
      grid += "\" stroke-width=\"1\" stroke=\"#aaaaff\" fill=\"none\" />";
    }
    else {
      grid += "\" stroke-width=\"0.25\" stroke=\"#aaaaff\" fill=\"none\" />";
    }
  }
  grid += "</g>";
  return grid;
};

  //return svg string for the construction lines
patterndraw.draw.constopt = function( construction ){
  patterndraw.message('got to here!');
console.log(construction)
  var svgconststr = "<g>", i, j;
  for ( i in construction ) {
    patterndraw.message('i = ' + i);
    svgconststr += "<";
    svgconststr += construction[i].type + " " + "id=\"" + construction[i].id + "\" ";
    for (j in construction[i].drawattr){
      var evaled = eval( construction[i].drawattr[j] );
      evaled *= patterndraw.settings.units;
      patterndraw.message("og: " + construction[i].drawattr[j] + "ev: " + evaled);
      svgconststr += j + "=\"" + evaled + "\" ";
    }
    if ( construction[i].type == "path" ){
      svgconststr += " d=\" ";
      for (j in construction[i].d){
        svgconststr += construction[i].d[j][0];
        for (var k=1; k < construction[i].d[j].length; k++){
          //patterndraw.message(window.patternData.pattern.construction[i].d[j][k][0]);
          var eval0 = eval( construction[i].d[j][k][0] );
          var eval1 = eval( construction[i].d[j][k][1] );
          eval0 *= patterndraw.settings.units;
          eval1 *= patterndraw.settings.units;
          //patterndraw.message("j[0]: " + window.patternData.pattern.construction[i].d[j][0]);
          if ( construction[i].d[j][0] !== "m" ) { eval0; eval1; }

          svgconststr += " " + eval0 + "," + eval1 + " ";
        }
      }
      svgconststr += " \" ";
    }
    var l;
    for ( l in construction[i].appearanceattr ){
      svgconststr += l + "=\"" + construction[i].appearanceattr[l] + "\" ";
    }
    if ( construction[i].type == "text" ){
      svgconststr += ">" + construction[i].content + "</text>";
    } else {
      svgconststr += "/>";
    }
  }
  svgconststr += "</g>";

  return svgconststr;
};

  //return svg string for the pattern
patterndraw.draw.patterndraw = function( pattern ){

  var svgobjstring = '', i, j;

  for (i in pattern){
    svgobjstring += "<";
    svgobjstring += pattern[i].type + " " + "id=\"" + pattern[i].id + "\" ";
    for ( j in pattern[i].drawattr ){
      var evaled = eval( pattern[i].drawattr[j] );
      evaled *= patterndraw.settings.units;
      //patterndraw.message("og: " + window.patternData.pattern.main[i].drawattr[j] + "ev: " + evaled);
      svgobjstring += j + "=\"" + evaled + "\" ";
    }

    if ( pattern[i].type == "path" ){
      svgobjstring += " d=\" ";
      for (j in pattern[i].d){
        svgobjstring += pattern[i].d[j][0];
        for (var k=1; k< pattern[i].d[j].length; k++){
          //patterndraw.message(window.patternData.pattern.main[i].d[j][k][0]);
          var eval0 = eval( pattern[i].d[j][k][0]);
          var eval1 = eval( pattern[i].d[j][k][1]);
          eval0 *= patterndraw.settings.units;
          eval1 *= patterndraw.settings.units;
          //patterndraw.message("j[0]: " + window.patternData.pattern.main[i].d[j][0]);
          if ( pattern[i].d[j][0] !== "m") { eval0; eval1; }

          svgobjstring += " " + eval0 + "," + eval1 + " ";
        }
      }
      svgobjstring += " \" ";
    }

    for (j in pattern[i].appearanceattr){
      svgobjstring += j + "=\"" + pattern[i].appearanceattr[j] + "\" ";
    }

    if (pattern[i].type == "text"){
      svgobjstring += ">" + pattern[i].content + "</text>";
    }
    else {
      svgobjstring += "/>";
    }
  }
  return svgobjstring;
};

  //return svg string for the construction points
patterndraw.draw.constptopt = function( points ){
  var constptstr = "<g>", i;
  for (i in points){
    var ltr = i,
      x = points[ltr].x * patterndraw.settings.units,
      y = points[ltr].y * patterndraw.settings.units;

    constptstr += "<ellipse id=\"" + ltr + "\" ";
    constptstr += "cx=\"" + x + "\" cy=\"" + y + "\" ";
    constptstr += "rx=\"3\" ry=\"3\" ";
    constptstr += "fill=\"#000000\" ";
    constptstr += "/>";

    constptstr += "<text ";
    constptstr += "x=\"" + x + "\" y=\"" + y + "\"";
    constptstr += " >" + ltr + ": (" + points[ltr].x.toFixed(3) + ", " + points[ltr].y.toFixed(3) + ")";
    constptstr += "</text>";
    //patterndraw.message(ltr + ": (" + x + ", " + y + ")");
  }
  constptstr += "</g>";
  return constptstr;
};

/////////////////////////////////////////
/////////////////////////////////////////
//////////////    MATH    ///////////////
/////////////////////////////////////////

/* _ IMPORTANT: if you create any new function you should
/* _ remember that all the functions are aliased in the window
/* _ namespace so they can be used for the eval 
/* _ so BE CARFUL WITH FUNCION NAMES COLLISION */

patterndraw.math = patterndraw.math || {};

patterndraw.math.angleBetween = function(pt1, pt2){
    var dy = pt2.y - pt1.y;
    var dx = pt2.x - pt1.x;
    var ang = Math.atan2(dy, dx);
    patterndraw.message("angleBetween (" + pt1.x + ", " + pt1.y + ") & (" + pt2.x + ", " + pt2.y + ") = " + ang);
    return ang;
};

patterndraw.math.angleBetween3pts = function(a, b, c){
    var ab = new Object();
    var cb = new Object();
    ab.x = b.x-a.x;
    ab.y = b.y-a.y;
    cb.x = b.x-c.x;
    cb.y = b.y-c.y;
    var dot = (ab.x*cb.x + ab.y*cb.y);
    var cross = (ab.x*cb.y - ab.y*cb.x);
    var alpha = Math.atan2(cross,dot);
    patterndraw.message("alpha: " + alpha);
    return(alpha);
};

patterndraw.math.dist = function(pt1, pt2){
    var dy = pt2.y - pt1.y;
    var dx = pt2.x - pt1.x;
    var d = Math.sqrt(dy*dy + dx*dx);
    patterndraw.message("distance between (" + pt1.x + ", " + pt1.y + ") & (" + pt2.x + ", " + pt2.y + ") = " + d);
    return d;
};

patterndraw.math.numdist = function(num1, num2){
    return Math.sqrt((num1*num1) + (num2*num2));
};

patterndraw.math.rotate = function(p, o, theta, ltr){
    var p0 = {};
    p0.x = Math.cos(theta) * (p.x-o.x) - Math.sin(theta) * (p.y-o.y) + o.x;
    p0.y = Math.sin(theta) * (p.x-o.x) + Math.cos(theta) * (p.y-o.y) + o.y;
    patterndraw.message("ltr: " + ltr);
    if (ltr == 'x'){ return p0.x; }
    if (ltr == 'y'){ return p0.y; }
};

patterndraw.math.radians = function(deg){
    return deg*Math.PI/180;
};

patterndraw.math.bezierLength = function(start, c1, c2, end){
    var t;
    var steps = 10;
    var len = 0;
    var prevpt = {}; prevpt.x = 0; prevpt.y = 0;
    var curveptx, curvepty;
    var xdiff, ydiff;
    for (var i=0; i<steps; i++){
      t = i/steps;
      curveptx = ( start.x*Math.pow((1-t),3) + (3*c1.x*Math.pow((1-t),2)*t) + (3*c2.x*(1-t)*t*t) + (end.x*Math.pow(t,3)) );
      curvepty = ( start.y*Math.pow((1-t),3) + (3*c1.y*Math.pow((1-t),2)*t) + (3*c2.y*(1-t)*t*t) + (end.y*Math.pow(t,3)) );

      if (i>0){
        xdiff = curveptx - prevpt.x;
        ydiff = curvepty - prevpt.y;

        len += Math.sqrt(xdiff*xdiff + ydiff*ydiff);
      }

      prevpt.x = curveptx;
      prevpt.y = curvepty;

    }
    return len;
};

patterndraw.math.ccIntersect = function(P0, r0, P1, r1, ltr){
    var d = patterndraw.math.dist(P0, P1);
    patterndraw.message("d: "+d);
    r1 = parseFloat(r1);
    r0 = parseFloat(r0);
    patterndraw.message("r1: " + r1);
    var r0r1 = r0+r1;
    patterndraw.message("r0+r1= " + r0r1);
    if (r0r1<d){
        patterndraw.message("No Intersection between " + P0 + " and " + P1 + " with radii " + r0 + " and " + r1);
        return 0;
    }
    if (d<Math.abs(r0-r1)){
        patterndraw.message("One circle is inside another.");
        return 0;
    }
    var a = (r0*r0 - r1*r1 + d*d)/(2*d);
    patterndraw.message("a: "+a);
    var b = d-a;
    patterndraw.message("b: "+b);
    var h = Math.sqrt(r0*r0 - a*a);

    var P2 = {};
    P2.x = P0.x + a*(P1.x-P0.x)/d;
    P2.y = P0.y + a*(P1.y-P0.y)/d;
    patterndraw.message("P2: (" + P2.x + ", " + P2.y + ")");

    var P31 = {};
    P31.x = P2.x + h*(P1.y-P0.y)/d;
    P31.y = P2.y - h*(P1.x-P0.x)/d;
    patterndraw.message("P31: (" + P31.x + ", " + P31.y + ")");

    var P32 = {};
    P32.x = P2.x - h*(P1.y-P0.y)/d;
    P32.y = P2.y + h*(P1.x-P0.x)/d;
    patterndraw.message("P32: (" + P32.x + ", " + P32.y + ")");

    if (ltr == 'x'){ return P32.x; }
    if (ltr == 'y'){ return P32.y; }
};

patterndraw.math.pointOnLineAtLength = function(p1, p2, length, ltr) {
    //Accepts points p1 and p2, length, and letter 'x' or 'y'
    //Returns x or y of point on the line at length measured from p1 towards p2
    //If length is negative, returns point found at length measured from p1 in opposite direction from p2
    patterndraw.message('length = ', length);
    var lineangle = angleBetween(p1, p2);
    var x = (length * Math.cos(lineangle)) + p1.x;
    var y  = (length * Math.sin(lineangle)) + p1.y;
    if (ltr == 'x'){
      return x;
    } else {
      return y;
    }
};

patterndraw.math.midPoint = function(p1, p2, ltr) {
    //Accepts p1 & p2. Returns x or y of point at midpoint between p1 & p2
    patterndraw.message("midPoint.x => p1.x=" + p1.x + " + p2.x=" + p2.x + " = " + (p1.x + p2.x) / 2.0);
    patterndraw.message("midPoint.y => p1.y=" + p1.y + " + p2.y=" + p2.y + " = " + (p1.y + p2.y) / 2.0);
    patterndraw.message((p1.y + p2.y) / 2.0);
    if (ltr == 'x'){
      if (p1.x == p2.x) {
        x = p1.x;
      } else {
        x = (p1.x + p2.x) / 2.0;
      }
      return x;
    }
    if (ltr == 'y'){
      if (p1.y == p2.y) {
        y = p1.y;
      } else {
        y = (p1.y + p2.y) / 2.0;
      }
      return y;
    }
};

  //generate global alias of the functions of the patterndraw.math object so are available when parsing the json
patterndraw.math.alase = function(){
  for(funct in patterndraw.math){
    if(typeof(patterndraw.math[funct]) == 'function')
    window[funct] = patterndraw.math[funct];
  }
}()

/////////////////////////////////////////
/////////////////////////////////////////
//////////////    SAVE    ///////////////
/////////////////////////////////////////

patterndraw.svg = patterndraw.svg || {};

patterndraw.svg.settings = {
  maxx: 0, //set the limits of the svg so we can center the drawing
  maxy: 0,
  minx: 0,
  miny: 0,
  txtshift: 30,
  svgw: null, //calculated size of the svg
  svgh: null,
  xshift: null, //translate the element so it's displayed at origin
  yshift: null
};

patterndraw.svg.generate = function(title) {
  patterndraw.message("A maxx: " + patterndraw.svg.settings.maxx + ", maxy: " + patterndraw.svg.settings.maxy +
    ", minx: " + patterndraw.svg.settings.minx + ", miny: " + patterndraw.svg.settings.miny);
  patterndraw.svg.settings.maxx *= patterndraw.settings.units;
  patterndraw.svg.settings.maxy *= patterndraw.settings.units;
  patterndraw.svg.settings.minx *= patterndraw.settings.units;
  patterndraw.svg.settings.miny *= patterndraw.settings.units;
  patterndraw.svg.settings.minx -= 20;
  patterndraw.svg.settings.miny -= 20;
  patterndraw.svg.settings.maxx += 20;
  patterndraw.svg.settings.maxy += 20;
  patterndraw.message("B maxx: " + patterndraw.svg.settings.maxx + ", maxy: " + patterndraw.svg.settings.maxy +
    ", minx: " + patterndraw.svg.settings.minx + ", miny: " + patterndraw.svg.settings.miny);

  patterndraw.svg.settings.svgw = patterndraw.svg.settings.maxx - patterndraw.svg.settings.minx;
  patterndraw.svg.settings.svgh = patterndraw.svg.settings.maxy - patterndraw.svg.settings.miny + patterndraw.svg.settings.txtshift;
  patterndraw.svg.settings.xshift = -patterndraw.svg.settings.minx;
  patterndraw.svg.settings.yshift = -patterndraw.svg.settings.miny + patterndraw.svg.settings.txtshift;

    //reformedsvg += svgheader[0];
  var svgObj = {};
  svgObj.viewBoxheader = "<svg width=\"" + patterndraw.settings.width + "\" height=\"" + patterndraw.settings.height + "\" viewBox=\"0 0 " +
    patterndraw.svg.settings.svgw + " " + patterndraw.svg.settings.svgh + "\" xmlns=\"http://www.w3.org/2000/svg\">";
  svgObj.svgsaveheader = "<svg width=\"" + patterndraw.svg.settings.svgw +
    "\" height=\"" + patterndraw.svg.settings.svgh + "\" xmlns=\"http://www.w3.org/2000/svg\">";
  svgObj.svgtitle = "<text font-size=\"24\" y=\"24\" x=\"5\" fill=\"#000000\">" + title + "</text>";
  svgObj.svgtransform = "<g transform=\"translate(" + patterndraw.svg.settings.xshift + "," + patterndraw.svg.settings.yshift + ")\">";
  svgObj.svgend = "</g></svg>";

  return svgObj;
};

  /// PENDING:
patterndraw.svg.savesvg = function() {
    //Editor.show_save_warning = false;

    // by default, we add the XML prolog back, systems integrating SVG-edit (wikis, CMSs)
    // can just provide their own custom save handler and might not want the XML prolog
    //svg = '<?xml version="1.0"?>\n' + svg;
    var svgsavestring = patterndraw.svg.svgsaveheader + patterndraw.svg.svgtitle + patterndraw.svg.svgtransform;
    if (patterndraw.svg.gridopt) { svgsavestring += patterndraw.svg.gridsvgstr; }
    if (patterndraw.svg.constopt) { svgsavestring += patterndraw.svg.svgconststr; }
    if (patterndraw.svg.constptopt) { svgsavestring += patterndraw.svg.constptstr; }
    svgsavestring += patterndraw.svg.svgobjstring + svgend;
    // Opens the SVG in new window, with warning about Mozilla bug #308590 when applicable
    var ua = navigator.userAgent;
    // Chrome 5 (and 6?) don't allow saving, show source instead ( http://code.google.com/p/chromium/issues/detail?id=46735 )
    // IE9 doesn't allow standalone Data URLs ( https://connect.microsoft.com/IE/feedback/details/542600/data-uri-images-fail-when-loaded-by-themselves )
    if((~ua.indexOf('Chrome') || ~ua.indexOf('MSIE'))) {
        //showSourceEditor(0,true);
        //return;
        patterndraw.message("chrome or ie");
    }
    var svg64 = patterndraw.svg.Base64(svgsavestring);
    patterndraw.message(svg64);
    var win = window.open("data:image/svg+xml;base64," + svg64);
};

patterndraw.svg.Base64 = function(input){
    // private property
    var keyStr = "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789+/=";
    // public method for encoding
    var output = "";
    var chr1, chr2, chr3, enc1, enc2, enc3, enc4;
    var i = 0;
    while (i < input.length) {
        chr1 = input.charCodeAt(i++);
        chr2 = input.charCodeAt(i++);
        chr3 = input.charCodeAt(i++);

        enc1 = chr1 >> 2;
        enc2 = ((chr1 & 3) << 4) | (chr2 >> 4);
        enc3 = ((chr2 & 15) << 2) | (chr3 >> 6);
        enc4 = chr3 & 63;

        if (isNaN(chr2)) {
            enc3 = enc4 = 64;
        } else if (isNaN(chr3)) {
            enc4 = 64;
        }

        output = output +
        keyStr.charAt(enc1) + keyStr.charAt(enc2) +
        keyStr.charAt(enc3) + keyStr.charAt(enc4);
    }
    return output;
};
