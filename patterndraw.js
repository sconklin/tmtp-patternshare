/*
vers    date        changes
0.1     02.27.13    1st release
0.1.1   02.28.13    added some math
0.1.2   03.19.13    added more math, added construction options/grid
*/

var maxx, maxy, minx, miny;
var pt = {};

function calcPoints() {
  maxx = 0;
  maxy = 0;
  minx = 0;
  miny = 0;
  for (i in window.patternData.pattern.points) {
    console.log('calculating ', i);
    var ltr = i;
    pt[ltr] = {};
    if (window.patternData.pattern.points[i].x && window.patternData.pattern.points[i].y) {
        console.log('point ', i, 'has x & y');
        console.log('evalx = ' + window.patternData.pattern.points[i].x);
        console.log('evaly = ' + window.patternData.pattern.points[i].y);
        // the + unary removes leading zeroes
        var evalx = +eval(window.patternData.pattern.points[i].x);
        var evaly = +eval(window.patternData.pattern.points[i].y);
    } else {
        // console.log('evalpnt = ' + window.patternData.pattern.points[i])
        var evaldict = eval(window.patternData.pattern.points[i]);
        console.log('evaldict = ', evaldict);
        console.log('evaldict.x = ', evaldict.x, 'evaldict.y = ', evaldict.y);
        var evalx = evaldict.x;
        var evaly = evaldict.y;
        console.log('evalx, evaly = ', evalx, evaly);
    }
    pt[ltr].x = evalx;
    pt[ltr].y = evaly;

    maxx = Math.max(maxx, pt[ltr].x);
    minx = Math.min(minx, pt[ltr].x);
    maxy = Math.max(maxy, pt[ltr].y);
    miny = Math.min(miny, pt[ltr].y);
    console.log(ltr + ".x: " + window.patternData.pattern.points[i].x + " = " + pt[ltr].x);
    console.log(ltr + ".y: " + window.patternData.pattern.points[i].y + " = " + pt[ltr].y);
    console.log("Point "+ltr+" maxx: " + maxx + ", maxy: " + maxy + ", minx: " + minx + ", miny: " + miny);
  }
  //console.log(pt);
}

var measValid;
var meas;

function getMeas() {
  measValid = true;
  meas = {};
  console.log("getMeas");
  var pmd = window.patternData.pattern.measurements;
  pmd.map( function(item) {
    var measnum = $("#"+item).val();
    if ( measnum !== "" && isNaN(measnum) == false ) {
        meas[item] = measnum;
        console.log("meas."+item+": " + measnum);
    } else { measValid = false; }
  });
  console.log("measValid is " + measValid);
}


var reformedsvg = "";
var svgnohead = "";
var svgsaveheader = "";
var svgtitle = "";
var svgobjstring = "";
var svgtransform = "";
var svgconststr = "";
var constopt;
var constptopt;
var gridopt;
var gridsvgstr = "";
var constptstr = "";

