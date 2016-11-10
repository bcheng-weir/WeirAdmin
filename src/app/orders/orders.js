angular.module('orderCloud')
	.config(OrdersConfig)
	.controller('OrdersCtrl',OrdersController);

function OrdersConfig($stateProvider,buyerid) {
	$stateProvider.state('ordersMain', {
		parent:'base',
		templateUrl:'orders/templates/orders.tpl.html',
		controller:'OrdersCtrl',
		controllerAs:'orders',
		url:'/orders?from&to&search&page&pageSize&searchOn&sortBy&sortByXp&filters&buyerid',
		data:{componentName:'Orders'},
		resolve: {
			Parameters: function($stateParams,OrderCloudParameters) {
				return OrderCloudParameters.Get($stateParams);
			},
			Orders: function(OrderCloud,Parameters) {
				return OrderCloud.Orders.ListOutgoing(Parameters.from,Parameters.to,Parameters.search,Parameters.page,Parameters.pageSize || 20,Parameters.searchOn,Parameters.sortBy,Parameters.filters,buyerid);
			},
			xpOrders: function(OrderCloud, Parameters, Orders) {
				return false;
			}
		}
	})
	//Type Quote States
	.state('ordersMain.quotesRevised', {
		url:'/quotesRevised',
		templateUrl:'orders/templates/quote.revised.tpl.html',
		parent:'ordersMain'
	})
	.state('ordersMain.quotesReview', {
		url:'/quotesReview',
		templateUrl:'orders/templates/quote.review.tpl.html',
		parent:'ordersMain'
	})
	.state('ordersMain.quotesConfirmed', {
		url:'/quotesConfirmed',
		templateUrl:'orders/templates/quote.confirm.tpl.html',
		parent:'ordersMain'
	})
		//Type Orders State
	.state('ordersMain.ordersRevised', {
		url:'/ordersRevised',
		templateUrl: 'orders/templates/order.revised.tpl.html',
		parent:'ordersMain'
	})
	.state('ordersMain.POOrders', {
		url:'/ordersSubmitted',
		templateUrl:'orders/templates/order.submitted.tpl.html',
		parent:'ordersMain'
	})
	.state('ordersMain.ordersConfirmed', {
		url:'/orderConfirmed',
		templateUrl:'orders/templates/order.confirmed.tpl.html',
		parent:'ordersMain'
	})
	.state('ordersMain.ordersDespatched', {
		url:'/orderDespatched',
		templateUrl:'orders/templates/order.despatched.tpl.html',
		parent:'ordersMain'
	})
	.state('ordersMain.ordersInvoiced', {
		url:'/quotesReview',
		templateUrl:'orders/templates/order.invoiced.tpl.html',
		parent:'ordersMain'
	})
	.state('ordersMain.ordersAll', {
		url:'/ordersAll',
		templateUrl:'orders/templates/order.all.tpl.html',
		parent:'ordersMain'
	})};

function OrdersController($rootScope, $scope, $state, $sce, $ocMedia, $exceptionHandler, Underscore, OrderCloud, OrderCloudParameters, Orders, Parameters, buyerid, WeirService) {
	var vm = this;
	vm.xpType = Parameters.filters ? Parameters.filters["xp.Type"] : {};
	vm.list = Orders;
	vm.parameters = Parameters;
	vm.sortSelection = Parameters.sortBy ? (Parameters.sortBy.indexOf('!') == 0 ? Parameters.sortBy.split('!')[1] : Parameters.sortBy) : null;
	//Check if filters are applied
	vm.filtersApplied = vm.parameters.filters || vm.parameters.from || vm.parameters.to || ($ocMedia('max-width:767px') && vm.sortSelection); //Sort by is a filter on mobile devices
	vm.showFilters = vm.filtersApplied;

	//Components cannot filter on xp in the OC. The filter must happen locally. Check for the xp filter. If it applies, conduct the filtering.
	/*switch(vm.parameters.sortByXp) {
		case vm.parameters.sortByXp:
			vm.list.Items = Underscore.sortBy(vm.list.Items, function(item) {
				//return item.xp[value];
				return item.xp ? item.xp[vm.parameters.sortByXp] : -1;
			});
			break;
		case '!'+vm.parameters.sortByXp:
			vm.parameters.sortByXp = null;
			break;
		default:
			vm.list.Items = Underscore.sortBy(vm.list.Items, function(item) {
				//return item.xp[value];
				return item.xp ? item.xp[vm.parameters.sortByXp] : -1;
			}).reverse();
	}*/

	//Check if search was used
	vm.searchResults = Parameters.search && Parameters.search.length > 0;

	//Reload the state with new parameters
	vm.filter = function(resetPage) {
		$state.go('.', OrderCloudParameters.Create(vm.parameters, resetPage));
	};

	//Reload the state with new search parameter & reset the page
	vm.search = function() {
		vm.parameters.searchOn = '';
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

	//This does not cause a reload of the page.
	vm.updateXpSort = function(value) {
		return;
		/*switch(vm.parameters.sortByXp) {
			case value:
				vm.parameters.sortByXp = '!'+value;
				vm.list.Items = Underscore.sortBy(vm.list.Items, function(item) {
					//return item.xp[value];
					return item.xp ? item.xp[value] : -1;
				});
				break;
			case '!'+value:
				vm.parameters.sortByXp = null;
				break;
			default:
				vm.parameters.sortByXp = value;
				vm.list.Items = Underscore.sortBy(vm.list.Items, function(item) {
					//return item.xp[value];
					return item.xp ? item.xp[value] : -1;
				}).reverse();
		}
		vm.filter(false);*/
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
			update: "Update",
			revisions: "Revisions",
			status: "Status",
			loadMore:"Load More",
			poNumber:"PO Number",
			orderedBy:"Ordered By",
			contractNo: "Contract number",
			dateOrdered: "Order date",
			dateConfirmed: "Date confirmed",
			confirmedBy: "Confirmed by",
			estimatedDelievery: "Estimated delievery date",
			dateDespatched: "Estimated delievery date",
			orderValue: "Order value",
			invoiceValue: "Invoice Number"
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
			loadMore:$sce.trustAsHtml("Load More"),
			poNumber:$sce.trustAsHtml("PO Number"),
			orderedBy:$sce.trustAsHtml("Ordered By")
		}
	};
	vm.labels = labels.en;

	vm.View = function(orderId, customerId) {
		var cid = customerId;
		WeirService.SetOrderAsCurrentOrder(orderId)
			.then(function() {
				//return OrderCloud.BuyerID.Set(cid);
				return true;
			})
			.then(function() {
				$rootScope.$broadcast('SwitchCart');
				$state.go('order');
			})
			.catch(function(ex) {
				$exceptionHandler(ex)
			})
	};

	vm.Revisions = function() {
		//ToDo
	}

	vm.Update = function() {
		//ToDo
	}
}