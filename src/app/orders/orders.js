angular.module('orderCloud')
	.config(OrderConfig)
	.controller('OrderCtrl',OrderController);

function OrderConfig($stateProvider,buyerid) {
	$stateProvider.state('orders', {
		parent:'base',
		templateUrl:'orders/templates/orders.tpl.html',
		controller:'OrderCtrl',
		controllerAs:'orders',
		url:'/orders?from&to&search&page&pageSize&searchOn&sortBy&filter&buyerid',
		data:{componentName:'Orders'},
		resolve: {
			Parameters: function($stateParams,OrderCloudParameters) {
				return OrderCloudParameters.Get($stateParams);
			},
			Orders: function(OrderCloud,Parameters) {
				var f = JSON.parse(Parameters.filter);
				return OrderCloud.Orders.ListOutgoing(Parameters.from,Parameters.to,Parameters.search,Parameters.page,Parameters.pageSize || 20,Parameters.searchOn,Parameters.sortBy,f,buyerid);
			}
		}
	});
}

function OrderController($state, $sce, $ocMedia, OrderCloud, OrderCloudParameters, Orders, Parameters, buyerid) {
	var vm = this;
	vm.filterParam = JSON.parse(Parameters.filter);
	vm.xpType = vm.filterParam["xp.Type"];
	vm.list = Orders;
	vm.parameters = Parameters;
	vm.sortSelection = Parameters.sortBy ? (Parameters.sortBy.indexOf('!') == 0 ? Parameters.sortBy.split('!')[1] : Parameters.sortBy) : null;

	//Check if filters are applied
	vm.filtersApplied = vm.parameters.filters || vm.parameters.from || vm.parameters.to || ($ocMedia('max-width:767px') && vm.sortSelection); //Sort by is a filter on mobile devices
	vm.showFilters = vm.filtersApplied;

	//Check if search was used
	vm.searchResults = Parameters.search && Parameters.search.length > 0;

	//Reload the state with new parameters
	vm.filter = function(resetPage) {
		$state.go('.', OrderCloudParameters.Create(vm.parameters, resetPage));
	};

	//Reload the state with new search parameter & reset the page
	vm.search = function() {
		vm.filter(true);
	};

	//Clear the search parameter, reload the state & reset the page
	vm.clearSearch = function() {
		vm.parameters.search = null;
		vm.filter(true);
	};

	//Clear relevant filters, reload the state & reset the page
	vm.clearFilters = function() {
		vm.parameters.filters = null;
		vm.parameters.from = null;
		vm.parameters.to = null;
		$ocMedia('max-width:767px') ? vm.parameters.sortBy = null : angular.noop(); //Clear out sort by on mobile devices
		vm.filter(true);
	};

	//Conditionally set, reverse, remove the sortBy parameter & reload the state
	vm.updateSort = function(value) {
		value ? angular.noop() : value = vm.sortSelection;
		switch(vm.parameters.sortBy) {
			case value:
				vm.parameters.sortBy = '!' + value;
				break;
			case '!' + value:
				vm.parameters.sortBy = null;
				break;
			default:
				vm.parameters.sortBy = value;
		}
		vm.filter(false);
	};

	//Used on mobile devices
	vm.reverseSort = function() {
		Parameters.sortBy.indexOf('!') == 0 ? vm.parameters.sortBy = Parameters.sortBy.split('!')[1] : vm.parameters.sortBy = '!' + Parameters.sortBy;
		vm.filter(false);
	};

	//Reload the state with the incremented page parameter
	vm.pageChanged = function() {
		$state.go('.', {page:vm.list.Meta.Page});
	};

	//Load the next page of results with all of the same parameters
	vm.loadMore = function() {
		return OrderCloud.Orders.ListOutgoing(null , null, Parameters.search, vm.list.Meta.Page + 1, Parameters.pageSize || vm.list.Meta.PageSize, Parameters.searchOn, Parameters.sortBy, Parameters.filters, buyerid)
			.then(function(data) {
				vm.list.Items = vm.list.Items.concat(data.Items);
				vm.list.Meta = data.Meta;
			});
	};

	var labels = {
		en: {
			search:"Search",
			Quote: "Quote ID",
			Order: "Order ID",
			customerRef: "Customer Ref",
			businessName: "Business Name",
			submittedBy: "Submitted By",
			quoteValue: "Quote Value",
			dateSubmitted: "Date Submitted",
			dateRevised: "Date Revised",
			reviewer: "Reviewer",
			view: "View",
			revisions: "Revisions",
			status: "Status",
			loadMore:"Load More"
		},
		fr: {
			search:$sce.trustAsHtml("Search"),
			Quote: $sce.trustAsHtml("Quote ID"),
			Order: $sce.trustAsHtml("Order ID"),
			customerRef: $sce.trustAsHtml("Customer Ref"),
			businessName: $sce.trustAsHtml("Business Name"),
			submittedBy: $sce.trustAsHtml("Submitted By"),
			quoteValue: $sce.trustAsHtml("Quote Value"),
			dateSubmitted: $sce.trustAsHtml("Date Submitted"),
			dateRevised: $sce.trustAsHtml("Date Revised"),
			reviewer: $sce.trustAsHtml("Reviewer"),
			view: $sce.trustAsHtml("View"),
			revisions: $sce.trustAsHtml("Revisions"),
			status: $sce.trustAsHtml("Status"),
			loadMore:$sce.trustAsHtml("Load More")
		}
	};

	vm.labels = labels.en;
}