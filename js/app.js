//(function ($) {   

	/********************************************************************
	START BACKBONE
	
	// TO DO: everytime localStorage is used, Backbone.sync should be called simultaneously
	
	********************************************************************/
	
    var Pattern = Backbone.Model.extend({
        urlRoot: 'pattern',
		defaults: {
			"pattern": patternStandard.pattern
        }
    });
	
	var Measurement = Backbone.Model.extend({
		urlRoot: 'measurement',
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
			'change input.parameter': 'parameterChange',
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
			patterndraw.settings.drawArea = null; // strange, only to avoid circular definition when stringifying into localStorage
			storageSave('patterndrawSettings', patterndraw.settings);
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
			if(bodyCurrent){
				for (var i in patternCurrent.attributes.pattern.measurements){
					this.meas[i] = bodyCurrent.attributes.clientdata.measurements[i];
					if (this.meas[i]  == '') this.missing[i] = true;
				}
			} else {
				this.meas = _.clone(patternCurrent.attributes.pattern.measurements);
			}
			
			// 4. retrieve parameters
			for (var i in patternCurrent.attributes.pattern.parameters){
				this.meas[i] = patternCurrent.attributes.pattern.parameters[i]; 
			}
			
			// 5. render the parameter sliders
			this.$el.empty();
			this.$el.html(tmpl({'parameters': this.meas, 'title': window.bodyNames}));
			
			// 6. abort pattern rendering if ther are missing measurements
			if (_.size(this.missing) > 0){
				$('#alert').fadeTo(200,1);
				measurementView.missing = this.missing;
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
			
			this.$el.empty();
			this.$el.html(tmpl({'customers': customerCollection.models}));
			
			if (bodyCurrent)this.renderForm();
			
			return this;
		},
		renderForm: function(){
			this.measForm.$el = $('#drawarea');
			this.measForm.missing = this.missing;
			this.measForm.render();
		},
		events: {
			'click #saveMeasurements': 'saveData',
			'click #deleteMeasurements': 'deleteData',
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
				$nameInput.attr({'data-original-title': "Please, supply a valid customer name"})
					.tooltip('show').focus(function(){
						$nameInput.tooltip('destroy');
					});
			} else {
				$nameInput.parent().removeClass('error');
			}

			if ($('form .error').length > 0){
				$('#alert').removeClass('alert-success').addClass('alert-error')
					.html('<b>Ooops!</b> Some values you entered are invalid. Please, correct them before you proceed')
					.fadeTo(200,1).delay(2000).fadeTo(800,0);
				return false;
			}
			/*************************************************************/
			
			console.log('saving data...');

			// update the model
			var data = bodyCurrent.get('clientdata');
			data.customername = this.$el.find('#customername').val();
			data.units = this.$el.find("input[name=units]:checked").attr('id');
			for (var j in data.measurements) {
				var newVal = this.$el.find('#'+j).val();
				data.measurements[j] = newVal ? newVal : data.measurements[j];
			}
			
			bodyCurrent.set({'clientdata':data});	
			
					
			// update the collection
			customerCollection.set(bodyCurrent, {remove: false});
			
			// localStorage
			storageSaveToList('customerList', data.customername, bodyCurrent.attributes);
			
			// HTTP save to server
			bodyCurrent.save();

			// re-render view, to update the dropdown menu for measurement selection
			this.missing = {};
			this.render();  			
			
			//// give some feedback when saving measurements:
			$('#alert').removeClass('alert-error').addClass('alert-success')
				.html('<b>Great!</b> You just saved measurements for customer: <b>'+data.customername+'</b>')
				.fadeTo(200,1).delay(2000).fadeTo(800,0);
		},
		deleteData: function(e){
			e.preventDefault();

			// update the collection
			customerCollection.remove(bodyCurrent);
			
			// localStorage
			storageDeleteFromList('customerList', bodyCurrent.attributes.clientdata.customername);
			
			// HTTP delete from server...

			// re-render view, to update the dropdown menu for measurement selection
			var $name = bodyCurrent.attributes.clientdata.customername;
			this.missing = {};
			bodyCurrent = new Measurement({'clientdata': JSON.parse(JSON.stringify(bodyStandard.clientdata))});
			this.render();
			
			//// give some feedback when saving measurements:
			$('#alert').removeClass('alert-error').addClass('alert-success')
				.html('You successfully deleted measurements for customer: <b>'+$name+'</b>')
				.fadeTo(200,1).delay(2000).fadeTo(800,0);
		},
		clearForm: function(e){
			e.preventDefault();
			bodyCurrent = new Measurement({'clientdata': JSON.parse(JSON.stringify(bodyStandard.clientdata))});
			this.render();
		},
		selectCustomer: function(e){
			if (e.currentTarget.value != 'dummy'){
				bodyCurrent = customerCollection.get(e.currentTarget.value);
				this.missing = {};
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
			
			this.$el.empty();
			this.$el.html(tmpl({'data': bodyCurrent, 'title': window.bodyNames, missing: this.missing}));
			
			// CLIENT-SIDE INPUT VALIDATION
			$('input.numerical').change(function(e){
				if (!isNum(e.target.value)) {
					$(this).parent().addClass('error');
					$(this).attr({'data-original-title': "Input must be numerical"})
						.tooltip('show').focus(function(){
							$(this).tooltip('destroy');
						});
				} else if (!isHum(e.target.value)) {
					$(this).parent().addClass('error');
					$(this).attr({'data-original-title': "Input must be human ;)"})
						.tooltip('show').focus(function(){
							$(this).tooltip('destroy');
						});
				} else {
					$(this).parent().removeClass('error');
					// commas are accepted, but get replaced by dots
					$(this).val($(this).val().replace(',','.'));
				}
			});	
			
			// MARK MISSING MEASUREMENTS
			$('input.missing').each(function(e){
				$(this).parent().addClass('error');
				$(this).attr({'data-original-title': "Missing input"})
					.tooltip('show').focus(function(){
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
			measurementView.render();  
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
	
	
//  INITIALIZE INSTANCES OF THE CLASSES JUST DEFINED

//  MODELS
	var bodyCurrent;  	
	var patternCurrent;
	
	
//  COLLECTIONS
	var customerCollection = new measurementCollection();
	// FIRST: include defaults in collection
	for ( var i in window.defaultMeasurements ){
		customerCollection.add(new Measurement(window.defaultMeasurements[i]));
	}
	// SECOND: include measurements from localStorage:
	var customerList = JSON.parse(localStorage.getItem('customerList'));
	if (customerList != undefined){
		for (var i in customerList){
			customerCollection.add(new Measurement(JSON.parse(localStorage.getItem(customerList[i]))));
		}
	}
	// THIRD: upon authentication, retrieve models from server.......
	

	var patternCollection = new patternCollection();
	// FIRST: include defaults in collection
	for ( var i in window.defaultPatterns ){
		patternCollection.add(new Measurement(window.defaultPatterns[i]));
	}
	
	
//  VIEWS
    var todo = new PageView();
    todo.template = $("#todoTemplate").html();
	
    var measurementView = new MeasurementView();
	
    var patterns = new PatternView();
	
	var about = new PageView();
	about.template = $("#aboutTemplate").html();
	
//  ROUTER	
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
		return JSON.parse(window.localStorage.getItem(listName)) || [];
	}
	
	var storageSave = function(key, value){
		window.localStorage.setItem(key, JSON.stringify(value));
	}
	
	var storageDelete = function(key){
		window.localStorage.removeItem(key);
	}
	
	var storageSaveToList = function(listName, key, value){
		var list = storageList(listName);
		list = _.union(list,[key]);
		storageSave(listName, list);
		storageSave(key, value);
	}
	
	var storageDeleteFromList = function(listName, key){
		var list = storageList(listName);
		list = _.without(list,key);
		storageSave(listName, list);
		storageDelete(key);
	}
	
//} (jQuery));