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
		    $("#"+mname+"-label").attr('class', "disabledmeaslabel");
		} else {
		    // This is a required measurement
		    $("#"+mname).prop('disabled', false);
		    $("#"+mname).attr('class', "enabledmeasurement");
		    $("#"+mname+"-label").attr('class', "measlabel");
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

function getDataIntoSelect(filepath, selectId, prompt){
    // Fetch a list
    $.getJSON(filepath, function(plist) {

	var $el = $("#"+selectId);
	$el.empty(); // remove old options from the select

	// Add the prompt
        $el.append($("<option></option>")
		   .attr("value", "dummy").text(prompt));

	// Add the choices we read from the json file
	$.each(plist, function(key, val) {
            // remove the .js from the end
            var name = val.slice(0,-5);
            // Add the option to the list
            $el.append($("<option></option>")
		       .attr("value", val).text(name));
	});
	// now select the first item in the list
    });
}

// Turn off caching, or changes to json files, etc
// won't get reloaded
console.log("Start . . .");

var ua = navigator.userAgent;
if((~ua.indexOf('MSIE'))) {
    alert("It appears that you're using Internet Explorer. This site probably won't work for you. We're working on it and we apologize for the inconvenience. Firefox is a great free browser alternative on which this site should work.")
}

$.ajaxSetup({ cache: false }); // Don't cache results from json file loads

// Load the choices for the Pattern and Measurement select buttons
// This is from static files now but can be from a database
console.log("About to load patterns");
getDataIntoSelect("patterns/pattern_list.json", "SelectP", "Select Pattern");
console.log("selpat = " + $("#SelectP").val());
//patternChangeHandler();
console.log("About to load measurements");
getDataIntoSelect("measurements/measurement_list.json", "SelectM", "Select Measurements");
//measurementChangeHandler();

function measurementChangeHandler(){
    console.log("Measurement file CHANGED");
    mFileName = './measurements/' + $("#SelectM").val();
    console.log(mFileName);

    // remove the dummy from the select list. This is kinda dumb but the dummy has to be there
    // initially because we need to force the user to generate a change event
    $("#SelectM option[value='dummy']").remove();

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
		measElTxt += "<input type=\"text\" size=\"8\" id=\"" + mname + "\" value=\"" + md[mname] + "\" />" + "<div id=\"" + mname + "-label\" class=\"measlabel\">" + mname + "<br/>" + "</div>";
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
}

// Triggered when the user selects a measurement file from the select
$("#SelectM").change(measurementChangeHandler);

function patternChangeHandler(){
    console.log("Pattern file CHANGED");
    pFileName = './patterns/' + $("#SelectP").val();
    console.log(pFileName);

    // remove the dummy from the select list. This is kinda dumb but the dummy has to be there
    // initially because we need to force the user to generate a change event
    $("#SelectP option[value='dummy']").remove();

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
}

// Triggered when the user selects a pattern file from the select
$("#SelectP").change(patternChangeHandler);