function drawpattern(){
    //getMeas();
    maxx = 0;
    maxy = 0;
    minx = 0;
    miny = 0;
    pt = {};

    reformedsvg = "";
    svgnohead = "";
    svgsaveheader = "";
    svgtitle = "";
    svgobjstring = "";
    svgtransform = "";
    svgconststr = "";
    gridsvgstr = "";
    constptstr = "";
    constopt = document.getElementById("constopt").checked;
    constptopt = document.getElementById("constptopt").checked;
    gridopt = document.getElementById("gridopt").checked;
    IN = 72;
    CM = 28.346;

    if ( measValid ) {

        calcPoints();

        var unitscayl;
        if ( document.getElementById("cmradio").checked == true ) { unitscayl = 28.346; }
        else if ( document.getElementById("inradio").checked == true ) { unitscayl = 72; }
        else { unitscayl = 1; };

        console.log("unitscayl = " + unitscayl);

        if ( constopt ) {
            console.log('constopt');
            svgconststr += "<g>";
            console.log('got to here!');
            for (i in window.patternData.pattern.construction) {
                console.log('i = ' + i);
                svgconststr += "<";
                svgconststr += window.patternData.pattern.construction[i].type + " " + "id=\"" + window.patternData.pattern.construction[i].id + "\" ";
                for (j in window.patternData.pattern.construction[i].drawattr){
                    var evaled = eval(window.patternData.pattern.construction[i].drawattr[j]);
                    evaled *= unitscayl;
                    console.log("og: " + window.patternData.pattern.construction[i].drawattr[j] + "ev: " + evaled);
                    svgconststr += j + "=\"" + evaled + "\" ";
                }
                if (window.patternData.pattern.construction[i].type == "path"){
                    svgconststr += " d=\" ";
                    for (j in window.patternData.pattern.construction[i].d){
                        svgconststr += window.patternData.pattern.construction[i].d[j][0];
                        for (var k=1; k<window.patternData.pattern.construction[i].d[j].length; k++){
                            //console.log(window.patternData.pattern.construction[i].d[j][k][0]);
                            var eval0 = eval(window.patternData.pattern.construction[i].d[j][k][0]);
                            var eval1 = eval(window.patternData.pattern.construction[i].d[j][k][1]);
                            eval0 *= unitscayl;
                            eval1 *= unitscayl;
                            //console.log("j[0]: " + window.patternData.pattern.construction[i].d[j][0]);
                            if (window.patternData.pattern.construction[i].d[j][0] !== "m") { eval0; eval1; }

                            svgconststr += " " + eval0 + "," + eval1 + " ";
                        }
                    }
                    svgconststr += " \" ";
                }
                for (j in window.patternData.pattern.construction[i].appearanceattr){
                    svgconststr += j + "=\"" + window.patternData.pattern.construction[i].appearanceattr[j] + "\" ";
                }
                if (window.patternData.pattern.construction[i].type == "text"){
                    svgconststr += ">" + window.patternData.pattern.construction[i].content + "</text>";
                }
                else {
                    svgconststr += "/>";
                }
            }
            svgconststr += "</g>";
        }

        for (i in window.patternData.pattern.main){
            console.log(i, ' A');
            svgobjstring += "<";
            console.log(i, 'A', window.patternData.pattern.main[i].type);
            console.log(i, 'A', window.patternData.pattern.main[i].id);
            svgobjstring += window.patternData.pattern.main[i].type
                            + " " + "id=\"" + window.patternData.pattern.main[i].id + "\" ";
            for (j in window.patternData.pattern.main[i].drawattr){
                console.log(i, 'B', j);
                var evaled = eval(window.patternData.pattern.main[i].drawattr[j]);
                evaled *= unitscayl;
                //console.log("og: " + window.patternData.pattern.main[i].drawattr[j] + "ev: " + evaled);
                svgobjstring += j + "=\"" + evaled + "\" ";
            }

            if (window.patternData.pattern.main[i].type == "path"){
                console.log(i, 'C');
                svgobjstring += " d=\" ";
                for (j in window.patternData.pattern.main[i].d){
                    console.log(i, 'C', j);
                    svgobjstring += window.patternData.pattern.main[i].d[j][0];
                    for (var k=1; k<window.patternData.pattern.main[i].d[j].length; k++){
                        console.log(i, 'C', j, k, window.patternData.pattern.main[i].d[j]);
                        console.log(window.patternData.pattern.main[i].d[j][k][0]);
                        var eval0 = eval(window.patternData.pattern.main[i].d[j][k][0]);
                        var eval1 = eval(window.patternData.pattern.main[i].d[j][k][1]);
                        eval0 *= unitscayl;
                        eval1 *= unitscayl;
                        //console.log("j[0]: " + window.patternData.pattern.main[i].d[j][0]);
                        if (window.patternData.pattern.main[i].d[j][0] !== "m") { eval0; eval1; }

                        svgobjstring += " " + eval0 + "," + eval1 + " ";
                    }
                }
                svgobjstring += " \" ";
            }

            for (j in window.patternData.pattern.main[i].appearanceattr){
                console.log(i, 'D', j)
                svgobjstring += j + "=\"" + window.patternData.pattern.main[i].appearanceattr[j] + "\" ";
            }

            if (window.patternData.pattern.main[i].type == "text"){
                console.log(i, 'E');
                svgobjstring += ">" + window.patternData.pattern.main[i].content + "</text>";
            }
            else {
                console.log(i, 'F');
                svgobjstring += "/>";
            }
        }
        console.log("A maxx: " + maxx + ", maxy: " + maxy + ", minx: " + minx + ", miny: " + miny);
        maxx *= unitscayl;
        maxy *= unitscayl;
        minx *= unitscayl;
        miny *= unitscayl;
        minx -= 20;
        miny -= 20;
        maxx += 20;
        maxy += 20;
        console.log("B maxx: " + maxx + ", maxy: " + maxy + ", minx: " + minx + ", miny: " + miny);
        var txtshift = 30;
        var svgw = maxx - minx;
        var svgh = maxy - miny + txtshift;
        var xshift = -minx;
        var yshift = -miny + txtshift;

        if (gridopt){
            gridsvgstr += "<g>";
            var numx = svgw/unitscayl;
            var numy = svgh/unitscayl;
            for (var i=0; i<numx; i++){
                gridsvgstr += "<path d=\"";
                gridsvgstr += "M " + i*unitscayl + ",0 ";
                gridsvgstr += "l " + "0," + svgh + " ";
                if (i%10 == 0){
                    gridsvgstr += "\" stroke-width=\"2\" stroke=\"#aaaaff\" fill=\"none\" />";
                }
                else if (i%5 == 0) {
                    gridsvgstr += "\" stroke-width=\"1\" stroke=\"#aaaaff\" fill=\"none\" />";
                }
                else {
                    gridsvgstr += "\" stroke-width=\"0.25\" stroke=\"#aaaaff\" fill=\"none\" />";
                }
            }
            for (var i=0; i<numy; i++){
                gridsvgstr += "<path d=\"";
                gridsvgstr += "M 0," + i*unitscayl;
                gridsvgstr += " l " + svgw  + ",0 ";
                if (i%10 == 0){
                    gridsvgstr += "\" stroke-width=\"2\" stroke=\"#aaaaff\" fill=\"none\" />";
                }
                else if (i%5 == 0) {
                    gridsvgstr += "\" stroke-width=\"1\" stroke=\"#aaaaff\" fill=\"none\" />";
                }
                else {
                    gridsvgstr += "\" stroke-width=\"0.25\" stroke=\"#aaaaff\" fill=\"none\" />";
                }
            }
            gridsvgstr += "</g>";
        }

        if (constptopt){
            constptstr += "<g>";
            for (i in pt){
                var ltr = i;
                var x = pt[ltr].x * unitscayl;
                var y = pt[ltr].y * unitscayl;

                constptstr += "<ellipse id=\"" + ltr + "\" ";
                constptstr += "cx=\"" + x + "\" cy=\"" + y + "\" ";
                constptstr += "rx=\"3\" ry=\"3\" ";
                constptstr += "fill=\"#000000\" ";
                constptstr += "/>";

                constptstr += "<text ";
                constptstr += "x=\"" + x + "\" y=\"" + y + "\"";
                constptstr += " >" + ltr + ": (" + pt[ltr].x.toFixed(3) + ", " + pt[ltr].y.toFixed(3) + ")";
                constptstr += "</text>";
                //console.log(ltr + ": (" + x + ", " + y + ")");
            }
            constptstr += "</g>";
        }

        //reformedsvg += svgheader[0];
        var viewBoxheader = "<svg width=\"" + "700" + "\" height=\"" + "550" + "\" viewBox=\"0 0 " + svgw + " " + svgh + "\" xmlns=\"http://www.w3.org/2000/svg\">";
        svgsaveheader = "<svg width=\"" + svgw + "\" height=\"" + svgh + "\" xmlns=\"http://www.w3.org/2000/svg\">";
        svgtitle = "<text font-size=\"24\" y=\"24\" x=\"5\" fill=\"#000000\">" + window.patternData.pattern.title + "</text>";
        svgtransform = "<g transform=\"translate(" + xshift + "," + yshift + ")\">";
        svgend = "</g></svg>";

        reformedsvg += viewBoxheader;
        reformedsvg += svgtitle;
        reformedsvg += svgtransform;
        if (gridopt) { reformedsvg += gridsvgstr; }
        if (constopt) { reformedsvg += svgconststr; }
        if (constptopt) { reformedsvg += constptstr; }
        reformedsvg += svgobjstring;
        reformedsvg += svgend;
        //console.log(reformedsvg);

        var da = document.getElementById("drawarea");
        da.innerHTML = reformedsvg;
    } else {
        alert("Please enter a number in each measurement box.");
    }
    //console.log(ptarray[1]);
}

