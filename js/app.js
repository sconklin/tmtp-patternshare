//(function ($) {    // Commented out for development purposes only, remove for production

	/********************************************************************
	START BACKBONE
	
	// TO DO: everytime localStorage is used, Backbone.sync should be called simultaneously
	
	// TO DO: MeasurementView is wrong: there should be a view for model nested inside a view for collection
	
	// TO DO: abstract localStorage saving function
	
	********************************************************************/

	var patternCurrent;

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
		
    var Book = Backbone.Collection.extend({
		model: Pattern
    });
	
	var Bodies = Backbone.Collection.extend({
		model: Measurement
	});
	
	var PatternView = Backbone.View.extend({
		el: 'div.draw-wrapper',
		template: $("#patternsTemplate").html(),
		
		initialize: function(){
			// TO DO: this list is currently only built from static variables residing in app-patterns.js
			// in the future, it will ALSO be built from server or local memory collections of patterns

			var models = [];
			for (var i in defaultPatterns){
				models.push(new Pattern(defaultPatterns[i]));
			}
			this.collection = new Book(models);
		},
		render: function(){
			patternCurrent = null;
			bodyCurrent = null;

			// ??? TO DO: for listing, render shouldn't reference localStorage but the view's collection instead
			// perhaps, the measurement collection should be built first, independently of views, 
			// and then assigned to the measurements view??? 
			var customers = JSON.parse(localStorage.getItem('customerList'));
			var patternList = this.collection.models;
			var tmpl = _.template(this.template);

			this.$el.empty();
			this.$el.html(tmpl({'patternList': patternList, 'customers': customers}));
			
			return this;
		},
		events: {
			'change #patternCustomerSelect': 'selectionMade',
			'change #patternSelect': 'selectionMade'
		},
		selectionMade: function(){
			console.log('selection made');
		}
	});
    
	var MeasurementView = Backbone.View.extend({
		el: 'div.draw-wrapper',
		template: $("#measurementTemplate").html(),
		
		initialize: function(){
			// insert defaults into localStorage if not included...
			
			/*************************************************************************/
			// TO DO: this is wrong! the collection should first include the defaults
			// and then check if there is anything available in localstorage or server!!!!
			for (var i in defaultMeasurements){
				localStorage.setItem(
					defaultMeasurements[i].clientdata.customername, 
					JSON.stringify(defaultMeasurements[i]));
				var customerList = localStorage.getItem('customerList') ? JSON.parse(localStorage.getItem('customerList')) : [];
				if (customerList.indexOf(defaultMeasurements[i].clientdata.customername)<0) {
					customerList.push(defaultMeasurements[i].clientdata.customername);
				}
				localStorage.setItem('customerList',JSON.stringify(customerList));
			}
			// build collection of measurements from localStorage 
			var customerList = JSON.parse(localStorage.getItem('customerList'));
			var models = [];
			for (var i in customerList){
				models.push(JSON.parse(localStorage.getItem(customerList[i])));
			}
			this.collection = new Bodies(models);
			
			/*****************************************************************/
		},
		render: function(data){
			var customers = this.collection.models;
			var tmpl = _.template(this.template);

			this.$el.empty();
			this.$el.html(tmpl({'data': data, 'name': data.customername, 'customers': customers}));
			
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
				}
			});	
			
			return this;
		},
		events: {
			'click #saveMeasurements': 'saveData',
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
			
			if ( JSON.parse(localStorage.getItem('customerList')).indexOf($name) >= 0){
				console.log('already exists');
				var model = bodyCurrent;
			} else {
				console.log('new user');
				var model = new Measurement();
				console.log(model);
			}

			var $form = this.$el;
			
			// update the model
			// model.set('name', this.$el.find('#customername').val());
			model.get('clientdata').customername = $name;
			model.get('clientdata').units = $("input[name=units]:checked").attr('id');
			var measurements = model.get('clientdata').measurements;
			for (var part in measurements){
				for (var j in measurements[part]) {
					var newVal = $form.find('#'+j).val();
					measurements[part][j].val = newVal ? newVal : measurements[part][j].val;
				}
			}
			
			// update the collection.............. UGLY SOLUTION ?????????
			if ( JSON.parse(localStorage.getItem('customerList')).indexOf($name) < 0){
				console.log('add new model to collection');
				this.collection.push(model);
				bodyCurrent = this.collection.get(model);
			}
				
			// ABSTRACT THIS		
			// localStorage create/update the customer list
			var customerList = localStorage.getItem('customerList') ? JSON.parse(localStorage.getItem('customerList')) : [];
			if (customerList.indexOf($name)<0) customerList.push($name);
			localStorage.setItem('customerList',JSON.stringify(customerList));

			// localStorage create/update the measurement
			localStorage.setItem($name,JSON.stringify(model));
			
			// HTTP save to server
			// model.save();

			// re-render view, to update the dropdown menu for measurement selection
			this.render(bodyCurrent.get('clientdata'));  			
			
			//// give some feedback when saving measurements:
			$alert = $('#alertSaved');
			$alert.removeClass('alert-error');
			$alert.addClass('alert-success');
			$message = '<b>Hooray!</b> You just saved measurements for customer: <b>'+$name+'</b>';
			$alert.html($message).fadeTo(200,1);
			window.setTimeout(function(){$alert.fadeTo(800,0);}, 2000);
		},
		selectCustomer: function(e){
			bodyCurrent = this.collection.get(e.currentTarget.value);
			this.render(bodyCurrent.get('clientdata'));
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
        urlFilter: function (type) {
            directory.filterType = type;
            directory.trigger("change:filterType");
        },
		todoPage: function() {
			todo.render();  
		},
		measurementsPage: function() {
			measurements.render(bodyStandard.clientdata);  
		},
		patternsPage: function() {
			patterns.render();  
		},
		aboutPage: function() {
			about.render();  
		},
    });
    
	
	// INITIALIZE INSTANCES OF THE CLASSES JUST DEFINED
	
	// MODEL
	var bodyCurrent = new Measurement(bodyStandard); 	
	
	// COLLECTIONS
	// pattern collection
	// measurement collection	
	
	// VIEWS
    var todo = new PageView();
    todo.template = $("#todoTemplate").html();
	
    var measurements = new MeasurementView();
	
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
        reNum = new RegExp(/^\d+((\.|,)\d+)?$/);
        return reNum.test(n);
    }
	
	var isHum = function(n){
		var i = parseFloat(n);
		return ( i > 0 && i < 1000 );
	}
	
//} (jQuery));