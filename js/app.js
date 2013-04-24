//(function ($) {    // Commented out for development purposes only, remove for production

	/********************************************************************
	START BACKBONE
	
	// TO DO: everytime localStorage is used, Backbone.sync should be called simultaneously
	
	// TO DO: MeasurementView is wrong: there should be a view for model nested inside a view for collection
	
	// TO DO: abstract localStorage saving function
	
	********************************************************************/
	
	// var TMTP = TMTP || {};
	
	var meas = {};

    var Pattern = Backbone.Model.extend({
        //urlRoot: 'pattern',
		defaults: {
			//"pattern": patternStandard.pattern
        }
    });
	
	var Measurement = Backbone.Model.extend({
		//urlRoot: 'measurement',
		defaults: {
			"clientdata": bodyStandard.clientdata
		}
	});
		
    var patternCollection = Backbone.Collection.extend({
		url: 'patterns',
		model: Pattern
    });
	
	var measurementCollection = Backbone.Collection.extend({
		url: 'measurements',
		model: Measurement
	});
	
	var PatternView = Backbone.View.extend({
		el: 'div.draw-wrapper',
		template: $("#patternsTemplate").html(),
		meas: {}, 
		initialize: function(){
		},
		render: function(){
			var tmpl = _.template(this.template);

			this.$el.empty();
			this.$el.html(tmpl({
				'patterns': patternCollection.models, 
				'customers': customerCollection.models, 
				'parameters': this.meas, 
				'options': patterndraw.settings})
			);
			

			
			if (bodyCurrent && patternCurrent){
				patterndraw.settings.drawArea = document.getElementById("drawing");
				patterndraw.drawpattern(patternCurrent.attributes.pattern,this.meas);			
			}
			
			return this;
		},
		events: {
			'change #patternCustomerSelect': 'patternCustomerSelect',
			'change #patternSelect': 'patternSelect',
			'change input[type=checkbox]': 'optionsToggle',
			'change .parameter': 'parameterChange',
			'click #saveSvg': 'saveSvg'
		},
		patternCustomerSelect: function(e){
			$('#patternCustomerSelect [value=dummy]').attr('disabled','true');
			if (e.currentTarget.value != 'dummy'){
				bodyCurrent = customerCollection.get(e.currentTarget.value);
				this.render();
			}
		},
		patternSelect: function(e){
			if (e.currentTarget.value != 'dummy'){
				patternCurrent = patternCollection.get(e.currentTarget.value);
				// PROVISIONAL: calculate measures from pattern defaults....
				// should instead REQUIRE the listed measures from customer!
				this.meas = {};
				for (var i in patternCurrent.attributes.pattern.defaults){
					this.meas[patternCurrent.attributes.pattern.measurements[i]] = patternCurrent.attributes.pattern.defaults[i];
				}			
				this.render();
			}
		},
		optionsToggle: function(e){
			patterndraw.settings[e.currentTarget.id] = e.currentTarget.checked;
			this.render();
		},
		parameterChange: function(e){
			parameter = e.currentTarget.id;
			this.meas[e.currentTarget.id] = e.currentTarget.value;
			this.render();
		},
		saveSvg: function(e){
			e.preventDefault();
			// implement SVG saving.......
		}
	});
    
	var MeasurementView = Backbone.View.extend({
		el: 'div.draw-wrapper',
		template: $("#measurementTemplate").html(),
		
		initialize: function(){
			this.model = new Measurement();
			bodyCurrent = this.model;
		},
		render: function(){
			var tmpl = _.template(this.template);
			
			this.model = bodyCurrent;

			this.$el.empty();
			this.$el.html(tmpl({'data': this.model, 'title': window.bodyNames, 'customers': customerCollection.models}));
			
			// INPUT VALIDATION
			$('input.numerical').change(function(e){
				if (!isNum(e.target.value)) {
					$(this).parent().addClass('error');
					$(this).attr({
						'data-toggle': "tooltip", 
						'data-original-title': "Input must be numerical",
						'data-placement': "top",
						'data-trigger': "manual"
					}).tooltip('show').focus(function(){
						$(this).tooltip('destroy');
					});
				} else if (!isHum(e.target.value)) {
					$(this).parent().addClass('error');
					$(this).attr({
						'data-toggle': "tooltip", 
						'data-original-title': "Input must be human ;)",
						'data-placement': "top",
						'data-trigger': "manual"
					}).tooltip('show').focus(function(){
						$(this).tooltip('destroy');
					});
				} else {
					$(this).parent().removeClass('error');
					// commas are accepted, but get replaced by dots
					$(this).val($(this).val().replace(',','.'));
				}
			});	
			
			return this;
		},
		events: {
			'click #newMeasurements': 'clearForm',
			'click #saveMeasurements': 'saveData',
			'change #customerSelect': 'selectCustomer'
		},
		clearForm: function(){
			this.model = new Measurement();
			bodyCurrent = this.model;
			this.render();
		},
		saveData: function(e){
			e.preventDefault();
			
			/*************************************************************/
			// First, validate the form			
			var $nameInput = $('input#customername');
			if ($nameInput.val().length == 0) {
				$nameInput.parent().addClass('error');
				$nameInput.attr({
					'data-toggle': "tooltip", 
					'data-original-title': "Please, supply a customer name",
					'data-placement': "bottom",
					'data-trigger': "manual"
				}).tooltip('show').focus(function(){
					$nameInput.tooltip('destroy');
				});
				//return false
			} else {
				$nameInput.parent().removeClass('error');
			}

			if ($('form .error').length > 0){
				$alert = $('#alertSaved');
				$alert.removeClass('alert-success');
				$alert.addClass('alert-error');
				$message = '<b>Ooops!</b> Some values you entered are invalid. Please, correct them before you proceed';
				$alert.html($message).fadeTo(200,1);
				window.setTimeout(function(){$alert.fadeTo(800,0);}, 2000);				
				console.log('error: invalid input...');
				return false;
			}
			/*************************************************************/
			
			console.log('saving data...');
			
			var $name = this.$el.find('#customername').val();
			var $form = this.$el;

			// update the model
			var data = this.model.get('clientdata');
			data.customername = $name;
			data.units = $("input[name=units]:checked").attr('id');
			for (var part in data.measurements){
				for (var j in data.measurements[part]) {
					var newVal = $form.find('#'+j).val();
					data.measurements[part][j] = newVal ? newVal : data.measurements[part][j];
				}
			}
			
			this.model.set({'clientdata': data});
			
			// update the collection
			customerCollection.set(this.model, {remove: false});
			
			bodyCurrent = this.model;

			
			// localStorage
			storageSave('customerList', $name, this.model.attributes);
			
			// HTTP save to server
			this.model.save();

			// re-render view, to update the dropdown menu for measurement selection
			this.render();  			
			
			//// give some feedback when saving measurements:
			$alert = $('#alertSaved');
			$alert.removeClass('alert-error');
			$alert.addClass('alert-success');
			$message = '<b>Great!</b> You just saved measurements for customer: <b>'+$name+'</b>';
			$alert.html($message).fadeTo(200,1);
			window.setTimeout(function(){$alert.fadeTo(800,0);}, 2000);
		},
		selectCustomer: function(e){
			//var body = this.collection.get(e.currentTarget.value);
			bodyCurrent = customerCollection.get(e.currentTarget.value);
			this.model = bodyCurrent;
			this.render();
		}
	});
	
	var PageView = Backbone.View.extend({
		el: 'div.draw-wrapper',
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
            "":				"todoPage",
			"measurements": "measurementsPage",
			"patterns":		"patternsPage",
			"about":		"aboutPage"
        },
        /*urlFilter: function (type) {
            directory.filterType = type;
            directory.trigger("change:filterType");
        },*/
		todoPage: function() {
			$('.nav li.active').toggleClass('active');
			todo.render();  
		},
		measurementsPage: function() {
			$('.nav li.active').toggleClass('active');
			$('#menuMeasurements').toggleClass('active');
			measurementForm.render();  
		},
		patternsPage: function() {
			$('.nav li.active').toggleClass('active');
			$('#menuPatterns').toggleClass('active');
			patterns.render();
		},
		aboutPage: function() {
			$('.nav li.active').toggleClass('active');
			$('#menuAbout').toggleClass('active');
			about.render();  
		},
    });
	
	
	
	// INITIALIZE INSTANCES OF THE CLASSES JUST DEFINED
	
	// MODELS
	var bodyCurrent; // = new Measurement(bodyStandard); 	
	var patternCurrent;
	
	// COLLECTIONS
	var customerCollection = new measurementCollection();
	// FIRST: include defaults in collection
	// customerCollection.add(new Measurement(window.bodyStandard));
	for ( var i in window.defaultMeasurements ){
		//console.log('build measurements collection: defaults: '+window.defaultMeasurements[i].clientdata.customername);
		customerCollection.add(new Measurement(window.defaultMeasurements[i]));
	}
	// SECOND: include measurements from localStorage:
	var customerList = JSON.parse(localStorage.getItem('customerList'));
	if (customerList != undefined){
		for (var i in customerList){
			//console.log('build measurements collection: localStorage: '+customerList[i]);
			customerCollection.add(new Measurement(JSON.parse(localStorage.getItem(customerList[i]))));
		}
	}
	// THIRD: upon authentication, retrieve models from server.......
	
	var patternCollection = new patternCollection();
	// FIRST: include defaults in collection
	for ( var i in window.defaultPatterns ){
		//console.log('build patterns collection: defaults:'+window.defaultPatterns[i].pattern.title);
		patternCollection.add(new Measurement(window.defaultPatterns[i]));
	}
	
	
	// VIEWS
    var todo = new PageView();
    todo.template = $("#todoTemplate").html();
	
    var measurementForm = new MeasurementView();
	
    var patterns = new PatternView();
	
	var about = new PageView();
	about.template = $("#aboutTemplate").html();
	
    var taumetataurouter = new TauMetaTauRouter();
    
    Backbone.history.start();
	
	
	/********************************************************************
	END BACKBONE
	********************************************************************/
	
	// Form Validation
	
	var isNum = function(n){
        reNum = new RegExp(/^(\d+((\.|,)\d+)?)?$/);
        return reNum.test(n);
    }
	
	var isHum = function(n){
		var i = parseFloat(n);
		return ( i >= 0 && i < 1000 );
	}
	
	// localStorage utility functions
	
	var storageList = function(listName){
		if (!window.localStorage.getItem(listName))	window.localStorage.setItem(listName, '[]');
		return JSON.parse(window.localStorage.getItem(listName));
	}
	
	var storageSave = function(listName, key, value){
		var list = storageList(listName);
		if (list.indexOf(key) < 0) list.push(key);
		window.localStorage.setItem(listName, JSON.stringify(list));
		window.localStorage.setItem(key, JSON.stringify(value));
	}
	
//} (jQuery));