//(function ($) {

	/******************************************************************************
	IndexedDB
	*******************************************************************************/
	
	// In the following line, you should include the prefixes of implementations you want to test.
	window.indexedDB = window.indexedDB || window.mozIndexedDB || window.webkitIndexedDB || window.msIndexedDB;
	// DON'T use "var indexedDB = ..." if you're not in a function.
	// Moreover, you may need references to some window.IDB* objects:
	window.IDBTransaction = window.IDBTransaction || window.webkitIDBTransaction || window.msIDBTransaction;
	window.IDBKeyRange = window.IDBKeyRange || window.webkitIDBKeyRange || window.msIDBKeyRange
	// (Mozilla has never prefixed these objects, so we don't need window.mozIDB*)
	
	if (!window.indexedDB) {
		window.alert("Your browser doesn't support a stable version of IndexedDB. Such and such feature will not be available.")
	}
	
	const DB_NAME = 'TauMetaTauDB';
	const DB_VERSION = 1; // Use a long long for this value (don't use a float)
	const DB_STORE_NAME = 'Measurements';

	var db;

	function openDb() {
		console.log("openDb ...");
		var req = indexedDB.open(DB_NAME, DB_VERSION);
		req.onsuccess = function (evt) {
			// Better use "this" than "req" to get the result to avoid problems with
			// garbage collection.
			// db = req.result;
			console.log("openDb DONE");
			db = this.result;
		};
		req.onerror = function (evt) {
			console.error("openDb:", evt.target.errorCode);
		};
		req.onupgradeneeded = function (evt) {
			console.log("openDb.onupgradeneeded");
			var store = evt.currentTarget.result.createObjectStore(
				DB_STORE_NAME, { keyPath: 'name', autoIncrement: true });
		};
	}


	
	
  /**
   * @param {string} store_name
   * @param {string} mode either "readonly" or "readwrite"
   */
  function getObjectStore(store_name, mode) {
    var tx = db.transaction(store_name, mode);
    return tx.objectStore(store_name);
  }

  function clearObjectStore(store_name) {
    var store = getObjectStore(DB_STORE_NAME, 'readwrite');
    var req = store.clear();
    req.onsuccess = function(evt) {
      displayActionSuccess("Store cleared");
      displayPubList(store);
    };
    req.onerror = function (evt) {
      console.error("clearObjectStore:", evt.target.errorCode);
      displayActionFailure(this.error);
    };
  }
 
  function getBlob(key, store, success_callback) {
    var req = store.get(key);
    req.onsuccess = function(evt) {
      var value = evt.target.result;
      if (value)
        success_callback(value.blob);
    };
  }
 
  /**
   * @param {IDBObjectStore=} store
   */
	function buildCustomerList(store) {
	
		console.log("openDb ...");
		var req = indexedDB.open(DB_NAME, DB_VERSION);
		req.onsuccess = function (evt) {
			// Better use "this" than "req" to get the result to avoid problems with
			// garbage collection.
			// db = req.result;
			console.log("openDb DONE");
			db = this.result;
			
			
				console.log("buildCustomerList.....");
			 
				if (typeof store == 'undefined')
					store = getObjectStore(DB_STORE_NAME, 'readonly');
			 
				var req;
				var resultList = [];
				req = store.openCursor();
				req.onerror = function(evt) {
					console.error("add error", this.error);
					//displayActionFailure(this.error);
				};
				req.onsuccess = function(evt) {
					var cursor = evt.target.result;
					if (cursor) {
						req = store.get(cursor.key);
						req.onsuccess = function (evt) {
							resultList.push(cursor.key);
							//console.log(resultList);					
						};
						cursor.continue();
					} else {
						//console.log("No more entries");
						//console.log(resultList);
						customerList = resultList;
					}
				};			
		
		};
		req.onerror = function (evt) {
			console.error("openDb:", evt.target.errorCode);
		};
	}


	var customerList = [];
	var currentPattern;
	var currentMeasurement = universal;

	//openDb();
	//buildCustomerList();

	/******************************************************************************
	BackBone.js
	*******************************************************************************/
	

    var Pattern = Backbone.Model.extend({
        urlRoot: 'pattern',
		defaults: {                     // the "defaults" property of the Model class
            name: ''
        }
    });
	
	var Measurement = Backbone.Model.extend({
		urlRoot: 'measurement',
		defaults: {
			"clientdata": {
				"customername": "",
				"units": "cm",
				"measurements": universal.clientdata.measurements
			}
		}
	});
		
    var Book = Backbone.Collection.extend({
		model: Pattern
    });
	
	var Bodies = Backbone.Collection.extend({
		model: Measurement
	});
    
	var MeasurementView = Backbone.View.extend({
		el: 'div.draw-wrapper',
		template: $("#measurementTemplate").html(),
		
		initialize: function(){
			this.model = new Measurement();
			//this.render(currentMeasurement.clientdata);   
		},
		render: function(data){
			//// replace this with indexedDB!!!!
			var customers = JSON.parse(localStorage.getItem('customerList'));
			var data = data;
			//var customers = customerList;     // built from indexedDB: function buildCustomerList()
			//console.log(customerList);
			
			var tmpl = _.template(this.template);

			this.$el.empty();
			this.$el.html(tmpl({'data': data, 'name': data.customername, 'customers': customers}));
			
			return this;
			
		},
		events: {
			'click #saveMeasurements': 'saveData',
			'change #customerSelect': 'selectCustomer'
		},
		saveData: function(e){
			e.preventDefault();
			var model = this.model;
			var $form = this.$el;

			// update model
			model.set('name', this.$el.find('#customername').val());
			model.get('clientdata').customername = this.$el.find('#customername').val();
			model.get('clientdata').units = $("input[name=units]:checked").attr('id');
			var measurements = model.get('clientdata').measurements;
			for (var part in measurements){
				for (var j in measurements[part]) {
					var newVal = $form.find('#'+j).val();
					measurements[part][j].val = newVal ? newVal : measurements[part][j].val;
				}
			}
			
			// localStorage
			customerList = localStorage.getItem('customerList') ? JSON.parse(localStorage.getItem('customerList')) : [];
			if (customerList.indexOf(model.get('name'))<0) customerList.push(model.get('name'));
			localStorage.setItem('customerList',JSON.stringify(customerList));
			localStorage.setItem(model.get('name'),JSON.stringify(model));
			
			// HTTP save to server
			model.save();
			

			/********************************************************************
			
			THIS PART NEEDS SOME WORK

			*********************************************************************/
			
			// indexedDB
			var request = window.indexedDB.open('TauMetaTauDB', '1');
			request.onerror = function(event) {
				//blablabla
			};
			request.onsuccess = function(event) {
				var db = event.target.result;
				var transaction = db.transaction(['Measurements'],'readwrite');
				transaction.oncomplete = function(event){
					console.log('transaction done');
				};
				transaction.onerror = function(event){
					// OHIO....
				};
				var objectStore = transaction.objectStore('Measurements');
				//console.log(objectStore);
				//var request = objectStore.add(model.attributes);
				var request = objectStore.put(model.attributes);
				request.onsuccess = function(event){
					// whatever
				};
			};
			
			/********************************************************************/
			
			//// GIVE SOME FEEDBACK WHEN SAVING MEASUREMENTS:
			
			//alert('Measurements saved for customer: '+model.get('name'));
			$alert = $('#alertSaved');
			$message = '<b>Hooray!</b> You just saved measurements for customer: <b>'+model.get('name')+'</b>';
			$alert.html($message).fadeTo(200,1);
			window.setTimeout(function(){$alert.fadeTo(800,0);}, 2000);
			
			
		},
		selectCustomer: function(e){
			currentCustomer = e.currentTarget.value;
			
			//// replace this with indexedDB !!!!!
			currentMeasurement = JSON.parse(localStorage.getItem(currentCustomer));
			this.render(currentMeasurement.clientdata);
		}
	});
	
	var pageView = Backbone.View.extend({
		el: 'div.draw-wrapper',
		//template: $("#aboutTemplate").html(),
		render: function(){
			
			var tmpl = _.template(this.template);

			this.$el.empty();
			this.$el.html(tmpl());
			
			return this;
			
		}
		
	});
	
    var TauMetaTauRouter = Backbone.Router.extend({
        routes: {
//			"search/:query/p:page": "search"   // #search/kiwis/p7   	GENERAL FORMAT: "query" and "page" can be passed 
//																		as arguments for the callback function 
            "":				"roadmapPage",
			"measurements": "measurementsPage",
			"patterns":		"patternsPage",
			"about":		"aboutPage"
        },
        
        urlFilter: function (type) {
            directory.filterType = type;
            directory.trigger("change:filterType");
        },
		
		roadmapPage: function() {
			roadmap.render();  
		},
		measurementsPage: function() {
			measurements.render(currentMeasurement.clientdata);  
		},
		patternsPage: function() {
			patterns.render();  
		},
		aboutPage: function() {
			about.render();  
		},
		
    });
    

    var roadmap = new pageView();
    roadmap.template = $("#roadmapTemplate").html();
    var measurements = new MeasurementView();
	//// PATTERNS WILL GET THEIR OWN VIEW, 
    var patterns = new pageView();
    patterns.template = $("#patternsTemplate").html();
	//// PATTERNS WILL GET THEIR OWN VIEW,
	var about = new pageView();
	about.template = $("#aboutTemplate").html();
	
    var taumetarouter = new TauMetaTauRouter();
    
    Backbone.history.start();
	
//} (jQuery));