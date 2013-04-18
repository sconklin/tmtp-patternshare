//(function ($) {    // Commented out for development purposes only, remove for production

	var patternCurrent;
  	// this is wrong, the Current Body should reference a model 
										// from within a collection, not a plain object...    we'll get there

    var Pattern = Backbone.Model.extend({
        urlRoot: 'pattern',
		defaults: {
            name: ''
        }
    });
	
	var Measurement = Backbone.Model.extend({
		urlRoot: 'measurement',
		defaults: {
			"clientdata": bodyStandard.clientdata,
			"name": ""
		}
	});
		
    var Book = Backbone.Collection.extend({
		model: Pattern
    });
	
	var Bodies = Backbone.Collection.extend({
		model: Measurement
	});
	
	var PatternView = Backbone.View.extend({});
    
	var MeasurementView = Backbone.View.extend({
		el: 'div.draw-wrapper',
		template: $("#measurementTemplate").html(),
		
		initialize: function(){
			this.model = new Measurement();

			// build collection of measurements from localStorage
			var customerList = JSON.parse(localStorage.getItem('customerList'));
			var models = [];
			for (var i in customerList){
				models.push(JSON.parse(localStorage.getItem(customerList[i])));
			}
			this.collection = new Bodies(models);
		},
		render: function(data){
			// TO DO: for listing, render shouldn't reference localStorage but the view's collection instead
			var customers = JSON.parse(localStorage.getItem('customerList'));
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
			
			// update the model
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
						
			// localStorage create/update the customer list
			var customerList = localStorage.getItem('customerList') ? JSON.parse(localStorage.getItem('customerList')) : [];
			if (customerList.indexOf(model.get('name'))<0) customerList.push(model.get('name'));
			localStorage.setItem('customerList',JSON.stringify(customerList));
			// localStorage create/update the measurement
			localStorage.setItem(model.get('name'),JSON.stringify(model));
			
			// HTTP save to server
			// model.save();

			// re-render view, to update the dropdown menu for measurement selection
			this.render(model.attributes.clientdata);  			
			
			//// give some feedback when saving measurements:
			$alert = $('#alertSaved');
			$message = '<b>Hooray!</b> You just saved measurements for customer: <b>'+model.get('name')+'</b>';
			$alert.html($message).fadeTo(200,1);
			window.setTimeout(function(){$alert.fadeTo(800,0);}, 2000);
		},
		selectCustomer: function(e){
			currentCustomer = e.currentTarget.value;
			// TO DO: bodyCurrent should be drawn from the view's collection
			bodyCurrent = new Measurement(JSON.parse(localStorage.getItem(currentCustomer)));
			// TO DO: bodyCurrent should reference a model inside the view's collection, not create a new one
			this.render(bodyCurrent.get('clientdata'));
		}
	});
	
	var PageView = Backbone.View.extend({
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
			measurements.render(bodyCurrent.get('clientdata'));  
		},
		patternsPage: function() {
			patterns.render();  
		},
		aboutPage: function() {
			about.render();  
		},
    });
    
	var bodyCurrent = new Measurement(bodyStandard); 	
	
    var todo = new PageView();
    todo.template = $("#todoTemplate").html();
	
    var measurements = new MeasurementView();
	
//// PATTERNS WILL GET THEIR OWN VIEW, 
    var patterns = new PageView();
    patterns.template = $("#patternsTemplate").html();
//// PATTERNS WILL GET THEIR OWN VIEW,
	
	var about = new PageView();
	about.template = $("#aboutTemplate").html();
	
    var taumetarouter = new TauMetaTauRouter();
    
    Backbone.history.start();
	
//} (jQuery));