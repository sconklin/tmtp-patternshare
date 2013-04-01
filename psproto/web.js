
function drawPatternIfReady(){
    // See whether everything is ready to draw a pattern.
    // If it is, call drawPattern

    // Are measurements loaded?
    // Is a pattern Script Loaded?
    if ((typeof window.measurementData != 'undefined') &&
    (typeof drawPattern == 'function')){
	// do any setup work here for the canvas (none yet)

	// Draw the pattern
	console.log("Draw Pattern Here");
	//var mmap = convertMeasurementData(window.measurementData);
	//drawPattern(window.measurementData, window.styleData, mmap);
    }
}

function getMeasurement(){
    // Fetch a list of available Measurements
    // Right now this grabs a list from a json file,
    // but could ultimately query a db
    $.getJSON("measurements/measurement_list.json", function(mlist) {

	// we'll set up the select list, then display the popup
	// that contains it
	var $el = $("#popupSelectM");
	$el.empty(); // remove old options from the select

	// Add the first prompt. Selecting this one will not trigger
	// a change, since it is selected already
	$el.append($("<option></option>")
	       .attr("value", "select").text("Select Measurements"));

	// Add the choices we read from the json file
	$.each(mlist, function(key, val) {
	    // remove the .json from the end
	    var name = val.slice(0,-5);
	    // Add the option to the list
	    $el.append($("<option></option>")
		   .attr("value", val).text(name));
	});
	// TODO This doesn't display correctly the second click
	// set the location of the popup right over the button
	buttonOffset = $("#SMButton").offset();
	console.log( "Button offset left: " + buttonOffset.left + ", top: " + buttonOffset.top );
	pdOffset = $("#selectMeasurementsDiv").offset();
	console.log( "MDiv offset left: " + pdOffset.left + ", top: " + pdOffset.top );

	//$("#selectMeasurementsDiv").offset({ top: 0, left: 0})
	$("#selectMeasurementsDiv").offset({ top: buttonOffset.top, left: buttonOffset.left})
	$("#selectMeasurementsDiv").show();
	// Now, when user selects one of these the change callback will happen
    });
}

function getPattern(e){
    // Fetch a list of available pattern files
    // Right now this grabs a list from a json file,
    // but could ultimately query a db
    $.getJSON("patterns/pattern_list.json", function(plist) {

	// we'll set up the select list, then display the popup
	// that contains it
	var $el = $("#popupSelectP");
	$el.empty(); // remove old options from the select

	// Add the first prompt. Selecting this one will not trigger
	// a change, since it is selected already
	$el.append($("<option></option>")
		   .attr("value", "select").text("Select Pattern"));

	// Add the choices we read from the json file
	$.each(plist, function(key, val) {
            // remove the .js from the end
            var name = val.slice(0,-3);
            // Add the option to the list
            $el.append($("<option></option>")
		       .attr("value", val).text(name));
	});

	// TODO This doesn't display correctly the second click
	// set the location of the popup right over the button
	console.log("here");
	buttonOffset = $("#SPButton").offset();
	console.log( "Button offset left: " + buttonOffset.left + ", top: " + buttonOffset.top );
	pdOffset = $("#selectPatternDiv").offset();
	console.log( "PDiv offset left: " + pdOffset.left + ", top: " + pdOffset.top );

	//$("#selectPatternDiv").offset({ top: 0, left: 0})
	$("#selectPatternDiv").offset({ top: buttonOffset.top, left: buttonOffset.left})
	$("#selectPatternDiv").show();
	// Now, when user selects one of these the change callback will happen
    });
}


// --------

// Turn off caching, or changes to json files, etc
// won't get reloaded
console.log("Start");

//document.getElementById("patterntitle").innerHTML += titletxt;


$.ajaxSetup({ cache: false });

// catch the click on the measurements button
$("#SMButton").click(function(e){
    console.log("Mbutton Clicked");
    e.preventDefault();
    console.log("MButton");
    getMeasurement();
});

// catch the click on the patterns button
$("#SPButton").click(function(e){
    console.log("Pbutton Clicked");
    e.preventDefault();
    console.log("PButton");
    getPattern(e);
});

// Triggered when the user selects a measurement file
// from the popup
$("#popupSelectM").change(function(e) {
    console.log("Measurement file CHANGED");
    mFileName = './measurements/' + $("#popupSelectM").val();
    console.log(mFileName);
    // Now we have a file selected
    $("#selectMeasurementsDiv").hide();
    $.getJSON(mFileName, function(mdata) {
	// Now we have measurement data
	window.measurementData = mdata

	// See whether we're ready to draw
	drawPatternIfReady();
    });
});


// Triggered when the user selects a pattern file
// from the popup
$("#popupSelectP").change(function(e) {
    console.log("Pattern file CHANGED");
    pFileName = './patterns/' + $("#popupSelectP").val();
    console.log(pFileName);
    // Now we have a file selected, so hide the selection popup
    $("#selectPatternDiv").hide();

    $.getJSON(pFileName, function(pdata) {
	// Now we have measurement data
	window.patternData = pdata
	// TODO update text in the pattern name block

	// See whether we're ready to draw
	drawPatternIfReady();
    });
});