/////////////////////////////////////////
/////////////////////////////////////////
//////////////    MATH    ///////////////
/////////////////////////////////////////

function angleBetween(pt1, pt2){
    var dy = pt2.y - pt1.y;
    var dx = pt2.x - pt1.x;
    var ang = Math.atan2(dy, dx);
    console.log("angleBetween (" + pt1.x + ", " + pt1.y + ") & (" + pt2.x + ", " + pt2.y + ") = " + ang);
    return ang;
}

function angleBetween3pts(a, b, c){
    var ab = new Object();
    var cb = new Object();
    ab.x = b.x-a.x;
    ab.y = b.y-a.y;
    cb.x = b.x-c.x;
    cb.y = b.y-c.y;
    var dot = (ab.x*cb.x + ab.y*cb.y);
    var cross = (ab.x*cb.y - ab.y*cb.x);
    var alpha = Math.atan2(cross,dot);
    console.log("alpha: " + alpha);
    return(alpha);
}

function dist(pt1, pt2){
    var dy = pt2.y - pt1.y;
    var dx = pt2.x - pt1.x;
    var d = Math.sqrt(dy*dy + dx*dx);
    console.log("distance between (" + pt1.x + ", " + pt1.y + ") & (" + pt2.x + ", " + pt2.y + ") = " + d);
    return d;
}

