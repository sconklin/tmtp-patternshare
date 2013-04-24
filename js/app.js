//(function ($) {    // Commented out for development purposes only, remove for production

	/********************************************************************
	START BACKBONE
	
	// TO DO: everytime localStorage is used, Backbone.sync should be called simultaneously
	
	********************************************************************/
	
	// var TMTP = TMTP || {};

    var Pattern = Backbone.Model.extend({
        //urlRoot: 'pattern',
		defaults: {
			"pattern": patternStandard.pattern
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
		el: 'div#wrapper',
		template: $("#patternsTemplate").html(),
		initialize: function(){
			this.renderView = new PatternRenderView();
		},
		render: function(){
			var tmpl = _.template(this.template);
			
			if (localStorage.getItem('patterndrawSettings')){
				console.log('loading saved settings');
				patterndraw.init(JSON.parse(localStorage.getItem('patterndrawSettings')));
			}
			
			this.$el.empty();
			this.$el.html(tmpl({
				'patterns': patternCollection.models, 
				'customers': customerCollection.models, 
				'options': patterndraw.settings})
			);
			
			if (patternCurrent) this.renderPat();
			
			return this;
		},
		renderPat: function(){
			this.renderView.$el = $('#stage');
			this.renderView.render();
		},
		events: {
			'change #patternCustomerSelect': 'patternCustomerSelect',
			'change #patternSelect': 'patternSelect',
			'change input[type=checkbox]': 'optionsToggle',
			'change .parameter': 'parameterChange',
			'click #saveSvg': 'saveSvg'
		},
		patternCustomerSelect: function(e){
			if (e.currentTarget.value != 'dummy' ){
				bodyCurrent = customerCollection.get(e.currentTarget.value);
			} else {
				bodyCurrent = null;
			}
			this.renderPat();
		},
		patternSelect: function(e){
			if (e.currentTarget.value != 'dummy'){
				patternCurrent = patternCollection.get(e.currentTarget.value);
			}
			this.renderPat();
		},
		optionsToggle: function(e){
			patterndraw.settings[e.currentTarget.id] = e.currentTarget.checked;
			patterndraw.settings.drawArea = null;
			storageSave('patterndrawSettings', patterndraw.settings);
			console.log('settings saved');
			if (patternCurrent) this.renderView.draw();
		},
		parameterChange: function(e){
			this.renderView.meas[e.currentTarget.id] = e.currentTarget.value;
			this.renderView.draw();
		},
		saveSvg: function(e){
			e.preventDefault();
			// implement SVG saving.......
		}
	});
    
	var PatternRenderView = Backbone.View.extend({
		template: $("#patternsRenderTemplate").html(),
		initialize: function(){
			this.meas = {};
			this.missing = {};
		},
		render: function(){
			var tmpl = _.template(this.template);
			
			// 1. reset missing measurements
			$('#alert').fadeTo(20,0);
			this.missing = {};
			this.meas = {};
			
			// 2. retrieve measurements
			for (var i in patternCurrent.attributes.pattern.measurements){
				if (bodyCurrent) {
					this.meas[i] = bodyCurrent.attributes.clientdata.measurements[i]; 
					if (this.meas[i] == '') this.missing[i] = true;
				} else {
					this.meas[i] = JSON.parse(JSON.stringify(patternCurrent.attributes.pattern.measurements[i]));
				}
			}
			
			// 4. retrieve parameters
			for (var i in patternCurrent.attributes.pattern.parameters){
				this.meas[i] = patternCurrent.attributes.pattern.parameters[i]; 
			}
			
			// 5. render the parameter sliders
			this.$el.empty();
			this.$el.html(tmpl({'parameters': this.meas}));
			
			// 6. abort pattern rendering if ther are missing measurements
			if (_.size(this.missing) > 0){
				$('#alert').fadeTo(200,1);
				measurementForm.missing = this.missing;
				return;
			}			
			
			// 7. if everything was ok: then, draw the shapes
			this.draw();
			
			return this;
		},
		draw: function(){
			patterndraw.settings.drawArea = document.getElementById("drawing");
			patterndraw.drawpattern(patternCurrent.attributes.pattern,this.meas);			
		}
	});
    
	var MeasurementView = Backbone.View.extend({
		el: 'div#wrapper',
		template: $("#measurementTemplate").html(),
		missing: {},
		initialize: function(){
			this.measForm = new MeasurementFormView();
		},
		render: function(){
			var tmpl = _.template(this.template);
			
			this.model = bodyCurrent;

			this.$el.empty();
			this.$el.html(tmpl({'customers': customerCollection.models}));
			
			if (bodyCurrent) this.renderForm();
			
			return this;
		},
		renderForm: function(){
			this.measForm.$el = $('#drawarea');
			this.measForm.missing = this.missing;
			this.measForm.render();
		},
		events: {
			'click #saveMeasurements': 'saveData',
			'click #newMeasurements': 'clearForm',
			'change #customerSelect': 'selectCustomer'
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
				$alert = $('#alert');
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
			var $units = this.$el.find("input[name=units]:checked").attr('id')
			var $form = this.$el;

			// update the model
			var data = this.model.get('clientdata');
			data.customername = $name;
			data.units = $units;
			for (var j in data.measurements) {
				var newVal = $form.find('#'+j).val();
				data.measurements[j] = newVal ? newVal : data.measurements[j];
			}
			
			this.model.set({'clientdata': data});
			
			// update the collection
			customerCollection.set(this.model, {remove: false});
			
			bodyCurrent = this.model;

			
			// localStorage
			storageSaveToList('customerList', $name, this.model.attributes);
			
			// HTTP save to server
			this.model.save();

			// re-render view, to update the dropdown menu for measurement selection
			this.missing = {};
			this.render();  			
			
			//// give some feedback when saving measurements:
			$alert = $('#alert');
			$alert.removeClass('alert-error');
			$alert.addClass('alert-success');
			$message = '<b>Great!</b> You just saved measurements for customer: <b>'+$name+'</b>';
			$alert.html($message).fadeTo(200,1);
			window.setTimeout(function(){$alert.fadeTo(800,0);}, 2000);
		},
		clearForm: function(e){
			e.preventDefault();
			this.model = new Measurement();
			bodyCurrent = this.model;
			this.render();
		},
		selectCustomer: function(e){
			if (e.currentTarget.value != 'dummy'){
				this.model = customerCollection.get(e.currentTarget.value);
				bodyCurrent = this.model;
				//this.missing = {};
				this.render();
			}
		}
	});
	
	var MeasurementFormView = Backbone.View.extend({
		template: $("#measurementFormTemplate").html(),
		initialize: function(){
		},
		render: function(){
			var tmpl = _.template(this.template);
			
			this.model = bodyCurrent;

			this.$el.empty();
			this.$el.html(tmpl({'data': this.model, 'title': window.bodyNames, missing: this.missing}));
			
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
			
			//MISSING MEASUREMENT
			$('input.missing').each(function(e){
				$(this).parent().addClass('error');
				$(this).attr({
					'data-toggle': "tooltip", 
					'data-original-title': "Missing input",
					'data-placement': "top",
					'data-trigger': "manual"
				}).tooltip('show').focus(function(){
					$(this).tooltip('destroy');
				});
			});	
			
			// REARRANGE FORM... ???
			
			return this;
		}	
	});
	
	var PageView = Backbone.View.extend({
		el: 'div#wrapper',
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
	
	var storageSave = function(key, value){
		window.localStorage.setItem(key, JSON.stringify(value));
	}
	
	var storageSaveToList = function(listName, key, value){
		var list = storageList(listName);
		if (list.indexOf(key) < 0) list.push(key);
		storageSave(listName, list);
		storageSave(key, value);
	}
	
	
	
//} (jQuery));