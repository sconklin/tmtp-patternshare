function drawPatternIfReady(){
    console.log("drawPatternIfReady");
    // See whether everything is ready to draw a pattern.
    // If it is, call drawpattern

    // Are measurements loaded?
    if (typeof window.measurementData != 'undefined') {
	// Is patterndata loaded?
	if (typeof window.patternData != 'undefined'){
	    console.log("We have a pattern file loaded");
	    var md = window.measurementData.clientdata.measurements
	    var pmd = window.patternData.pattern.measurements;

	    // make sure measurements in the pattern exist in the
	    // measurement file
	    pmd.map( function(item) {
		if (!(item in md)) {
		    alert("Measurement <" + item + "> is required by the pattern and is not in the selected measurement file");
		}
	    })

	    // disable any measurement inputs that the pattern doesn't use
	    for(var mname in md){
		if ($.inArray(mname, pmd) == -1) {
		    $("#"+mname).prop('disabled', true);
		    $("#"+mname).attr('class', "disabledmeasurement");
		} else {
		    // This is a required measurement
		    $("#"+mname).prop('disabled', false);
		    $("#"+mname).attr('class', "enabledmeasurement");
		}
	    }

	    // Change the units selector to match what's in the measurements file
	    var clientUnits = window.measurementData.clientdata.units;
	    console.log("Client Units: " + clientUnits);
	    if (clientUnits == "px") {
		$("#pxradio").attr('checked', 'checked')
	    }
	    else if (clientUnits == "in") {
		$("#inradio").attr('checked', 'checked')
	    }
	    else if (clientUnits == "cm") {
		$("#cmradio").attr('checked', 'checked')
	    }
	    else {
		alert("Invalid units field in measurement file");
	    }

	    // Draw the pattern
	    getMeas();
	    console.log("Draw Pattern Here");
	    //var mmap = convertMeasurementData(window.measurementData);
	    drawpattern();
	}
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

function getPattern(){
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
console.log("Start . . .");

var ua = navigator.userAgent;
if((~ua.indexOf('MSIE'))) {
    alert("It appears that you're using Internet Explorer. This site probably won't work for you. We're working on it and we apologize for the inconvenience. Firefox is a great free browser alternative on which this site should work.")
}

$.ajaxSetup({ cache: false }); // Don't cache results from json file loads

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
    getPattern();
});

// Triggered when the user selects a measurement file
// from the popup
$("#popupSelectM").change(function(e) {
    console.log("Measurement file CHANGED");
    mFileName = './measurements/' + $("#popupSelectM").val();
    console.log(mFileName);
    // Now we have a file selected
    $("#selectMeasurementsDiv").hide();
    $.getJSON(mFileName)
	.done(function(mdata) {
	    // Now we have measurement data
	    window.measurementData = mdata;
	    console.log("LOADED MEASUREMENTS");
	    $("#measuretitle").html(window.measurementData.clientdata.customername);

	    // Copy all the values from the measurement file to the text entries
	    var md = mdata.clientdata.measurements
	    var measElTxt="";
	    for(var mname in md){
		//console.log(mname + ': ' + md[mname])
		measElTxt += "<input type=\"text\" size=\"8\" id=\"" + mname + "\" value=\"" + md[mname] + "\" />" + mname + "<br/>";
	    }
	    measElTxt += "</br><button type=\"button\" onclick=\"drawpattern()\"> Draw! </button>";
	    $("#measurements").html(measElTxt);

	    // See whether we're ready to draw
	    drawPatternIfReady();
	})
	.fail(function( jqxhr, textStatus, error ) {
	    var err = textStatus + ', ' + error;
	    console.log( "Measurement Request Failed: " + err);
	    alert("An error was encountered while parsing the Measurement data file")
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

    $.getJSON(pFileName)
	.done(function(pdata) {
	    // Now we have measurement data
	    window.patternData = pdata;
	    $("#patterntitle").html(window.patternData.pattern.title);

	    // See whether we're ready to draw
	    drawPatternIfReady();
	})
	.fail(function( jqxhr, textStatus, error ) {
	    var err = textStatus + ', ' + error;
	    console.log( "Pattern Request Failed: " + err);
	    alert("An error was encountered while parsing the Pattern data file")
	});

    $.getJSON(pFileName, function(pdata) {
    });
});