function numdist(num1, num2){
    return Math.sqrt((num1*num1) + (num2*num2));
}

function rotate(p, o, theta, ltr){
    var p0 = new Object();
    p0.x = Math.cos(theta) * (p.x-o.x) - Math.sin(theta) * (p.y-o.y) + o.x;
    p0.y = Math.sin(theta) * (p.x-o.x) + Math.cos(theta) * (p.y-o.y) + o.y;
    console.log("ltr: " + ltr);
    if (ltr == 'x'){ return p0.x; }
    if (ltr == 'y'){ return p0.y; }
}

function radians(deg){
    return deg*Math.PI/180;
}

function bezierLength(start, c1, c2, end){
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
}

function ccIntersect(P0, r0, P1, r1, ltr){
    var d = dist(P0, P1);
    console.log('ccIntersect ', ltr);
    console.log('P0 =', P0.x, P0.y, 'r0 = ', r0);
    console.log('P1 =', P1.x, P1.y, 'r1 = ', r1);
    console.log("d: "+d);
    r1 = parseFloat(r1);
    r0 = parseFloat(r0);
    console.log("r1: " + r1);
    var r0r1 = r0+r1;
    console.log("r0+r1= " + r0r1);
    if (r0r1<d){
        console.log("No Intersection between " + P0 + " and " + P1 + " with radii " + r0 + " and " + r1);
        return 0;
    }
    if (d<Math.abs(r0-r1)){
        console.log("One circle is inside another.");
        return 0;
    }
    var a = (r0*r0 - r1*r1 + d*d)/(2*d);
    console.log("a: "+a);
    var b = d-a;
    console.log("b: "+b);
    var h = Math.sqrt(r0*r0 - a*a);

    var P2 = {};
    P2.x = P0.x + a*(P1.x-P0.x)/d;
    P2.y = P0.y + a*(P1.y-P0.y)/d;
    console.log("P2: (" + P2.x + ", " + P2.y + ")");

    var P31 = {};
    P31.x = P2.x + h*(P1.y-P0.y)/d;
    P31.y = P2.y - h*(P1.x-P0.x)/d;
    console.log("P31: (" + P31.x + ", " + P31.y + ")");

    var P32 = {};
    P32.x = P2.x - h*(P1.y-P0.y)/d;
    P32.y = P2.y + h*(P1.x-P0.x)/d;
    console.log("P32: (" + P32.x + ", " + P32.y + ")");

    if (ltr == 'x'){ return P32.x; }
    if (ltr == 'y'){ return P32.y; }
}

function pointOnLineAtLength(p1, p2, length, ltr) {
    //Accepts points p1 and p2, length, and letter 'x' or 'y'
    //Returns x or y of point on the line at length measured from p1 towards p2
    //If length is negative, returns point found at length measured from p1 in opposite direction from p2
    console.log('length = ', length);
    var lineangle = angleBetween(p1, p2);
    var x = (length * Math.cos(lineangle)) + p1.x;
    var y  = (length * Math.sin(lineangle)) + p1.y;
    if (ltr == 'x'){
      return x;
    } else {
      return y;
    };
}

function midPoint(p1, p2, ltr) {
    //Accepts p1 & p2. Returns x or y of point at midpoint between p1 & p2
    console.log("midPoint.x => p1.x=" + p1.x + " + p2.x=" + p2.x + " = " + (p1.x + p2.x) / 2.0);
    console.log("midPoint.y => p1.y=" + p1.y + " + p2.y=" + p2.y + " = " + (p1.y + p2.y) / 2.0);
    console.log((p1.y + p2.y) / 2.0);
    if (ltr == 'x'){
        if (p1.x == p2.x) {
            x = p1.x;
        } else {
            x = (p1.x + p2.x) / 2.0;
        };
        return x;
      };
      if (ltr == 'y'){
        if (p1.y == p2.y) {
            y = p1.y;
        } else {
            y = (p1.y + p2.y) / 2.0;
        };
        return y;
    };
}

