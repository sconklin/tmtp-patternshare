
	/********************************************************************
	START BACKBONE
	
	// TO DO: everytime localStorage is used, Backbone.sync should be called simultaneously
	
	********************************************************************/
	
	var TMTP = TMTP || {};
	
    TMTP.Pattern = Backbone.Model.extend({
        urlRoot: 'pattern',
		defaults: {
			"pattern": patternStandard.pattern
        }
    });
	
	TMTP.Measurement = Backbone.Model.extend({
		urlRoot: 'measurement',
		defaults: {
			"clientdata": bodyStandard.clientdata
		}
	});
		
    TMTP.PatternCollection = Backbone.Collection.extend({
		url: 'patterns',
		model: TMTP.Pattern
    });
	
	TMTP.MeasurementCollection = Backbone.Collection.extend({
		url: 'measurements',
		model: TMTP.Measurement
	});
	
	TMTP.PatternView = Backbone.View.extend({
		el: 'div#wrapper',
		template: $("#patternsTemplate").html(),
		initialize: function(){
			this.renderView = new TMTP.PatternRenderView();
		},
		render: function(){
			var tmpl = _.template(this.template);
			
			if (localStorage.getItem('patterndrawSettings')){
				patterndraw.init(JSON.parse(localStorage.getItem('patterndrawSettings')));
			}
			
			this.$el.empty();
			this.$el.html(tmpl({
				'patterns': TMTP.patternCollection.models, 
				'customers': TMTP.customerCollection.models, 
				'options': patterndraw.settings})
			);
			
			if (TMTP.patternCurrent) this.renderPat();
			
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
				TMTP.bodyCurrent = TMTP.customerCollection.get(e.currentTarget.value);
			} else {
				TMTP.bodyCurrent = null;
			}
			this.renderPat();
		},
		patternSelect: function(e){
			if (e.currentTarget.value != 'dummy'){
				TMTP.patternCurrent = TMTP.patternCollection.get(e.currentTarget.value);
			}
			this.renderPat();
		},
		optionsToggle: function(e){
			patterndraw.settings[e.currentTarget.id] = e.currentTarget.checked;
			patterndraw.settings.drawArea = null; // strange, only to avoid circular definition when stringifying into localStorage
			TMTP.storageSave('patterndrawSettings', patterndraw.settings);
			if (TMTP.patternCurrent) this.renderView.draw();
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
    
	TMTP.PatternRenderView = Backbone.View.extend({
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
			if(!TMTP.patternCurrent) return;
			
			// 2. retrieve measurements
			if(TMTP.bodyCurrent){
				for (var i in TMTP.patternCurrent.attributes.pattern.measurements){
					this.meas[i] = TMTP.bodyCurrent.attributes.clientdata.measurements[i];
					if (this.meas[i]  == '') this.missing[i] = true;
				}
			} else {
				this.meas = _.clone(TMTP.patternCurrent.attributes.pattern.measurements);
			}
			
			// 4. retrieve parameters
			for (var i in TMTP.patternCurrent.attributes.pattern.parameters){
				this.meas[i] = TMTP.patternCurrent.attributes.pattern.parameters[i]; 
			}
			
			// 5. render the parameter sliders
			this.$el.empty();
			this.$el.html(tmpl({'parameters': this.meas, 'title': window.bodyNames}));
			
			// 6. abort pattern rendering if ther are missing measurements
			if (_.size(this.missing) > 0){
				$('#alert').fadeTo(200,1);
				TMTP.measurementView.missing = this.missing;
				return;
			}			
			
			// 7. if everything was ok: then, draw the shapes
			this.draw();
			
			return this;
		},
		draw: function(){
			patterndraw.settings.drawArea = document.getElementById("drawing");
			patterndraw.drawpattern(TMTP.patternCurrent.attributes.pattern,this.meas);			
		}
	});
    
	TMTP.MeasurementView = Backbone.View.extend({
		el: 'div#wrapper',
		template: $("#measurementTemplate").html(),
		missing: {},
		initialize: function(){
			this.measForm = new TMTP.MeasurementFormView();
		},
		render: function(){
			var tmpl = _.template(this.template);
			
			this.$el.empty();
			this.$el.html(tmpl({'customers': TMTP.customerCollection.models}));
			
			if (TMTP.bodyCurrent)this.renderForm();
			
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
			var data = TMTP.bodyCurrent.get('clientdata');
			data.customername = this.$el.find('#customername').val();
			data.units = this.$el.find("input[name=units]:checked").attr('id');
			for (var j in data.measurements) {
				var newVal = this.$el.find('#'+j).val();
				data.measurements[j] = newVal ? newVal : data.measurements[j];
			}
			
			TMTP.bodyCurrent.set({'clientdata':data});	
			
					
			// update the collection
			TMTP.customerCollection.set(TMTP.bodyCurrent, {remove: false});
			
			// localStorage
			TMTP.storageSaveToList('customerList', data.customername, TMTP.bodyCurrent.attributes);
			
			// HTTP save to server
			TMTP.bodyCurrent.save();

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
			TMTP.customerCollection.remove(TMTP.bodyCurrent);
			
			// localStorage
			TMTP.storageDeleteFromList('customerList', TMTP.bodyCurrent.attributes.clientdata.customername);
			
			// HTTP delete from server...

			// re-render view, to update the dropdown menu for measurement selection
			var $name = TMTP.bodyCurrent.attributes.clientdata.customername;
			this.missing = {};
			TMTP.bodyCurrent = new TMTP.Measurement({'clientdata': _.clone(bodyStandard.clientdata)});
			this.render();
			
			//// give some feedback when saving measurements:
			$('#alert').removeClass('alert-error').addClass('alert-success')
				.html('You successfully deleted measurements for customer: <b>'+$name+'</b>')
				.fadeTo(200,1).delay(2000).fadeTo(800,0);
		},
		clearForm: function(e){
			e.preventDefault();
			TMTP.bodyCurrent = new TMTP.Measurement({'clientdata': _.clone(bodyStandard.clientdata)});
			this.render();
		},
		selectCustomer: function(e){
			if (e.currentTarget.value != 'dummy'){
				TMTP.bodyCurrent = TMTP.customerCollection.get(e.currentTarget.value);
				this.missing = {};
				this.render();
			}
		}
	});
	
	TMTP.MeasurementFormView = Backbone.View.extend({
		template: $("#measurementFormTemplate").html(),
		initialize: function(){
		},
		render: function(){
			var tmpl = _.template(this.template);
			
			this.$el.empty();
			this.$el.html(tmpl({'data': TMTP.bodyCurrent, 'title': window.bodyNames, missing: this.missing}));
			
			// CLIENT-SIDE INPUT VALIDATION
			$('input.numerical').change(function(e){
				if (!TMTP.isNum(e.target.value)) {
					$(this).parent().addClass('error');
					$(this).attr({'data-original-title': "Input must be numerical"})
						.tooltip('show').focus(function(){
							$(this).tooltip('destroy');
						});
				} else if (!TMTP.isHum(e.target.value)) {
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
	
	TMTP.PageView = Backbone.View.extend({
		el: 'div#wrapper',
		render: function(){
			
			var tmpl = _.template(this.template);

			this.$el.empty();
			this.$el.html(tmpl());
			
			return this;
		}
	});
	
    TMTP.TauMetaTauRouter = Backbone.Router.extend({
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
			TMTP.todo.render();  
		},
		measurementsPage: function() {
			$('.nav li.active').toggleClass('active');
			$('#menuMeasurements').toggleClass('active');
			TMTP.measurementView.render();  
		},
		patternsPage: function() {
			$('.nav li.active').toggleClass('active');
			$('#menuPatterns').toggleClass('active');
			TMTP.patterns.render();
		},
		aboutPage: function() {
			$('.nav li.active').toggleClass('active');
			$('#menuAbout').toggleClass('active');
			TMTP.about.render();  
		},
    });
	
	
//  INITIALIZE INSTANCES OF THE CLASSES JUST DEFINED

//  MODELS
	TMTP.bodyCurrent = null;  	
	TMTP.patternCurrent = null;
	
	
//  COLLECTIONS
	TMTP.customerCollection = new TMTP.MeasurementCollection();
	// FIRST: include defaults in collection
	for ( var i in window.defaultMeasurements ){
		TMTP.customerCollection.add(new TMTP.Measurement(window.defaultMeasurements[i]));
	}
	// SECOND: include measurements from localStorage:
	TMTP.customerList = JSON.parse(localStorage.getItem('customerList'));
	if (TMTP.customerList != undefined){
		for (var i in TMTP.customerList){
			TMTP.customerCollection.add(new TMTP.Measurement(JSON.parse(localStorage.getItem(TMTP.customerList[i]))));
		}
	}
	// THIRD: upon authentication, retrieve models from server.......
	

	TMTP.patternCollection = new TMTP.PatternCollection();
	// FIRST: include defaults in collection
	for ( var i in window.defaultPatterns ){
		TMTP.patternCollection.add(new TMTP.Measurement(window.defaultPatterns[i]));
	}
	
	
//  VIEWS
    TMTP.todo = new TMTP.PageView();
    TMTP.todo.template = $("#todoTemplate").html();
	
    TMTP.measurementView = new TMTP.MeasurementView();
	
    TMTP.patterns = new TMTP.PatternView();
	
	TMTP.about = new TMTP.PageView();
	TMTP.about.template = $("#aboutTemplate").html();
	
//  ROUTER	
    TMTP.taumetataurouter = new TMTP.TauMetaTauRouter();
    
    Backbone.history.start();
	
	/********************************************************************
	END BACKBONE
	********************************************************************/
	
	// Form Validation
	
	TMTP.isNum = function(n){
        var reNum = new RegExp(/^(\d+((\.|,)\d+)?)?$/);
        return reNum.test(n);
    }
	
	TMTP.isHum = function(n){
		var i = parseFloat(n);
		return ( i >= 0 && i < 1000 );
	}
	
	// localStorage utility functions
	
	TMTP.storageList = function(listName){
		return JSON.parse(window.localStorage.getItem(listName)) || [];
	}
	
	TMTP.storageSave = function(key, value){
		window.localStorage.setItem(key, JSON.stringify(value));
	}
	
	TMTP.storageDelete = function(key){
		window.localStorage.removeItem(key);
	}
	
	TMTP.storageSaveToList = function(listName, key, value){
		var list = TMTP.storageList(listName);
		list = _.union(list,[key]);
		TMTP.storageSave(listName, list);
		TMTP.storageSave(key, value);
	}
	
	TMTP.storageDeleteFromList = function(listName, key){
		var list = TMTP.storageList(listName);
		list = _.without(list,key);
		TMTP.storageSave(listName, list);
		TMTP.storageDelete(key);
	}