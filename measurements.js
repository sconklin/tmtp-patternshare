console.log("Start Measurements. . .");

var ua = navigator.userAgent;
if((~ua.indexOf('MSIE'))) {
    alert("It appears that you're using Internet Explorer. This site probably won't work for you. We're working on it and we apologize for the inconvenience. Firefox is a great free browser alternative on which this site should work.")
}
// Turn off caching, or changes to json files, etc
// won't get reloaded
$.ajaxSetup({ cache: false }); // Don't cache results from json file loads

// Load the choices for the Measurement select buttons
// This is from static files now but can be from a database
console.log("About to load measurements");
getDataIntoSelect("measurements/measurement_list.json", "SelectM", "Select");
//measurementChangeHandler();

// Triggered when the user selects a measurement file from the select
$("#SelectM").change(measurementChangeHandler);