function polarPoint(p1, length, angle) {
    /*
    Adapted from http://www.teacherschoice.com.au/maths_library/coordinates/polar_-_rectangular_conversion.htm
    Accepts p1 as type Point,length as float,angle as float. angle is in radians
    Returns p2 as type Point, calculated at length and angle from p1,
    Angles start at position 3:00 and move clockwise due to y increasing downwards
    */
    console.log('polarPoint p1 =', p1.x, p1.y, 'length = ', length, 'angle = ', angle);
    var r = length;
    var x = p1.x + (r*Math.cos(angle));
    var y = p1.y + (r*Math.sin(angle));
    console.log('x = ', x, 'y = ', y);
    var p2 = { "x" : x, "y" : y};
    console.log('return p2 = ', p2);
    return p2;
}

function right(p1, n) {
    //Accepts point p1 and float n. Returns p2 to the right of p1 at (p1.x+n, p1.y)
    p2 = { "x" : p1.x + n, "y" : p1.y};
    return p2;
}

function left(p1, n) {
    //Accepts point p1 and float n. Returns p2 to the left of p1 at (p1.x-n, p1.y)
    p2 = { "x" : p1.x - n, "y" : p1.y};
    return p2;
}

function up(p1, n) {
    //Accepts point p1 and float n. Returns p2 above p1 at (p1.x, p1.y-n)
    p2 = { "x" : p1.x, "y" : p1.y - n};
    return p2;
}

function down(p1, n) {
    //Accepts point p1 and float n. Returns p2 below p1 at (p1.x, p1.y+n)
    p2 = { "x" : p1.x, "y" : p1.y + n};
    return p2;
}

function pointOnCircleAtX(C, r, x, test_y_str) {
    /*
    Finds points p on circle where p.x = cx
    Accepts C as center point of the circle, r as radius point, and float x.
    The eval_str is used to test which point to use for return values
    Returns a dictionary of x & y
    */
    console.log('Circle = (', C.x, C.y, '), x = ', x, 'test_y_str =', test_y_str);
    id = '';
    pnts = {};
    num = 0;
    if ( Math.abs(x - C.x) > r) {
        // TODO: better error handling here
        console.log('cx is outside radius of circle in patterdraw.pointOnCircleAtX()');
        return;
    } else {
        console.log('x is inside radius of circle in patterndraw.pointOnCircleAtX()');
        translated_x = x - C.x // center of translated circle is (0,0)
        console.log('translated_x = ', translated_x);

        translated_y1 = Math.abs(Math.sqrt(r*r - translated_x*translated_x))
        console.log('translated_y1 = ', translated_y1);

        translated_y2 = -(translated_y1)
        console.log('translated_y2 = ', translated_y2);

        // test translated_y1
        y = translated_y1 + C.y // translate back
        console.log('translated_y1 + C.y = ', y);
        if ( +eval(test_y_str) == false) {
          // test translated_y2
          y = translated_y2 + C.y // translate back
          console.log('translated_y2 + C.y = ', y);
        }
        console.log('x = ', x, 'y = ', y);
        return_dict = { "x" : x, "y" : y };
        console.log('return_dict =', return_dict);
        return return_dict;
    }
}

/////////////////////////////////////////
/////////////////////////////////////////
//////////////    SAVE    ///////////////
/////////////////////////////////////////

function savesvg() {
    //Editor.show_save_warning = false;

    // by default, we add the XML prolog back, systems integrating SVG-edit (wikis, CMSs)
    // can just provide their own custom save handler and might not want the XML prolog
    //svg = '<?xml version="1.0"?>\n' + svg;
    var svgsavestring = svgsaveheader + svgtitle + svgtransform;
    if (gridopt) { svgsavestring += gridsvgstr; }
    if (constopt) { svgsavestring += svgconststr; }
    if (constptopt) { svgsavestring += constptstr; }
    svgsavestring += svgobjstring + svgend;
    // Opens the SVG in new window, with warning about Mozilla bug #308590 when applicable
    var ua = navigator.userAgent;
    // Chrome 5 (and 6?) don't allow saving, show source instead ( http://code.google.com/p/chromium/issues/detail?id=46735 )
    // IE9 doesn't allow standalone Data URLs ( https://connect.microsoft.com/IE/feedback/details/542600/data-uri-images-fail-when-loaded-by-themselves )
    if((~ua.indexOf('Chrome') || ~ua.indexOf('MSIE'))) {
        //showSourceEditor(0,true);
        //return;
        console.log("chrome or ie");
    }
    var svg64 = Base64(svgsavestring);
    console.log(svg64);
    var win = window.open("data:image/svg+xml;base64," + svg64);
}

function Base64(input){
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
}
