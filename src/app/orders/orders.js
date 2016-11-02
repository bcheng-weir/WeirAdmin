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
				return OrderCloud.Orders.ListOutgoing(null,null,null,null,null,null,null,f,buyerid);
			}
		}
	});
}

function OrderController($sce, Parameters, Orders) {
	var vm = this;
	vm.Parameteres = Parameters;
	vm.list = Orders;

	var labels = {
		en: {
			search:"Search",
			quoteID: "Quote ID",
			customerRef: "Customer Ref",
			businessName: "Business Name",
			submittedBy: "Submitted By",
			quoteValue: "Quote Value",
			dateSubmitted: "Date Submitted",
			reviewer: "Reviewer",
			view: "View",
			revisions: "Revisions",
			status: "Status"
		},
		fr: {
			search:$sce.trustAsHtml("Search"),
			quoteID: $sce.trustAsHtml("Quote ID"),
			customerRef: $sce.trustAsHtml("Customer Ref"),
			businessName: $sce.trustAsHtml("Business Name"),
			submittedBy: $sce.trustAsHtml("Submitted By"),
			quoteValue: $sce.trustAsHtml("Quote Value"),
			dateSubmitted: $sce.trustAsHtml("Date Submitted"),
			reviewer: $sce.trustAsHtml("Reviewer"),
			view: $sce.trustAsHtml("View"),
			revisions: $sce.trustAsHtml("Revisions"),
			status: $sce.trustAsHtml("Status")
		}
	};

	vm.labels = labels.en;
}